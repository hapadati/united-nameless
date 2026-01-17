// import { addXP } from "../commands/rank/xp-system.js";

export async function handleXpMessage(message) {
  // [DISABLED] XPは直接付与せず、ポイント経由で変換する仕組みに変更
  // メッセージイベントはすでに events/observer.js でAPI経由でポイント付与済み

  // 必要に応じて、ここでXP以外の処理（クールダウンチェックなど）を実装可能
  return;

  /* LEGACY CODE - XP Direct Grant (now disabled)
  if (message.author.bot || !message.guild) return;

  const result = await addXP(
    message.guild.id,
    message.author.id,
    10,
    message.member,
    message.channel,
    message.author.username
  );

  if (result.leveledUp) {
    await message.channel.send(
      `🎉 ${message.author} がレベル **${result.level}** にアップしました！`
    );

    if (result.unlocked.length > 0) {
      await message.channel.send(
        `🔓 新しい機能が解放されました！: ${result.unlocked.join(", ")}`
      );
    }
  }
  */
}
