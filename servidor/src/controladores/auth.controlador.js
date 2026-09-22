import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { generarToken } from '../utilidades/jwt.js';
import { generarCodigoDeSeisDigitos, minutosDesdeAhora } from '../utilidades/codigo.js';
import { enviarCodigoVerificacion, enviarCodigoRecuperacion } from '../servicios/correo.servicio.js';

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'El nombre es muy corto.'),
  correo: z.string().trim().toLowerCase().email('Correo invalido.'),
  contrasena: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
});

const esquemaVerificacion = z.object({
  correo: z.string().trim().toLowerCase().email(),
  codigo: z.string().length(6),
});

const esquemaLogin = z.object({
  correo: z.string().trim().toLowerCase().email(),
  contrasena: z.string().min(1),
});

export function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    correoVerificado: usuario.correoVerificado,
  };
}

export async function registro(req, res) {
  const datos = esquemaRegistro.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: datos.error.issues[0].message });
  }
  const { nombre, correo, contrasena } = datos.data;

  const yaExiste = await prisma.usuario.findUnique({ where: { correo } });
  if (yaExiste) {
    return res.status(409).json({ error: 'Ese correo ya esta registrado.' });
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 12);
  const codigo = generarCodigoDeSeisDigitos();

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      correo,
      contrasenaHash,
      codigoVerificacion: codigo,
      codigoExpiraEn: minutosDesdeAhora(20),
    },
  });

  try {
    await enviarCodigoVerificacion(correo, nombre, codigo);
  } catch (error) {
    console.error('No se pudo enviar el correo de verificacion:', error);
  }

  return res.status(201).json({
    mensaje: 'Cuenta creada. Revisa tu correo para el codigo de verificacion.',
    usuario: usuarioPublico(usuario),
  });
}

export async function verificarCorreo(req, res) {
  const datos = esquemaVerificacion.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: datos.error.issues[0].message });
  }
  const { correo, codigo } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) {
    return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });
  }
  if (usuario.correoVerificado) {
    return res.status(400).json({ error: 'Ese correo ya esta verificado.' });
  }
  if (usuario.codigoVerificacion !== codigo) {
    return res.status(400).json({ error: 'Codigo incorrecto.' });
  }
  if (!usuario.codigoExpiraEn || usuario.codigoExpiraEn < new Date()) {
    return res.status(400).json({ error: 'El codigo vencio. Pedi uno nuevo.' });
  }

  const esAdminInicial =
    correo === process.env.ADMIN_EMAIL_INICIAL?.trim().toLowerCase();

  const usuarioActualizado = await prisma.usuario.update({
    where: { correo },
    data: {
      correoVerificado: true,
      codigoVerificacion: null,
      codigoExpiraEn: null,
      ...(esAdminInicial ? { rol: 'ADMIN' } : {}),
    },
  });

  const token = generarToken(usuarioActualizado);

  return res.json({
    mensaje: 'Correo verificado correctamente.',
    token,
    usuario: usuarioPublico(usuarioActualizado),
  });
}

const esquemaReenvio = z.object({
  correo: z.string().trim().toLowerCase().email(),
});

export async function reenviarCodigo(req, res) {
  const datos = esquemaReenvio.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: 'Correo invalido.' });
  }
  const { correo } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario || usuario.correoVerificado) {
    return res.json({
      mensaje: 'Si el correo existe y todavia no esta verificado, te mandamos un codigo nuevo.',
    });
  }

  const codigo = generarCodigoDeSeisDigitos();

  await prisma.usuario.update({
    where: { correo },
    data: {
      codigoVerificacion: codigo,
      codigoExpiraEn: minutosDesdeAhora(20),
    },
  });

  try {
    await enviarCodigoVerificacion(correo, usuario.nombre, codigo);
  } catch (error) {
    console.error('No se pudo reenviar el codigo de verificacion:', error);
  }

  return res.json({
    mensaje: 'Si el correo existe y todavia no esta verificado, te mandamos un codigo nuevo.',
  });
}

export async function iniciarSesion(req, res) {
  const datos = esquemaLogin.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: 'Correo o contrasena invalidos.' });
  }
  const { correo, contrasena } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  const credencialesInvalidas = () =>
    res.status(401).json({ error: 'Correo o contrasena incorrectos.' });

  if (!usuario) return credencialesInvalidas();

  const coincide = await bcrypt.compare(contrasena, usuario.contrasenaHash);
  if (!coincide) return credencialesInvalidas();

  if (!usuario.correoVerificado) {
    return res.status(403).json({ error: 'Verifica tu correo antes de iniciar sesion.' });
  }

  const token = generarToken(usuario);
  return res.json({ token, usuario: usuarioPublico(usuario) });
}

export async function obtenerPerfil(req, res) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json({ usuario: usuarioPublico(usuario) });
}

const esquemaOlvideContrasena = z.object({
  correo: z.string().trim().toLowerCase().email(),
});

export async function olvideContrasena(req, res) {
  const datos = esquemaOlvideContrasena.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: 'Correo invalido.' });
  }
  const { correo } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });

  const respuestaGenerica = {
    mensaje: 'Si el correo existe, te mandamos un codigo para restablecer la contrasena.',
  };

  if (!usuario) {
    return res.json(respuestaGenerica);
  }

  const codigo = generarCodigoDeSeisDigitos();

  await prisma.usuario.update({
    where: { correo },
    data: {
      codigoReset: codigo,
      codigoResetExpira: minutosDesdeAhora(20),
    },
  });

  try {
    await enviarCodigoRecuperacion(correo, usuario.nombre, codigo);
  } catch (error) {
    console.error('No se pudo enviar el correo de recuperacion:', error);
  }

  return res.json(respuestaGenerica);
}

const esquemaRestablecer = z.object({
  correo: z.string().trim().toLowerCase().email(),
  codigo: z.string().length(6),
  contrasenaNueva: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
});

export async function restablecerContrasena(req, res) {
  const datos = esquemaRestablecer.safeParse(req.body);
  if (!datos.success) {
    return res.status(400).json({ error: datos.error.issues[0].message });
  }
  const { correo, codigo, contrasenaNueva } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) {
    return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });
  }
  if (usuario.codigoReset !== codigo) {
    return res.status(400).json({ error: 'Codigo incorrecto.' });
  }
  if (!usuario.codigoResetExpira || usuario.codigoResetExpira < new Date()) {
    return res.status(400).json({ error: 'El codigo vencio. Pedi uno nuevo.' });
  }

  const contrasenaHash = await bcrypt.hash(contrasenaNueva, 12);

  await prisma.usuario.update({
    where: { correo },
    data: {
      contrasenaHash,
      codigoReset: null,
      codigoResetExpira: null,
    },
  });

  return res.json({ mensaje: 'Contrasena actualizada. Ya podes iniciar sesion con la nueva.' });
}
