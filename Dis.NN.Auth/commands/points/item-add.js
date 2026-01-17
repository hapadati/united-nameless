import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addItem } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('item-add')
  .setDescription('新しいアイテムを追加します（管理者専用）')
  .addStringOption(option =>
    option.setName('id')
      .setDescription('アイテムID (英数字とハイフンのみ)')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('name')
      .setDescription('アイテム名')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('price')
      .setDescription('価格')
      .setMinValue(1)
      .setMaxValue(1000000)
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('stock')
      .setDescription('在庫数')
      .setMinValue(0)
      .setMaxValue(10000)
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  try {
    const itemId = interaction.options.getString('id');
    const name = interaction.options.getString('name');
    const price = interaction.options.getInteger('price');
    const stock = interaction.options.getInteger('stock');
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({
        content: '❌ このコマンドはサーバー内でのみ使用できます。',
        ephemeral: true
      });
      return;
    }

    // ID validation
    if (!/^[a-zA-Z0-9-_]+$/.test(itemId)) {
      await interaction.reply({
        content: '❌ アイテムIDは英数字、ハイフン、アンダースコアのみ使用できます。',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    await addItem(guildId, itemId, price, stock);

    // Store the display name separately
    const { db } = await import('../../firestore.js');
    await db.collection('servers').doc(guildId).collection('items').doc(itemId).update({
      displayName: name
    });

    await interaction.editReply(
      `🛒 アイテム **${name}** を追加しました！\n` +
      `ID: \`${itemId}\`, 価格: ${price.toLocaleString()}pt, 在庫: ${stock.toLocaleString()}`
    );
  } catch (err) {
    console.error('[item-add] Error:', err);

    const errorMessage = err.message || '❌ アイテムの追加に失敗しました。';

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage).catch(() => { });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
    }
  }
}
