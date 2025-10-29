const express = require('express');
const router = express.Router();

// Placeholder de rotas de avaliação
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Avaliações API - em construção' });
});

module.exports = router;

