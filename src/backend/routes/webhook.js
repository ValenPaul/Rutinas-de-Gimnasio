const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const axios = require("axios");
const pool = require("../db");
const { MercadoPagoConfig, Payment } = require("mercadopago");
require("dotenv").config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


router.post("/", async (req, res) => {
  console.log("🔔 Webhook recibido");
  console.log("Endpoint ejecutado");

  const { topic, resource, type, data } = req.body;
  let paymentId = null;

  if (topic === "payment" && resource) paymentId = resource;
  if (type === "payment" && data?.id) paymentId = data.id;

  if (!paymentId) return res.sendStatus(200);

  try {
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    console.log("💰 Payment recibido:", payment.id);
    console.log("💰 Status:", payment.status);

    if (payment.status !== "approved") {
      console.log("⌛ Pago no aprobado:", payment.status);
      return res.sendStatus(200);
    }

    const reference = payment.external_reference
      ? JSON.parse(payment.external_reference)
      : null;

    const usuarioId = reference?.usuario_id;
    const rutinaNombre = reference?.rutina;

    if (!usuarioId || !rutinaNombre) {
      throw new Error("Referencia incompleta");
    }

    // 🔎 Buscar rutina
    const rutinaResult = await pool.query(
      `SELECT id, pdf_path FROM rutinas WHERE nombre = $1`,
      [rutinaNombre]
    );

    if (!rutinaResult.rows.length)
      throw new Error("Rutina no encontrada");

    const rutinaId = rutinaResult.rows[0].id;
    const pdfPath = rutinaResult.rows[0].pdf_path;


    const insertResult = await pool.query(
    `INSERT INTO pagos 
    (payment_id, usuario_id, rutina_id, estado, monto, fecha_pago, email_enviado, error_email)
    VALUES ($1, $2, $3, $4, $5, $6, false, NULL)
    ON CONFLICT (payment_id) DO NOTHING
    RETURNING payment_id`,
    [
      paymentId,
      usuarioId,
      rutinaId,
      payment.status,
      payment.transaction_amount,
      payment.date_approved
    ]
  );

    // 🔁 Si no insertó nada → otro webhook ya lo procesó
    if (!insertResult.rows.length) {
      console.log("🔁 Pago ya procesado:", paymentId);
      return res.sendStatus(200);
    }

    console.log("📝 Pago guardado y procesado:", paymentId);

    // 👉 SOLO el proceso que insertó envía el mail
    console.log("📩 Enviando mail:", paymentId);


    try {
      await enviarMail(payment, pdfPath, rutinaId);

      await pool.query(
        `UPDATE pagos 
         SET email_enviado = true,
             error_email = NULL
         WHERE payment_id = $1`,
        [paymentId]
      );

      console.log("✅ Email enviado correctamente:", paymentId);

    } catch (mailError) {
      console.error("⚠️ Falló el envío de mail:", mailError.message);

      await pool.query(
        `UPDATE pagos 
         SET error_email = $1
         WHERE payment_id = $2`,
        [mailError.message, paymentId]
      );

      console.log("📌 Mail pendiente para reintento:", paymentId);
    }

    return res.sendStatus(200);

  } catch (error) {
    console.error("❌ Error webhook:", error.message);
    return res.sendStatus(200);
  }
});







// 🧩 Función para enviar el mail
async function enviarMail(payment, pdfPath, rutinaId) {

  try {

    const titulo = payment.additional_info?.items?.[0]?.title;
    if (!titulo) throw new Error("No se pudo obtener el título de la rutina");

    console.log("🏋️ Rutina comprada:", titulo);

    const precioPagado = Number(payment.transaction_amount);
    const result = await pool.query(
    `SELECT precio, pdf_path FROM rutinas WHERE id = $1`,
    [rutinaId]
    );

    if (result.rows.length === 0) {
      throw new Error("Rutina no válida");
    }

    const precioEsperado = Number(result.rows[0].precio);

    if (precioPagado !== precioEsperado) {
      throw new Error(`Precio inválido (${precioPagado} ≠ ${precioEsperado})`);
    }

    const nombrePdf = result.rows[0].pdf_path;
    if (!nombrePdf) throw new Error("PDF no encontrado");

    console.log("📧 Enviando mail para pago:", payment.id);

    const { data, error } = await supabase.storage
      .from("rutinas-pdf")
      .download(nombrePdf);

    if (error) throw error;

    const pdfBuffer = Buffer.from(await data.arrayBuffer());

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailComprador =
      payment.payer?.email;

    await transporter.sendMail({
      from: `"Rutinas de Gimnasio" <${process.env.EMAIL_USER}>`,
      to: emailComprador,
      subject: "Tu rutina personalizada 💪",
      html: `
        <h2>¡Gracias por tu compra!</h2>
        <p>Adjuntamos tu rutina en formato PDF, junto a un video explicativo de ¿Como utilizar el cuaderno?</p>
        <h3>Video explicativo</h3>
        <a href="https://youtube.com/shorts/QRo9z67pWDQ?si=i19AD7uUVohW4J22">¿Como utilizar el cuaderno?</a>
      `,
      attachments: [
        {
          filename: nombrePdf,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log("✅ Email enviado correctamente");

  } catch (error) {
  console.error("❌ Error enviando mail:", error.message);
  throw error; // 🔥 IMPORTANTE
  }

}


module.exports = router;



