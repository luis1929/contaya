const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { billerContext } = require('../middleware/tenantContext');
const ctrl = require('../controllers/declarationController');

router.use(authMiddleware, billerContext);
router.get('/', ctrl.list);
router.get('/summary', ctrl.summary);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
