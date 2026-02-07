const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

class PlaywrightWorker {
    constructor() {
        this.process = null;
        this.rl = null;
        this.jobQueue = new Map(); // jobId -> { resolve, reject }
    }

    start() {
        const workerPath = path.join(__dirname, '../../workers/playwright/index.js');

        this.process = spawn('node', [workerPath], {
            cwd: path.dirname(workerPath),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.rl = readline.createInterface({
            input: this.process.stdout,
            terminal: false
        });

        this.rl.on('line', (line) => {
            try {
                const result = JSON.parse(line);
                if (this.jobQueue.has(result.job_id)) {
                    const { resolve, reject } = this.jobQueue.get(result.job_id);
                    this.jobQueue.delete(result.job_id);

                    if (result.success) {
                        resolve(result.data);
                    } else {
                        reject(new Error(result.error));
                    }
                }
            } catch (e) {
                console.error("Worker output parse error:", e);
            }
        });

        this.process.stderr.on('data', (data) => {
            console.error(`[Playwright Worker]: ${data}`);
        });

        console.log("Playwright Worker Started");
    }

    async checkCookieBanner(url, jobId) {
        if (!this.process) this.start();

        return new Promise((resolve, reject) => {
            this.jobQueue.set(jobId, { resolve, reject });

            const job = {
                job_id: jobId,
                url: url,
                check_type: "cookie_banner",
                output_path: path.join(__dirname, `../../data/scans/${jobId}/screenshot.png`)
            };

            this.process.stdin.write(JSON.stringify(job) + "\n");
        });
    }

    async performDeepAudit(url, jobId) {
        if (!this.process) this.start();

        return new Promise((resolve, reject) => {
            this.jobQueue.set(jobId, { resolve, reject });

            const job = {
                job_id: jobId,
                url: url,
                check_type: "deep_audit"
            };

            this.process.stdin.write(JSON.stringify(job) + "\n");
        });
    }
}

module.exports = new PlaywrightWorker();
