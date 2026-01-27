'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { getShopItems, buyItem, ShopItem } from '@/lib/api'
import { ItemCard, Item } from '@/components/ItemCard'
import { Toaster, toast } from 'sonner'
import { ShoppingBag } from 'lucide-react'

export default function ShopPage() {
    const { data: session } = useSession()
    const [items, setItems] = useState<ShopItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const data = await getShopItems()
                if (data?.items) {
                    setItems(data.items)
                }
            } catch (error) {
                console.error('Failed to fetch shop items', error)
            } finally {
                setLoading(false)
            }
        }
        fetchItems()
    }, [])

    const handleBuy = async (item: Item) => {
        if (!session || !session.user) {
            toast.error('Please login first')
            return
        }
        const userId = (session.user as any).id
        if (!userId) {
            toast.error('Session error')
            return
        }

        const promise = buyItem(userId, item.id)

        toast.promise(promise, {
            loading: 'Purchasing...',
            success: (data) => {
                if (!data || data.error) throw new Error(data?.error || 'Failed')
                return `Successfully bought ${item.name}!`
            },
            error: (err) => {
                return err.message === 'INSUFFICIENT_POINTS'
                    ? 'Insufficient points!'
                    : 'Purchase failed. Try again.'
            }
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <Toaster theme="dark" position="bottom-right" />

            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ShoppingBag className="text-primary" size={32} />
                        Item Shop
                    </h1>
                    <p className="text-zinc-500 mt-2">Spend your hard-earned points on exclusive rewards.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <ItemCard
                            item={item}
                            mode="shop"
                            onAction={handleBuy}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
