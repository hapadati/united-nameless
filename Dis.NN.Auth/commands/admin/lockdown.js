import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('🚨 サーバーを緊急ロックダウンします（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        // 6.1 管理者判定はAPIで行う
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

        // TOTP認証が必要な場合（仕様 6.2）
        if (adminCheck.requireTOTP) {
            await interaction.reply({
                content: '🔐 このコマンドには二段階認証が必要です。認証を完了してから再実行してください。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        // APIへLockdownリクエスト
        const response = await api.post('/admin/lockdown', {
            guildId: interaction.guildId,
            executorId: interaction.user.id,
            timestamp: Math.floor(Date.now() / 1000)
        });

        if (response && response.success) {
            // セキュリティモジュールを呼び出し
            const { executeLockdown } = await import('../../events/security.js');
            await executeLockdown(interaction.guild);

            const embed = new EmbedBuilder()
                .setTitle('🚨 Lockdown Activated')
                .setDescription('サーバーがロックダウンモードに入りました。')
                .setColor(0xFF0000)
                .addFields(
                    { name: '実行者', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '時刻', value: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), inline: true }
                )
                .setFooter({ text: `Guild ID: ${interaction.guildId}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply('❌ ロックダウンの実行に失敗しました。API応答を確認してください。');
        }
    } catch (err) {
        console.error('[lockdown] Unexpected error:', err);

        const errorMessage = '❌ エラーが発生しました。サーバーログを確認してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
