const { spawnSync } = require('child_process');
const path = require('path');

function run() {
    console.log("[Boot] 🚀 Starting Neural Command Architecture...");

    // Phase A.1: Prisma Generation (Ensure client matches schema)
    console.log("[Boot] Phase A.1: Generating Prisma Client...");
    spawnSync('npx', ['prisma', 'generate'], { stdio: 'inherit', shell: true });

    // Phase A.2: Schema Synchronization (Safe db push)
    console.log("[Boot] Phase A.2: Synchronizing Schema...");
    spawnSync('npx', ['prisma', 'db', 'push', '--accept-data-loss'], { stdio: 'inherit', shell: true });

    // Phase A.3: Neural Schema Repair (Align IDs)
    console.log("[Boot] Phase A.3: Running Neural Schema Repair...");
    spawnSync('node', [path.join(__dirname, 'repair-db.js')], { stdio: 'inherit', shell: true });

    // Phase B: Start server
    console.log("[Boot] Phase B: Launching Application Server...");
    const { spawn } = require('child_process');
    const server = spawn('node', ['dist/src/index.js'], { 
        stdio: 'inherit', 
        env: { ...process.env, NODE_ENV: 'production' },
        shell: true
    });

    server.on('close', (code) => {
        console.log(`[App] Server exited with code ${code}`);
        process.exit(code);
    });
}

run();
