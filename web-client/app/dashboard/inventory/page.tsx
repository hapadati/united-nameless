'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { getUserInventory, useItem, InventoryItem } from '@/lib/api'
import { ItemCard, Item } from '@/components/ItemCard'
import { Toaster, toast } from 'sonner'
import { Package } from 'lucide-react'

export default function InventoryPage() {
    const { data: session } = useSession()
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchInventory = async () => {
        if (!session || !session.user) return
        const userId = (session.user as any).id
        if (!userId) return

        try {
            const data = await getUserInventory(userId)
            if (data?.items) {
                setItems(data.items)
            }
        } catch (error) {
            console.error('Failed to fetch inventory', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user) {
            fetchInventory()
        }
    }, [session])

    const handleUse = async (item: Item) => {
        if (!session || !session.user) return
        const userId = (session.user as any).id
        if (!userId) return

        const promise = useItem(userId, item.id)

        toast.promise(promise, {
            loading: 'Using item...',
            success: (data) => {
                if (!data || data.error) throw new Error(data?.error || 'Failed')
                // Refresh inventory after use
                fetchInventory()
                return data.message || `Used ${item.name}!`
            },
            error: (err) => {
                return err.message === 'ITEM_NOT_OWNED'
                    ? 'Item not found in inventory'
                    : 'Failed to use item.'
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
                        <Package className="text-blue-500" size={32} />
                        Your Inventory
                    </h1>
                    <p className="text-zinc-500 mt-2">View and manage your purchased items.</p>
                </div>
            </header>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-400">Inventory is Empty</h2>
                    <p className="text-zinc-500 mt-2">Visit the Shop to buy your first item!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.itemId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <ItemCard
                                item={{
                                    type: 'consumable', // Default type for inventory items if not provided
                                    id: item.itemId,
                                    name: item.name,
                                    description: item.description,
                                    count: item.count
                                }}
                                mode="inventory"
                                onAction={handleUse}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
