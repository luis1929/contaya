const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');
const path = require('path');
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function launchScraper(billerId, user, pass) {
  const scraperPath = path.join(__dirname, '../../scraper/index.js');
  const env = {
    ...process.env,
    FACTURATECH_USER: user,
    FACTURATECH_PASS: pass,
  };

  const child = spawn('node', [scraperPath, `--biller-id=${billerId}`], {
    env,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  console.log(`[scraper] launched for biller ${billerId} (pid will detach)`);
}

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'biller') {
      const { rows } = await pool.query('SELECT id, name, document_number, email, phone, is_active FROM billers WHERE id = $1', [req.user.biller_id]);
      return res.json(rows);
    }
    const { rows } = await pool.query(`
      SELECT b.id, b.name, b.document_number, b.email, b.phone, b.is_active,
        COUNT(i.id)::int AS invoice_count,
        COALESCE(SUM(i.total), 0) AS total_sum
      FROM billers b
      LEFT JOIN invoices i ON i.biller_id = b.id
      GROUP BY b.id
      ORDER BY b.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, document_type, document_number, email, phone, address, city, password, facturatech_user, facturatech_pass } = req.body;
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const { rows } = await pool.query(
      `INSERT INTO billers (name, document_type, document_number, email, phone, address, city, password, scrape_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending') RETURNING id, name, document_number, email, phone, is_active, scrape_status`,
      [name, document_type || 'NIT', document_number, email, phone, address, city, hash]
    );
    const biller = rows[0];

    // Lanzar scraper en background si se proveyeron credenciales de Facturatech
    if (facturatech_user && facturatech_pass) {
      await pool.query(
        `UPDATE billers SET scrape_status='running', scrape_last_run=NOW() WHERE id=$1`,
        [biller.id]
      );
      biller.scrape_status = 'running';
      launchScraper(biller.id, facturatech_user, facturatech_pass);
    }

    res.status(201).json(biller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { name, document_type, document_number, email, phone, address, city, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE billers SET name=$1, document_type=$2, document_number=$3, email=$4, phone=$5,
       address=$6, city=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING id, name, document_number, email, phone, is_active`,
      [name, document_type, document_number, email, phone, address, city, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM billers WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
