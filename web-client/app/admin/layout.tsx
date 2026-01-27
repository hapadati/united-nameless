'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShieldAlert,
    ScrollText,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    Sword,
    Target,
    Shield,
    UserCheck,
    Send,
    Flag,
    MessageSquare
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { AuthButton } from '@/components/AuthButton';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);
    const { data: session } = useSession();

    const sidebarLinks = [
        { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
        { icon: Target, label: 'Quest Manager', href: '/admin/quests' },
        { icon: Shield, label: 'Security', href: '/admin/security' },
        { icon: UserCheck, label: '承認管理', href: '/admin/approvals' },
        { icon: Send, label: 'Admin申請', href: '/admin/request' },
        { icon: Flag, label: '通報管理', href: '/admin/reports' },
        { icon: MessageSquare, label: '会議室', href: '/admin/meeting' },
        { icon: ScrollText, label: 'Audit Logs', href: '/admin/logs' },
    ];

    return (
        <div className="flex h-screen bg-[#050505] overflow-hidden bg-[url('/grid.svg')] bg-fixed">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <span className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" />
                    Admin Portal
                </span>
                <button onClick={() => setIsMobileOpen(true)} className="p-2 text-zinc-400">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <AnimatePresence>
                {(isMobileOpen || true) && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        className={`
                            fixed inset-y-0 left-0 z-50 w-72 bg-black/40 backdrop-blur-xl border-r border-white/5
                            lg:static lg:translate-x-0 transition-transform duration-300
                            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        `}
                    >
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-white/5">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-900/20">
                                            <ShieldCheck className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h1 className="font-bold text-lg text-white tracking-tight leading-none">Admin</h1>
                                            <p className="text-xs text-zinc-500 font-medium">Control Center</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-zinc-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="Admin" className="w-10 h-10 rounded-full border border-white/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                            {session?.user?.name?.charAt(0) || 'A'}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'Admin User'}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-xs text-emerald-500 font-medium">Online</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                                <p className="px-4 text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Main Menu</p>
                                {sidebarLinks.map((link) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                                ${isActive
                                                    ? 'text-white bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20'
                                                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'}
                                            `}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500" />
                                            )}
                                            <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`} />
                                            <span className="font-medium relative z-10">{link.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                                >
                                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>
                <div className="p-8 relative z-10">
                    <div className="max-w-[1600px] mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
