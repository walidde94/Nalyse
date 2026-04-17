const { execSync, spawn } = require('child_process');

function run() {
    const databaseUrl = process.env.DATABASE_URL;
    let directUrl = process.env.DIRECT_URL;

    console.log("[Boot] 🚀 Starting Neural Command Bootloader...");

    if (directUrl && directUrl.includes('pooler.supabase.com')) {
        console.warn("[Boot] ⚠️ WARNING: Your DIRECT_URL appears to be a POOLED connection (pooler.supabase.com).");
        console.warn("[Boot] ⚠️ Prisma 'db push' WILL FAIL against a pooler. Please use the 'Session' connection from Supabase.");
    }

    // Try to fix missing DIRECT_URL if DATABASE_URL is all we have
    if (!directUrl && databaseUrl) {
        if (databaseUrl.includes('pooler.supabase.com') || databaseUrl.includes('pgbouncer=true')) {
            // We can't easily guess the non-pooler hostname for Supabase, so we just warn
            console.error("[Boot] ❌ ERROR: DATABASE_URL is pooled but DIRECT_URL is missing.");
        } else {
            process.env.DIRECT_URL = databaseUrl;
        }
    }

    // Optional: Allow skipping sync via env var if the DB is already manually synced
    if (process.env.SKIP_DB_SYNC === 'true') {
        console.log("[Boot] ⏩ Skipping Database Sync as requested.");
    } else {
        try {
            console.log("[Boot] 📡 Synchronizing Database Schema...");
            // Use the DIRECT_URL for the push command explicitly
            execSync('npx prisma db push --accept-data-loss', { 
                stdio: 'inherit', 
                env: { ...process.env, DATABASE_URL: process.env.DIRECT_URL || databaseUrl } 
            });
            console.log("[Boot] ✅ Schema is in sync.");
        } catch (error) {
            console.error("[Boot] ❌ CRITICAL: Database synchronization failed!");
            
            // On Supabase, this is almost always a pooler issue
            if (directUrl && directUrl.includes('pooler.supabase.com')) {
                console.error("[Boot] 💡 FIX: Change your DIRECT_URL in Render to the 'Session' connection string from Supabase settings.");
            }

            if (process.env.NODE_ENV === 'production') {
                console.error("[Boot] 🛑 Shutting down to prevent consistent 500 errors.");
                process.exit(1); 
            }
        }
    }

    console.log("[Boot] 🛰️ Starting Production Server...");
    const server = spawn('node', ['dist/src/index.js'], { stdio: 'inherit', env: process.env });

    server.on('close', (code) => {
        process.exit(code);
    });
}

run();
