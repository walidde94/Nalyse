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
            // Use local prisma binary for reliability
            const output = execSync('./node_modules/.bin/prisma db push --accept-data-loss --schema prisma/schema.prisma', { 
                encoding: 'utf8',
                env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
            });
            console.log("[Boot] Prisma Output:", output);
            console.log("[Boot] ✅ Schema sync complete.");
        } catch (err) {
            console.error("[Boot] ⚠️ Schema sync failed:", err.message);
            if (err.stdout) console.log("[Boot] Sync Stdout:", err.stdout);
            if (err.stderr) console.error("[Boot] Sync Stderr:", err.stderr);
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
