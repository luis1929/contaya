const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const levelWeight = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL || 'info';

function formatLog(level, msg, meta) {
  const entry = {
    time: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta } : {}),
  };
  return JSON.stringify(entry) + '\n';
}

const streams = {
  error: fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' }),
  combined: fs.createWriteStream(path.join(logDir, 'combined.log'), { flags: 'a' }),
};

function log(level, msg, meta) {
  if (levelWeight[level] > levelWeight[currentLevel]) return;
  const line = formatLog(level, msg, meta);
  streams.combined.write(line);
  if (level === 'error' || level === 'warn') streams.error.write(line);

  if (process.env.NODE_ENV !== 'production' || level === 'error') {
    const prefix = `[${level.toUpperCase()}]`;
    if (meta) console.log(prefix, msg, meta);
    else console.log(prefix, msg);
  }
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
