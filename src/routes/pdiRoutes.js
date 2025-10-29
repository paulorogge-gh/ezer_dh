const express = require('express');
const router = express.Router();

// Placeholder de rotas de PDI
router.get('/', (req, res) => {
  res.json({ success: true, message: 'PDI API - em construção' });
});

module.exports = router;

