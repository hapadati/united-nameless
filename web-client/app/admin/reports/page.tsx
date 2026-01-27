'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Flag, RefreshCw, AlertTriangle, CheckCircle, XCircle, Eye, Trash2, MessageSquare } from 'lucide-react';
import { getReports, getReportStats, updateReport, deleteReport } from '@/lib/api';
import { toast, Toaster } from 'sonner';

interface Report {
    id: string;
    messageContent: string;
    messageAuthorName: string;
    reporterName: string;
    reason: string;
    status: string;
    reportedAt: string;
    channelName?: string;
    messageUrl?: string;
}

interface ReportStats {
    pending: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    total: number;
}

export default function ReportsPage() {
    const { data: session } = useSession();
    const [reports, setReports] = useState<Report[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const userId = (session?.user as any)?.id;

    useEffect(() => {
        if (!userId) return;
        fetchData();
    }, [userId, filter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsData, statsData] = await Promise.all([
                getReports(filter === 'all' ? undefined : filter),
                getReportStats()
            ]);
            setReports(reportsData?.reports || []);
            setStats(statsData?.stats || null);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('通報データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (reportId: string, newStatus: string, action: string) => {
        if (!userId) return;

        try {
            await updateReport(reportId, {
                status: newStatus,
                action,
                reviewedBy: userId
            });
            toast.success('ステータスを更新しました');
            fetchData();
            setSelectedReport(null);
        } catch (error) {
            console.error('Failed to update report:', error);
            toast.error('更新に失敗しました');
        }
    };

    const handleDelete = async (reportId: string) => {
        if (!userId || !confirm('この通報を削除してもよろしいですか？')) return;

        try {
            await deleteReport(reportId, userId);
            toast.success('通報を削除しました');
            fetchData();
            setSelectedReport(null);
        } catch (error) {
            console.error('Failed to delete report:', error);
            toast.error('削除に失敗しました');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'reviewing': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'dismissed': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    if (loading && reports.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto">
            <Toaster theme="dark" position="bottom-right" toastOptions={{
                style: { background: '#18181b', border: '1px solid #3f3f46', color: '#fff' }
            }} />

            <header className="flex justify-between items-end pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl ring-1 ring-red-500/20">
                            <Flag className="text-red-500" size={32} />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                            Report Management
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-lg">Monitor and manage user reports to keep the community safe.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-white rounded-xl transition-all duration-300 group"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Data
                </button>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                    label="Total Reports"
                    value={stats?.total || 0}
                    icon={Flag}
                    color="zinc"
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                />
                <StatCard
                    label="Pending"
                    value={stats?.pending || 0}
                    icon={AlertTriangle}
                    color="yellow"
                    active={filter === 'pending'}
                    onClick={() => setFilter('pending')}
                />
                <StatCard
                    label="Reviewing"
                    value={stats?.reviewing || 0}
                    icon={Eye}
                    color="blue"
                    active={filter === 'reviewing'}
                    onClick={() => setFilter('reviewing')}
                />
                <StatCard
                    label="Resolved"
                    value={stats?.resolved || 0}
                    icon={CheckCircle}
                    color="green"
                    active={filter === 'resolved'}
                    onClick={() => setFilter('resolved')}
                />
                <StatCard
                    label="Dismissed"
                    value={stats?.dismissed || 0}
                    icon={XCircle}
                    color="red"
                    active={filter === 'dismissed'}
                    onClick={() => setFilter('dismissed')}
                />
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/40 backdrop-blur-sm rounded-3xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-zinc-900/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                            <Flag className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Reports Found</h3>
                        <p className="text-zinc-500">There are no reports matching the current filter.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {reports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative"
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl items-center"
                                />
                                <div
                                    className="relative p-5 rounded-2xl glass-card hover:bg-zinc-800/80 cursor-pointer flex items-center gap-6"
                                    onClick={() => setSelectedReport(report)}
                                >
                                    <div className={`w-1.5 h-16 rounded-full flex-shrink-0 ${getStatusColorBorder(report.status)}`} />

                                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-6 items-center">
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Badge status={report.status} />
                                            </div>
                                            <p className="text-xs text-zinc-500 font-mono">
                                                {new Date(report.reportedAt).toLocaleString('ja-JP')}
                                            </p>
                                        </div>

                                        <div className="col-span-3">
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Reporter</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                    {report.reporterName.charAt(0)}
                                                </div>
                                                <span className="text-white font-medium truncate">{report.reporterName}</span>
                                            </div>
                                        </div>

                                        <div className="col-span-6">
                                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">Reason</p>
                                            <p className="text-zinc-300 text-sm truncate">{report.reason}</p>
                                        </div>
                                    </div>

                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                                        <Eye size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedReport(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-2xl glass-card p-0 overflow-hidden shadow-2xl ring-1 ring-white/10"
                    >
                        <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                                    <MessageSquare className="text-blue-500" size={24} />
                                    Report Details
                                </h2>
                                <p className="text-zinc-500 text-sm font-mono">ID: {selectedReport.id}</p>
                            </div>
                            <Badge status={selectedReport.status} size="lg" />
                        </div>

                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-black/20">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Reporter</p>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                            {selectedReport.reporterName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{selectedReport.reporterName}</p>
                                            <p className="text-xs text-zinc-500">{new Date(selectedReport.reportedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Target User</p>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                                            {selectedReport.messageAuthorName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold">{selectedReport.messageAuthorName}</p>
                                            <p className="text-xs text-zinc-500">Reported User</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Report Reason</p>
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-zinc-300 leading-relaxed">
                                    {selectedReport.reason}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Message Content</p>
                                <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl text-zinc-300 font-mono text-sm leading-relaxed relative overflow-hidden group">
                                    <MessageSquare className="absolute top-4 right-4 text-zinc-800 w-12 h-12 -rotate-12 group-hover:text-zinc-700 transition-colors" />
                                    {selectedReport.messageContent}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-zinc-900/80 flex gap-3">
                            <button
                                onClick={() => handleStatusUpdate(selectedReport.id, 'resolved', 'resolved')}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Resolve
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(selectedReport.id, 'dismissed', 'no_action')}
                                className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <XCircle size={20} />
                                Dismiss
                            </button>
                            <button
                                onClick={() => handleDelete(selectedReport.id)}
                                className="px-5 py-3 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, active, onClick }: { label: string, value: number, icon: any, color: 'zinc' | 'yellow' | 'blue' | 'green' | 'red', active: boolean, onClick: () => void }) {
    const colors = {
        zinc: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20', icon: 'text-zinc-500' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: 'text-yellow-500' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'text-blue-500' },
        green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: 'text-emerald-500' },
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: 'text-red-500' }
    };

    const theme = colors[color];

    return (
        <button
            onClick={onClick}
            className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${active
                    ? `${theme.bg} ${theme.border} ring-1 ring-${color}-500/30`
                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
                }`}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${theme.icon} transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500`}>
                <Icon size={48} />
            </div>

            <p className={`text-3xl font-bold mb-1 ${active ? 'text-white' : 'text-zinc-200'}`}>{value}</p>
            <p className={`text-sm font-medium ${active ? theme.text : 'text-zinc-500'}`}>{label}</p>
        </button>
    );
}

function Badge({ status, size = 'sm' }: { status: string, size?: 'sm' | 'lg' }) {
    const styles = {
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        reviewing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        dismissed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    };

    // @ts-ignore
    const style = styles[status] || styles.pending;
    const px = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs';

    return (
        <span className={`${px} font-bold rounded-full border ${style} uppercase tracking-wider`}>
            {status}
        </span>
    );
}

function getStatusColorBorder(status: string) {
    switch (status) {
        case 'pending': return 'bg-yellow-500';
        case 'reviewing': return 'bg-blue-500';
        case 'resolved': return 'bg-emerald-500';
        case 'dismissed': return 'bg-zinc-600';
        default: return 'bg-zinc-600';
    }
}
