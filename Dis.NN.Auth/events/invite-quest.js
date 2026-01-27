import { api } from '../utils/api.js';

// サーバーごとの招待コード使用回数キャッシュ
// Key: guildId, Value: Map<code, uses>
const invitesCache = new Map();

/**
 * Bot起動時に招待コードをキャッシュする
 * @param {import('discord.js').Client} client 
 */
export async function initInviteCache(client) {
    console.log('[InviteQuest] Initializing invite cache...');

    // 全ギルドをループ（必要に応じて）
    for (const [guildId, guild] of client.guilds.cache) {
        try {
            const invites = await guild.invites.fetch();
            const guildInvites = new Map();

            invites.each(invite => {
                guildInvites.set(invite.code, invite.uses);
            });

            invitesCache.set(guildId, guildInvites);
            console.log(`[InviteQuest] Cached ${guildInvites.size} invites for guild ${guild.name}`);
        } catch (err) {
            console.warn(`[InviteQuest] Failed to fetch invites for guild ${guild.name}:`, err.message);
        }
    }
}

/**
 * メンバー参加時に招待を特定してクエスト進捗を報告
 * @param {import('discord.js').GuildMember} member 
 */
export async function handleInviteQuest(member) {
    const guild = member.guild;
    const cachedInvites = invitesCache.get(guild.id);

    // 権限などの問題でキャッシュがない場合
    if (!cachedInvites) return;

    try {
        // 新しい招待リストを取得
        const newInvites = await guild.invites.fetch();
        let inviter = null;

        // 使用回数が増えているコードを探す
        for (const [code, invite] of newInvites) {
            const oldUses = cachedInvites.get(code) || 0;

            if (invite.uses > oldUses) {
                inviter = invite.inviter;
                console.log(`[InviteQuest] User ${member.user.tag} joined using invite ${code} by ${inviter?.tag}`);
                break;
            }
        }

        // キャッシュ更新
        const newGuildInvites = new Map();
        newInvites.each(invite => newGuildInvites.set(invite.code, invite.uses));
        invitesCache.set(guild.id, newGuildInvites);

        // 招待者が特定できた場合、APIへ報告
        if (inviter && !inviter.bot) {
            const response = await api.post('/quests/progress', {
                userId: inviter.id,
                type: 'INVITE_USER',
                inviteCount: 1,
                context: { invitedUserId: member.id }
            });

            if (response && response.success && response.completed?.length > 0) {
                // 完了通知（招待者に対してメンションなどで通知したいが、ここではログのみ）
                console.log(`[InviteQuest] Quests completed for ${inviter.tag}:`, response.completed);

                // 任意のチャンネルに通知するならここで実装
                // const notifyChannel = guild.systemChannel; 
                // if (notifyChannel) notifyChannel.send(...)
            }
        }
    } catch (err) {
        console.error('[InviteQuest] Error handling invite:', err);
    }
}
