/**
 * リクエストバリデーションヘルパー
 */

/**
 * Discord User IDの形式を検証
 * @param {string} userId
 * @returns {boolean}
 */
export function isValidUserId(userId) {
    return /^\d{17,19}$/.test(userId);
}

/**
 * Discord Guild IDの形式を検証
 * @param {string} guildId
 * @returns {boolean}
 */
export function isValidGuildId(guildId) {
    return /^\d{17,19}$/.test(guildId);
}

/**
 * 必須フィールドを検証
 * @param {object} data
 * @param {string[]} requiredFields
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateRequired(data, requiredFields) {
    const missing = requiredFields.filter((field) => !(field in data) || data[field] === undefined || data[field] === null);

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * ポイント数を検証
 * @param {number} points
 * @returns {boolean}
 */
export function isValidPoints(points) {
    return typeof points === 'number' && points >= 0 && Number.isInteger(points);
}

export default {
    isValidUserId,
    isValidGuildId,
    validateRequired,
    isValidPoints,
};
