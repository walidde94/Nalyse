const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // For MVP speed, usually huge security risk
        }
    });

    // Start with login page - users will be redirected to dashboard after login
    mainWindow.loadFile('login.html');
}

function startBackend() {
    // Pivot to Node.js Backend because Go is not available
    const backendEntry = path.join(__dirname, '../backend-node/src/index.js');

    if (fs.existsSync(backendEntry)) {
        console.log("Starting Node Backend...");
        backendProcess = spawn('node', [backendEntry], {
            cwd: path.join(__dirname, '../backend-node'),
            env: { ...process.env, PORT: '8080' }
        });

        backendProcess.stdout.on('data', (data) => {
            console.log(`Backend: ${data}`);
        });

        backendProcess.stderr.on('data', (data) => {
            console.error(`Backend Error: ${data}`);
        });
    } else {
        console.log("Backend entry not found:", backendEntry);
    }
}

app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
