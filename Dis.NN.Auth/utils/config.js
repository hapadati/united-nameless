import dotenv from 'dotenv';
dotenv.config();

/**
 * Startup Validation
 * 仕様 4. Environment Check: 必要な環境変数をチェック
 */
export function validateEnvironment() {
    const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'DISCORD_GUILD_ID'];
    const optional = ['API_BASE_URL', 'BOT_ID', 'PORT'];

    const missing = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ Required environment variables are missing:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Please create a .env file based on .env.example');
        process.exit(1);
    }

    console.log('✅ Environment validation passed');

    // Optional variable warnings
    for (const key of optional) {
        if (!process.env[key]) {
            console.warn(`⚠️ Optional variable ${key} is not set. Using defaults.`);
        }
    }

    // Display configuration
    console.log('\n📋 Configuration:');
    console.log(`   DISCORD_GUILD_ID: ${process.env.DISCORD_GUILD_ID}`);
    console.log(`   API_BASE_URL: ${process.env.API_BASE_URL || 'http://localhost:4000'}`);
    console.log(`   BOT_ID: ${process.env.BOT_ID || 'DISCORD_BOT'}`);
    console.log(`   PORT: ${process.env.PORT || '3000'}`);
}
