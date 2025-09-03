//config principal der servidor
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); //para que express sirva los archivos estaticos


const app = express();
dotenv.config();

app.use(cors());
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



