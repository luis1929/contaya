const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const ctrl = require('../controllers/analyticsController');

router.use(authMiddleware, billerContext);
router.get('/top-products', ctrl.topProducts);
router.get('/product-clients', ctrl.productClients);
router.get('/monthly-sales', ctrl.monthlySales);
router.get('/client-products', ctrl.clientProducts);
router.get('/product-relations', ctrl.productRelations);
router.get('/stats', ctrl.stats);

module.exports = router;
