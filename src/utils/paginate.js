// Helper de paginación reutilizable para listados (panel /admin EJS y API REST).
const DEFAULT_LIMIT = 15;

// Lee ?page= y ?limit= de la query y devuelve los parámetros para Prisma.
function getPageParams(req, { defaultLimit = DEFAULT_LIMIT, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

// Construye el objeto meta { page, limit, total, pages } a partir del total.
function buildMeta({ page, limit, total }) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { getPageParams, buildMeta, DEFAULT_LIMIT };
