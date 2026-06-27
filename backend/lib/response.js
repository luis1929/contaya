module.exports = {
  success(res, data, status = 200) {
    return res.status(status).json(data);
  },
  created(res, data) {
    return res.status(201).json(data);
  },
  noContent(res) {
    return res.status(204).end();
  },
  badRequest(res, message = 'Solicitud inválida') {
    return res.status(400).json({ error: message });
  },
  notFound(res, message = 'No encontrado') {
    return res.status(404).json({ error: message });
  },
  conflict(res, message = 'Conflicto') {
    return res.status(409).json({ error: message });
  },
  unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({ error: message });
  },
  forbidden(res, message = 'Acceso denegado') {
    return res.status(403).json({ error: message });
  },
  error(res, err, status = 500) {
    console.error('[API Error]', err?.message || err);
    return res.status(status).json({ error: err?.message || 'Error interno del servidor' });
  },
};
