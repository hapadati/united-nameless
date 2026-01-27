'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import { convertPoints } from '@/lib/api';
import { toast } from 'sonner';

interface PointConverterProps {
    userId: string;
    currentPoints: number;
    onConversionComplete?: () => void;
}

export function PointConverter({ userId, currentPoints, onConversionComplete }: PointConverterProps) {
    const [points, setPoints] = useState<string>('');
    const [isConverting, setIsConverting] = useState(false);

    const pointsNum = parseInt(points) || 0;
    const xpGained = pointsNum; // 1:1 conversion ratio

    const handleConvert = async () => {
        if (pointsNum <= 0 || pointsNum > currentPoints) {
            toast.error('Invalid amount');
            return;
        }

        setIsConverting(true);
        try {
            const res = await convertPoints(userId, pointsNum);
            if (res && res.success) {
                toast.success(`Converted ${pointsNum} points to ${res.xpGained} XP!`);
                if (res.leveledUp) {
                    toast.success(`🎉 Level Up! Now Level ${res.newLevel}!`, { duration: 5000 });
                }
                setPoints('');
                onConversionComplete?.();
            } else {
                throw new Error('Conversion failed');
            }
        } catch (error) {
            toast.error('Failed to convert points');
            console.error(error);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
                <Zap className="text-purple-400" size={24} />
                <h3 className="text-lg font-bold">Point to XP Converter</h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-black/20">
                        <div className="text-xs text-zinc-500 mb-1">Available Points</div>
                        <div className="text-2xl font-bold text-yellow-400">{currentPoints.toLocaleString()}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20">
                        <div className="text-xs text-zinc-500 mb-1">XP to Gain</div>
                        <div className="text-2xl font-bold text-blue-400">{xpGained.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Enter points"
                        value={points}
                        onChange={(e) => setPoints(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                        disabled={isConverting}
                    />
                    <button
                        onClick={handleConvert}
                        disabled={isConverting || pointsNum <= 0 || pointsNum > currentPoints}
                        className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-2"
                    >
                        {isConverting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Convert
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>

                <p className="text-xs text-zinc-500 text-center">
                    Conversion Rate: 1 Point = 1 XP
                </p>
            </div>
        </div>
    );
}
