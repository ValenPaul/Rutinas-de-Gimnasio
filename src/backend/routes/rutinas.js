const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todas las rutinas
router.get('/', (req, res) => {
  db.query('SELECT * FROM rutinas', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al traer rutinas' });
    res.json(results);
  });
});

module.exports = router;
