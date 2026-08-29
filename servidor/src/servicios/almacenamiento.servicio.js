import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NOMBRE_BUCKET = 'noticias';

export async function subirImagenDeNoticia(archivo) {
  const extension = archivo.originalname.split('.').pop();
  const nombreUnico = `${randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(NOMBRE_BUCKET)
    .upload(nombreUnico, archivo.buffer, {
      contentType: archivo.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(NOMBRE_BUCKET).getPublicUrl(nombreUnico);
  return data.publicUrl;
}

export async function borrarImagenDeNoticia(urlPublica) {
  if (!urlPublica) return;
  const nombreArchivo = urlPublica.split(`${NOMBRE_BUCKET}/`).pop();
  if (!nombreArchivo) return;
  await supabase.storage.from(NOMBRE_BUCKET).remove([nombreArchivo]);
}