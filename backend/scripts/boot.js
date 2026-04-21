const { spawn, execSync } = require('child_process');

function run() {
    console.log("[Boot] 🚀 Starting Neural Command in Fast-Boot mode...");

    // Healing: Ensure DATABASE_URL is set for Prisma commands
    const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL || process.env.DIRECT_URL;
    if (dbUrl && dbUrl.length > 10 && (!process.env.DATABASE_URL || process.env.DATABASE_URL.length < 10)) {
        process.env.DATABASE_URL = dbUrl;
    }

    // Phase A: Sync database schema (Essential for fresh deployments)
    if (process.env.SKIP_DB_SYNC !== 'true') {
        try {
            console.log("[Boot] 🔄 Syncing database schema...");
            execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
            console.log("[Boot] ✅ Schema sync complete.");
        } catch (err) {
            console.error("[Boot] ⚠️ Schema sync failed (non-critical):", err.message);
        }
    }

    // Phase B: Start server
    const server = spawn('node', ['dist/src/index.js'], { 
        stdio: 'inherit', 
        env: { ...process.env, NODE_ENV: 'production' } 
    });

    server.on('close', (code) => {
        console.log(`[App] Server exited with code ${code}`);
        process.exit(code);
    });
}

run();
