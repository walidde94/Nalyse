const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://admin@localhost:5432/riskmonitor',
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
