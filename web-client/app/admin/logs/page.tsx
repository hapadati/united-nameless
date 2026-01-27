'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ScrollText, RefreshCw, Clock, User, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    ipAddress?: string;
}

export default function AuditLogsPage() {
    const { data: session } = useSession();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(50);

    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (!userId) return;
        fetchLogs();
    }, [userId, limit]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // API呼び出し（実装後に有効化）
            // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit?limit=${limit}`, {
            //     headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
            // });
            // const data = await response.json();
            // setLogs(data.logs || []);

            // モックデータ（開発用）
            const mockLogs: AuditLog[] = [
                {
                    id: '1',
                    timestamp: new Date(Date.now() - 10000).toISOString(),
                    userId: userId || 'unknown',
                    action: 'Admin権限承認',
                    details: 'User ID 987654321 の Admin権限を承認しました',
                    severity: 'success'
                },
                {
                    id: '2',
                    timestamp: new Date(Date.now() - 60000).toISOString(),
                    userId: userId || 'unknown',
                    action: 'ログイン',
                    details: 'Discord OAuth認証でログインしました',
                    severity: 'info'
                },
                {
                    id: '3',
                    timestamp: new Date(Date.now() - 120000).toISOString(),
                    userId: '123456789',
                    action: 'Emergency Lockdown',
                    details: 'システムロックダウンを実行しました。理由：セキュリティテスト',
                    severity: 'warning'
                },
                {
                    id: '4',
                    timestamp: new Date(Date.now() - 180000).toISOString(),
                    userId: userId || 'unknown',
                    action: 'Admin権限却下',
                    details: 'User ID 111222333 の Admin権限リクエストを却下しました',
                    severity: 'error'
                },
                {
                    id: '5',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    userId: '987654321',
                    action: '2FA セットアップ',
                    details: '2要素認証を有効化しました',
                    severity: 'success'
                }
            ];

            setLogs(mockLogs);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            toast.error('監査ログの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityConfig = (severity: string) => {
        switch (severity) {
            case 'success':
                return { icon: CheckCircle, color: 'text-green-400 bg-green-500/10 border-green-500/20' };
            case 'warning':
                return { icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
            case 'error':
                return { icon: XCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
            default:
                return { icon: Shield, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Toaster theme="dark" position="bottom-right" />

            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                        <ScrollText className="text-blue-500" size={32} />
                        監査ログ
                    </h1>
                    <p className="text-zinc-500">システムとユーザーのアクティビティを監視します</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                    <RefreshCw size={18} />
                    更新
                </button>
            </header>

            <div className="flex gap-4">
                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                    <option value={25}>25件表示</option>
                    <option value={50}>50件表示</option>
                    <option value={100}>100件表示</option>
                </select>
            </div>

            <div className="space-y-3">
                {logs.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <ScrollText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500">ログがありません</p>
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const config = getSeverityConfig(log.severity);
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-xl border ${config.color}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-white">{log.action}</h3>
                                            <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-zinc-400 font-mono">
                                                {log.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-zinc-300 text-sm mb-2">{log.details}</p>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <User size={14} />
                                                {log.userId}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {new Date(log.timestamp).toLocaleString('ja-JP')}
                                            </span>
                                            {log.ipAddress && (
                                                <span className="font-mono">{log.ipAddress}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                <div className="flex gap-3">
                    <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="text-yellow-500 font-bold mb-2">注意事項</h3>
                        <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
                            <li>監査ログは重要なセキュリティ情報です。不審な活動があればすぐに対処してください。</li>
                            <li>現在はモックデータを表示しています。API実装後に実際のログが表示されます。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
