const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    // Normalizar el id del usuario: distintos controladores leen req.user.id o req.user.userId
    const uid = req.user.id ?? req.user.userId;
    req.user.id = uid;
    req.user.userId = uid;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Restringe a administradores globales (esAdmin === true).
const soloAdmin = (req, res, next) => {
  if (!req.user?.esAdmin) {
    return res.status(403).json({ error: 'Solo el administrador global puede realizar esta acción' });
  }
  next();
};

module.exports = { authenticate, soloAdmin };
