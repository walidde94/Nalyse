const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://admin@localhost:5432/riskmonitor',
});

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, '../../database/migrations/001_initial_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Running migration...");
        await pool.query(sql);
        console.log("Migration successful!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e.message);
        console.error("Please ensure the database 'riskmonitor' exists and credentials are correct.");
        process.exit(1);
    }
}

migrate();
