const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/billers', require('./routes/billers'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/company', require('./routes/company'));
app.use('/api/health', require('./routes/health'));
app.use('/api/declarations', require('./routes/declarations'));
app.use('/api/items', require('./routes/items'));
app.use('/api/admin', require('./routes/admin'));

app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message || err);
  if (err.message && err.message.startsWith('Tipo no soportado')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Archivo demasiado grande. Máximo 20MB' });
  }
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log('Contaya backend running on port ' + PORT);
});
