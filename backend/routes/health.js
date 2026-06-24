const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Contaya API running' });
});

module.exports = router;
