const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const billersRoutes = require('./routes/billers');
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const documentsRoutes = require('./routes/documents');
const companyRoutes = require('./routes/company');
const healthRoutes = require('./routes/health');
const declarationsRoutes = require('./routes/declarations');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.use('/api/auth', authRoutes);
app.use('/api/billers', billersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/declarations', declarationsRoutes);

app.use((req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Contaya backend running on port ' + PORT);
});
