'use client';

import { useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function AdminQuestPage() {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('MESSAGE_IN_CHANNEL');
    const [targetId, setTargetId] = useState('');
    const [requiredCount, setRequiredCount] = useState(1);
    const [rewardPoints, setRewardPoints] = useState(100);
    const [adminKey, setAdminKey] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Creating...');

        try {
            const res = await fetchAPI('/quests', {
                method: 'POST',
                headers: {
                    'X-Admin-Key': adminKey
                },
                body: JSON.stringify({
                    title,
                    description: `Event Quest: ${title}`,
                    type,
                    targetId,
                    requiredCount,
                    rewardPoints,
                    createdBy: 'Admin Web UI'
                })
            });

            if (res && res.success) {
                setStatus('✅ Quest Created Successfully!');
                setTitle('');
            } else {
                setStatus(`❌ Error: ${res?.error || 'Unknown error'}`);
            }
        } catch (err) {
            setStatus('❌ Network Error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
            <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl">
                <h1 className="text-3xl font-bold mb-6 text-indigo-400">⚔️ Admin Quest Creator</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Quest Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Talk in General 10 times"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="MESSAGE_IN_CHANNEL">Message in Channel</option>
                                {/* Future: <option value="VOICE_TIME">Voice Time</option> */}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Target ID (Channel ID)</label>
                            <input
                                type="text"
                                value={targetId}
                                onChange={e => setTargetId(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono"
                                placeholder="123456789..."
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Required Count</label>
                            <input
                                type="number"
                                value={requiredCount}
                                onChange={e => setRequiredCount(Number(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Reward Points</label>
                            <input
                                type="number"
                                value={rewardPoints}
                                onChange={e => setRewardPoints(Number(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-yellow-400 font-bold"
                                min="10"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="block text-sm font-medium text-red-400 mb-1">Admin Secret Key</label>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={e => setAdminKey(e.target.value)}
                            className="w-full bg-gray-900 border border-red-900/50 rounded-lg px-4 py-2 text-white font-mono"
                            placeholder="Enter Secret Key"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg transform hover:scale-[1.02]"
                    >
                        Create Quest
                    </button>

                    {status && (
                        <div className={`text-center p-3 rounded-lg font-medium ${status.includes('✅') ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                            {status}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
