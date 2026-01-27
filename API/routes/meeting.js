/**
 * 会議室管理エンドポイント
 */

import { getFirestore } from '../config/firebase.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

const db = getFirestore();

/**
 * 会議室ルートを登録
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function meetingRoutes(fastify) {
    const rateLimiter = createRateLimiter('meeting');

    // GET /meeting/rooms - 会議室一覧取得
    fastify.get('/meeting/rooms', { preHandler: rateLimiter }, async (request, reply) => {
        const { status = 'active' } = request.query;

        try {
            let query = db.collection('meetingRooms');

            if (status !== 'all') {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.orderBy('lastActivity', 'desc').get();
            const rooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString(),
                lastActivity: doc.data().lastActivity?.toDate().toISOString()
            }));

            return reply.send({ rooms, count: rooms.length });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to fetch rooms');
            throw error;
        }
    });

    // POST /meeting/rooms - 会議室作成
    fastify.post('/meeting/rooms', { preHandler: rateLimiter }, async (request, reply) => {
        const { name, description, createdBy } = request.body;

        if (!name || !createdBy) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        try {
            const roomRef = db.collection('meetingRooms').doc();
            await roomRef.set({
                roomId: roomRef.id,
                name,
                description: description || '',
                createdBy,
                createdAt: new Date(),
                participants: [createdBy],
                status: 'active',
                lastActivity: new Date()
            });

            logger.info({ roomId: roomRef.id, createdBy }, 'Meeting room created');

            return reply.send({
                success: true,
                roomId: roomRef.id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message }, 'Failed to create room');
            throw error;
        }
    });

    // GET /meeting/rooms/:id/messages - メッセージ取得
    fastify.get('/meeting/rooms/:id/messages', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;
        const { limit = 50 } = request.query;

        try {
            const messagesSnapshot = await db.collection('meetingRooms')
                .doc(id)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(parseInt(limit))
                .get();

            const messages = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toISOString()
            })).reverse(); // 古い順に並び替え

            return reply.send({ messages, count: messages.length });
        } catch (error) {
            logger.error({ error: error.message, roomId: id }, 'Failed to fetch messages');
            throw error;
        }
    });

    // POST /meeting/rooms/:id/messages - メッセージ送信
    fastify.post('/meeting/rooms/:id/messages', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;
        const { userId, userName, content } = request.body;

        if (!userId || !userName || !content) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        try {
            const messageRef = db.collection('meetingRooms').doc(id).collection('messages').doc();
            await messageRef.set({
                messageId: messageRef.id,
                userId,
                userName,
                content,
                timestamp: new Date(),
                type: 'message'
            });

            // 会議室のlastActivityを更新
            await db.collection('meetingRooms').doc(id).update({
                lastActivity: new Date()
            });

            return reply.send({
                success: true,
                messageId: messageRef.id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, roomId: id }, 'Failed to send message');
            throw error;
        }
    });

    // GET /meeting/rooms/:id/notes - メモ一覧取得
    fastify.get('/meeting/rooms/:id/notes', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;

        try {
            const notesSnapshot = await db.collection('meetingRooms')
                .doc(id)
                .collection('notes')
                .orderBy('pinned', 'desc')
                .orderBy('updatedAt', 'desc')
                .get();

            const notes = notesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate().toISOString()
            }));

            return reply.send({ notes, count: notes.length });
        } catch (error) {
            logger.error({ error: error.message, roomId: id }, 'Failed to fetch notes');
            throw error;
        }
    });

    // POST /meeting/rooms/:id/notes - メモ作成
    fastify.post('/meeting/rooms/:id/notes', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;
        const { title, content, createdBy } = request.body;

        if (!title || !content || !createdBy) {
            return reply.code(400).send({ error: 'Missing required fields' });
        }

        try {
            const noteRef = db.collection('meetingRooms').doc(id).collection('notes').doc();
            await noteRef.set({
                noteId: noteRef.id,
                title,
                content,
                createdBy,
                createdAt: new Date(),
                updatedAt: new Date(),
                pinned: false
            });

            return reply.send({
                success: true,
                noteId: noteRef.id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error({ error: error.message, roomId: id }, 'Failed to create note');
            throw error;
        }
    });

    // PATCH /meeting/rooms/:id/notes/:noteId - メモ更新
    fastify.patch('/meeting/rooms/:id/notes/:noteId', { preHandler: rateLimiter }, async (request, reply) => {
        const { id, noteId } = request.params;
        const { title, content, pinned } = request.body;

        try {
            const updateData = { updatedAt: new Date() };
            if (title !== undefined) updateData.title = title;
            if (content !== undefined) updateData.content = content;
            if (pinned !== undefined) updateData.pinned = pinned;

            await db.collection('meetingRooms').doc(id).collection('notes').doc(noteId).update(updateData);

            return reply.send({ success: true, timestamp: new Date().toISOString() });
        } catch (error) {
            logger.error({ error: error.message, roomId: id, noteId }, 'Failed to update note');
            throw error;
        }
    });

    // DELETE /meeting/rooms/:id - 会議室削除
    fastify.delete('/meeting/rooms/:id', { preHandler: rateLimiter }, async (request, reply) => {
        const { id } = request.params;

        try {
            await db.collection('meetingRooms').doc(id).update({ status: 'archived' });

            logger.info({ roomId: id }, 'Meeting room archived');

            return reply.send({ success: true, message: 'Room archived' });
        } catch (error) {
            logger.error({ error: error.message, roomId: id }, 'Failed to archive room');
            throw error;
        }
    });
}
