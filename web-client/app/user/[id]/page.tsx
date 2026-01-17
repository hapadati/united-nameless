'use client';

import { use, useEffect, useState } from 'react';
import { fetchAPI, UserRank } from '@/lib/api';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PointConverter from '@/components/PointConverter';

export default function UserProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [userData, setUserData] = useState<UserRank | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const [rankRes, historyRes] = await Promise.all([
                    fetchAPI(`/economy/rank?userId=${id}`),
                    fetchAPI(`/events/history?userId=${id}&limit=5`)
                ]);

                if (rankRes && rankRes.userId) {
                    setUserData(rankRes);
                } else {
                    setError('User not found');
                }

                if (historyRes && historyRes.history) {
                    setHistory(historyRes.history);
                }
            } catch (e) {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
    );

    if (error || !userData) return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <h1 className="text-3xl font-bold mb-4 text-red-400">Error</h1>
            <p>{error || 'User not found'}</p>
            <Link href="/" className="mt-8 text-indigo-400 hover:text-indigo-300 underline">Return Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
            <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 mb-8">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6">
                            <div className="w-32 h-32 bg-gray-700 rounded-full border-4 border-gray-800 flex items-center justify-center text-4xl">
                                👤
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold mb-2">User ID: {userData.userId}</h1>
                        <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium border border-yellow-500/30">
                                Rank #{userData.rank ?? 'N/A'}
                            </span>
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm font-medium border border-indigo-500/30">
                                Level {userData.level ?? 0}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                <p className="text-gray-400 text-sm mb-1">Total Points</p>
                                <p className="text-2xl font-mono text-yellow-400">{userData.points?.toLocaleString() ?? 0} pt</p>
                            </div>
                            <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                                <p className="text-gray-400 text-sm mb-1">Total XP</p>
                                <p className="text-2xl font-mono text-blue-400">{userData.xp?.toLocaleString() ?? 0} XP</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Progress to Level {(userData.level ?? 0) + 1}</span>
                                <span>{userData.nextLevelXP ? `${userData.xp} / ${userData.nextLevelXP}` : ''}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-1000"
                                    style={{ width: `${Math.min(100, ((userData.xp ?? 0) / (userData.nextLevelXP || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <PointConverter
                            userId={userData.userId || id}
                            currentPoints={userData.points || 0}
                            currentXP={userData.xp || 0}
                        />
                    </div>
                </div>

                {/* Activity History Section */}
                <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">📜 Recent Activity</h3>
                    <div className="space-y-4">
                        {history.length > 0 ? (
                            history.map((log, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.pointsEarned > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{log.description}</p>
                                            <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {log.pointsEarned > 0 && (
                                        <span className="text-yellow-400 font-mono text-sm">+{log.pointsEarned} pt</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent activity found. Start chatting in Discord!</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center pb-8">
                    <Link href="/leaderboard" className="text-indigo-400 hover:text-indigo-300 underline">← Back to Leaderboard</Link>
                </div>
            </div>
        </div>
    );
}
