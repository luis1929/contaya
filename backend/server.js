const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/billers', require('./routes/billers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/health', require('./routes/health'));
app.use('/api/admin', require('./routes/admin'));

app.listen(PORT, () => {
  console.log('Contaya backend running on port ' + PORT);
});
