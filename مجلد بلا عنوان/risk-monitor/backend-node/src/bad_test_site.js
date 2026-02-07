const express = require('express');
const app = express();
const PORT = 8888;

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>Vulnerable Test Site</title></head>
        <body>
            <h1>Welcome to the Broken Site</h1>
            <p>This site is designed to fail scans.</p>
            
            <h2>Broken Links</h2>
            <ul>
                <li><a href="/valid-page">Valid Page</a></li>
                <li><a href="/missing-page">Broken Link (404)</a></li>
                <li><a href="/server-error">Server Error (500)</a></li>
                <li><a href="/timeout">Timeout Page</a></li>
            </ul>

            <h2>Compliance Risks</h2>
            <p>We have absolutely NO cookie banner here!</p>
            <script>document.cookie = "tracking_id=12345";</script>
            
            <h2>Images</h2>
            <img src="/missing-image.jpg" alt="Broken Image">
        </body>
        </html>
    `);
});

app.get('/valid-page', (req, res) => res.send('<h1>This is fine</h1>'));

app.get('/server-error', (req, res) => res.status(500).send('Critical Server Error'));

app.get('/timeout', (req, res) => {
    // Never respond to simulate timeout
});

app.listen(PORT, () => {
    console.log(`Bad Test Site running on http://localhost:${PORT}`);
});
