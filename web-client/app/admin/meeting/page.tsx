'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Send, FileText, Pin, Edit2, Trash2, Users, X } from 'lucide-react';
import { getMeetingRooms, createMeetingRoom, getMeetingMessages, sendMeetingMessage, getMeetingNotes, createMeetingNote, updateMeetingNote, deleteMeetingRoom } from '@/lib/api';
import { toast, Toaster } from 'sonner';

interface Room {
    id: string;
    name: string;
    description: string;
    lastActivity: string;
}

interface Message {
    id: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: string;
}

interface Note {
    id: string;
    title: string;
    content: string;
    createdBy: string;
    updatedAt: string;
    pinned: boolean;
}

export default function MeetingPage() {
    const { data: session } = useSession();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
    const [showNoteEditor, setShowNoteEditor] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userId = (session?.user as any)?.id;
    const userName = session?.user?.name || 'Guest';

    useEffect(() => {
        if (!userId) return;
        fetchRooms();

        // メッセージのポーリング
        const interval = setInterval(() => {
            if (selectedRoom) {
                fetchMessages(selectedRoom.id);
            }
        }, 3000); // 3秒ごと

        return () => clearInterval(interval);
    }, [userId, selectedRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchRooms = async () => {
        try {
            const data = await getMeetingRooms();
            setRooms(data?.rooms || []);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const fetchMessages = async (roomId: string) => {
        try {
            const data = await getMeetingMessages(roomId);
            setMessages(data?.messages || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const fetchNotes = async (roomId: string) => {
        try {
            const data = await getMeetingNotes(roomId);
            setNotes(data?.notes || []);
        } catch (error) {
            console.error('Failed to fetch notes:', error);
        }
    };

    const handleCreateRoom = async () => {
        if (!userId) return;

        const name = prompt('会議室名を入力してください');
        if (!name) return;

        const description = prompt('説明（任意）') || '';

        try {
            await createMeetingRoom(name, description, userId);
            toast.success('会議室を作成しました');
            fetchRooms();
        } catch (error) {
            console.error('Failed to create room:', error);
            toast.error('作成に失敗しました');
        }
    };

    const handleSelectRoom = async (room: Room) => {
        setSelectedRoom(room);
        await fetchMessages(room.id);
        await fetchNotes(room.id);
    };

    const handleSendMessage = async () => {
        if (!selectedRoom || !userId || !messageInput.trim()) return;

        try {
            await sendMeetingMessage(selectedRoom.id, userId, userName, messageInput);
            setMessageInput('');
            await fetchMessages(selectedRoom.id);
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('送信に失敗しました');
        }
    };

    const handleCreateNote = async () => {
        if (!selectedRoom || !userId || !noteTitle.trim() || !noteContent.trim()) {
            toast.error('タイトルと内容を入力してください');
            return;
        }

        try {
            await createMeetingNote(selectedRoom.id, noteTitle, noteContent, userId);
            toast.success('メモを作成しました');
            setShowNoteEditor(false);
            setNoteTitle('');
            setNoteContent('');
            await fetchNotes(selectedRoom.id);
        } catch (error) {
            console.error('Failed to create note:', error);
            toast.error('作成に失敗しました');
        }
    };

    const handleUpdateNote = async (noteId: string, updates: any) => {
        if (!selectedRoom) return;

        try {
            await updateMeetingNote(selectedRoom.id, noteId, updates);
            toast.success('メモを更新しました');
            await fetchNotes(selectedRoom.id);
        } catch (error) {
            console.error('Failed to update note:', error);
            toast.error('更新に失敗しました');
        }
    };

    const handleDeleteRoom = async () => {
        if (!selectedRoom || !confirm('この会議室を削除してもよろしいですか？')) return;

        try {
            await deleteMeetingRoom(selectedRoom.id);
            toast.success('会議室を削除しました');
            setSelectedRoom(null);
            fetchRooms();
        } catch (error) {
            console.error('Failed to delete room:', error);
            toast.error('削除に失敗しました');
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            <Toaster theme="dark" position="bottom-right" toastOptions={{
                style: { background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }
            }} />

            {/* Left Sidebar - Rooms List */}
            <div className="w-72 flex-shrink-0 glass-card p-4 flex flex-col">
                <div className="flex justify-between items-center mb-6 pl-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <MessageSquare className="text-blue-400" size={20} />
                        </div>
                        Meeting Rooms
                    </h2>
                    <button
                        onClick={handleCreateRoom}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-400 border border-transparent hover:border-white/5"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {rooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                            <MessageSquare size={32} className="mb-2 opacity-20" />
                            <p className="text-sm">No active rooms</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <button
                                key={room.id}
                                onClick={() => handleSelectRoom(room)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${selectedRoom?.id === room.id
                                        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                    }`}
                            >
                                <p className={`font-semibold truncate ${selectedRoom?.id === room.id ? 'text-blue-400' : 'text-zinc-200'}`}>
                                    {room.name}
                                </p>
                                <p className="text-zinc-500 text-xs mt-1.5 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedRoom?.id === room.id ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
                                    {new Date(room.lastActivity).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden relative">
                {selectedRoom ? (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md z-10">
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">{selectedRoom.name}</h1>
                                <p className="text-zinc-400 text-sm mt-1">{selectedRoom.description || 'No description provided'}</p>
                            </div>
                            <div className="flex gap-3 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm flex items-center gap-2 ${activeTab === 'chat'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <MessageSquare size={16} />
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-sm flex items-center gap-2 ${activeTab === 'notes'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <FileText size={16} />
                                    Notes
                                </button>
                                <div className="w-px bg-white/10 mx-1" />
                                <button
                                    onClick={handleDeleteRoom}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-500 hover:text-red-400"
                                    title="Archive Room"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Tab */}
                        {activeTab === 'chat' && (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {messages.map((msg, idx) => {
                                        const isMe = msg.userId === userId;
                                        const showAvatar = idx === 0 || messages[idx - 1].userId !== msg.userId;

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${showAvatar ? (isMe ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-zinc-700 to-zinc-600') : 'opacity-0'
                                                    }`}>
                                                    {msg.userName.slice(0, 1).toUpperCase()}
                                                </div>

                                                <div className={`max-w-[65%] group ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                                    {showAvatar && (
                                                        <span className="text-[10px] text-zinc-500 mb-1 px-1">
                                                            {msg.userName}
                                                        </span>
                                                    )}
                                                    <div className={`rounded-2xl p-3.5 shadow-sm text-sm leading-relaxed relative ${isMe
                                                            ? 'bg-blue-600/90 text-white rounded-tr-sm backdrop-blur-sm'
                                                            : 'bg-zinc-800/80 text-zinc-100 rounded-tl-sm backdrop-blur-sm border border-white/5'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-6 bg-black/20 backdrop-blur-md border-t border-white/5">
                                    <div className="flex gap-3 items-end bg-zinc-900/50 p-2 rounded-xl border border-white/10 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                                        <textarea
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            rows={1}
                                            style={{ minHeight: '44px', maxHeight: '120px' }}
                                            className="flex-1 px-4 py-2.5 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none resize-none custom-scrollbar"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim()}
                                            className="p-3 mb-0.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min pb-20">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowNoteEditor(true)}
                                        className="h-[200px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                                    >
                                        <div className="p-4 rounded-full bg-white/5 group-hover:bg-emerald-500/20 transition-colors mb-3">
                                            <Plus size={24} />
                                        </div>
                                        <span className="font-medium">Create New Note</span>
                                    </motion.button>

                                    {notes.map((note, idx) => (
                                        <motion.div
                                            key={note.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-6 rounded-2xl border transition-all group relative overflow-hidden ${note.pinned
                                                    ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                                                    : 'bg-zinc-800/40 border-white/5 hover:border-white/10 hover:bg-zinc-800/60'
                                                }`}
                                        >
                                            {note.pinned && (
                                                <div className="absolute top-0 right-0 p-1.5 bg-yellow-500/20 rounded-bl-xl border-l border-b border-yellow-500/20">
                                                    <Pin size={12} className="text-yellow-500" />
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="text-lg font-bold text-white line-clamp-1">{note.title}</h3>
                                            </div>

                                            <p className="text-zinc-400 text-sm whitespace-pre-wrap line-clamp-4 mb-4 h-[5em]">
                                                {note.content}
                                            </p>

                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-[10px] text-zinc-600 border border-white/5 px-2 py-1 rounded-full bg-black/20">
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </span>

                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                                    <button
                                                        onClick={() => handleUpdateNote(note.id, { pinned: !note.pinned })}
                                                        className={`p-2 rounded-lg transition-colors ${note.pinned ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        <Pin size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setNoteTitle(note.title);
                                                            setNoteContent(note.content);
                                                            setEditingNote(note);
                                                            setShowNoteEditor(true);
                                                        }}
                                                        className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Note Editor Modal */}
                                <AnimatePresence>
                                    {showNoteEditor && (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoteEditor(false)}>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full max-w-3xl bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                                            >
                                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                                            <FileText className="text-emerald-500" size={20} />
                                                        </div>
                                                        {editingNote ? 'Edit Note' : 'Create Note'}
                                                    </h2>
                                                    <button onClick={() => setShowNoteEditor(false)} className="text-zinc-500 hover:text-white transition-colors">
                                                        <X size={24} />
                                                    </button>
                                                </div>

                                                <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                                    <input
                                                        type="text"
                                                        value={noteTitle}
                                                        onChange={(e) => setNoteTitle(e.target.value)}
                                                        placeholder="Title"
                                                        className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-lg font-bold placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                                                    />
                                                    <textarea
                                                        value={noteContent}
                                                        onChange={(e) => setNoteContent(e.target.value)}
                                                        placeholder="Write something amazing using Markdown..."
                                                        className="w-full flex-1 min-h-[300px] p-4 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all font-mono text-sm leading-relaxed resize-none custom-scrollbar"
                                                    />
                                                </div>

                                                <div className="p-6 border-t border-white/5 bg-zinc-900/30 flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setShowNoteEditor(false)}
                                                        className="px-6 py-2.5 text-zinc-400 hover:text-white font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => editingNote ? handleUpdateNote(editingNote.id, { title: noteTitle, content: noteContent }) : handleCreateNote()}
                                                        className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95"
                                                    >
                                                        {editingNote ? 'Save Changes' : 'Create Note'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-zinc-900/80 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                            <MessageSquare className="w-10 h-10 text-zinc-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Select a Meeting Room</h2>
                        <p className="text-zinc-500 max-w-sm">
                            Choose a room from the sidebar or create a new one to start collaborating with your team.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
