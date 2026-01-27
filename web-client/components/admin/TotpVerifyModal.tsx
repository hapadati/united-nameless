'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TotpVerifyModalProps {
    isOpen?: boolean; // オプショナルに変更（従来のAPI）
    onClose?: () => void; // オプショナルに
    onVerify: (code: string) => Promise<boolean>;
    actionName?: string; // オプショナルに
    title?: string; // 新規追加
    description?: string; // 新規追加
}

export function TotpVerifyModal({
    isOpen = true,
    onClose = () => { },
    onVerify,
    actionName = 'this action',
    title,
    description
}: TotpVerifyModalProps) {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCode('');
            setError(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (code.length !== 6) return;

        setIsLoading(true);
        setError(false);

        try {
            const success = await onVerify(code);
            if (success) {
                onClose();
            } else {
                setError(true);
                toast.error('Invalid 2FA Code');
            }
        } catch (err) {
            setError(true);
            toast.error('Verification Error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const displayTitle = title || 'Security Check';
    const displayDescription = description || `Enter 2FA code to confirm ${actionName}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-zinc-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center space-y-4 mb-6">
                    <div className="p-4 rounded-full bg-red-500/10 text-red-500 ring-4 ring-red-500/5">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{displayTitle}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{displayDescription}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            maxLength={6}
                            value={code}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCode(val);
                                if (val.length === 6) setError(false);
                            }}
                            className={`w-full bg-black/50 border ${error ? 'border-red-500' : 'border-zinc-700 focus:border-red-500'} rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder:tracking-normal`}
                            placeholder="000000"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || code.length !== 6}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Action'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
