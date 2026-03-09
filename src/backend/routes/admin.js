const express = require("express");
const router = express.Router();

const verificarToken = require("../middleware/auth");
const soloAdmin = require("../middleware/admin");
const pool = require("../db");

// ✅ GET todos los usuarios
router.get("/usuarios", verificarToken, soloAdmin, async (req, res) => {
  const {rows} = await pool.query(
    `SELECT id, nombre, email, rol FROM usuarios`
  );

  res.json(rows);
});

// Ver todos los pagos
router.get("/pagos", verificarToken, soloAdmin, async (req, res) => {
  const {rows} = await pool.query(`
    SELECT 
      p.payment_id,
      u.email,
      r.nombre AS rutina,
      p.estado,
      p.monto,
      p.fecha_pago,
      p.email_enviado,
      p.error_email
    FROM pagos p
    JOIN usuarios u ON p.usuario_id = u.id
    JOIN rutinas r ON p.rutina_id = r.id
    ORDER BY p.fecha_pago DESC
  `);

  res.json(rows);
});


module.exports = router;
