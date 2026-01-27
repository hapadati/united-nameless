'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAPI } from '@/lib/api';

export function TotpSetup() {
    const [step, setStep] = useState<'start' | 'scan' | 'verify' | 'done'>('start');
    const [secret, setSecret] = useState('');
    const [qrUrl, setQrUrl] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const startSetup = async () => {
        setIsLoading(true);
        try {
            const res = await fetchAPI('/admin/totp/setup', { headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' } }); // Auth header mock
            if (res && res.otpauth_url) {
                setSecret(res.secret);
                const url = await QRCode.toDataURL(res.otpauth_url);
                setQrUrl(url);
                setStep('scan');
            } else {
                throw new Error('Failed to fetch setup');
            }
        } catch (err) {
            toast.error('Failed to generate TOTP secret');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const verifySetup = async () => {
        setIsLoading(true);
        try {
            const res = await fetchAPI('/admin/totp/verify', {
                method: 'POST',
                headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
                body: JSON.stringify({ code: verifyCode })
            });

            if (res && res.success) {
                setStep('done');
                toast.success('2FA Enabled Successfully!');
            } else {
                throw new Error('Invalid code');
            }
        } catch (err) {
            toast.error('Verification failed. Invalid code.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-white/5 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                    <p className="text-sm text-zinc-400">Secure your admin account.</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 'start' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-4"
                    >
                        <p className="text-zinc-400 text-sm">
                            Protect your account by adding an extra layer of security.
                            You will need to enter a code from your mobile app to perform critical actions.
                        </p>
                        <button
                            onClick={startSetup}
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={20} />}
                            Enable 2FA
                        </button>
                    </motion.div>
                )}

                {step === 'scan' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 text-center"
                    >
                        <div className="bg-white p-4 rounded-xl inline-block">
                            {qrUrl && <img src={qrUrl} alt="QR Code" className="w-48 h-48" />}
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-zinc-400">Scan this QR code with Google Authenticator</p>
                            <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-black/50 border border-white/10 font-mono text-sm text-zinc-300">
                                {secret}
                                <button className="hover:text-white" onClick={() => navigator.clipboard.writeText(secret)}>
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={verifyCode}
                                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={verifySetup}
                                disabled={isLoading || verifyCode.length !== 6}
                                className="px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Verify'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'done' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-4 py-8"
                    >
                        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-green-400">2FA Enabled!</h3>
                        <p className="text-zinc-500">Your account is now secure.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
