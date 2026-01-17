import { SlashCommandBuilder } from 'discord.js';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('use')
    .setDescription('🧪 アイテムを使用します')
    .addStringOption(option =>
        option.setName('item')
            .setDescription('使用するアイテムのID')
            .setRequired(true)
            .setAutocomplete(true));

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

        const response = await api.post('/economy/use', {
            userId,
            itemId
        });

        if (response && response.success) {
            await interaction.editReply({
                content: `✅ **${response.itemName}** を使用しました！\n${response.message}`
            });
        } else {
            const errorMsg = response?.error === 'Item not in inventory'
                ? '❌ そのアイテムを持っていません。'
                : '❌ 使用に失敗しました。';
            await interaction.editReply(errorMsg);
        }

    } catch (err) {
        console.error('[use] Unexpected error:', err);
        await interaction.editReply('❌ エラーが発生しました。');
    }
}
