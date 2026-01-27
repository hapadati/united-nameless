'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mic, Gift, ShoppingCart, Zap, Clock } from 'lucide-react';
import type { ActivityEntry } from '@/lib/api';

interface ActivityFeedProps {
    activities: ActivityEntry[];
}

const activityIcons = {
    message: MessageSquare,
    voice: Mic,
    reward: Gift,
    purchase: ShoppingCart,
    conversion: Zap,
};

const activityColors = {
    message: 'text-blue-400 bg-blue-500/10',
    voice: 'text-green-400 bg-green-500/10',
    reward: 'text-yellow-400 bg-yellow-500/10',
    purchase: 'text-purple-400 bg-purple-500/10',
    conversion: 'text-orange-400 bg-orange-500/10',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 text-center">
                <p className="text-zinc-500">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || MessageSquare;
                const colorClass = activityColors[activity.type] || activityColors.message;

                return (
                    <motion.div
                        key={activity.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900/70 transition-all"
                    >
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon size={20} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                                {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                <Clock size={12} />
                                {new Date(activity.timestamp).toLocaleString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            {activity.points && (
                                <span className="text-xs font-bold text-yellow-400">
                                    +{activity.points} pts
                                </span>
                            )}
                            {activity.xp && (
                                <span className="text-xs font-bold text-blue-400">
                                    +{activity.xp} XP
                                </span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
