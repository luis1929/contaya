const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });
    if (fileError) throw fileError;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('documents')
      .insert([{
        original_name: req.file.originalname,
        filename: fileName,
        file_url: publicUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: detectType(req.file.originalname),
      }])
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/documents/:id', async (req, res) => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Documento eliminado' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Contaya API running' });
});

function detectType(name) {
  const n = name.toLowerCase();
  if (n.includes('factura') || n.includes('invoice')) return 'invoice';
  if (n.includes('nota') && n.includes('credito')) return 'credit_note';
  if (n.includes('nota') && n.includes('debito')) return 'debit_note';
  if (n.includes('extracto') || n.includes('estado') || n.includes('bank')) return 'statement';
  if (n.includes('recibo') || n.includes('receipt')) return 'receipt';
  return 'other';
}

module.exports = app;
