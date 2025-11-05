//config principal der servidor
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); //para que express sirva los archivos estaticos
const webhookRoutes = require('../../api/webhook');
const app = express();
dotenv.config({ path: path.resolve(__dirname, '.env') });  // forzar para que node lea env

app.use(express.json());
app.use('/api/webhook', webhookRoutes);

// Lista blanca de orígenes permitidos desde .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

console.log("Allowed origins cargados:", allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log("🌍 Origin recibido:", origin);
    if (!origin) return callback(null, true); // Postman, curl
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Bloqueado por CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Manejar preflight OPTIONS globalmente
app.options('*', cors());


app.use(express.json()); // Para leer JSON del frontend

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, '../public')));


// Rutas
const usuariosRoutes = require('./routes/usuarios');
const rutinasRoutes = require('./routes/rutinas');
const comprasRoutes = require('./routes/compras');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api', comprasRoutes);

/*    ----- En vercel no usar app.listen, solo para correr localmente ---------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
*/





//exportar para vercel
module.exports = app;
