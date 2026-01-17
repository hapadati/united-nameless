import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('🎒 所持アイテムを確認します');

export async function execute(interaction) {
    try {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({ content: '❌ このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
            return;
        }

        await interaction.deferReply();

        const response = await api.get('/economy/inventory', { userId });

        if (response && response.items && response.items.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle(`🎒 ${interaction.user.username} のインベントリ`)
                .setColor(0xe67e22)
                .setDescription('アイテムを使用するには `/use item:<ID>` を使用してください。')
                .setTimestamp();

            response.items.forEach(item => {
                embed.addFields({
                    name: `${item.name} x${item.count}`,
                    value: `ID: \`${item.itemId}\`\n${item.description || ''}`,
                    inline: true
                });
            });

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({
                content: '🎒 インベントリは空です。`/shop` でアイテムを購入できます。'
            });
        }

    } catch (err) {
        console.error('[inventory] Unexpected error:', err);
        await interaction.editReply('❌ エラーが発生しました。');
    }
}
