import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('📊 自分または指定ユーザーのランクカードを表示します')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('確認するユーザー（省略可能）'));

/**
 * Calculate XP required for next level
 */
function getNextLevelXP(level) {
    if (!level || level < 1) return 100;
    return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Generate beautiful rank card
 */
async function generateRankCard(member, userData, rank) {
    const canvasWidth = 900;
    const canvasHeight = 300;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(0.5, "#764ba2");
    gradient.addColorStop(1, "#f093fb");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // オーバーレイ（半透明の暗い層）
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // アバター背景（白い円）
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(120, 150, 85, 0, Math.PI * 2);
    ctx.fill();

    // アバター（円形にクリップ）
    if (member.user.displayAvatarURL) {
        try {
            const avatar = await loadImage(member.user.displayAvatarURL({ extension: "png", size: 256 }));
            ctx.save();
            ctx.beginPath();
            ctx.arc(120, 150, 80, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 40, 70, 160, 160);
            ctx.restore();
        } catch (err) {
            console.error('[Rank Card] Failed to load avatar:', err);
        }
    }

    // アバター枠（グラデーション）
    const avatarGradient = ctx.createLinearGradient(40, 70, 200, 230);
    avatarGradient.addColorStop(0, "#fbbf24");
    avatarGradient.addColorStop(1, "#f59e0b");
    ctx.strokeStyle = avatarGradient;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(120, 150, 80, 0, Math.PI * 2);
    ctx.stroke();

    // ユーザー名
    ctx.font = 'bold 42px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    const username = member.user.username.slice(0, 15);
    ctx.fillText(username, 240, 80);

    // シャドウをリセット
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // レベル表示（大きく強調）
    ctx.font = 'bold 56px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
    const levelGradient = ctx.createLinearGradient(240, 100, 400, 150);
    levelGradient.addColorStop(0, "#fbbf24");
    levelGradient.addColorStop(1, "#fb923c");
    ctx.fillStyle = levelGradient;
    ctx.fillText(`Lv ${userData.level || 1}`, 240, 140);

    // XP情報
    ctx.font = '24px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "#e2e8f0";
    const currentXP = userData.xp || 0;
    const nextXP = getNextLevelXP(userData.level || 1);
    ctx.fillText(`${currentXP.toLocaleString()} / ${nextXP.toLocaleString()} XP`, 240, 170);

    // ランク表示（右上）
    if (rank) {
        ctx.font = 'bold 32px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
        ctx.fillStyle = "#fbbf24";
        const rankText = `#${rank}`;
        const rankWidth = ctx.measureText(rankText).width;

        // ランク背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(canvasWidth - rankWidth - 60, 20, rankWidth + 40, 50);

        ctx.fillStyle = "#fbbf24";
        ctx.fillText(rankText, canvasWidth - rankWidth - 40, 55);
    }

    // プログレスバー背景
    const barX = 240;
    const barY = 200;
    const barWidth = 620;
    const barHeight = 40;
    const borderRadius = 20;

    // 角丸矩形を描画するヘルパー
    function roundRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    // バー背景
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    roundRect(barX, barY, barWidth, barHeight, borderRadius);
    ctx.fill();

    // プログレスバー（グラデーション）
    const progress = Math.min(currentXP / nextXP, 1);
    const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
    progressGradient.addColorStop(0, "#3b82f6");
    progressGradient.addColorStop(0.5, "#8b5cf6");
    progressGradient.addColorStop(1, "#ec4899");
    ctx.fillStyle = progressGradient;

    ctx.save();
    roundRect(barX, barY, barWidth * progress, barHeight, borderRadius);
    ctx.clip();
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    ctx.restore();

    // バー枠
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    roundRect(barX, barY, barWidth, barHeight, borderRadius);
    ctx.stroke();

    // パーセント表示
    ctx.font = 'bold 22px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    const percentage = `${Math.floor(progress * 100)}%`;
    const percentageWidth = ctx.measureText(percentage).width;
    ctx.fillText(percentage, barX + (barWidth - percentageWidth) / 2, barY + 28);

    // シャドウリセット
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // フッター情報
    ctx.font = '16px "Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`次のレベルまで: ${(nextXP - currentXP).toLocaleString()} XP`, 240, 270);

    return new AttachmentBuilder(canvas.toBuffer(), { name: "rank-card.png" });
}

export async function execute(interaction) {
    try {
        const target = interaction.options.getUser('user') || interaction.user;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: '❌ このコマンドはサーバー内でのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        // APIからランク情報取得
        const response = await api.get('/economy/rank', {
            userId: target.id,
            guildId
        });

        if (response && response.level !== undefined) {
            // メンバー情報が必要
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            if (!member) {
                await interaction.editReply("❌ ユーザー情報を取得できませんでした。");
                return;
            }

            // Canvasで生成
            const attachment = await generateRankCard(member, {
                xp: response.xp,
                level: response.level
            }, response.rank);

            await interaction.editReply({ files: [attachment] });

        } else {
            // Fallback: データなし
            await interaction.editReply({
                content: `${target.username} のデータが見つかりませんでした。メッセージを送信すると登録されます。`
            });
        }
    } catch (err) {
        console.error('[rank] Unexpected error:', err);

        const errorMessage = '❌ データの取得に失敗しました。後ほど再試行してください。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
