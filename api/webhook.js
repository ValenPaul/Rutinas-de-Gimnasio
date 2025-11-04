import nodemailer from "nodemailer";
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  console.log("✅ Webhook activado");

  try {
    const data = req.body;

    if (data.type !== "payment") return res.status(200).send("No es un pago");

    // Obtener detalles del pago
    const paymentId = data.data.id;
    const response = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = response.data;

    if (payment.status === "approved") {
      console.log("💸 Pago aprobado:", payment);

      // Enviar el mail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const emailComprador = "valenpaul02@gmail.com";

      await transporter.sendMail({
        from: `"Rutinas de Gimnasio" <${process.env.EMAIL_USER}>`,
        to: emailComprador,
        subject: "Tu rutina personalizada 💪",
        html: `
          <h2>¡Gracias por tu compra!</h2>
          <p>Adjuntamos tu rutina en formato PDF 💥</p>
          <p>— El equipo de Rutinas de Gimnasio</p>
        `,
        attachments: [
          {
            filename: "rutinaFuerza.pdf",
            path: "./src/backend/archivos/rutinaFuerza.pdf",
          },
        ],
      });

      console.log("📩 Email enviado a:", emailComprador);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Error en webhook:", error.message);
    res.status(500).send("Error interno del servidor");
  }
}

