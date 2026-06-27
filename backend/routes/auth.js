const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/reset-password', ctrl.resetPassword);
router.get('/me', authMiddleware, ctrl.getMe);
router.post('/change-password', authMiddleware, ctrl.changePassword);
router.post('/impersonate/:biller_id', authMiddleware, ctrl.impersonate);

module.exports = router;
