// public/js/app.js - Motor principal de la SPA

// Estado global de la aplicación
const AppState = {
    currentView: null,
    cache: {}, // Para guardar vistas HTML ya cargadas
};

// Referencias del DOM
const appContainer = document.getElementById('app-container');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('.nav-link');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

// ==========================================
// 🚀 ROUTER Y RENDERIZADO DE VISTAS (Como un Controller de Laravel devolviendo views)
// ==========================================

async function loadView() {
    let hash = window.location.hash.replace('#', '') || 'users';

    // Activar link correcto en el sidebar
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${hash}`) {
            link.classList.add('active');
            pageTitle.textContent = link.getAttribute('data-title');
        }
    });

    // Mostrar loader
    appContainer.innerHTML = '<div class="loading-state">Cargando interfaz...</div>';

    try {
        // Cargar el HTML de la vista desde la carpeta views/
        if (!AppState.cache[hash]) {
            const response = await fetch(`/views/${hash}.html`);
            if (!response.ok) throw new Error('Vista no encontrada');
            AppState.cache[hash] = await response.text();
        }

        // Inyectar HTML en el DOM (Como un @yield de Blade)
        appContainer.innerHTML = AppState.cache[hash];

        // Ejecutar el controlador específico de cada vista
        if (hash === 'users') await UsersController.init();
        if (hash === 'roles') await RolesController.init();
        if (hash === 'tasks') await TasksController.init();

    } catch (error) {
        console.error("Error al cargar la vista:", error);
        appContainer.innerHTML = `<div class="loading-state" style="color:var(--danger)">Error al cargar la sección.</div>`;
    }
}

// Escuchar cambios en la URL
window.addEventListener('hashchange', loadView);
document.addEventListener('DOMContentLoaded', loadView);


// ==========================================
// 🛠️ SISTEMA DE MODALES REUTILIZABLE
// ==========================================
const ModalSystem = {
    open: (htmlContent) => {
        modalContent.innerHTML = htmlContent;
        modalOverlay.classList.add('active');
    },
    close: () => {
        modalOverlay.classList.remove('active');
    }
};

// Cerrar modal al hacer clic fuera
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) ModalSystem.close();
});

// ==========================================
// 👥 CONTROLADOR DE USUARIOS
// ==========================================
const UsersController = {
    users: [],
    currentPage: 1,
    itemsPerPage: 10,

    async init() {
        document.getElementById('btn-create-user').addEventListener('click', () => this.openFormModal());
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '<tr><td colspan="5" class="loading-state">Cargando usuarios...</td></tr>';

        try {
            const res = await fetch('/api/users');
            this.users = await res.json();
            this.renderTable();
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-state">Error cargando usuarios</td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('users-tbody');
        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-state">No hay usuarios</td></tr>';
            const paginationContainer = document.getElementById('users-pagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedUsers = this.users.slice(start, end);

        tbody.innerHTML = paginatedUsers.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${u.nombre}</td>
                <td>${u.email}</td>
                <td><span style="color:var(--success)">${u.rol ? u.rol.nombre : 'USER'}</span></td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="UsersController.openFormModal(${u.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="UsersController.delete(${u.id})">Borrar</button>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    },

    renderPagination() {
        const container = document.getElementById('users-pagination');
        if (!container) return;
        const totalPages = Math.ceil(this.users.length / this.itemsPerPage);

        container.innerHTML = `
            <div class="pagination-info">Página <b>${this.currentPage}</b> de ${totalPages} (Total: ${this.users.length})</div>
            <div class="pagination-controls">
                <button class="btn btn-secondary btn-small" onclick="UsersController.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <button class="btn btn-secondary btn-small" onclick="UsersController.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
            </div>
        `;
    },

    changePage(page) {
        const totalPages = Math.ceil(this.users.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderTable();
    },

    openFormModal(id = null) {
        const user = id ? this.users.find(u => u.id === id) : null;

        // Petición de roles para el select (Simplificada por ahora)
        const formHtml = `
            <div class="modal-header">
                <h3>${user ? 'Editar Usuario' : 'Crear Usuario'}</h3>
                <button class="modal-close" onclick="ModalSystem.close()">×</button>
            </div>
            <form id="user-form" onsubmit="event.preventDefault(); UsersController.save(${id})">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="u-nombre" class="form-control" value="${user?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="u-email" class="form-control" value="${user?.email || ''}" ${user ? 'readonly' : 'required'}>
                    </div>
                    ${!user ? `
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" id="u-pwd" class="form-control" required>
                    </div>` : ''}
                    <div class="form-group">
                        <label>ID del Rol (1=Admin, 4=Trabajador)</label>
                        <input type="number" id="u-rol" class="form-control" value="${user?.rolId || 4}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="ModalSystem.close()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;
        ModalSystem.open(formHtml);
    },

    async save(id) {
        const payload = {
            nombre: document.getElementById('u-nombre').value,
            rolId: parseInt(document.getElementById('u-rol').value)
        };

        let url = '/api/users';
        let method = 'POST';

        if (id) { // Actualizar
            url = `/api/users/${id}`;
            method = 'PUT';
        } else { // Crear
            url = '/api/auth/register';
            payload.email = document.getElementById('u-email').value;
            payload.password = document.getElementById('u-pwd').value;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Error al guardar');

            ModalSystem.close();
            await this.loadData();
        } catch (e) {
            alert(e.message);
        }
    },

    async delete(id) {
        if (!confirm('¿Estás seguro de borrar este usuario?')) return;
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            await this.loadData();
        } catch (e) { alert('Error al borrar'); }
    }
};

