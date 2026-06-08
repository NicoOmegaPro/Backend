require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const projectsRoutes = require('./routes/projects.routes');
const tasksRoutes = require('./routes/tasks.routes');
const equiposRoutes = require('./routes/equipos.routes');
const sprintsRoutes = require('./routes/sprints.routes');
const subtareasRoutes = require('./routes/subtareas.routes');
const comentariosRoutes = require('./routes/comentarios.routes');
const adjuntosRoutes = require('./routes/adjuntos.routes');
const etiquetasRoutes = require('./routes/etiquetas.routes');
const notificacionesRoutes = require('./routes/notificaciones.routes');
const historialRoutes = require('./routes/historial.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');
const { authenticate } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => res.redirect('/admin/users'));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/projects', authenticate, projectsRoutes);
app.use('/api/tasks', authenticate, tasksRoutes);
app.use('/api/equipos', authenticate, equiposRoutes);
app.use('/api/sprints', authenticate, sprintsRoutes);
app.use('/api/subtareas', authenticate, subtareasRoutes);
app.use('/api/comentarios', authenticate, comentariosRoutes);
app.use('/api/adjuntos', authenticate, adjuntosRoutes);
app.use('/api/etiquetas', authenticate, etiquetasRoutes);
app.use('/api/notificaciones', authenticate, notificacionesRoutes);
app.use('/api/historial', authenticate, historialRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
