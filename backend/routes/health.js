const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/healthController');

router.get('/', ctrl.check);

module.exports = router;
