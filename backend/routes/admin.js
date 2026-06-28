const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const ctrl = require('../controllers/adminController');

router.use(authMiddleware, adminOnly);

router.get('/dashboard', ctrl.dashboard);
router.get('/billers', requirePermission('billers', 'read'), ctrl.listBillers);
router.post('/billers', requirePermission('billers', 'create'), ctrl.createBiller);
router.put('/billers/:id', requirePermission('billers', 'update'), ctrl.updateBiller);
router.delete('/billers/:id', requirePermission('billers', 'delete'), ctrl.deleteBiller);
router.get('/audit-log', requirePermission('audit_log', 'read'), ctrl.auditLog);
router.get('/audit-stats', requirePermission('audit_log', 'read'), ctrl.auditStats);
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSetting);

module.exports = router;
