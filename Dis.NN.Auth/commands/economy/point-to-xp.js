import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

// 変換レート設定
const CONVERSION_RATE = 100; // 100ポイント = 1 XP

export const data = new SlashCommandBuilder()
    .setName('point-to-xp')
    .setDescription('💫 ポイントをXPに変換します')
    .addIntegerOption(option =>
        option.setName('amount')
            .setDescription('変換するポイント数')
            .setRequired(true)
            .setMinValue(100));

export async function execute(interaction) {
    try {
        const amount = interaction.options.getInteger('amount');
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        if (!guildId) {
            await interaction.reply({
                content: '❌ このコマンドはサーバー内でのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        // 変換レートチェック
        if (amount % CONVERSION_RATE !== 0) {
            await interaction.reply({
                content: `❌ ポイントは${CONVERSION_RATE}の倍数で指定してください。`,
                ephemeral: true
            });
            return;
        }

        const xpGain = Math.floor(amount / CONVERSION_RATE);

        await interaction.deferReply();

        // APIで変換実行
        const response = await api.post('/economy/convert', {
            userId,
            guildId,
            pointsToSpend: amount,
            xpToGain: xpGain
        });

        if (!response) {
            await interaction.editReply({
                content: '❌ APIサーバーとの通信に失敗しました。後ほど再試行してください。'
            });
            return;
        }

        if (response.success) {
            const embed = new EmbedBuilder()
                .setTitle('💫 ポイント → XP 変換完了')
                .setDescription(`**${amount.toLocaleString()}pt** → **${xpGain} XP** に変換しました！`)
                .setColor(0x9B59B6)
                .addFields(
                    { name: '消費ポイント', value: `${amount.toLocaleString()}pt`, inline: true },
                    { name: '獲得XP', value: `${xpGain} XP`, inline: true },
                    { name: '残りポイント', value: `${(response.remainingPoints || 0).toLocaleString()}pt`, inline: true }
                )
                .setFooter({ text: `変換レート: ${CONVERSION_RATE}pt = 1 XP` })
                .setTimestamp();

            // レベルアップした場合
            if (response.leveledUp) {
                embed.addFields({
                    name: '🎉 レベルアップ！',
                    value: `現在のレベル: **Lv.${response.newLevel}**`
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: `❌ 変換に失敗しました。${response.message || 'ポイントが不足している可能性があります。'}`
            });
        }
    } catch (err) {
        console.error('[point-to-xp] Unexpected error:', err);

        const errorMessage = '❌ エラーが発生しました。後ほど再試行してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
