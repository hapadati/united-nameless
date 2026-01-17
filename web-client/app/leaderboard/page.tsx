'use client';

import { useEffect, useState } from 'react';
import { fetchAPI, LeaderboardEntry } from '@/lib/api';
import Link from 'next/link';

export default function LeaderboardPage() {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetchAPI('/economy/leaderboard?limit=50'); // API limit parameter
                if (res && res.leaderboard) {
                    setData(res.leaderboard);
                }
            } catch (e) {
                console.error("Failed to load leaderboard", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center text-yellow-400">Server Leaderboard</h1>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700 text-gray-300">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4 text-right">Points</th>
                                    <th className="px-6 py-4 text-right">Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {data.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-750 transition">
                                        <td className="px-6 py-4 font-bold text-gray-400">
                                            {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : `#${index + 1}`}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white">
                                            <Link href={`/user/${entry.userId}`} className="flex items-center gap-3 hover:text-yellow-400 transition group">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs group-hover:bg-gray-500 transition">👤</div>
                                                <span className="text-gray-200 group-hover:text-white transition">{entry.userId.slice(0, 8)}...</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right text-yellow-400 font-mono">
                                            {entry.points?.toLocaleString() ?? 0}
                                        </td>
                                        <td className="px-6 py-4 text-right text-indigo-400 font-mono">
                                            Lv.{entry.level ?? 1}
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No data available yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <a href="/" className="text-indigo-400 hover:text-indigo-300 underline">← Back to Home</a>
                </div>
            </div>
        </div>
    );
}
