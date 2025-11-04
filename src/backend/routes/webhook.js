const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// ✅ Configurar el transporter para enviar mails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // tu cuenta Gmail
        pass: process.env.EMAIL_PASS  // contraseña de app (no tu clave normal)
    }
});

// ✅ Endpoint para recibir notificaciones de Mercado Pago
router.post('/', async (req, res) => {
    console.log("✅ Webhook activado");
    try {
        const data = req.body;

        if (data.type !== 'payment') return res.status(200).send('No es un pago');

        // Obtener detalles del pago desde MP
        const paymentId = data.data.id;
        const response = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            }
        );

        const payment = response.data;

        if (payment.status === 'approved') {
            console.log('💸 Pago aprobado:', payment);

            // ⚙️ Datos del comprador (si están disponibles)
            const emailComprador = 'valenpaul02@gmail.com';//payment.payer.email || 'sin_email@desconocido.com';

            // ✅ Enviar la rutina
            await transporter.sendMail({
                from: `"Rutinas de Gimnasio" <${process.env.EMAIL_USER}>`,
                to: emailComprador,
                subject: "Tu rutina personalizada 💪",
                html: `
                    <h2>¡Gracias por tu compra!</h2>
                    <p>Adjuntamos tu rutina en formato PDF. Esperamos que te sea útil 💥</p>
                    <p>— El equipo de Rutinas de Gimnasio</p>
                `,
                attachments: [
                    {
                        filename: 'rutinaFuerza.pdf',
                        path: './src/backend/archivos/rutinaFuerza.pdf' // archivo local o generado
                    }
                ]
            });

            console.log("📩 Email enviado a:", emailComprador);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error en webhook:", error.message);
        res.sendStatus(500);
    }
});

module.exports = router;
