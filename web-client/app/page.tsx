'use client'

import React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { AuthButton } from '@/components/AuthButton'
import { ChevronDown, Trophy, Zap, Shield, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroY = useTransform(scrollY, [0, 500], [0, 200])

  return (
    <div className="min-h-screen bg-black overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-0 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">N</span>
          </div>
          <span className="text-xl font-bold tracking-tighter">UNITED NAMELESS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">Leaderboard</Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">About</Link>
          <AuthButton />
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="relative h-screen flex flex-col items-center justify-center text-center px-4"
      >
        <div className="absolute inset-0 z-0 opacity-40">
          {/* Abstract Background Gradient - Could be video later */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-black to-black" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full" />
        </div>

        <div className="z-10 max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6 inline-block">
              Next Generation Community
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              TALK.<br />EARN.<br />CONQUER.
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto">
              Turn your Discord activity into real rewards.
              Level up, unlock items, and dominate the leaderboard.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/dashboard" className="px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-zinc-200 transition-transform hover:scale-105">
              Start Earning
            </Link>
            <Link href="/leaderboard" className="px-8 py-4 bg-zinc-900 border border-zinc-800 text-white font-bold text-lg rounded-full hover:bg-zinc-800 transition-transform hover:scale-105">
              View Rankings
            </Link>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 z-10 text-zinc-500"
        >
          <ChevronDown size={32} />
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5 bg-zinc-900/30">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatCard number="1.2M+" label="Messages Tracked" />
          <StatCard number="50K+" label="Quests Completed" />
          <StatCard number="8.5K+" label="Active Users" />
          <StatCard number="∞" label="Possibilities" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 container mx-auto px-4 space-y-32">
        <FeatureBlock
          title="Activity Tracking"
          desc="Every message counts. Our advanced bot tracks your engagement across voice and text channels, converting activity into points automatically."
          icon={<Zap className="w-8 h-8 text-yellow-400" />}
          align="left"
        />
        <FeatureBlock
          title="Quest System"
          desc="Complete daily and weekly challenges to earn bonus XP. From simple conversations to complex community events, there's always a goal."
          icon={<Trophy className="w-8 h-8 text-purple-400" />}
          align="right"
        />
        <FeatureBlock
          title="Player Marketplace"
          desc="Use your hard-earned points to buy roles, items, and exclusive perks in our integrated web shop. Manage your inventory directly from the dashboard."
          icon={<Shield className="w-8 h-8 text-blue-400" />}
          align="left"
        />
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 text-center text-zinc-600">
          <p>&copy; 2026 UNITED NAMELESS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ number, label }: { number: string, label: string }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-black text-white mb-2">{number}</div>
      <div className="text-sm font-medium text-zinc-500 uppercase tracking-widest">{label}</div>
    </div>
  )
}

function FeatureBlock({ title, desc, icon, align }: { title: string, desc: string, icon: React.ReactNode, align: 'left' | 'right' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className={`flex flex-col md:flex-row gap-12 items-center ${align === 'right' ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="flex-1 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-4xl font-bold">{title}</h2>
        <p className="text-lg text-zinc-400 leading-relaxed">{desc}</p>
      </div>
      <div className="flex-1 w-full aspect-video bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-zinc-800 p-1 relative overflow-hidden group">
        {/* Placeholder for feature image */}
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        <div className="w-full h-full rounded-2xl bg-zinc-950/50 flex items-center justify-center text-zinc-700 font-mono">
          [Feature Visualization]
        </div>
      </div>
    </motion.div>
  )
}
