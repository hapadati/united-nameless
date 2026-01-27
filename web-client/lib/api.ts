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
    avatarUrl?: string;
}

export interface UserRank {
    userId?: string;
    rank: number;
    level: number;
    xp: number;
    points: number;
    nextLevelXP: number;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'buff' | 'role' | 'consumable';
}

export interface InventoryItem {
    itemId: string;
    name: string;
    count: number;
    description: string;
}

// Shop & Inventory APIs
export async function getShopItems(): Promise<{ items: ShopItem[] } | null> {
    return fetchAPI('/economy/shop');
}

export async function buyItem(userId: string, itemId: string): Promise<{ success: boolean, error?: string }> {
    return fetchAPI('/economy/buy', {
        method: 'POST',
        body: JSON.stringify({ userId, itemId }),
    });
}

export async function getUserInventory(userId: string): Promise<{ items: InventoryItem[] } | null> {
    return fetchAPI(`/economy/inventory?userId=${userId}`);
}

export async function useItem(userId: string, itemId: string): Promise<{ success: boolean, message?: string, error?: string }> {
    return fetchAPI('/economy/use', {
        method: 'POST',
        body: JSON.stringify({ userId, itemId }),
    });
}

// Point Conversion
export async function convertPoints(userId: string, points: number) {
    return fetchAPI('/economy/convert', {
        method: 'POST',
        body: JSON.stringify({ userId, points }),
    });
}

// User Balance
export async function getUserBalance(userId: string) {
    return fetchAPI(`/economy/balance?userId=${userId}`);
}

// User Rank
export async function getUserRank(userId: string): Promise<UserRank | null> {
    return fetchAPI(`/economy/rank?userId=${userId}`);
}

// User Activity
export interface ActivityEntry {
    id: string;
    type: 'message' | 'voice' | 'reward' | 'purchase' | 'conversion';
    description: string;
    points?: number;
    xp?: number;
    timestamp: string;
}

export async function getUserActivity(userId: string, limit: number = 10): Promise<ActivityEntry[]> {
    try {
        const data = await fetchAPI(`/activity/${userId}?limit=${limit}`);
        return data?.activities || [];
    } catch (error) {
        console.error('Failed to fetch user activity:', error);
        return [];
    }
}

// Admin承認システム関連
export async function requestAdminAccess(userId: string, reason: string) {
    return fetchAPI('/admin/request-access', {
        method: 'POST',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify({ userId, reason })
    });
}

export async function checkSuperAdmin(userId: string) {
    return fetchAPI(`/admin/super-check?userId=${userId}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function getAdminApprovals(userId: string) {
    return fetchAPI(`/admin/approvals?userId=${userId}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function approveAdmin(requestId: string, userId: string, approvedBy: string, totpCode: string) {
    return fetchAPI('/admin/approve', {
        method: 'POST',
        headers: {
            'X-Bot-ID': 'UNITED_NAMELESS_BOT',
            'X-TOTP-Token': totpCode
        },
        body: JSON.stringify({ requestId, userId, approvedBy })
    });
}

export async function rejectAdmin(requestId: string, rejectedBy: string, reason: string, totpCode: string) {
    return fetchAPI('/admin/reject', {
        method: 'POST',
        headers: {
            'X-Bot-ID': 'UNITED_NAMELESS_BOT',
            'X-TOTP-Token': totpCode
        },
        body: JSON.stringify({ requestId, rejectedBy, reason })
    });
}

// 通報管理関連
export async function getReports(status?: string, limit: number = 50) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());

    return fetchAPI(`/reports?${params.toString()}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function getReport(reportId: string) {
    return fetchAPI(`/reports/${reportId}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function updateReport(reportId: string, data: { status?: string, action?: string, notes?: string, reviewedBy?: string }) {
    return fetchAPI(`/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify(data)
    });
}

export async function deleteReport(reportId: string, deletedBy: string) {
    return fetchAPI(`/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify({ deletedBy })
    });
}

export async function getReportStats() {
    return fetchAPI('/reports/stats', {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

// 会議室管理関連
export async function getMeetingRooms(status: string = 'active') {
    return fetchAPI(`/meeting/rooms?status=${status}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function createMeetingRoom(name: string, description: string, createdBy: string) {
    return fetchAPI('/meeting/rooms', {
        method: 'POST',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify({ name, description, createdBy })
    });
}

export async function deleteMeetingRoom(roomId: string) {
    return fetchAPI(`/meeting/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function getMeetingMessages(roomId: string, limit: number = 50) {
    return fetchAPI(`/meeting/rooms/${roomId}/messages?limit=${limit}`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function sendMeetingMessage(roomId: string, userId: string, userName: string, content: string) {
    return fetchAPI(`/meeting/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify({ userId, userName, content })
    });
}

export async function getMeetingNotes(roomId: string) {
    return fetchAPI(`/meeting/rooms/${roomId}/notes`, {
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' }
    });
}

export async function createMeetingNote(roomId: string, title: string, content: string, createdBy: string) {
    return fetchAPI(`/meeting/rooms/${roomId}/notes`, {
        method: 'POST',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify({ title, content, createdBy })
    });
}

export async function updateMeetingNote(roomId: string, noteId: string, data: { title?: string, content?: string, pinned?: boolean }) {
    return fetchAPI(`/meeting/rooms/${roomId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'X-Bot-ID': 'UNITED_NAMELESS_BOT' },
        body: JSON.stringify(data)
    });
}
