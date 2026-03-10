const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// ✅ REGISTRO
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email || !contraseña) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // 1. Verificar si ya existe el email
    const {rows} = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1`,
      [email]
    );

    if (rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // 2. Generar hash automático
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(contraseña, salt);

    // 3. Guardar usuario en DB
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)`,
      [nombre, email, passwordHash]
    );

    res.json({ mensaje: "Usuario registrado correctamente" });

  } catch (error) {
    console.error("❌ Error registro:", error);
    res.status(500).json({ error: "Error interno" });
  }
});


// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Buscar usuario por email
    const {rows} = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Email no registrado" });
    }

    const usuario = rows[0];

    // Comparar contraseña escrita con hash guardado
    const coincide = await bcrypt.compare(
      contraseña,
      usuario.password
    );

    if (!coincide) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id,
        email: usuario.email,
        rol: usuario.rol 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: "2h" 
      }
    );

    //  Enviar token + usuario
    res.json({
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("❌ Error login:", error);
    res.status(500).json({ error: "Error interno" });
  }
});




module.exports = router;
