const { spawn, exec } = require('child_process');

function run() {
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    console.log("[Boot] 🚀 Starting Neural Command Bootloader...");

    if (process.env.SKIP_DB_SYNC === 'true') {
        console.log("[Boot] ⏩ Skipping Database Sync.");
        startApp();
        return;
    }

    console.log("[Boot] 📡 Synchronizing Database Schema (Background)...");
    
    // Run sync in a way that doesn't block the app from starting
    const sync = exec('npx prisma db push --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: directUrl || databaseUrl }
    });

    sync.stdout.on('data', (data) => console.log(`[Prisma] ${data.trim()}`));
    sync.stderr.on('data', (data) => console.error(`[Prisma Error] ${data.trim()}`));

    sync.on('close', (code) => {
        if (code === 0) {
            console.log("[Boot] ✅ Database Synchronization Complete.");
        } else {
            console.error(`[Boot] ⚠️ Database Synchronization exited with code ${code}. Check logs above.`);
        }
    });

    // Start the app IMMEDIATELY so Render sees it as "Live"
    setTimeout(() => {
        startApp();
    }, 2000);
}

function startApp() {
    console.log("[Boot] 🛰️ Starting Production Server...");
    const server = spawn('node', ['dist/src/index.js'], { stdio: 'inherit', env: process.env });

    server.on('close', (code) => {
        console.log(`[App] Server exited with code ${code}`);
        process.exit(code);
    });
}

run();
