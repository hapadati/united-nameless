'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { User, TrendingUp, Trophy, Activity, RefreshCw } from 'lucide-react';
import { getUserBalance, getUserRank, getUserActivity } from '@/lib/api';
import { PointConverter } from '@/components/dashboard/PointConverter';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import type { UserRank, ActivityEntry } from '@/lib/api';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [balance, setBalance] = useState<any>(null);
    const [rank, setRank] = useState<UserRank | null>(null);
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const userId = (session?.user as any)?.id || 'guest';

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [balanceData, rankData, activityData] = await Promise.all([
                getUserBalance(userId),
                getUserRank(userId),
                getUserActivity(userId, 15),
            ]);

            setBalance(balanceData);
            setRank(rankData);
            setActivities(activityData || []);
        } catch (error) {
            console.error('Failed to fetch profile data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">User Profile</h1>
                    <p className="text-zinc-500">View your stats, convert points, and track your activity.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all"
                    title="Refresh"
                >
                    <RefreshCw size={20} />
                </button>
            </header>

            {/* User Info Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-full h-full rounded-full"
                            />
                        ) : (
                            <User size={32} />
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{session?.user?.name || 'Guest User'}</h2>
                        <p className="text-zinc-400">#{userId.slice(0, 8)}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={TrendingUp}
                    label="Points"
                    value={balance?.points?.toLocaleString() || '0'}
                    color="yellow"
                />
                <StatCard
                    icon={Activity}
                    label="XP"
                    value={rank?.xp?.toLocaleString() || '0'}
                    subValue={`${rank?.nextLevelXP ? Math.floor((rank.xp / rank.nextLevelXP) * 100) : 0}% to next level`}
                    color="blue"
                />
                <StatCard
                    icon={Trophy}
                    label="Level"
                    value={rank?.level?.toString() || '0'}
                    color="purple"
                />
                <StatCard
                    icon={Trophy}
                    label="Rank"
                    value={`#${rank?.rank || '-'}`}
                    color="green"
                />
            </div>

            {/* Point Converter */}
            <PointConverter
                userId={userId}
                currentPoints={balance?.points || 0}
                onConversionComplete={fetchData}
            />

            {/* Activity Feed */}
            <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity size={24} className="text-blue-400" />
                    Recent Activity
                </h2>
                <ActivityFeed activities={activities} />
            </section>
        </div>
    );
}

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    subValue?: string;
    color?: 'yellow' | 'blue' | 'purple' | 'green';
}

function StatCard({ icon: Icon, label, value, subValue, color = 'blue' }: StatCardProps) {
    const colors = {
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border ${colors[color]}`}
        >
            <div className="flex items-center gap-3 mb-3">
                <Icon size={24} />
                <span className="text-sm font-medium text-zinc-400">{label}</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {subValue && <div className="text-xs text-zinc-500 mt-2">{subValue}</div>}
        </motion.div>
    );
}
