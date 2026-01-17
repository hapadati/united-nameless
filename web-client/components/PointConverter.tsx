'use client';

import { useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface PointConverterProps {
    userId: string;
    currentPoints: number;
    currentXP: number;
}

export default function PointConverter({ userId, currentPoints, currentXP }: PointConverterProps) {
    const [convertAmount, setConvertAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleConvert = async () => {
        if (convertAmount <= 0) return;
        setLoading(true);
        setMessage('');

        try {
            const res = await fetchAPI('/economy/convert', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    points: convertAmount
                })
            });

            if (res && res.success) {
                setMessage(`🎉 Converted ${convertAmount} pts to ${res.xpGained} XP!`);
                setConvertAmount(0);
                router.refresh(); // データ更新
            } else {
                setMessage('❌ Conversion failed.');
            }
        } catch (e) {
            setMessage('❌ Error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const maxConvert = currentPoints;

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mt-6">
            <h3 className="text-xl font-bold text-white mb-4">🔮 Convert Points to XP</h3>

            <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Convert Amount</span>
                    <span className="text-yellow-400 font-mono">{convertAmount.toLocaleString()} pts</span>
                </div>

                <input
                    type="range"
                    min="0"
                    max={maxConvert}
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    disabled={loading || maxConvert === 0}
                />

                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0</span>
                    <span>Max: {maxConvert.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm">
                    <span className="text-gray-400">Estimated Gain: </span>
                    <span className="text-blue-400 font-bold">+{convertAmount} XP</span>
                </div>

                <button
                    onClick={handleConvert}
                    disabled={loading || convertAmount === 0}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${loading || convertAmount === 0
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                        }`}
                >
                    {loading ? 'Converting...' : 'Convert Now'}
                </button>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('🎉') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
