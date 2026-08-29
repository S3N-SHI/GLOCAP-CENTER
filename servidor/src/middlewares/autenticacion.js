import { verificarToken } from '../utilidades/jwt.js';

/**
 * Exige un JWT válido en el header Authorization: Bearer <token>.
 * Si es válido, deja los datos del usuario en req.usuario.
 */
export function requiereSesion(req, res, next) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Necesitás iniciar sesión.' });
  }

  const token = encabezado.slice('Bearer '.length);

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o vencida.' });
  }
}

/**
 * Va SIEMPRE después de requiereSesion. Corta el paso si el usuario
 * autenticado no tiene rol ADMIN. Esta es la única puerta real hacia
 * las acciones de admin — el frontend puede ocultar botones, pero
 * es este middleware el que efectivamente lo impide.
 */
export function requiereAdmin(req, res, next) {
  if (req.usuario?.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Esta acción es exclusiva de administradores.' });
  }
  next();
}
