// commands/utils/server-invite.js - Generate Server Invite
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('create-invite')
    .setDescription('🔗 サーバー招待リンクを作成します')
    .addIntegerOption(option =>
        option.setName('max-age')
            .setDescription('有効期限（時間、0=無期限）')
            .setMinValue(0)
            .setMaxValue(168)) // 最大1週間
    .addIntegerOption(option =>
        option.setName('max-uses')
            .setDescription('最大使用回数（0=無制限）')
            .setMinValue(0)
            .setMaxValue(100))
    .addBooleanOption(option =>
        option.setName('temporary')
            .setDescription('一時メンバー'))
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite);

export async function execute(interaction) {
    try {
        const maxAge = interaction.options.getInteger('max-age') || 24; // デフォルト24時間
        const maxUses = interaction.options.getInteger('max-uses') || 0;
        const temporary = interaction.options.getBoolean('temporary') || false;

        if (!interaction.guild) {
            await interaction.reply({
                content: '❌ このコマンドはサーバー内でのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        // 最初のテキストチャンネルを取得
        const textChannel = interaction.guild.channels.cache.find(
            channel => channel.isTextBased() && !channel.isThread()
        );

        if (!textChannel) {
            await interaction.editReply('❌ 招待リンクを作成できるチャンネルが見つかりません。');
            return;
        }

        // 招待リンク作成
        const invite = await textChannel.createInvite({
            maxAge: maxAge * 3600, // 時間を秒に変換
            maxUses: maxUses,
            temporary: temporary,
            unique: true,
            reason: `Created by ${interaction.user.tag}`
        });

        const expiresAt = maxAge === 0
            ? '無期限'
            : new Date(Date.now() + maxAge * 3600 * 1000).toLocaleString('ja-JP');

        const embed = new EmbedBuilder()
            .setTitle('🔗 招待リンク作成完了')
            .setDescription(`招待リンク: ${invite.url}`)
            .setColor(0x5865F2)
            .addFields(
                { name: '⏰ 有効期限', value: expiresAt, inline: true },
                { name: '🔢 最大使用回数', value: maxUses === 0 ? '無制限' : `${maxUses}回`, inline: true },
                { name: '👥 一時メンバー', value: temporary ? 'はい' : 'いいえ', inline: true }
            )
            .setFooter({ text: `作成者: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        console.log(`[Invite] ${interaction.user.tag} created invite: ${invite.url}`);
    } catch (err) {
        console.error('[create-invite] Error:', err);

        const errorMessage = '❌ 招待リンクの作成に失敗しました。権限を確認してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
