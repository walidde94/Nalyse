const { spawn, execSync } = require('child_process');

function run() {
    console.log("[Boot] 🚀 Starting Neural Command in Fast-Boot mode...");

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
