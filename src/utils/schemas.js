const { z } = require('zod');

const ESTADOS_TAREA = ['PENDIENTE', 'EN_PROGRESO', 'EN_REVISION', 'FINALIZADO'];
const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];
const ESTADOS_PROYECTO = ['ACTIVO', 'COMPLETADO', 'ARCHIVADO'];
const ESTADOS_SPRINT = ['PLANIFICADO', 'ACTIVO', 'COMPLETADO'];

const fechaOpcional = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;      // no se envió → no tocar el campo
    if (v === null || v === '') return null;    // se envió vacío → limpiar el campo
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const idOpcional = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;      // no se envió → no tocar el campo
    if (v === null || v === '') return null;    // se envió vacío → limpiar los campos
    const n = parseInt(v);
    return Number.isNaN(n) ? null : n;
  });

const registerSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  email: z.string().trim().toLowerCase().email('Email no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const createTaskSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(200),
  descripcion: z.string().trim().max(5000).optional().nullable(),
  estado: z.enum(ESTADOS_TAREA).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  proyectoId: z.union([z.number(), z.string()]).transform((v) => parseInt(v)),
  asignadoAId: idOpcional,
  sprintId: idOpcional,
  fechaVencimiento: fechaOpcional,
});

const updateTaskSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200).optional(),
    descripcion: z.string().trim().max(5000).optional().nullable(),
    estado: z.enum(ESTADOS_TAREA).optional(),
    prioridad: z.enum(PRIORIDADES).optional(),
    asignadoAId: idOpcional,
    sprintId: idOpcional,
    orden: z.number().int().optional(),
    fechaVencimiento: fechaOpcional,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos que actualizar' });

const createProjectSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  descripcion: z.string().trim().max(2000).optional().nullable(),
  equipoId: z.union([z.number(), z.string()]).transform((v) => parseInt(v)),
});

const updateProjectSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120).optional(),
    descripcion: z.string().trim().max(2000).optional().nullable(),
    estado: z.enum(ESTADOS_PROYECTO).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos que actualizar' });

const createSprintSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  objetivo: z.string().trim().max(1000).optional().nullable(),
  estado: z.enum(ESTADOS_SPRINT).optional(),
  fechaInicio: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  fechaFin: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  proyectoId: z.union([z.number(), z.string()]).transform((v) => parseInt(v)),
});

const updateSprintSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120).optional(),
    objetivo: z.string().trim().max(1000).optional().nullable(),
    estado: z.enum(ESTADOS_SPRINT).optional(),
    fechaInicio: fechaOpcional,
    fechaFin: fechaOpcional,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos que actualizar' });

const createSubtareaSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es obligatorio').max(200),
  completada: z.boolean().optional(),
  tareaId: z.union([z.number(), z.string()]).transform((v) => parseInt(v)),
});

const updateSubtareaSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200).optional(),
    completada: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos que actualizar' });

const createComentarioSchema = z.object({
  contenido: z.string().trim().min(1, 'El comentario no puede estar vacío').max(3000),
  tareaId: z.union([z.number(), z.string()]).transform((v) => parseInt(v)),
});

const createEquipoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  descripcion: z.string().trim().max(2000).optional().nullable(),
});

const invitarMiembroSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email no válido'),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
  createProjectSchema,
  updateProjectSchema,
  createSprintSchema,
  updateSprintSchema,
  createSubtareaSchema,
  updateSubtareaSchema,
  createComentarioSchema,
  createEquipoSchema,
  invitarMiembroSchema,
};
