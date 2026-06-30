const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const ctrl = require('../controllers/invoiceController');

router.use(authMiddleware, billerContext);
router.get('/', ctrl.list);
router.get('/client-list', ctrl.clientList);
router.get('/summary', ctrl.summary);
router.get('/summary-by-biller', ctrl.summaryByBiller);
router.get('/:id', ctrl.getById);
router.get('/:id/items', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