// ==========================================
// 🛡️ CONTROLADOR DE ROLES
// ==========================================
const RolesController = {
    roles: [],

    async init() {
        document.getElementById('btn-create-rol').addEventListener('click', () => this.openFormModal());
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('roles-tbody');
        tbody.innerHTML = '<tr><td colspan="4" class="loading-state">Cargando roles...</td></tr>';

        try {
            const res = await fetch('/api/roles');
            this.roles = await res.json();
            this.renderTable();
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading-state">Error cargando roles</td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('roles-tbody');
        if (this.roles.length === 0) return tbody.innerHTML = '<tr><td colspan="4">No hay roles</td></tr>';

        tbody.innerHTML = this.roles.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td style="font-weight:600; color:var(--primary)">${r.nombre}</td>
                <td>${r.descripcion || '-'}</td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="RolesController.openFormModal(${r.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="RolesController.delete(${r.id})">Borrar</button>
                </td>
            </tr>
        `).join('');
    },

    openFormModal(id = null) {
        const role = id ? this.roles.find(r => r.id === id) : null;

        const formHtml = `
            <div class="modal-header">
                <h3>${role ? 'Editar Rol' : 'Crear Rol'}</h3>
                <button class="modal-close" onclick="ModalSystem.close()">×</button>
            </div>
            <form onsubmit="event.preventDefault(); RolesController.save(${id})">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nombre del Rol (Mayúsculas sin espacios)</label>
                        <input type="text" id="r-nombre" class="form-control" value="${role?.nombre || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Descripción</label>
                        <input type="text" id="r-desc" class="form-control" value="${role?.descripcion || ''}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="ModalSystem.close()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;
        ModalSystem.open(formHtml);
    },

    async save(id) {
        const payload = {
            nombre: document.getElementById('r-nombre').value.toUpperCase(),
            descripcion: document.getElementById('r-desc').value
        };

        const url = id ? `/api/roles/${id}` : '/api/roles';
        const method = id ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            ModalSystem.close();
            await this.loadData();
        } catch (e) { alert('Error al guardar el rol'); }
    },

    async delete(id) {
        if (!confirm('¿Seguro? Si hay usuarios con este rol dará error.')) return;
        try {
            const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            await this.loadData();
        } catch (e) { alert('No se pudo borrar. Puede estar asignado a usuarios.'); }
    }
};

