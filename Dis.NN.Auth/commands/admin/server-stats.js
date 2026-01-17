// commands/admin/server-stats.js - Server Statistics
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('server-stats')
    .setDescription('📊 サーバーの統計情報を表示します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const guild = interaction.guild;

        // Fetch fresh data
        await guild.members.fetch();
        await guild.channels.fetch();

        const totalMembers = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const humanCount = totalMembers - botCount;

        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;
        const stickers = guild.stickers.cache.size;

        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;

        const createdAt = guild.createdAt.toLocaleDateString('ja-JP');
        const serverAge = Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name} サーバー統計`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .setColor(0x5865F2)
            .addFields(
                {
                    name: '👥 メンバー',
                    value: `合計: **${totalMembers.toLocaleString()}**\n` +
                        `人間: **${humanCount.toLocaleString()}**\n` +
                        `Bot: **${botCount.toLocaleString()}**`,
                    inline: true
                },
                {
                    name: '📢 チャンネル',
                    value: `テキスト: **${textChannels}**\n` +
                        `ボイス: **${voiceChannels}**\n` +
                        `カテゴリー: **${categories}**`,
                    inline: true
                },
                {
                    name: '🎭 その他',
                    value: `ロール: **${roles}**\n` +
                        `絵文字: **${emojis}**\n` +
                        `ステッカー: **${stickers}**`,
                    inline: true
                },
                {
                    name: '💎 ブースト',
                    value: `レベル: **${boostLevel}**\n` +
                        `ブースト数: **${boostCount}**`,
                    inline: true
                },
                {
                    name: '📅 サーバー情報',
                    value: `作成日: **${createdAt}**\n` +
                        `経過日数: **${serverAge.toLocaleString()}日**`,
                    inline: true
                },
                {
                    name: '👑 オーナー',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                }
            )
            .setFooter({ text: `Server ID: ${guild.id}` })
            .setTimestamp();

        if (guild.description) {
            embed.setDescription(guild.description);
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('[server-stats] Error:', err);

        const errorMessage = '❌ サーバー統計の取得に失敗しました。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
