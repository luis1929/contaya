const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Tipo de archivo no soportado: ${ext}`));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const documentController = require('../controllers/documentController');

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/', documentController.list);
router.get('/:id', documentController.getById);
router.delete('/:id', documentController.remove);

module.exports = router;
