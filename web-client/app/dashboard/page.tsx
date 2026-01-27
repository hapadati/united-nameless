'use client'

import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { CreditCard, TrendingUp, Activity, User } from "lucide-react"

export default function DashboardPage() {
    const { data: session } = useSession()

    // Mock Data (Replace with API fetch)
    const stats = [
        { label: "Current Balance", value: "12,450 pts", icon: <CreditCard className="text-emerald-400" />, trend: "+2,300 this week" },
        { label: "Community Rank", value: "#42", icon: <TrendingUp className="text-blue-400" />, trend: "Top 5%" },
        { label: "Activity Score", value: "850", icon: <Activity className="text-purple-400" />, trend: "Very Active" },
    ]

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {session?.user?.name} 👋</h1>
                <p className="text-zinc-500 mt-2">Here's what's happening with your account today.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                {stat.icon}
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {stat.trend}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-zinc-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-zinc-900/50 border border-white/5 overflow-hidden backdrop-blur-sm"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Recent Transactions</h2>
                    <button className="text-sm text-primary hover:underline">View All</button>
                </div>
                <div className="p-6 text-center text-zinc-500 py-20">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity size={24} />
                    </div>
                    <p>No recent activity found.</p>
                    <p className="text-sm mt-2">Start chatting in Discord to earn points!</p>
                </div>
            </motion.div>
        </div>
    )
}
