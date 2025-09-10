//config principal der servidor
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); //para que express sirva los archivos estaticos


const app = express();
dotenv.config();

// Lista blanca de orígenes permitidos desde .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json()); // Para leer JSON del frontend

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));


// Rutas
const usuariosRoutes = require('./routes/usuarios');
const rutinasRoutes = require('./routes/rutinas');
const comprasRoutes = require('./routes/compras');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/compras', comprasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

//exportar para vercel
module.exports = app;
