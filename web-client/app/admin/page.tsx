'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Users, Server, AlertTriangle } from 'lucide-react';
import { TotpVerifyModal } from '@/components/admin/TotpVerifyModal';
import { fetchAPI } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const [showLockdownModal, setShowLockdownModal] = useState(false);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Overview</h1>
                <p className="text-zinc-500">Real-time system metrics and security status.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    icon={Activity}
                    label="API Latency"
                    value="45ms"
                    trend="-12%"
                    trendUp={false} // Low latency is good
                    color="emerald"
                />
                <MetricCard
                    icon={Users}
                    label="Active Admins"
                    value="3"
                    subValue="Online now"
                    color="blue"
                />
                <MetricCard
                    icon={Shield}
                    label="Auth Failures"
                    value="0"
                    trend="0%"
                    color="green"
                />
                <MetricCard
                    icon={Server}
                    label="Bot Status"
                    value="Online"
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Alerts */}
                <section className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" size={20} />
                            Security Alerts
                        </h2>
                        <button className="text-sm text-zinc-500 hover:text-white transition-colors">View All</button>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <Shield size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">System Lockdown Deactivated</div>
                                <div className="text-xs text-zinc-500">2 hours ago • Admin (You)</div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Activity size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-sm">Bot Restarted</div>
                                <div className="text-xs text-zinc-500">5 hours ago • System</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                    <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setShowLockdownModal(true)}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all text-red-400 font-bold flex flex-col items-center gap-2"
                        >
                            <Shield size={24} />
                            Emergency Lockdown
                        </button>
                        <button className="p-4 rounded-xl bg-zinc-800/50 border border-white/5 hover:bg-zinc-800 transition-all text-zinc-300 font-bold flex flex-col items-center gap-2">
                            <Server size={24} />
                            Restart Services
                        </button>
                    </div>
                </section>
            </div>

            <TotpVerifyModal
                isOpen={showLockdownModal}
                onClose={() => setShowLockdownModal(false)}
                actionName="System Lockdown"
                onVerify={async (code) => {
                    try {
                        const res = await fetchAPI('/admin/lockdown', {
                            method: 'POST',
                            headers: {
                                'X-Bot-ID': 'UNITED_NAMELESS_BOT', // Mock Auth
                                'X-TOTP-Token': code
                            },
                            body: JSON.stringify({
                                reason: 'Manual Emergency Lockdown',
                                initiatedBy: 'WebAdmin'
                            })
                        });

                        if (res && res.success) {
                            toast.success('Lockdown Activated!');
                            return true;
                        } else {
                            return false;
                        }
                    } catch (e) {
                        console.error(e);
                        return false;
                    }
                }}
            />
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, subValue, trend, trendUp, color = "zinc" }: any) {
    const colors = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        green: "text-green-400 bg-green-500/10 border-green-500/20",
        zinc: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    }
    const colorClass = colors[color as keyof typeof colors] || colors.zinc

    return (
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <div className="text-sm text-zinc-500 font-medium mb-1">{label}</div>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {subValue && <div className="text-xs text-zinc-600 mt-1">{subValue}</div>}
            </div>
        </div>
    )
}
