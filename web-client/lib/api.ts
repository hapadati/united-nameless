export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const BOT_ID = process.env.NEXT_PUBLIC_BOT_ID || 'UNITED_NAMELESS_BOT';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Bot-ID': BOT_ID,
        ...options.headers,
    };

    try {
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        console.error(`Fetch API Error (${endpoint}):`, error);
        return null;
    }
}

// Data Types
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    points: number;
    xp: number;
    level: number;
    username?: string;
    avatarUrl?: string; // Optional: To be fetched if needed
}

export interface UserRank {
    userId?: string;
    rank: number;
    level: number;
    xp: number;
    points: number;
    nextLevelXP: number;
}
