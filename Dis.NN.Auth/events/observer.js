import { api } from '../utils/api.js';
import { EmbedBuilder } from 'discord.js';

// 2.1 メッセージ監視
export async function handleMessageEvent(message) {
    // 安全性チェック
    if (!message || !message.author) return;
    if (message.author.bot) return; // Ignore Bots
    if (!message.guild || !message.guildId) return; // DM除外

    // Webhook除外
    if (message.webhookId) return;

    try {
        // APIへ送信
        const response = await api.postEvent('/message', {
            guildId: message.guildId,
            channelId: message.channelId,
            userId: message.author.id,
            messageId: message.id,
            createdAt: Math.floor(message.createdTimestamp / 1000)
        });

        // 2.1.5 Botの返答処理
        if (response && response.earned) {
            console.log(`[Points] User ${message.author.tag} earned ${response.amount} points.`);

            // レベルアップ通知
            if (response.levelUp) {
                try {
                    await message.channel.send({
                        content: `🆙 ${message.author} の活動ランクが **Lv${xpResponse.newLevel || response.newLevel}** に上がりました！`,
                        allowedMentions: { users: [message.author.id] }
                    });
                } catch (err) {
                    console.error('[Observer] Failed to send level-up message:', err);
                }
            }
        }

        // --- クエスト進捗報告 ---
        try {
            const questResponse = await api.post('/quests/progress', {
                userId: message.author.id,
                type: 'MESSAGE_IN_CHANNEL',
                context: { channelId: message.channelId }
            });

            if (questResponse && questResponse.success && questResponse.completed?.length > 0) {
                for (const quest of questResponse.completed) {
                    await message.reply({
                        content: `✅ **活動目標達成**\n「${quest.title}」を達成しました。\n活動報酬: **+${quest.rewardPoints}pt**`,
                        allowedMentions: { repliedUser: false }
                    });
                }
            }
        } catch (questErr) {
            console.error('Quest progress report failed:', questErr.message);
        }
    } catch (err) {
        console.error('[Observer] handleMessageEvent error:', err);
        // エラーでもBotは落ちない
    }
}

// 2.2 VC監視
export async function handleVoiceStateUpdate(oldState, newState) {
    // 安全性チェック
    if (!newState || !newState.member) return;

    const member = newState.member;
    if (!member.user || member.user.bot) return;
    if (!newState.guild) return;

    try {
        // 関連する変更のみ検知
        const isChannelChange = oldState.channelId !== newState.channelId;
        const isMuteChange = oldState.selfMute !== newState.selfMute ||
            oldState.serverMute !== newState.serverMute;
        const isStreamChange = oldState.streaming !== newState.streaming;

        if (!isChannelChange && !isMuteChange && !isStreamChange) return;

        const channelId = newState.channelId || oldState.channelId;

        await api.postEvent('/voice', {
            guildId: newState.guild.id,
            userId: member.id,
            channelId: channelId,
            joined: !!newState.channelId,
            selfMuted: newState.selfMute || newState.serverMute || false,
            streaming: newState.streaming || false,
            timestamp: Math.floor(Date.now() / 1000)
        });
    } catch (err) {
        console.error('[Observer] handleVoiceStateUpdate error:', err);
        // エラーでもBotは落ちない
    }
}
