'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut, User } from "lucide-react"

export function AuthButton() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {session.user?.image && (
                        <img
                            src={session.user.image}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-zinc-700"
                        />
                    )}
                    <div className="hidden md:block text-sm">
                        <p className="font-medium text-zinc-200">{session.user?.name}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn('discord')}
            className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-md font-medium transition-colors"
        >
            <LogIn size={18} />
            Login with Discord
        </button>
    )
}
