const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, password, nombre, rolId } = req.body;

    // Check if user exists
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        rolId: rolId || 4 // Por defecto TRABAJADOR asumiendo que 4 es su ID, ajusta según tu base de datos
      }
    });

    res.status(201).json({ message: 'Usuario registrado correctamente', userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, rolId: user.rolId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el login' });
  }
};

module.exports = {
  register,
  login
};
