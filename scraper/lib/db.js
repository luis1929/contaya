import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

const ALGORITHM = 'aes-256-gcm';

function getDecryptionKey() {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIALS_ENCRYPTION_KEY env var is required');
  return crypto.scryptSync(key, 'contaya_salt', 32);
}

function decryptCredential(encoded) {
  const parts = encoded.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, getDecryptionKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function createPool() {
  return new Pool({
    user: process.env.DB_USER || 'contaya',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'contaya',
    password: process.env.DB_PASSWORD || 'contaya123',
    port: parseInt(process.env.DB_PORT || '5432'),
  });
}

export async function getBillers(pool) {
  const { rows } = await pool.query(`
    SELECT
      b.id, b.name, b.document_number,
      bc.username_encrypted, bc.password_encrypted
    FROM billers b
    LEFT JOIN biller_credentials bc ON bc.biller_id = b.id
    ORDER BY b.name
  `);
  return rows.map(row => {
    const creds = {};
    if (row.username_encrypted && row.password_encrypted) {
      try {
        creds.username = decryptCredential(row.username_encrypted);
        creds.password = decryptCredential(row.password_encrypted);
      } catch (e) {
        console.error(`[db] Failed to decrypt credentials for ${row.name}: ${e.message}`);
      }
    }
    const envUser = process.env[`FACTURATECH_USER_${row.document_number}`];
    const envPass = process.env[`FACTURATECH_PASS_${row.document_number}`];
    return {
      id: row.id,
      name: row.name,
      document_number: row.document_number,
      username: creds.username || envUser || row.document_number,
      password: creds.password || envPass || null,
    };
  });
}
