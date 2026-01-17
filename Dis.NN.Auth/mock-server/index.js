import express from 'express';

const app = express();
app.use(express.json());

const PORT = 4000; // Mock API Port

// ==========================
// 2. イベント監視
// ==========================

// 2.1 メッセージ監視 (POST /events/message)
app.post('/events/message', (req, res) => {
    console.log('[API] Message Event:', req.body);
    const isLucky = Math.random() > 0.5;
    res.json({
        earned: isLucky,
        amount: isLucky ? Math.floor(Math.random() * 50) : 0,
        levelUp: false
    });
});

// 2.2 VC監視 (POST /events/voice)
app.post('/events/voice', (req, res) => {
    console.log('[API] Voice Event:', req.body);
    res.json({ status: 'ok', pointsEarned: 15 });
});

// ==========================
// 3. セキュリティ監視
// ==========================

// 3.1 Audit Log (POST /events/audit)
const auditHistory = new Map(); // executorId -> count
app.post('/events/audit', (req, res) => {
    console.log('[API] Audit Event:', req.body);

    const { executorId, action } = req.body;

    // Simple rate limiting simulation
    if (!auditHistory.has(executorId)) {
        auditHistory.set(executorId, []);
    }

    const history = auditHistory.get(executorId);
    history.push({ action, timestamp: Date.now() });

    // Check if more than 5 actions in last 10 seconds
    const recentActions = history.filter(h => Date.now() - h.timestamp < 10000);
    auditHistory.set(executorId, recentActions);

    const shouldLockdown = recentActions.length > 5;

    res.json({
        lockdown: shouldLockdown,
        message: shouldLockdown ? 'Rate limit exceeded' : 'OK'
    });
});

// 3.2 Bot Join (POST /events/bot-join)
app.post('/events/bot-join', (req, res) => {
    console.log('[API] Bot Join Event:', req.body);
    res.json({ alert: true, message: 'Suspicious bot detected' });
});

// ==========================
// 4. 経済コマンド
// ==========================

// Mock user database
const mockUsers = {
    '123456789': { balance: 12345, rank: 1, level: 15 },
    '987654321': { balance: 9876, rank: 2, level: 12 },
    '555555555': { balance: 5432, rank: 3, level: 8 }
};

// GET /economy/balance
app.get('/economy/balance', (req, res) => {
    const { userId } = req.query;
    console.log('[API] Balance Request:', userId);

    const userData = mockUsers[userId] || { balance: 0, rank: 999, level: 1 };
    res.json(userData);
});

// GET /economy/rank
app.get('/economy/rank', (req, res) => {
    const { userId } = req.query;
    console.log('[API] Rank Request:', userId);

    const userData = mockUsers[userId] || { balance: 0, rank: 999, level: 1 };
    res.json(userData);
});

// GET /economy/leaderboard
app.get('/economy/leaderboard', (req, res) => {
    const { limit = 10 } = req.query;
    console.log('[API] Leaderboard Request, limit:', limit);

    const users = Object.entries(mockUsers)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, parseInt(limit));

    res.json({ users });
});

// POST /economy/convert (Point to XP)
app.post('/economy/convert', (req, res) => {
    const { userId, pointsToSpend, xpToGain } = req.body;
    console.log('[API] Point-to-XP Conversion:', { userId, pointsToSpend, xpToGain });

    // Mock: Check if user has enough points
    const user = mockUsers[userId];
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }

    if (user.balance < pointsToSpend) {
        res.status(400).json({ success: false, message: 'Insufficient points' });
        return;
    }

    // Deduct points
    user.balance -= pointsToSpend;

    res.json({
        success: true,
        remainingPoints: user.balance,
        xpGained: xpToGain
    });
});


// ==========================
// 5. タスク連携
// ==========================

// POST /events/task
app.post('/events/task', (req, res) => {
    console.log('[API] Task Event:', req.body);

    // Simulate title granting
    const shouldGrantTitle = Math.random() > 0.8;
    res.json({
        titleGranted: shouldGrantTitle ? 'ACTIVE_MEMBER' : null
    });
});

// ==========================
// 6. 管理者コマンド
// ==========================

// GET /admin/check
app.get('/admin/check', (req, res) => {
    const { userId } = req.query;
    console.log('[API] Admin Check:', userId);

    // Mock: Assume specific user is admin
    const isAdmin = userId === '123456789' || userId === 'ADMIN_USER_ID';

    res.json({
        isAdmin,
        requireTOTP: false // Set to true to test TOTP flow
    });
});

// POST /admin/lockdown
app.post('/admin/lockdown', (req, res) => {
    console.log('[API] Lockdown Request:', req.body);
    res.json({ success: true, message: 'Lockdown activated' });
});

// POST /admin/unlock
app.post('/admin/unlock', (req, res) => {
    console.log('[API] Unlock Request:', req.body);
    res.json({ success: true, message: 'Lockdown released' });
});

// GET /admin/audit-log
app.get('/admin/audit-log', (req, res) => {
    const { limit = 10, filter = 'all' } = req.query;
    console.log('[API] Audit Log Request:', { limit, filter });

    // Mock audit logs
    const mockLogs = [
        { action: 'CHANNEL_DELETE', executorId: '123456789', targetId: 'ch_001', targetType: 'CHANNEL', timestamp: Math.floor(Date.now() / 1000) - 300 },
        { action: 'ROLE_UPDATE', executorId: '123456789', targetId: 'role_001', targetType: 'ROLE', timestamp: Math.floor(Date.now() / 1000) - 600 },
        { action: 'WEBHOOK_CREATE', executorId: '987654321', targetId: 'wh_001', targetType: 'WEBHOOK', timestamp: Math.floor(Date.now() / 1000) - 900 }
    ];

    const filtered = filter === 'all' ? mockLogs : mockLogs.filter(log => log.targetType.toLowerCase() === filter);

    res.json({
        logs: filtered.slice(0, parseInt(limit))
    });
});


// ==========================
// Server Start
// ==========================

app.listen(PORT, () => {
    console.log(`✅ Mock API Server listening on http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('  POST /events/message');
    console.log('  POST /events/voice');
    console.log('  POST /events/audit');
    console.log('  POST /events/bot-join');
    console.log('  GET  /economy/balance');
    console.log('  GET  /economy/rank');
    console.log('  GET  /economy/leaderboard');
    console.log('  GET  /admin/check');
    console.log('  POST /admin/lockdown');
    console.log('  POST /admin/unlock');
});
