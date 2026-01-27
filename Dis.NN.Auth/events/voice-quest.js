import { api } from '../utils/api.js';

// ユーザーごとのVC入室時間を記録
// Key: userId, Value: timestamp (ms)
const voiceJoinTimes = new Map();

/**
 * VC参加・退出・移動を検知してクエスト進捗を送信
 * @param {import('discord.js').VoiceState} oldState 
 * @param {import('discord.js').VoiceState} newState 
 */
export async function handleVoiceQuest(oldState, newState) {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;
    if (newState.member?.user.bot) return; // Botは無視

    // 1. 退出または移動 (Old channel existed)
    if (oldState.channelId) {
        const joinTime = voiceJoinTimes.get(userId);
        if (joinTime) {
            const durationMs = Date.now() - joinTime;
            const durationMinutes = Math.floor(durationMs / 1000 / 60);

            // 1分以上の場合のみ報告
            if (durationMinutes >= 1) {
                console.log(`[VoiceQuest] User ${userId} spent ${durationMinutes} mins in ${oldState.channelId}`);

                try {
                    const response = await api.post('/quests/progress', {
                        userId: userId,
                        type: 'VOICE_JOIN',
                        duration: durationMinutes,
                        context: { channelId: oldState.channelId }
                    });

                    if (response && response.success && response.completed?.length > 0) {
                        // 完了通知（できればDMやシステムログが良いが、ここではconsoleのみ、またはテキストチャンネルがあれば送信）
                        // ※ VCのみの参加だとテキストチャンネルが不明なため、通知が難しい。
                        // メインチャンネルがあれば送るなどの工夫が必要だが、一旦ログのみ。
                        console.log(`[VoiceQuest] Quests completed:`, response.completed);
                    }
                } catch (err) {
                    console.error('[VoiceQuest] Failed to report progress:', err.message);
                }
            }

            voiceJoinTimes.delete(userId);
        }
    }

    // 2. 参加または移動 (New channel exists)
    if (newState.channelId) {
        // AFKチャンネルなどの除外ロジックが必要ならここに追加
        // if (newState.channelId === newState.guild.afkChannelId) return;

        voiceJoinTimes.set(userId, Date.now());
    }
}
