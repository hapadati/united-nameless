/**
 * JWT生成・検証ユーティリティ
 * 将来のWebダッシュボード用
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = '7d'; // 7日間有効

/**
 * JWTトークンを生成
 * @param {object} payload - トークンに含めるデータ
 * @returns {string} JWT token
 */
export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
    });
}

/**
 * JWTトークンを検証
 * @param {string} token
 * @returns {object|null} デコードされたペイロード、無効な場合はnull
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export default {
    generateToken,
    verifyToken,
};
