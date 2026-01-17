// events/audit-monitor.js - Audit Log Monitoring System
import { Events, AuditLogEvent } from 'discord.js';
import { handleAuditLogEvent } from './security.js';

/**
 * Setup audit log monitoring
 * @param {Client} client
 */
export function setupAuditLogMonitoring(client) {
    console.log('🔍 Setting up Audit Log monitoring...');

    // Channel events
    client.on(Events.ChannelCreate, async (channel) => {
        await handleChannelEvent(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    });

    client.on(Events.ChannelDelete, async (channel) => {
        await handleChannelEvent(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    });

    //Role events
    client.on(Events.GuildRoleCreate, async (role) => {
        await handleRoleEvent(role.guild, AuditLogEvent.RoleCreate, role.id);
    });

    client.on(Events.GuildRoleDelete, async (role) => {
        await handleRoleEvent(role.guild, AuditLogEvent.RoleDelete, role.id);
    });

    client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
        await handleRoleEvent(newRole.guild, AuditLogEvent.RoleUpdate, newRole.id);
    });

    // Ban events
    client.on(Events.GuildBanAdd, async (ban) => {
        await handleModerationEvent(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    });

    // Webhook events
    client.on(Events.WebhooksUpdate, async (channel) => {
        await handleWebhookEvent(channel.guild, channel.id);
    });

    console.log('✅ Audit Log monitoring active');
}

/**
 * Handle channel audit events
 */
async function handleChannelEvent(guild, action, targetId) {
    if (!guild) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: action,
            limit: 1
        });

        const entry = auditLogs.entries.first();
        if (!entry || entry.targetId !== targetId) return;

        await handleAuditLogEvent(guild, {
            action: action,
            executorId: entry.executor?.id,
            targetId: entry.targetId,
            targetType: 'CHANNEL'
        });
    } catch (err) {
        console.error('[Audit] Channel event error:', err);
    }
}

/**
 * Handle role audit events
 */
async function handleRoleEvent(guild, action, targetId) {
    if (!guild) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: action,
            limit: 1
        });

        const entry = auditLogs.entries.first();
        if (!entry || entry.targetId !== targetId) return;

        await handleAuditLogEvent(guild, {
            action: action,
            executorId: entry.executor?.id,
            targetId: entry.targetId,
            targetType: 'ROLE'
        });
    } catch (err) {
        console.error('[Audit] Role event error:', err);
    }
}

/**
 * Handle moderation audit events
 */
async function handleModerationEvent(guild, action, targetId) {
    if (!guild) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: action,
            limit: 1
        });

        const entry = auditLogs.entries.first();
        if (!entry) return;

        await handleAuditLogEvent(guild, {
            action: action,
            executorId: entry.executor?.id,
            targetId: targetId,
            targetType: 'MEMBER'
        });
    } catch (err) {
        console.error('[Audit] Moderation event error:', err);
    }
}

/**
 * Handle webhook audit events
 */
async function handleWebhookEvent(guild, channelId) {
    if (!guild) return;

    try {
        const auditLogs = await guild.fetchAuditLogs({
            type: AuditLogEvent.WebhookCreate,
            limit: 1
        });

        const entry = auditLogs.entries.first();
        if (!entry) return;

        // Check if this is recent (within last 5 seconds)
        if (Date.now() - entry.createdTimestamp > 5000) return;

        await handleAuditLogEvent(guild, {
            action: 'WEBHOOK_CREATE',
            executorId: entry.executor?.id,
            targetId: entry.targetId,
            targetType: 'WEBHOOK'
        });
    } catch (err) {
        console.error('[Audit] Webhook event error:', err);
    }
}
