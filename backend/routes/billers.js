const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/billerController');
const credCtrl = require('../controllers/credentialsController');

router.use(authMiddleware);

router.get('/credentials/status', credCtrl.status);
router.post('/credentials', credCtrl.save);
router.delete('/credentials', credCtrl.delete);
router.get('/credentials/admin-list', adminOnly, credCtrl.adminList);

router.get('/', ctrl.list);
router.post('/', adminOnly, ctrl.create);
router.put('/:id', adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);
router.post('/:id/sync', ctrl.sync);

module.exports = router;
