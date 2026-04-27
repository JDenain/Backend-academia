import { verifyAccessToken } from "./auth.controllers.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const decoded = verifyAccessToken(token, process.env.JWT_ACCESS_SECRET);
  if (!decoded) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }

  req.user = decoded;
  next();
}

export const authorize = (...allowedRoles) => {
  return (req, res, next) =>{
    if (!req.user) return res.sendStatus(401);
    if (!allowedRoles.includes(req.user.rol)){
      return res.status(403).json({ message: 'Acceso denegado: No tienes los permisos necesarios.' });
    }
    next();
  };
};

