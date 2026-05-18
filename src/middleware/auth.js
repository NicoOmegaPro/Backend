const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  const ROLES = { ADMINISTRADOR: 1, JEFE_PROYECTO: 2, SUPERVISOR: 3, TRABAJADOR: 4 };
  const allowedIds = roles.map(r => ROLES[r]).filter(Boolean);
  if (!allowedIds.includes(req.user.rolId)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};

module.exports = { authenticate, authorize };
