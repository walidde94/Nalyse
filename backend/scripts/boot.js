const { spawn, execSync } = require('child_process');

function run() {
    console.log("[Boot] 🚀 Starting Neural Command in Fast-Boot mode...");

    // Phase A: Push Database Schema (Ensures production DB stays in sync during Phase 5/6 experiments)
    if (process.env.DATABASE_URL) {
        try {
            console.log("[Boot] 🧬 Synchronizing Neural Metadata Schema...");
            execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
            console.log("[Boot] ✅ Schema Synchronized.");
        } catch (err) {
            console.error("[Boot] ⚠️ Schema sync failed (continuing anyway):", err.message);
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
