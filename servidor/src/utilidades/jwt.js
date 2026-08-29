import jwt from 'jsonwebtoken';

const SECRETO = process.env.JWT_SECRETO;

export function generarToken(usuario) {
  // Solo va adentro del token lo mínimo necesario para identificar
  // y autorizar. Nunca la contraseña, ni siquiera el hash.
  return jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
    SECRETO,
    { expiresIn: '7d' }
  );
}

export function verificarToken(token) {
  return jwt.verify(token, SECRETO);
}
