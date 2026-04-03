const { DataSource } = require('typeorm');
const myDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nalyse_dev',
});
myDataSource.initialize().then(async db => {
    const files = await db.query('SELECT id, filename FROM files ORDER BY "createdAt" DESC LIMIT 1');
    console.log("Found File:", files[0].id);
    const fetch = require('node-fetch');
    const res = await fetch(`http://localhost:3000/api/files/${files[0].id}/analyze`);
    const text = await res.text();
    console.log("RESPONSE:", text);
    process.exit(0);
}).catch(console.error);
