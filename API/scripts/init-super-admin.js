/**
 * SuperAdmin初期化スクリプト
 * 
 * 使用方法:
 * node scripts/init-super-admin.js
 */

import { getFirestore } from '../config/firebase.js';

const db = getFirestore();

// SuperAdminのUID（環境変数から取得、またはハードコード）
const SUPER_ADMIN_UID = process.env.SUPER_ADMIN_UID || '1420014044055732327';

async function initSuperAdmin() {
    try {
        console.log(`Initializing SuperAdmin with UID: ${SUPER_ADMIN_UID}`);

        // SuperAdminsコレクションに登録
        await db.collection('superAdmins').doc(SUPER_ADMIN_UID).set({
            userId: SUPER_ADMIN_UID,
            role: 'super',
            createdAt: new Date(),
            permissions: ['approve_admins', 'revoke_admins', 'view_all_logs']
        });

        console.log('✓ SuperAdmin initialized successfully');

        // Adminsコレクションにも追加（自動的にAdmin権限も持つ）
        await db.collection('admins').doc(SUPER_ADMIN_UID).set({
            userId: SUPER_ADMIN_UID,
            totpEnabled: false, // 初回は無効、後でセットアップ
            grantedAt: new Date(),
            grantedBy: 'system',
            isSuperAdmin: true
        });

        console.log('✓ SuperAdmin added to admins collection');
        console.log('\nSetup complete! SuperAdmin can now:');
        console.log('- Approve/reject admin requests');
        console.log('- Access /admin/approvals page');
        console.log('- Manage all system settings');

    } catch (error) {
        console.error('Error initializing SuperAdmin:', error);
        process.exit(1);
    }

    process.exit(0);
}

initSuperAdmin();
