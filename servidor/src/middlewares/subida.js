import multer from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const subidaImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, archivo, cb) {
    if (!TIPOS_PERMITIDOS.includes(archivo.mimetype)) {
      return cb(new Error('Formato de imagen no permitido (usá JPG, PNG, WEBP o GIF).'));
    }
    cb(null, true);
  },
});