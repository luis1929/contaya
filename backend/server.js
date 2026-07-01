const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const logger = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(compression());

const corsOptions = {
  origin: isProd ? process.env.CORS_ORIGIN || true : true,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  skip: req => req.path === '/api/health',
});
app.use('/api/', limiter);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist, { maxAge: isProd ? '1y' : 0, immutable: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/billers', require('./routes/billers'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/company', require('./routes/company'));
app.use('/api/health', require('./routes/health'));
app.use('/api/declarations', require('./routes/declarations'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/invoice-parse', require('./routes/invoiceParser'));
app.use('/api/chat', require('./routes/chat'));

app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  logger.error(err.message || err, { path: req.path, method: req.method });
  const status = err.status || 500;
  if (status === 400) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Archivo demasiado grande. Máximo 20MB' });
  }
  res.status(status).json({ error: isProd ? 'Error interno del servidor' : err.message });
});

const syncScheduler = require('./services/syncScheduler');

const server = app.listen(PORT, () => {
  logger.info('Backend started', { port: PORT, env: isProd ? 'production' : 'development' });
  syncScheduler.start();
});

function gracefulShutdown(signal) {
  logger.info('Shutting down gracefully', { signal });
  syncScheduler.stop();
  server.close(() => {
    logger.info('Server closed', { signal });
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown', { signal });
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
