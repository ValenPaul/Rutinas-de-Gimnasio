const pool = require("../db");
const enviarMail = require("../routes/webhook"); // donde esté la función

async function reenviarPendientes() {
  try {
    const {rows} = await pool.query(
      `SELECT * FROM pagos WHERE email_enviado = false`
    );

    if (rows.length === 0) {
      console.log("📭 No hay mails pendientes");
      return;
    }

    console.log("🔁 Reintentando mails pendientes:", rows.length);

    for (let pago of rows) {
      try {
        console.log("📩 Reintentando:", pago.payment_id);

        await enviarMail(pago);

        await pool.query(
          `UPDATE pagos 
           SET email_enviado = true,
               error_email = NULL
           WHERE payment_id = $1`,
          [pago.payment_id]
        );

        console.log("✅ Mail reenviado:", pago.payment_id);

      } catch (err) {
        console.log("❌ Sigue fallando:", err.message);

        await pool.query(
          `UPDATE pagos 
           SET error_email = $1
           WHERE payment_id = $2`,
          [err.message, pago.payment_id]
        );
      }
    }

  } catch (error) {
    console.error("🔥 Error general en reenvío:", error.message);
  }
}

module.exports = reenviarPendientes;
