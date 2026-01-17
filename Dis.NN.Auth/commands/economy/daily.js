import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 デイリーボーナスを受け取ります（1日1回）');

export async function execute(interaction) {
    try {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: '❌ このコマンドはサーバー内でのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        // API実行
        const response = await api.post('/economy/daily', {
            userId,
            guildId
        });

        if (!response) {
            await interaction.editReply({
                content: '❌ APIサーバーとの通信に失敗しました。後ほど再試行してください。'
            });
            return;
        }

        if (response.success) {
            const embed = new EmbedBuilder()
                .setTitle('📅 デイリー活動報酬')
                .setColor(0x2ecc71)
                .setDescription(`日々のコミュニティ活動ありがとうございます。`)
                .addFields(
                    { name: '獲得ポイント', value: `+${response.earnedPoints}pt`, inline: true },
                    { name: '連続活動', value: `${response.streak}日目`, inline: true }
                )
                .setTimestamp();

            if (response.streak >= 7) {
                embed.addFields({ name: '🔥 週間継続ボーナス', value: '7日連続達成！ポイント倍率アップ中', inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        } else {
            // 失敗（おそらくまだ受け取れない）
            // nextClaimTimeがあれば表示
            let msg = '❌ 今日は既に受け取っています。';
            if (response.nextClaimTime) {
                const next = new Date(response.nextClaimTime);
                const now = new Date();
                const diff = next.getTime() - now.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                msg += `\n次の受け取りまで: **${hours}時間 ${minutes}分**`;
            }
            await interaction.editReply({ content: msg });
        }

    } catch (err) {
        console.error('[daily] Unexpected error:', err);

        const errorMessage = '❌ エラーが発生しました。後ほど再試行してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
