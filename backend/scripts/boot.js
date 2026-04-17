const { execSync, spawn } = require('child_process');

function run() {
    let directUrl = process.env.DIRECT_URL;
    let databaseUrl = process.env.DATABASE_URL;

    console.log("[Boot] Initializing DB sync...");

    if (!directUrl && databaseUrl) {
        console.log("[Boot] DIRECT_URL is missing. Attempting to derive from DATABASE_URL...");
        
        // Supabase / PgBouncer commonly uses port 6543. Migrations MUST use 5432.
        if (databaseUrl.includes('6543') || databaseUrl.includes('pgbouncer=true')) {
            directUrl = databaseUrl.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
            console.log("[Boot] Detected pooled connection. Rewrote DIRECT_URL to bypass PgBouncer.");
        } else {
            directUrl = databaseUrl;
        }
        
        process.env.DIRECT_URL = directUrl;
    }

    // Export so Prisma sees it
    process.env.PRISMA_HIDE_UPDATE_MESSAGE = '1';

    try {
        console.log("[Boot] Running prisma db push...");
        // Use stdio inherit to see the exact error output in Render logs if it crashes again
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
        console.log("[Boot] Prisma DB push completed successfully!");
    } catch (error) {
        console.error("[Boot] ⚠️ Prisma DB Push Failed ⚠️");
        console.error("[Boot] Check the error logs above for the exact reason.");
        console.error(error);
        // We do NOT exit. We still attempt to start Node! Let the app run so at least parts of it work.
    }

    console.log("[Boot] Starting Node server...");
    const server = spawn('node', ['dist/src/index.js'], { stdio: 'inherit', env: process.env });

    server.on('close', (code) => {
        process.exit(code);
    });
}

run();
