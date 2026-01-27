'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ShieldCheck, LogIn } from 'lucide-react';

function LoginContent() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/dashboard';

    const handleLogin = () => {
        signIn('discord', { callbackUrl: from });
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 ring-4 ring-indigo-500/5">
                        <ShieldCheck size={48} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-white mb-2">Access Restricted</h1>
                <p className="text-zinc-400 text-center mb-8">
                    Please sign in with Discord to access this area.
                </p>

                <button
                    onClick={handleLogin}
                    className="w-full py-3.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <LogIn size={20} />
                    <span>Sign in with Discord</span>
                </button>

                <p className="text-xs text-center text-zinc-600 mt-6">
                    Protected by UNITED NAMELESS Security
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
