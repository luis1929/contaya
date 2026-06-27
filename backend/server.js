const express = require('express');
const cors = require('cors');
const path = require('path');
<<<<<<< HEAD
require('dotenv').config();
=======
const fs = require('fs');

const authRoutes = require('./routes/auth');
const billersRoutes = require('./routes/billers');
const clientsRoutes = require('./routes/clients');
const invoicesRoutes = require('./routes/invoices');
const documentsRoutes = require('./routes/documents');
const companyRoutes = require('./routes/company');
const healthRoutes = require('./routes/health');
const declarationsRoutes = require('./routes/declarations');
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

<<<<<<< HEAD
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/billers', require('./routes/billers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/health', require('./routes/health'));
app.use('/api/admin', require('./routes/admin'));
=======
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
>>>>>>> 1d55fded9ff5433180cb1a5257998ca0df7ef5ec

app.listen(PORT, () => {
  console.log('Contaya backend running on port ' + PORT);
});
