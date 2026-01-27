'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, UserCheck, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getAdminApprovals, approveAdmin, rejectAdmin, checkSuperAdmin } from '@/lib/api';
import { TotpVerifyModal } from '@/components/admin/TotpVerifyModal';
import { toast, Toaster } from 'sonner';

interface ApprovalRequest {
    id: string;
    userId: string;
    reason: string;
    status: string;
    requestedAt: string;
}

export default function ApprovalsPage() {
    const { data: session } = useSession();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTotpModal, setShowTotpModal] = useState(false);
    const [currentAction, setCurrentAction] = useState<{ type: 'approve' | 'reject', requestId: string, userId: string } | null>(null);

    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (!session || !userId) return;

        const checkPermission = async () => {
            const result = await checkSuperAdmin(userId);
            if (result?.isSuperAdmin) {
                setIsSuperAdmin(true);
                fetchRequests();
            } else {
                setLoading(false);
            }
        };

        checkPermission();
    }, [session, userId]);

    const fetchRequests = async () => {
        if (!userId) return;

        try {
            const data = await getAdminApprovals(userId);
            setRequests(data?.requests || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error('承認リストの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (requestId: string, targetUserId: string) => {
        setCurrentAction({ type: 'approve', requestId, userId: targetUserId });
        setShowTotpModal(true);
    };

    const handleReject = (requestId: string, targetUserId: string) => {
        setCurrentAction({ type: 'reject', requestId, userId: targetUserId });
        setShowTotpModal(true);
    };

    const handleTotpVerify = async (code: string) => {
        if (!currentAction || !userId) return false;

        try {
            if (currentAction.type === 'approve') {
                await approveAdmin(currentAction.requestId, currentAction.userId, userId, code);
                toast.success('Admin権限を承認しました');
            } else {
                const reason = prompt('却下理由を入力してください（任意）') || '';
                await rejectAdmin(currentAction.requestId, userId, reason, code);
                toast.success('リクエストを却下しました');
            }

            // リストを再取得
            await fetchRequests();
            setShowTotpModal(false);
            setCurrentAction(null);
            return true;
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('操作に失敗しました');
            return false;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">アクセス拒否</h2>
                    <p className="text-zinc-400">SuperAdmin権限が必要です</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Toaster theme="dark" position="bottom-right" />

            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                    <Shield className="text-yellow-500" size={32} />
                    Admin承認管理
                </h1>
                <p className="text-zinc-500">Admin権限のリクエストを承認または却下します</p>
            </header>

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <Clock className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500">承認待ちのリクエストはありません</p>
                    </div>
                ) : (
                    requests.map((request, index) => (
                        <motion.div
                            key={request.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {request.userId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">User ID: {request.userId}</h3>
                                            <p className="text-sm text-zinc-500">
                                                {new Date(request.requestedAt).toLocaleString('ja-JP')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-black/20 rounded-lg">
                                        <p className="text-sm text-zinc-400 font-medium mb-1">申請理由:</p>
                                        <p className="text-white">{request.reason}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleApprove(request.id, request.userId)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                    >
                                        <CheckCircle size={18} />
                                        承認
                                    </button>
                                    <button
                                        onClick={() => handleReject(request.id, request.userId)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                    >
                                        <XCircle size={18} />
                                        却下
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {showTotpModal && (
                <TotpVerifyModal
                    title={currentAction?.type === 'approve' ? 'Admin権限承認' : 'リクエスト却下'}
                    description="この操作を実行するには2FAコードを入力してください"
                    onVerify={handleTotpVerify}
                    onClose={() => {
                        setShowTotpModal(false);
                        setCurrentAction(null);
                    }}
                />
            )}
        </div>
    );
}
