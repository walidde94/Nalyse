const { execSync, spawn } = require('child_process');

function run() {
    let databaseUrl = process.env.DATABASE_URL;
    let directUrl = process.env.DIRECT_URL;

    console.log("[Boot] 🚀 Starting Neural Command Bootloader...");

    // If DIRECT_URL is missing, we try to derive it to ensure Migrations/Push work
    if (!directUrl && databaseUrl) {
        if (databaseUrl.includes('6543') || databaseUrl.includes('pgbouncer=true')) {
            directUrl = databaseUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
            process.env.DIRECT_URL = directUrl;
            console.log("[Boot] 🔗 Derived DIRECT_URL for schema synchronization.");
        } else {
            process.env.DIRECT_URL = databaseUrl;
        }
    }

    try {
        console.log("[Boot] 📡 Synchronizing Database Schema...");
        // Increase memory and timeout for Prisma on limited Render instances
        execSync('npx prisma db push --accept-data-loss', { 
            stdio: 'inherit', 
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=1024' } 
        });
        console.log("[Boot] ✅ Schema is in sync.");
    } catch (error) {
        console.error("[Boot] ❌ CRITICAL: Database synchronization failed!");
        console.error("[Boot] This usually means your DIRECT_URL is incorrect or your DB is refusing connections.");
        
        // In local dev, we might want to continue, but on Render (production), 
        // starting a broken app just leads to 500 errors.
        if (process.env.NODE_ENV === 'production') {
            console.error("[Boot] 🛑 Shuting down to prevent ghost 500 errors. Check Render logs for the Prisma error above.");
            process.exit(1); 
        }
    }

    console.log("[Boot] 🛰️ Starting Production Server...");
    const server = spawn('node', ['dist/src/index.js'], { stdio: 'inherit', env: process.env });

    server.on('close', (code) => {
        process.exit(code);
    });
}

run();
