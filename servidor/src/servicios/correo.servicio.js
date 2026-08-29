import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const REMITENTE = process.env.CORREO_REMITENTE;

/**
 * Envía el código de verificación de 6 dígitos al registrarse.
 */
export async function enviarCodigoVerificacion(correoDestino, nombre, codigo) {
  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: correoDestino,
    subject: 'Tu código de verificación — GLOCAP CENTER',
    html: `
      <p>Hola ${nombre},</p>
      <p>Tu código de verificación es:</p>
      <h2 style="letter-spacing:4px;">${codigo}</h2>
      <p>Vence en 20 minutos. Si no fuiste vos quien intentó registrarse, ignorá este correo.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend rechazó el envío: ${JSON.stringify(error)}`);
  }

  console.log('Correo de verificación enviado, id de Resend:', data?.id);
}

/**
 * Notifica a un usuario verificado que se publicó una noticia nueva.
 */
export async function enviarNotificacionNoticia(correoDestino, nombre, noticia) {
  const { data, error } = await resend.emails.send({
    from: REMITENTE,
    to: correoDestino,
    subject: `Nueva noticia: ${noticia.titulo}`,
    html: `
      <p>Hola ${nombre},</p>
      <p>GLOCAP CENTER publicó una noticia nueva:</p>
      <h3>${noticia.titulo}</h3>
      <p>${noticia.contenido.slice(0, 200)}${noticia.contenido.length > 200 ? '…' : ''}</p>
      <p><a href="https://s3n-shi.github.io/GLOCAP-CENTER/paginas/noticias.html">Ver todas las noticias</a></p>
    `,
  });

  if (error) {
    throw new Error(`Resend rechazó el envío: ${JSON.stringify(error)}`);
  }

  console.log('Notificación de noticia enviada, id de Resend:', data?.id);
}