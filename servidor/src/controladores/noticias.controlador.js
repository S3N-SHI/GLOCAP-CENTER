import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { subirImagenDeNoticia, borrarImagenDeNoticia } from '../servicios/almacenamiento.servicio.js';
import { enviarNotificacionNoticia } from '../servicios/correo.servicio.js';

const esquemaCrear = z.object({
  titulo: z.string().trim().min(3, 'El título es muy corto.'),
  contenido: z.string().trim().min(10, 'El contenido es muy corto.'),
  fechaExpiracion: z.string().trim().optional().or(z.literal('')),
});

const esquemaEditar = esquemaCrear.partial();

function noticiaPublica(noticia) {
  return {
    id: noticia.id,
    titulo: noticia.titulo,
    contenido: noticia.contenido,
    imagenUrl: noticia.imagenUrl,
    autor: noticia.autor?.nombre ?? null,
    creadoEn: noticia.creadoEn,
  };
}

function noticiaAdmin(noticia) {
  return {
    ...noticiaPublica(noticia),
    fechaExpiracion: noticia.fechaExpiracion,
  };
}

function parsearFechaExpiracion(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error('Fecha de expiración inválida.');
  }
  return fecha;
}

export async function listarNoticiasPublicas(req, res) {
  const noticias = await prisma.noticia.findMany({
    where: {
      OR: [{ fechaExpiracion: null }, { fechaExpiracion: { gt: new Date() } }],
    },
    include: { autor: true },
    orderBy: { creadoEn: 'desc' },
  });
  return res.json({ noticias: noticias.map(noticiaPublica) });
}

export async function listarNoticiasAdmin(req, res) {
  const noticias = await prisma.noticia.findMany({
    include: { autor: true },
    orderBy: { creadoEn: 'desc' },
  });
  return res.json({ noticias: noticias.map(noticiaAdmin) });
}

export async function crearNoticia(req, res) {
  const datos = esquemaCrear.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: datos.error.issues[0].message });
  }

  let fechaExpiracion;
  try {
    fechaExpiracion = parsearFechaExpiracion(datos.data.fechaExpiracion);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  let imagenUrl = null;
  if (req.file) {
    try {
      imagenUrl = await subirImagenDeNoticia(req.file);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  const noticia = await prisma.noticia.create({
    data: {
      titulo: datos.data.titulo,
      contenido: datos.data.contenido,
      fechaExpiracion,
      imagenUrl,
      autorId: req.usuario.id,
    },
    include: { autor: true },
  });

  res.status(201).json({
    mensaje: 'Noticia publicada.',
    noticia: noticiaAdmin(noticia),
  });

  notificarUsuariosVerificados(noticia).catch((error) => {
    console.error('Error notificando la noticia nueva:', error);
  });
}

async function notificarUsuariosVerificados(noticia) {
  const usuarios = await prisma.usuario.findMany({
    where: { correoVerificado: true },
    select: { correo: true, nombre: true },
  });

  console.log(`Notificando la noticia "${noticia.titulo}" a ${usuarios.length} usuario(s) verificado(s)...`);

  for (const usuario of usuarios) {
    try {
      await enviarNotificacionNoticia(usuario.correo, usuario.nombre, noticia);
    } catch (error) {
      console.error(`No se pudo notificar a ${usuario.correo}:`, error.message);
    }
  }
}

export async function editarNoticia(req, res) {
  const { id } = req.params;
  const datos = esquemaEditar.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: datos.error.issues[0].message });
  }

  const noticiaExistente = await prisma.noticia.findUnique({ where: { id } });
  if (!noticiaExistente) {
    return res.status(404).json({ error: 'Noticia no encontrada.' });
  }

  let fechaExpiracion = noticiaExistente.fechaExpiracion;
  if (datos.data.fechaExpiracion !== undefined) {
    try {
      fechaExpiracion = parsearFechaExpiracion(datos.data.fechaExpiracion);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  let imagenUrl = noticiaExistente.imagenUrl;
  if (req.file) {
    try {
      await borrarImagenDeNoticia(noticiaExistente.imagenUrl);
      imagenUrl = await subirImagenDeNoticia(req.file);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  const noticia = await prisma.noticia.update({
    where: { id },
    data: {
      titulo: datos.data.titulo ?? noticiaExistente.titulo,
      contenido: datos.data.contenido ?? noticiaExistente.contenido,
      fechaExpiracion,
      imagenUrl,
    },
    include: { autor: true },
  });

  return res.json({ mensaje: 'Noticia actualizada.', noticia: noticiaAdmin(noticia) });
}

export async function borrarNoticia(req, res) {
  const { id } = req.params;

  const noticia = await prisma.noticia.findUnique({ where: { id } });
  if (!noticia) {
    return res.status(404).json({ error: 'Noticia no encontrada.' });
  }

  await borrarImagenDeNoticia(noticia.imagenUrl);
  await prisma.noticia.delete({ where: { id } });

  return res.json({ mensaje: 'Noticia borrada.' });
}
