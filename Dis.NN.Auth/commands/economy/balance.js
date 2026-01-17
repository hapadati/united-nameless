import { SlashCommandBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('自分または指定ユーザーのポイントを確認します')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('確認するユーザー（省略可能）'));

export async function execute(interaction) {
    try {
        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: "❌ このコマンドはサーバー内でのみ使用できます。",
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        // APIから残高取得
        const response = await api.get('/economy/balance', { userId: target.id, guildId });

        if (response && response.points !== undefined) {
            await interaction.editReply(
                `💰 ${target.username} のポイント: **${response.points.toLocaleString()}pt**`
            );
        } else {
            await interaction.editReply({
                content: `${target.username} のデータが見つかりませんでした。`
            });
        }

    } catch (err) {
        console.error('[balance] Unexpected error:', err);

        const errorMessage = '❌ エラーが発生しました。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
