const express = require('express');
const router = express.Router();
const db = require('../db');

// Registro
router.post('/registro', (req, res) => {
  const { nombre, email, contraseña } = req.body;
  db.query(
    'INSERT INTO usuarios (nombre, email, contraseña) VALUES (?, ?, ?)',
    [nombre, email, contraseña],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al registrar' });
      res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, contraseña } = req.body;
  db.query(
    'SELECT * FROM usuarios WHERE email = ? AND contraseña = ?',
    [email, contraseña],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al iniciar sesión' });
      if (results.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
      res.json({ mensaje: 'Login exitoso', usuario: results[0] });
    }
  );
});

module.exports = router;
