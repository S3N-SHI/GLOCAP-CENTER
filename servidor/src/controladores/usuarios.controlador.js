import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { usuarioPublico } from './auth.controlador.js';

const esquemaCambioDeRol = z.object({
  rol: z.enum(['ESTUDIANTE', 'ADMIN']),
});

export async function listarUsuarios(req, res) {
  const usuarios = await prisma.usuario.findMany({
    orderBy: { creadoEn: 'desc' },
  });
  return res.json({ usuarios: usuarios.map(usuarioPublico) });
}

export async function cambiarRol(req, res) {
  const datos = esquemaCambioDeRol.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: 'Rol inválido. Usá ESTUDIANTE o ADMIN.' });
  }

  const { id } = req.params;

  if (id === req.usuario.id && datos.data.rol === 'ESTUDIANTE') {
    return res.status(400).json({ error: 'No podés quitarte el rol de admin a vos mismo.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: { rol: datos.data.rol },
  });

  return res.json({
    mensaje: `${usuario.nombre} ahora tiene el rol ${datos.data.rol}.`,
    usuario: usuarioPublico(usuarioActualizado),
  });
}