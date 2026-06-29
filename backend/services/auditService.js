const pool = require('../db/pool');

async function logActivity({ actor_id, actor_name, actor_role, action, resource, resource_id, details, ip_address }) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_name, actor_role, action, resource, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [actor_id || null, actor_name || null, actor_role || 'system', action, resource || null, resource_id || null,
       details ? JSON.stringify(details) : '{}', ip_address || null]
    );
  } catch (err) {
    console.error('[auditService] Error logging activity:', err.message);
  }
}

function getIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || null;
}

function extractActor(req) {
  if (!req || !req.user) return { actor_id: null, actor_name: null, actor_role: 'system' };
  return {
    actor_id: req.user.id || req.user.biller_id || null,
    actor_name: req.user.email || req.user.name || null,
    actor_role: req.user.role || 'system',
  };
}

module.exports = {
  logActivity,
  getIp,
  extractActor,

  log(req, { action, resource, resource_id, details } = {}) {
    const actor = extractActor(req);
    return logActivity({
      ...actor,
      action,
      resource,
      resource_id,
      details,
      ip_address: getIp(req),
    });
  },
};
