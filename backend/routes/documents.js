const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const docCtrl = require('../controllers/documentController');
const noteCtrl = require('../controllers/noteController');
const tagCtrl = require('../controllers/tagController');

router.use(authMiddleware, billerContext);

router.post('/upload', docCtrl.uploadSingle);
router.post('/upload-multiple', docCtrl.uploadMultiple);
router.get('/', docCtrl.list);
router.get('/tags', tagCtrl.list);
router.post('/tags', tagCtrl.create);
router.delete('/tags/:id', tagCtrl.remove);
router.get('/:id', docCtrl.getById);
router.get('/:id/download', docCtrl.download);
router.patch('/:id/favorite', docCtrl.toggleFavorite);
router.patch('/:id/status', docCtrl.updateStatus);
router.post('/:id/notes', noteCtrl.create);
router.get('/:id/notes', noteCtrl.list);
router.delete('/:id', docCtrl.remove);

module.exports = router;
