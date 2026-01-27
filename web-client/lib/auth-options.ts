
import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID ?? "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
            authorization: { params: { scope: 'identify guilds' } }, // Require 'guilds' scope to check permission
        }),
    ],
    callbacks: {
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.id = token.sub; // Add Discord ID to session
                session.user.isAdmin = false; // Will check later against API
            }
            return session;
        },
        async jwt({ token, profile }: any) {
            // Persist the user ID to the token right after signin
            if (profile) {
                token.id = profile.id;
            }
            return token;
        }
    },
    pages: {
        signIn: '/auth/signin', // Custom sign-in page if needed, or default
    }
}

// Export handler for App Router
import { NextApiRequest, NextApiResponse } from "next"

// Note: For App Router we usually check NextAuth v5 or use Route Handler wrapper
// But with next-auth v4 stable, we use 'route.ts' wrapper.
