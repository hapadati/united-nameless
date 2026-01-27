'use client';

import React from 'react';
import { TotpSetup } from '@/components/admin/TotpSetup';

export default function SecurityPage() {
    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Security Settings</h1>
                <p className="text-zinc-500">Manage 2-Factor Authentication and access controls.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section>
                    <TotpSetup />
                </section>

                <section className="space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                        <h3 className="text-lg font-bold mb-4">Access Logs</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/20">
                                <span className="text-zinc-300">Login via Discord</span>
                                <span className="text-zinc-500">Just now</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-black/20">
                                <span className="text-zinc-300">Admin Page Access</span>
                                <span className="text-zinc-500">2 mins ago</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
