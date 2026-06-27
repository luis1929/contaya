const pool = require('../db/pool');

const PERMISSION_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getPermissions(roleName) {
  const cached = PERMISSION_CACHE.get(roleName);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.perms;

  const { rows } = await pool.query(
    'SELECT resource, action FROM role_permissions WHERE role_name = $1',
    [roleName]
  );

  const perms = rows.map(r => `${r.resource}:${r.action}`);
  PERMISSION_CACHE.set(roleName, { perms, ts: Date.now() });
  return perms;
}

function hasPermission(perms, resource, action) {
  if (perms.includes('*:manage')) return true;
  return perms.includes(`${resource}:${action}`) || perms.includes(`${resource}:manage`);
}

function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const role = req.user.role || 'biller';
      const perms = await getPermissions(role);
      if (!hasPermission(perms, resource, action)) {
        return res.status(403).json({ error: `No tienes permiso para ${action} ${resource}` });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = { requirePermission, getPermissions };
