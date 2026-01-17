import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Config
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const BOT_ID = process.env.BOT_ID || 'DISCORD_BOT_ID';
const REQUEST_TIMEOUT = 10000; // 10秒に延長

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Bot-ID': BOT_ID
    },
    timeout: REQUEST_TIMEOUT
});

// Helper for error handling (Safe Mode)
const safeRequest = async (method, url, data = {}, params = {}) => {
    try {
        const config = { params };
        let response;

        if (method === 'POST') {
            response = await client.post(url, data, config);
        } else if (method === 'GET') {
            response = await client.get(url, config);
        } else {
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        return response.data;
    } catch (error) {
        // 詳細なエラーログ
        if (error.response) {
            // サーバーがエラーレスポンスを返した
            console.error(`[API Error] ${method} ${url}: ${error.response.status} ${error.response.statusText}`);
            if (error.response.data) {
                console.error('[API Error] Response:', error.response.data);
            }
        } else if (error.request) {
            // リクエストは送信されたがレスポンスがない
            console.error(`[API Error] ${method} ${url}: No response received (timeout or network error)`);
        } else {
            // リクエスト設定時のエラー
            console.error(`[API Error] ${method} ${url}:`, error.message);
        }

        // "Botは落ちない" - Return null
        return null;
    }
};

export const api = {
    postEvent: (path, data) => {
        // Validation
        if (!path || typeof path !== 'string') {
            console.error('[API] Invalid path:', path);
            return Promise.resolve(null);
        }
        return safeRequest('POST', `/events${path}`, data);
    },

    get: (path, params) => {
        if (!path || typeof path !== 'string') {
            console.error('[API] Invalid path:', path);
            return Promise.resolve(null);
        }
        return safeRequest('GET', path, {}, params);
    },

    post: (path, data) => {
        if (!path || typeof path !== 'string') {
            console.error('[API] Invalid path:', path);
            return Promise.resolve(null);
        }
        return safeRequest('POST', path, data);
    }
};
