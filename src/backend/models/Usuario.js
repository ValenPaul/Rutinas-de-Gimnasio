const db = require('../db'); // tu conexión MySQL

const Usuario = {
  crear: async (nombre, email, passwordHash) => {
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, email, contraseña) VALUES (?, ?, ?)',
      [nombre, email, passwordHash]
    );
    return result.insertId;
  },

  buscarPorEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  },
};

module.exports = Usuario;
