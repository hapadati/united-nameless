import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../../firestore.js';

export const data = new SlashCommandBuilder()
  .setName('points-add')
  .setDescription('ユーザーにポイントを追加します（管理者専用）')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('対象ユーザー')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('追加するポイント数')
      .setMinValue(1)
      .setMaxValue(1000000)
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  try {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const guildId = interaction.guildId;

    if (!guildId) {
      await interaction.reply({
        content: "❌ このコマンドはサーバー内でのみ使用できます。",
        ephemeral: true
      });
      return;
    }

    if (!target || target.bot) {
      await interaction.reply({
        content: "❌ Botにはポイントを追加できません。",
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const ref = db.collection('servers').doc(guildId).collection('points').doc(target.id);
    const doc = await ref.get();
    const current = doc.exists ? (doc.data()?.points || 0) : 0;
    const newTotal = current + amount;

    await ref.set(
      {
        points: newTotal,
        updatedAt: new Date().toISOString(),
        updatedBy: interaction.user.id
      },
      { merge: true }
    );

    await interaction.editReply(
      `✅ ${target.username} に **${amount.toLocaleString()}pt** 追加しました！\n` +
      `合計: **${newTotal.toLocaleString()}pt**`
    );
  } catch (err) {
    console.error("[points-add] Error:", err);

    const errorMessage = "❌ ポイント追加処理中にエラーが発生しました。";

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage).catch(() => { });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
    }
  }
}