// ==========================================
// 📋 CONTROLADOR DE TAREAS
// ==========================================
const TasksController = {
    tasks: [],
    currentPage: 1,
    itemsPerPage: 10,

    async init() {
        document.getElementById('btn-create-task').addEventListener('click', () => this.openFormModal());
        await this.loadData();
    },

    async loadData() {
        const tbody = document.getElementById('tasks-tbody');
        tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Cargando tareas...</td></tr>';

        try {
            const res = await fetch('/api/tasks');
            this.tasks = await res.json();
            this.renderTable();
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Error cargando tareas</td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('tasks-tbody');
        if (this.tasks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading-state">No hay tareas</td></tr>';
            const paginationContainer = document.getElementById('tasks-pagination');
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedTasks = this.tasks.slice(start, end);

        tbody.innerHTML = paginatedTasks.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td>${t.titulo}</td>
                <td><span style="color:#eab308">${t.estado}</span></td>
                <td><span style="color:#ef4444">${t.prioridad}</span></td>
                <td>${t.proyectoId}</td>
                <td>
                    <button class="btn btn-primary btn-small" onclick="TasksController.openFormModal(${t.id})">Editar</button>
                    <button class="btn btn-danger btn-small" onclick="TasksController.delete(${t.id})">Borrar</button>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    },

    renderPagination() {
        const container = document.getElementById('tasks-pagination');
        if (!container) return;
        const totalPages = Math.ceil(this.tasks.length / this.itemsPerPage);

        container.innerHTML = `
            <div class="pagination-info">Página <b>${this.currentPage}</b> de ${totalPages} (Total: ${this.tasks.length})</div>
            <div class="pagination-controls">
                <button class="btn btn-secondary btn-small" onclick="TasksController.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <button class="btn btn-secondary btn-small" onclick="TasksController.changePage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
            </div>
        `;
    },

    changePage(page) {
        const totalPages = Math.ceil(this.tasks.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderTable();
    },

    openFormModal(id = null) {
        const task = id ? this.tasks.find(t => t.id === id) : null;

        const formHtml = `
            <div class="modal-header">
                <h3>${task ? 'Editar Tarea' : 'Crear Tarea'}</h3>
                <button class="modal-close" onclick="ModalSystem.close()">×</button>
            </div>
            <form onsubmit="event.preventDefault(); TasksController.save(${id})">
                <div class="modal-body">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" id="t-titulo" class="form-control" value="${task?.titulo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Estado (PENDIENTE, EN_PROGRESO, FINALIZADO)</label>
                        <input type="text" id="t-estado" class="form-control" value="${task?.estado || 'PENDIENTE'}" required>
                    </div>
                    <div class="form-group">
                        <label>Prioridad (BAJA, MEDIA, ALTA, URGENTE)</label>
                        <input type="text" id="t-prioridad" class="form-control" value="${task?.prioridad || 'MEDIA'}" required>
                    </div>
                    <div class="form-group">
                        <label>ID del Proyecto</label>
                        <input type="number" id="t-proyecto" class="form-control" value="${task?.proyectoId || 1}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="ModalSystem.close()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                </div>
            </form>
        `;
        ModalSystem.open(formHtml);
    },

    async save(id) {
        const payload = {
            titulo: document.getElementById('t-titulo').value,
            estado: document.getElementById('t-estado').value.toUpperCase(),
            prioridad: document.getElementById('t-prioridad').value.toUpperCase(),
            proyectoId: parseInt(document.getElementById('t-proyecto').value)
        };

        const url = id ? `/api/tasks/${id}` : '/api/tasks';
        const method = id ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            ModalSystem.close();
            await this.loadData();
        } catch (e) { alert('Error al guardar la tarea'); }
    },

    async delete(id) {
        if (!confirm('¿Borrar tarea?')) return;
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
            await this.loadData();
        } catch (e) { alert('Error al borrar'); }
    }
};
