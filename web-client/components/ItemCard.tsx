'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Package, Star, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'

export interface Item {
    id: string
    name: string
    description: string
    price?: number
    type: 'buff' | 'role' | 'consumable'
    count?: number
    purchasedAt?: string
    isUsed?: boolean
}

interface ItemCardProps {
    item: Item
    mode: 'shop' | 'inventory'
    onAction: (item: Item) => Promise<void>
}

export function ItemCard({ item, mode, onAction }: ItemCardProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleAction = async () => {
        setIsLoading(true)
        try {
            await onAction(item)
        } catch (error) {
            console.error('Action failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getIcon = () => {
        switch (item.type) {
            case 'buff': return <Clock className="text-blue-400" />
            case 'role': return <Shield className="text-purple-400" />
            case 'consumable': return <Star className="text-yellow-400" />
            default: return <Package className="text-zinc-400" />
        }
    }

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110`}>
                {mode === 'shop' ? <ShoppingBag size={64} /> : <Package size={64} />}
            </div>

            <div className="flex items-start justify-between mb-4 z-10">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    {getIcon()}
                </div>
                {mode === 'shop' && (
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                        {item.price?.toLocaleString()} pts
                    </div>
                )}
                {mode === 'inventory' && item.count && (
                    <div className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-sm">
                        x{item.count}
                    </div>
                )}
            </div>

            <div className="flex-1 space-y-2 mb-6 z-10">
                <h3 className="text-xl font-bold tracking-tight">{item.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
            </div>

            <button
                onClick={handleAction}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all z-10 ${mode === 'shop'
                        ? 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                        : 'bg-primary text-white hover:bg-primary/90 active:scale-95'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    mode === 'shop' ? 'Purchase' : 'Use Item'
                )}
            </button>
        </motion.div>
    )
}
