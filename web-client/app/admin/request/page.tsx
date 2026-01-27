'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { requestAdminAccess } from '@/lib/api';
import { toast, Toaster } from 'sonner';

export default function RequestPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hasRequest, setHasRequest] = useState(false);

    const userId = (session?.user as any)?.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            toast.error('ログインが必要です');
            return;
        }

        if (!reason.trim()) {
            toast.error('申請理由を入力してください');
            return;
        }

        setSubmitting(true);

        try {
            const result = await requestAdminAccess(userId, reason);

            if (result?.success) {
                toast.success('Admin権限をリクエストしました');
                setHasRequest(true);
                setReason('');
            } else if (result?.code === 'DUPLICATE_REQUEST') {
                toast.error('既にリクエスト済みです');
                setHasRequest(true);
            } else {
                toast.error('リクエストに失敗しました');
            }
        } catch (error) {
            console.error('Request failed:', error);
            toast.error('エラーが発生しました');
        } finally {
            setSubmitting(false);
        }
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-zinc-400">ログインが必要です</p>
                </div>
            </div>
        );
    }

    if (hasRequest) {
        return (
            <div className="max-w-2xl mx-auto space-y-8">
                <Toaster theme="dark" position="bottom-right" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-12 bg-green-500/10 border border-green-500/20 rounded-2xl"
                >
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">リクエスト送信完了</h2>
                    <p className="text-zinc-400 mb-2">Admin権限のリクエストを送信しました</p>
                    <p className="text-zinc-500 text-sm">SuperAdminによる承認をお待ちください</p>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                            ダッシュボードへ
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <Toaster theme="dark" position="bottom-right" />

            <header className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
                    <Shield className="text-white" size={40} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Admin権限リクエスト</h1>
                <p className="text-zinc-400 text-lg">Admin権限を申請します。SuperAdminによる承認が必要です。</p>
            </header>

            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6 p-8 bg-zinc-900/50 border border-white/5 rounded-2xl"
            >
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        あなたのUser ID
                    </label>
                    <div className="p-4 bg-black/20 rounded-lg text-white font-mono">
                        {userId || 'ログインしてください'}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        申請理由 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Admin権限が必要な理由を詳しく記載してください..."
                        rows={6}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        required
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                        申請理由は SuperAdmin に表示されます
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={submitting || !reason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                送信中...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                リクエストを送信
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                </div>
            </motion.form>

            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <div className="flex gap-3">
                    <Clock className="text-yellow-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="text-yellow-500 font-bold mb-2">注意事項</h3>
                        <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
                            <li>承認されるまで時間がかかる場合があります</li>
                            <li>承認後、初回ログイン時に2FAのセットアップが必須となります</li>
                            <li>不適切な申請は却下される可能性があります</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
