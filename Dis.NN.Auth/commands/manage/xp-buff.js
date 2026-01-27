/* [DISABLED] Legacy Command
import { SlashCommandBuilder } from "discord.js";
import { addBuff, removeBuff } from "../rank/xp-system.js";

export const xpBuffCommand = {
  data: new SlashCommandBuilder()
    .setName("xp-buff")
    .setDescription("💪 XPバフを付与・削除します")
    // ...
    ,
  execute: async function(interaction) {
     // ...
  }
};
*/
export const xpBuffCommand = null; // Skipped by loader

