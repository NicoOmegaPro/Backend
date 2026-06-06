// Middleware genérico de validación con zod.
// Uso: router.post('/', validate(miSchema), controlador)
// Reemplaza req.body por los datos ya parseados/saneados.
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const detalles = result.error.issues.map((i) => ({
      campo: i.path.join('.') || '(raíz)',
      mensaje: i.message,
    }));
    return res.status(400).json({ error: 'Datos no válidos', detalles });
  }
  req.body = result.data;
  next();
};

module.exports = { validate };
