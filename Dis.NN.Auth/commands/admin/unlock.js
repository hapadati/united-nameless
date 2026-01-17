import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 ロックダウンを解除します（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
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

        if (adminCheck.requireTOTP) {
            await interaction.reply({
                content: '🔐 このコマンドには二段階認証が必要です。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const response = await api.post('/admin/unlock', {
            guildId: interaction.guildId,
            executorId: interaction.user.id,
            timestamp: Math.floor(Date.now() / 1000)
        });

        if (response && response.success) {
            // @everyone権限を復元
            try {
                const everyoneRole = interaction.guild.roles.everyone;
                if (everyoneRole) {
                    const newPermissions = everyoneRole.permissions.add([
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AddReactions,
                        PermissionFlagsBits.CreatePublicThreads,
                        PermissionFlagsBits.SendMessagesInThreads
                    ]);

                    await everyoneRole.setPermissions(newPermissions, 'Unlocking: Restoring permissions');
                }
            } catch (err) {
                console.error('[unlock] Failed to restore permissions:', err);
                await interaction.editReply('⚠️ ロックダウンを解除しましたが、権限の復元に一部失敗しました。手動で確認してください。');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🔓 Lockdown Released')
                .setDescription('ロックダウンが解除されました。')
                .setColor(0x00FF00)
                .addFields(
                    { name: '実行者', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '時刻', value: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), inline: true }
                )
                .setFooter({ text: `Guild ID: ${interaction.guildId}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply('❌ ロックダウン解除に失敗しました。API応答を確認してください。');
        }
    } catch (err) {
        console.error('[unlock] Unexpected error:', err);

        const errorMessage = '❌ エラーが発生しました。サーバーログを確認してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
