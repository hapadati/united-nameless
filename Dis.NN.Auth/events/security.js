import { api } from '../utils/api.js';
import { PermissionFlagsBits } from 'discord.js';

// 3. セキュリティ監視（Anti-Nuke / Anti-Raid）

/**
 * Audit Log 監視ハンドラー
 * 3.1.1 対象イベント: CHANNEL_CREATE/DELETE, ROLE_CREATE/DELETE/UPDATE, 
 * MEMBER_BAN/KICK, WEBHOOK_CREATE, BOT_ADD
 */
export async function handleAuditLogEvent(guild, auditLogEntry) {
    if (!guild || !auditLogEntry) return;

    try {
        const { action, executorId, targetId, targetType } = auditLogEntry;

        // 3.1.2 APIへ送信
        const response = await api.postEvent('/audit', {
            guildId: guild.id,
            action: action,
            executorId: executorId,
            targetId: targetId,
            targetType: targetType,
            timestamp: Math.floor(Date.now() / 1000)
        });

        // 3.1.4 Lockdown発動時の処理
        if (response && response.lockdown) {
            await executeLockdown(guild);
        }
    } catch (err) {
        console.error('[Security] handleAuditLogEvent error:', err);
    }
}

/**
 * 3.1.4 Lockdown 実行
 * - @everyone 権限停止
 * - Webhook削除
 * - 管理者通知
 */
export async function executeLockdown(guild) {
    if (!guild) return;

    console.log(`🚨 [LOCKDOWN] Activating for guild: ${guild.name}`);

    try {
        // @everyone のメッセージ送信権限を剥奪
        const everyoneRole = guild.roles.everyone;
        if (everyoneRole) {
            const newPermissions = everyoneRole.permissions.remove([
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.SendMessagesInThreads
            ]);

            await everyoneRole.setPermissions(newPermissions, 'Lockdown: Restricting permissions');
            console.log('✅ [LOCKDOWN] @everyone permissions restricted');
        }
    } catch (err) {
        console.error('❌ [LOCKDOWN] Failed to restrict permissions:', err);
    }

    try {
        // 全Webhookを削除
        const webhooks = await guild.fetchWebhooks();
        let deletedCount = 0;

        for (const webhook of webhooks.values()) {
            try {
                await webhook.delete('Lockdown: Removing all webhooks');
                deletedCount++;
            } catch (err) {
                console.error(`[LOCKDOWN] Failed to delete webhook ${webhook.id}:`, err);
            }
        }
        console.log(`✅ [LOCKDOWN] Deleted ${deletedCount}/${webhooks.size} webhooks`);
    } catch (err) {
        console.error('❌ [LOCKDOWN] Failed to fetch/delete webhooks:', err);
    }

    try {
        // 管理者通知（システムチャンネルまたはログチャンネル）
        const systemChannel = guild.systemChannel;
        if (systemChannel && systemChannel.isTextBased()) {
            await systemChannel.send({
                content: `🚨 **LOCKDOWN ACTIVATED**\n\n` +
                    `サーバーが異常な操作を検知し、自動的にロックダウンモードに入りました。\n` +
                    `管理者は速やかに状況を確認してください。`,
                allowedMentions: { parse: [] }
            });
        }
    } catch (err) {
        console.error('❌ [LOCKDOWN] Failed to send notification:', err);
    }
}

/**
 * 3.2 怪しいBot検知
 * Bot追加時に管理権限をチェック
 */
export async function handleBotJoin(member) {
    if (!member || !member.user) return;
    if (!member.user.bot) return;
    if (!member.guild) return;

    try {
        const permissions = member.permissions?.toArray() || [];
        const hasAdmin = member.permissions?.has(PermissionFlagsBits.Administrator) || false;

        // Permission flag names (discord.js returns PermissionFlagsBits keys)
        const dangerousPerms = permissions.filter(p =>
            ['Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'ManageWebhooks'].includes(p)
        );

        if (hasAdmin || dangerousPerms.length > 0) {
            // 3.2.2 APIへ通知
            await api.postEvent('/bot-join', {
                guildId: member.guild.id,
                botId: member.user.id,
                botName: member.user.tag,
                permissions: permissions,
                hasAdministrator: hasAdmin,
                timestamp: Math.floor(Date.now() / 1000)
            });

            console.warn(`⚠️ [Security] Suspicious bot joined: ${member.user.tag} with ${dangerousPerms.length} dangerous permissions`);
        }
    } catch (err) {
        console.error('[Security] handleBotJoin error:', err);
    }
}
