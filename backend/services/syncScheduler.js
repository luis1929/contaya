const { spawn } = require('child_process');
const path = require('path');
const pool = require('../db/pool');
const crypto = require('./cryptoService');
const logger = require('../lib/logger');

const INTERVAL_MS = 20 * 60 * 1000; // 20 minutes

function launchScraper(billerId, user, pass) {
  const scraperPath = path.join(__dirname, '../../scraper/index.js');
  const child = spawn('node', [scraperPath, `--biller-id=${billerId}`], {
    env: { ...process.env, FACTURATECH_USER: user, FACTURATECH_PASS: pass },
    detached: true, stdio: 'ignore',
  });
  child.unref();
}

async function syncAll() {
  try {
    const { rows: billers } = await pool.query(`
      SELECT b.id, bc.username_encrypted, bc.password_encrypted
      FROM billers b
      JOIN biller_credentials bc ON bc.biller_id = b.id AND bc.is_configured = true
      WHERE b.is_active = true
    `);

    for (const b of billers) {
      try {
        const username = crypto.decrypt(b.username_encrypted);
        const password = crypto.decrypt(b.password_encrypted);
        await pool.query(
          `UPDATE billers SET scrape_status = 'running', scrape_last_run = NOW() WHERE id = $1`,
          [b.id]
        );
        launchScraper(b.id, username, password);
      } catch (err) {
        logger.error('Error syncing biller', { billerId: b.id, error: err.message });
      }
    }

    if (billers.length > 0) {
      logger.info('Sync cycle completed', { billersCount: billers.length });
    }
  } catch (err) {
    logger.error('Sync cycle failed', { error: err.message });
  }
}

let timer = null;

function start() {
  logger.info('Sync scheduler started', { intervalMin: INTERVAL_MS / 60000 });
  syncAll();
  timer = setInterval(syncAll, INTERVAL_MS);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Sync scheduler stopped');
  }
}

module.exports = { start, stop, syncAll };
