const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, contraseña } = req.body;

    const existe = await Usuario.buscarPorEmail(email);
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });

    const passwordHash = await bcrypt.hash(contraseña, 10);
    const id = await Usuario.crear(nombre, email, passwordHash);

    res.json({ mensaje: 'Usuario registrado', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const esValido = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!esValido) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});


module.exports = router;
