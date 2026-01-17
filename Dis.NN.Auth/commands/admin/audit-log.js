// commands/admin/audit-log.js - View Audit Logs
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('audit-log')
    .setDescription('🔍 監査ログを表示します（管理者専用）')
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('表示件数（デフォルト: 10）')
            .setMinValue(5)
            .setMaxValue(50))
    .addStringOption(option =>
        option.setName('filter')
            .setDescription('フィルター')
            .addChoices(
                { name: 'すべて', value: 'all' },
                { name: 'チャンネル操作', value: 'channel' },
                { name: 'ロール操作', value: 'role' },
                { name: 'メンバー操作', value: 'member' },
                { name: 'Webhook', value: 'webhook' }
            ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        const limit = interaction.options.getInteger('limit') || 10;
        const filter = interaction.options.getString('filter') || 'all';

        // Admin check
        const adminCheck = await api.get('/admin/check', {
            userId: interaction.user.id,
            guildId: interaction.guildId
        });

        if (!adminCheck || !adminCheck.isAdmin) {
            await interaction.reply({
                content: '❌ このコマンドを実行する権限がありません。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        // Fetch from API
        const response = await api.get('/admin/audit-log', {
            guildId: interaction.guildId,
            limit,
            filter
        });

        if (!response || !response.logs || response.logs.length === 0) {
            await interaction.editReply('📋 表示する監査ログがありません。');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('🔍 監査ログ')
            .setColor(0x5865F2)
            .setFooter({ text: `${response.logs.length}件の結果` })
            .setTimestamp();

        let description = '';
        for (const log of response.logs) {
            const timestamp = new Date(log.timestamp * 1000).toLocaleString('ja-JP');
            const action = getActionEmoji(log.action);
            description += `${action} **${log.action}** - <@${log.executorId}>\n`;
            description += `   時刻: ${timestamp}\n`;
            description += `   対象: ${log.targetType} (${log.targetId})\n\n`;
        }

        embed.setDescription(description || 'ログなし');

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('[audit-log] Error:', err);

        const errorMessage = '❌ 監査ログの取得に失敗しました。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}

function getActionEmoji(action) {
    const emojiMap = {
        'CHANNEL_CREATE': '➕',
        'CHANNEL_DELETE': '➖',
        'ROLE_CREATE': '🎭',
        'ROLE_DELETE': '🗑️',
        'ROLE_UPDATE': '✏️',
        'MEMBER_BAN': '🔨',
        'MEMBER_KICK': '👢',
        'WEBHOOK_CREATE': '🪝'
    };
    return emojiMap[action] || '📝';
}
