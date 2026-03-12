const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const verificarToken = require("../middleware/auth.js");
const pool = require("../db");

require('dotenv').config();

if (process.env.NODE_ENV !== 'production') {
  console.log("Access token usado:", process.env.MP_ACCESS_TOKEN ? "OK" : "NO CARGADO");
} // para no exponer info en logs del servidor

// Crear la configuración con tu Access Token
const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});
console.log("prueba codigo");

// Endpoint para crear una preferencia de pago
router.post('/crear-preferencia', verificarToken, async (req, res) => {
    const usuarioId = req.usuario.id;
    const emailUsuario = req.usuario.email;
    console.log("Endpoint ejecutado");
    console.log("Compra iniciada por usuario: ", usuarioId);
    try {
        // solo recibimos el ID de la rutina
        const { rutina_id } = req.body;

        console.log("Rutina recibida:", rutina_id);

        // 🔎 Buscar rutina en la base de datos
        const { rows } = await pool.query(
            `SELECT id, nombre, precio FROM rutinas WHERE id = $1`,
            [rutina_id]
        );

        if (!rows.length) {
            return res.status(404).json({
                error: "Rutina no encontrada"
            });
        }

        const rutina = rows[0];

        // Tomamos el origin que llega desde el frontend
        //const origin = "https://9008-190-231-107-206.ngrok-free.app";
        const origin = req.headers.origin || process.env.ALLOWED_ORIGINS || "https://primeconditioning.vercel.app";
        
        console.log("arranca el try");
        console.log("🔔 URL webhook configurada:", `${origin}/api/webhook`);
        console.log("Origin detectado para back_urls:", origin);
       


        const preference = new Preference(mp);

        const result = await preference.create({
            body: {
                items: [
                    {
                        title: rutina.nombre, // ahora viene de la DB
                        quantity: 1,
                        unit_price: Number(rutina.precio), // precio desde DB
                        currency_id: 'ARS'
                    }
                ],

                external_reference: JSON.stringify({
                    usuario_id: usuarioId,
                    rutina: rutina.nombre
                }),

                back_urls: {
                    success: `${origin}/success.html`,
                    failure: `${origin}/failure.html`,
                    pending: `${origin}/pending.html`
                },

                auto_return: 'approved',

                notification_url: `https://primeconditioning.vercel.app/api/webhook`,
            }
        });

        console.log("✅ Preferencia creada:", result);

        // Responder con el link para pagar
        res.json({ init_point: result.init_point || result.body?.init_point});
        // ✅ Usar el sandbox_init_point para modo de prueba
        //const sandboxUrl = result.sandbox_init_point || result.body?.sandbox_init_point;
        //res.json({ init_point: sandboxUrl });


    } catch (error) {
    console.error('Error al crear preferencia:', error);

    // Si Mercado Pago devuelve un objeto con mensaje
    if (error.response) {
        console.error('Detalles del error:', error.response);
    }
    if (error.message) {
        console.error('Mensaje de error:', error.message);
    }

    res.status(500).json({ 
        error: 'No se pudo crear la preferencia de pago',
        detalles: error.message || error.response
    });
    }
});


// ✅ GET /api/compras/mis-compras
router.get("/mis-compras", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const {rows} = await pool.query(
      `
      SELECT 
        pagos.payment_id,
        pagos.rutina_id,
        rutinas.nombre,
        rutinas.pdf_path,
        pagos.fecha_pago
      FROM pagos
      JOIN rutinas ON pagos.rutina_id = rutinas.id
      WHERE pagos.usuario_id = $1
      ORDER BY pagos.fecha_pago DESC
      `,
      [usuarioId]
    );

    res.json(rows);

  } catch (error) {
    console.error("❌ Error mis compras:", error.message);
    res.status(500).json({ error: "Error al obtener compras" });
  }
});


// En vez de pasar el PDF directo, pasamos rutinaId.
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/descargar/:rutinaId", verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const rutinaId = req.params.rutinaId;

    console.log("usuarioId:", usuarioId);
    console.log("rutinaId:", rutinaId);

    // 1️⃣ Verificar compra real
    const {rows} = await pool.query(
      `
      SELECT rutinas.pdf_path
      FROM pagos
      JOIN rutinas ON pagos.rutina_id = rutinas.id
      WHERE pagos.usuario_id = $1 
      AND pagos.rutina_id = $2
      AND pagos.estado = 'approved'
      `,
      [usuarioId, rutinaId]
    );

    if (!rows.length) {
      return res.status(403).json({
        error: "No tienes permiso para descargar esta rutina"
      });
    }

    const pdfPath = rows[0].pdf_path;

    // 2️⃣ Crear link firmado (expira)
    const { data, error } = await supabase.storage
      .from("rutinas-pdf")
      .createSignedUrl(pdfPath, 60); // 60 segundos

    if (error) throw error;

    res.json({ url: data.signedUrl });

  } catch (error) {
    console.error("❌ Error descarga:", error.message);
    res.status(500).json({ error: "No se pudo generar descarga" });
  }
});




module.exports = router;


