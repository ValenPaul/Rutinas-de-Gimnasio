const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

require('dotenv').config();

console.log("Access token usado:", process.env.MP_ACCESS_TOKEN ? "OK" : "NO CARGADO");


// Crear la configuración con tu Access Token
const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

// Endpoint para crear una preferencia de pago
router.post('/crear-preferencia', async (req, res) => {
    try {
        const { titulo, precio, cantidad } = req.body; // datos desde frontend

         // Tomamos el origin que llega desde el frontend
        const origin = req.headers.origin || process.env.ALLOWED_ORIGINS || "https://rutinas-de-gimnasio.vercel.app";

        console.log("🔗 Origin detectado para back_urls:", origin);

        const preference = new Preference(mp);

        const result = await preference.create({
            body: {
                items: [
                    {
                        title: titulo || 'Compra en mi tienda',
                        quantity: Number(cantidad) || 1,
                        unit_price: Number(precio) || 1000,
                        currency_id: 'ARS'
                    }
                ],

                back_urls: {
                    success: `${origin}/success.html`,
                    failure: `${origin}/failure.html`,
                    pending: `${origin}/pending.html`
                },
                auto_return: 'approved'
            }
        });

        // Responder con el link para pagar
        res.json({ init_point: result.init_point || result.body?.init_point});
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

module.exports = router;


