const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/companyController');

router.use(authMiddleware);
router.get('/', ctrl.get);
router.put('/', ctrl.upsert);

module.exports = router;
