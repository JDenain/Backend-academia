import rateLimit from 'express-rate-limit';
import {body, validationResult} from 'express-validator';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 solicitudes por IP
  message: { error: 'Demasiados intentos, por favor intente más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const validateRegister = [
  body('username')
    .trim().isLength({ min: 3, max: 100 })
    .withMessage('El nombre de usuario debe tener entre 3 y 100 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Debe contener mayusculas, minusculas y números'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Debe contener mayúscula, minúscula y número'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateLogin = [
  body('username').notEmpty().withMessage('El nombre de usuario es requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

