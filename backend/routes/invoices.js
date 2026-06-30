const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const ctrl = require('../controllers/invoiceController');

router.use(authMiddleware, billerContext);
router.get('/', ctrl.list);
router.get('/summary', ctrl.summary);
router.get('/summary-by-biller', ctrl.summaryByBiller);
router.get('/clients-by-biller', ctrl.clientsByBiller);
router.get('/consolidated', ctrl.consolidated);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/emitir', ctrl.emitir);
router.post('/extract-items', ctrl.extractItems);
router.post('/backfill-items', ctrl.backfillInvoiceItems);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
