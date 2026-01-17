import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { api } from '../../utils/api.js';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 サーバーのリーダーボードを表示します')
    .addIntegerOption(option =>
        option.setName('limit')
            .setDescription('表示する人数（デフォルト: 10）')
            .setMinValue(5)
            .setMaxValue(10)); // 画像生成のため10人に制限

/**
 * Generate beautiful leaderboard card
 */
async function generateLeaderboardCard(guild, leaderboardData) {
    const ROW_HEIGHT = 80;
    const HEADER_HEIGHT = 100;
    const PADDING = 20;

    // データ数に基づいて高さを計算
    const count = leaderboardData.length;
    const canvasWidth = 800;
    const canvasHeight = HEADER_HEIGHT + (count * ROW_HEIGHT) + PADDING;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // フォント設定 (日本語対応)
    const fontStack = '"Yu Gothic", Meiryo, "Hiragino Kaku Gothic ProN", sans-serif';

    // 背景 (グラデーション)
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "#1a2a6c");
    gradient.addColorStop(0.5, "#b21f1f");
    gradient.addColorStop(1, "#fdbb2d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // オーバーレイ
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ヘッダー
    ctx.font = `bold 40px ${fontStack}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(`${guild.name} Leaderboard`, canvasWidth / 2, 60);

    // シャドウリセット
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";

    // 各行の描画
    for (let i = 0; i < count; i++) {
        const user = leaderboardData[i];
        const y = HEADER_HEIGHT + (i * ROW_HEIGHT);

        // 列背景 (交互に色を変える)
        if (i % 2 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(PADDING, y, canvasWidth - (PADDING * 2), ROW_HEIGHT);
        }

        // 順位
        const rank = i + 1;
        ctx.font = `bold 32px ${fontStack}`;

        // メダルカラー
        if (rank === 1) ctx.fillStyle = "#FFD700"; // Gold
        else if (rank === 2) ctx.fillStyle = "#C0C0C0"; // Silver
        else if (rank === 3) ctx.fillStyle = "#CD7F32"; // Bronze
        else ctx.fillStyle = "#ffffff";

        ctx.textAlign = "center";
        ctx.fillText(`#${rank}`, 80, y + 50);

        // アバター
        if (user.avatarUrl) {
            try {
                const avatar = await loadImage(user.avatarUrl);
                ctx.save();
                ctx.beginPath();
                ctx.arc(150, y + 40, 30, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 120, y + 10, 60, 60);
                ctx.restore();
            } catch (e) {
                // アバターロード失敗時はプレースホルダーなどを描画してもよいが無視
            }
        }

        // 名前
        ctx.textAlign = "left";
        ctx.font = `bold 28px ${fontStack}`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(user.username, 200, y + 50);

        // ポイント
        ctx.textAlign = "right";
        ctx.font = `24px ${fontStack}`;
        ctx.fillStyle = "#fbbf24";
        const points = user.points !== undefined ? user.points.toLocaleString() : '0';
        ctx.fillText(`${points} pt`, canvasWidth - 50, y + 50);
    }

    return new AttachmentBuilder(canvas.toBuffer(), { name: "leaderboard.png" });
}

export async function execute(interaction) {
    try {
        const limit = interaction.options.getInteger('limit') || 10;
        const guildId = interaction.guildId;

        if (!guildId) {
            await interaction.reply({
                content: '❌ このコマンドはサーバー内でのみ使用できます。',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        // APIからデータ取得
        const response = await api.get('/economy/leaderboard', {
            guildId,
            limit
        });

        if (response && response.leaderboard && Array.isArray(response.leaderboard) && response.leaderboard.length > 0) {
            // ユーザー情報を並列取得
            const enrichedData = await Promise.all(response.leaderboard.map(async (entry) => {
                try {
                    const member = await interaction.guild.members.fetch(entry.userId).catch(() => null);
                    // メンバーが見つからない場合はUnknownユーザーとして扱う
                    return {
                        ...entry,
                        username: member ? member.user.username.slice(0, 15) : 'Unknown User',
                        avatarUrl: member ? member.user.displayAvatarURL({ extension: 'png', size: 64 }) : null
                    };
                } catch (e) {
                    return {
                        ...entry,
                        username: 'Unknown User',
                        avatarUrl: null
                    };
                }
            }));

            // 画像生成
            const attachment = await generateLeaderboardCard(interaction.guild, enrichedData);

            await interaction.editReply({ files: [attachment] });
        } else {
            await interaction.editReply('データがありません。メッセージを送信するとポイントが記録されます。');
        }
    } catch (err) {
        console.error('[leaderboard] Unexpected error:', err);

        const errorMessage = '❌ リーダーボードの取得に失敗しました。';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage).catch(() => { });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => { });
        }
    }
}
