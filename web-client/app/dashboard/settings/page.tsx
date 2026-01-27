'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Eye, Palette, LogOut, Save } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState({
        discord: true,
        email: false,
        levelUp: true,
        itemPurchase: true,
        questComplete: true
    });
    const [privacy, setPrivacy] = useState({
        profilePublic: true,
        showActivity: true,
        showInventory: false
    });
    const [theme, setTheme] = useState('dark');

    const userId = (session?.user as any)?.id;

    const handleSave = () => {
        // API呼び出し（実装後に有効化）
        // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/settings`, {
        //     method: 'POST',
        //     headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        //     body: JSON.stringify({ notifications, privacy, theme })
        // });

        toast.success('設定を保存しました');
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <Toaster theme="dark" position="bottom-right" />

            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <SettingsIcon className="text-purple-500" size={32} />
                    設定
                </h1>
                <p className="text-zinc-500">アカウントとアプリケーションの設定を管理します</p>
            </header>

            {/* Profile Section */}
            <section className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <User className="text-blue-500" size={24} />
                    <h2 className="text-xl font-bold text-white">プロフィール</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {session?.user?.image && (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full border-2 border-blue-500/20"
                            />
                        )}
                        <div>
                            <p className="text-xl font-bold text-white">{session?.user?.name || 'Guest'}</p>
                            <p className="text-zinc-500 font-mono">ID: {userId?.slice(0, 16) || '...'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notifications Section */}
            <section className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="text-yellow-500" size={24} />
                    <h2 className="text-xl font-bold text-white">通知設定</h2>
                </div>

                <div className="space-y-4">
                    <ToggleItem
                        label="Discord通知"
                        description="Discord DMで重要な通知を受け取る"
                        checked={notifications.discord}
                        onChange={(checked) => setNotifications({ ...notifications, discord: checked })}
                    />
                    <ToggleItem
                        label="メール通知"
                        description="メールで週次レポートを受け取る"
                        checked={notifications.email}
                        onChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                    <ToggleItem
                        label="レベルアップ通知"
                        description="レベルアップ時に通知する"
                        checked={notifications.levelUp}
                        onChange={(checked) => setNotifications({ ...notifications, levelUp: checked })}
                    />
                    <ToggleItem
                        label="アイテム購入通知"
                        description="アイテムを購入した時に通知する"
                        checked={notifications.itemPurchase}
                        onChange={(checked) => setNotifications({ ...notifications, itemPurchase: checked })}
                    />
                    <ToggleItem
                        label="クエスト完了通知"
                        description="クエストを完了した時に通知する"
                        checked={notifications.questComplete}
                        onChange={(checked) => setNotifications({ ...notifications, questComplete: checked })}
                    />
                </div>
            </section>

            {/* Privacy Section */}
            <section className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Eye className="text-green-500" size={24} />
                    <h2 className="text-xl font-bold text-white">プライバシー設定</h2>
                </div>

                <div className="space-y-4">
                    <ToggleItem
                        label="プロフィールを公開"
                        description="他のユーザーがあなたのプロフィールを閲覧できます"
                        checked={privacy.profilePublic}
                        onChange={(checked) => setPrivacy({ ...privacy, profilePublic: checked })}
                    />
                    <ToggleItem
                        label="アクティビティを表示"
                        description="最近のアクティビティを他のユーザーに表示します"
                        checked={privacy.showActivity}
                        onChange={(checked) => setPrivacy({ ...privacy, showActivity: checked })}
                    />
                    <ToggleItem
                        label="インベントリを表示"
                        description="所持アイテムを他のユーザーに表示します"
                        checked={privacy.showInventory}
                        onChange={(checked) => setPrivacy({ ...privacy, showInventory: checked })}
                    />
                </div>
            </section>

            {/* Theme Section */}
            <section className="p-6 bg-zinc-900/50 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Palette className="text-purple-500" size={24} />
                    <h2 className="text-xl font-bold text-white">テーマ設定</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setTheme('dark')}
                        className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                    >
                        <div className="w-full h-20 bg-zinc-900 rounded-lg mb-3 flex items-center justify-center">
                            <Shield className="text-white" size={32} />
                        </div>
                        <p className="text-white font-medium">ダークモード</p>
                    </button>
                    <button
                        onClick={() => setTheme('light')}
                        className={`p-4 rounded-xl border-2 transition-all opacity-50 cursor-not-allowed ${theme === 'light'
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/10'
                            }`}
                        disabled
                    >
                        <div className="w-full h-20 bg-zinc-100 rounded-lg mb-3 flex items-center justify-center">
                            <Shield className="text-zinc-900" size={32} />
                        </div>
                        <p className="text-white font-medium">ライトモード（準備中）</p>
                    </button>
                </div>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                    <Save size={18} />
                    設定を保存
                </button>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                    <LogOut size={18} />
                    ログアウト
                </button>
            </div>
        </div>
    );
}

interface ToggleItemProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ToggleItem({ label, description, checked, onChange }: ToggleItemProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-black/20">
            <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-zinc-500 text-sm mt-1">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-14 h-8 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-zinc-700'
                    }`}
            >
                <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    animate={{ left: checked ? 30 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>
        </div>
    );
}
