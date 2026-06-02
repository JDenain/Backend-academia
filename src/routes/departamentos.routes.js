import { Router } from 'express';
import { getDepartamentos, createDepartamento, updateDepartamento, deleteDepartamento } from '../controllers/departamentos.controllers.js';
import { authenticateToken, authorize } from '../controllers/auth.middleware.js';

const router = Router();

// Todos los usuarios autenticados pueden ver los departamentos
router.get('/api/departamentos', authenticateToken, getDepartamentos);

// Solo el Administrador y root pueden crear, modificar o eliminar departamentos
router.post('/api/departamentos', authenticateToken, authorize('Administrador', 'root'), createDepartamento);
router.put('/api/departamentos/:id', authenticateToken, authorize('Administrador', 'root'), updateDepartamento);
router.delete('/api/departamentos/:id', authenticateToken, authorize('Administrador', 'root'), deleteDepartamento);

export default router;
