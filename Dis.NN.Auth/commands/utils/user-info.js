// commands/utils/user-info.js - User Information
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('user-info')
    .setDescription('👤 ユーザー情報を表示します')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('情報を表示するユーザー（省略可能）'));

export async function execute(interaction) {
    try {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetMember = interaction.guild?.members.cache.get(targetUser.id);

        if (!targetMember) {
            await interaction.reply({
                content: '❌ このユーザーはサーバーに存在しません。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        const createdAt = targetUser.createdAt.toLocaleDateString('ja-JP');
        const joinedAt = targetMember.joinedAt?.toLocaleDateString('ja-JP') || '不明';

        const accountAge = Math.floor((Date.now() - targetUser.createdTimestamp) / (1000 * 60 * 60 * 24));
        const serverAge = targetMember.joinedTimestamp
            ? Math.floor((Date.now() - targetMember.joinedTimestamp) / (1000 * 60 * 60 * 24))
            : 0;

        const roles = targetMember.roles.cache
            .filter(role => role.id !== interaction.guildId)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 10);

        const permissions = targetMember.permissions.toArray().slice(0, 10);

        const embed = new EmbedBuilder()
            .setTitle(`👤 ${targetUser.username} の情報`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(targetMember.displayHexColor || 0x5865F2)
            .addFields(
                {
                    name: '📝 基本情報',
                    value: `ユーザー名: **${targetUser.username}**\n` +
                        `表示名: **${targetMember.displayName}**\n` +
                        `ID: \`${targetUser.id}\`\n` +
                        `Bot: **${targetUser.bot ? 'はい' : 'いいえ'}**`,
                    inline: false
                },
                {
                    name: '📅 日付',
                    value: `アカウント作成: **${createdAt}** (${accountAge}日前)\n` +
                        `サーバー参加: **${joinedAt}** (${serverAge}日前)`,
                    inline: false
                }
            )
            .setFooter({ text: `User ID: ${targetUser.id}` })
            .setTimestamp();

        if (roles.length > 0) {
            embed.addFields({
                name: `🎭 ロール (${targetMember.roles.cache.size - 1})`,
                value: roles.join(', ') + (targetMember.roles.cache.size > 11 ? '...' : ''),
                inline: false
            });
        }

        if (permissions.length > 0) {
            embed.addFields({
                name: '🔑 権限 (一部)',
                value: permissions.map(p => `\`${p}\``).join(', '),
                inline: false
            });
        }

        if (targetMember.premiumSince) {
            const boostingSince = targetMember.premiumSince.toLocaleDateString('ja-JP');
            embed.addFields({
                name: '💎 ブースト',
                value: `開始日: **${boostingSince}**`,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('[user-info] Error:', err);

        const errorMessage = '❌ ユーザー情報の取得に失敗しました。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
