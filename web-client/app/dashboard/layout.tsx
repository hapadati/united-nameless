'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react' // Use NextAuth hooks
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Settings,
    LogOut,
    User,
    Shield
} from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session } = useSession()


    return (
        <div className="flex h-screen bg-black text-zinc-100 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-zinc-950/50 flex flex-col backdrop-blur-xl">
                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">N</span>
                        </div>
                        <span className="font-bold tracking-tight">UNITED NAMELESS</span>
                    </Link>
                </div>

                <div className="flex-1 py-6 px-4 space-y-1">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavItem href="/dashboard/profile" icon={<User size={20} />} label="Profile" />
                    <NavItem href="/dashboard/shop" icon={<ShoppingBag size={20} />} label="Item Shop" />
                    <NavItem href="/dashboard/inventory" icon={<Package size={20} />} label="Inventory" />
                    <NavItem href="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />

                    {/* Admin Link - Conditional rendering could go here, but checking role is better */}
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="px-4 text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Administration</p>
                        <NavItem href="/admin/quests" icon={<Shield size={20} />} label="Quest Manager" />
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Avatar" className="w-10 h-10 rounded-full border border-zinc-700" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <User size={20} className="text-zinc-500" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{session?.user?.name || 'Guest'}</p>
                                <p className="text-xs text-zinc-500 truncate">ID: {(session?.user as any)?.id?.slice(0, 8) || '...'}...</p>
                            </div>
                        </div>
                        <button onClick={() => signOut()} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-grid-white/[0.02] relative">
                <div className="absolute inset-0 bg-black/50 pointer-events-none" /> {/* Overlay for grid readability */}
                <div className="relative p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            {label}
        </Link>
    )
}
