function soloAdmin(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.usuario.rol !== "admin") {
    return res.status(403).json({ error: "Acceso solo para administradores" });
  }

  next();
}

module.exports = soloAdmin;
