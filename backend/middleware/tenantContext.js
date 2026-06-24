/**
 * Inyecta `req.billerId` en cada request autenticado.
 * - Biller -> req.billerId = uuid de billers.id
 * - Admin -> req.billerId = null (acceso global)
 */

function billerContext(req, res, next) {
  if (req.user.role === 'biller') {
    req.billerId = req.user.biller_id;
    req.isAdmin = false;
  } else {
    req.billerId = null;
    req.isAdmin = true;
  }
  next();
}

/**
 * Agrega cláusula WHERE biller_id = $N al SQL si el usuario es biller.
 */
function whereBiller(req, params, alias = '') {
  if (!req.billerId) return '';
  const prefix = alias ? `${alias}.` : '';
  params.push(req.billerId);
  return ` AND ${prefix}biller_id = $${params.length}::uuid`;
}

module.exports = { billerContext, whereBiller };
