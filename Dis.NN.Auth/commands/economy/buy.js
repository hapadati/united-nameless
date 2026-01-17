import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('buy')
    .setDescription('🛒 ショップでアイテムを購入します')
    .addStringOption(option =>
        option.setName('item')
            .setDescription('購入するアイテムのID')
            .setRequired(true)
            .setAutocomplete(true)); // 将来的にはオートコンプリート実装推奨

export async function execute(interaction) {
    try {
        const itemId = interaction.options.getString('item');
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const response = await api.post('/economy/buy', {
            userId,
            itemId
        });

        if (response && response.success) {
            await interaction.editReply({
                content: `✅ **${itemId}** を購入しました！\n残りポイント: **${response.newPoints.toLocaleString()}pt**`
            });
        } else {
            const errorMsg = response?.error === 'Insufficient points'
                ? '❌ ポイントが不足しています。'
                : response?.error === 'Item not found'
                    ? '❌ アイテムが見つかりません。'
                    : '❌ 購入に失敗しました。';

            await interaction.editReply(errorMsg);
        }

    } catch (err) {
        console.error('[buy] Unexpected error:', err);
        await interaction.editReply('❌ エラーが発生しました。');
    }
}
