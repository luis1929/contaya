const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'contaya',
  password: process.env.DB_PASSWORD || 'contaya123',
  database: process.env.DB_NAME || 'contaya',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
});

pool.on('error', err => {
  console.error('[DB Pool] Unexpected error:', err.message);
});

module.exports = pool;
