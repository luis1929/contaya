const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Contaya API running' });
});

const documentRoutes = require('./routes/documents');
app.use('/api/documents', documentRoutes);

app.listen(PORT, () => {
  console.log(`Contaya backend running on port ${PORT}`);
});
