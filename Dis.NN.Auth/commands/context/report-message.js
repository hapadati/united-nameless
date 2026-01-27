import { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { getFirestore } from '../../config/firebase.js';

const db = getFirestore();

export default {
    data: new ContextMenuCommandBuilder()
        .setName('通報する')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        try {
            const message = interaction.targetMessage;

            // モーダルを表示
            const modal = new ModalBuilder()
                .setCustomId(`report-modal-${message.id}`)
                .setTitle('メッセージを通報');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('通報理由を入力してください')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('例: スパム、嫌がらせ、不適切なコンテンツなど...')
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(500);

            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);

            await interaction.showModal(modal);

            // モーダル送信を待機
            const filter = (i) => i.customId === `report-modal-${message.id}` && i.user.id === interaction.user.id;

            const submitted = await interaction.awaitModalSubmit({ filter, time: 120000 }).catch(() => null);

            if (!submitted) return;

            const reason = submitted.fields.getTextInputValue('reason');

            // 自分自身のメッセージは通報できない
            if (message.author.id === interaction.user.id) {
                return await submitted.reply({
                    content: '❌ 自分自身のメッセージは通報できません。',
                    ephemeral: true
                });
            }

            // Botのメッセージは通報できない
            if (message.author.bot) {
                return await submitted.reply({
                    content: '❌ Botのメッセージは通報できません。',
                    ephemeral: true
                });
            }

            // Firestoreに保存
            const reportRef = db.collection('reports').doc();
            await reportRef.set({
                reportId: reportRef.id,
                messageId: message.id,
                messageContent: message.content || '[添付ファイル、Embed、またはスタンプ]',
                messageUrl: message.url,
                messageAuthorId: message.author.id,
                messageAuthorName: message.author.tag,
                messageAuthorAvatar: message.author.displayAvatarURL(),
                reporterId: interaction.user.id,
                reporterName: interaction.user.tag,
                reason,
                channelId: message.channelId,
                channelName: message.channel.name,
                guildId: message.guildId,
                status: 'pending',
                reportedAt: new Date()
            });

            console.log(`[REPORT] New report created: ${reportRef.id} by ${interaction.user.tag}`);

            await submitted.reply({
                content: `✅ 通報を受け付けました。\n通報ID: \`${reportRef.id.slice(0, 8)}\`\n\nAdminチームが内容を確認します。ご協力ありがとうございます。`,
                ephemeral: true
            });

            // オプション: Admin通知チャンネルに通知
            // const adminChannel = interaction.guild.channels.cache.get('ADMIN_CHANNEL_ID');
            // if (adminChannel) {
            //     await adminChannel.send({
            //         embeds: [{
            //             title: '🚨 新しい通報',
            //             description: `**通報者**: ${interaction.user.tag}\n**対象**: ${message.author.tag}\n**理由**: ${reason.slice(0, 100)}...`,
            //             color: 0xFF0000,
            //             timestamp: new Date()
            //         }]
            //     });
            // }

        } catch (error) {
            console.error('[REPORT] Error handling report:', error);

            // エラー時のフォールバック
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ 通報の処理中にエラーが発生しました。もう一度お試しください。',
                    ephemeral: true
                }).catch(() => { });
            }
        }
    }
};
