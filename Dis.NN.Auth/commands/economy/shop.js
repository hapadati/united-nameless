import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛒 ショップのアイテム一覧を表示します');

export async function execute(interaction) {
    try {
        await interaction.deferReply();

        const response = await api.get('/economy/shop');

        if (response && response.items) {
            const embed = new EmbedBuilder()
                .setTitle('🛒 アイテムショップ')
                .setColor(0x3498db)
                .setDescription('ポイントを使ってアイテムを購入できます。\n購入コマンド: `/buy item:<ID>`')
                .setTimestamp();

            response.items.forEach(item => {
                embed.addFields({
                    name: `${item.name} (${item.price}pt)`,
                    value: `ID: \`${item.id}\`\n${item.description}`
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply('❌ ショップ情報の取得に失敗しました。');
        }
    } catch (err) {
        console.error('[shop] Unexpected error:', err);
        await interaction.editReply('❌ エラーが発生しました。');
    }
}
