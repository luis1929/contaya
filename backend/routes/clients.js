const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const ctrl = require('../controllers/clientController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware, billerContext);
router.get('/', ctrl.list);
router.post('/upload-rut', upload.single('file'), ctrl.uploadRut);
router.post('/', ctrl.create);
router.post('/sync-facturatech', ctrl.syncFacturatech);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
