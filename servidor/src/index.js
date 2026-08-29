import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rutasAuth } from './rutas/auth.rutas.js';
import { rutasUsuarios } from './rutas/usuarios.rutas.js';
import { rutasNoticias } from './rutas/noticias.rutas.js';

const VARIABLES_REQUERIDAS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRETO',
  'RESEND_API_KEY',
  'CORREO_REMITENTE',
  'ADMIN_EMAIL_INICIAL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const variable of VARIABLES_REQUERIDAS) {
  if (!process.env[variable]) {
    console.error(`Falta la variable de entorno ${variable} (revisá tu archivo .env)`);
    process.exit(1);
  }
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ estado: 'ok', servicio: 'GLOCAP CENTER API' });
});

app.use('/api/auth', rutasAuth);
app.use('/api/usuarios', rutasUsuarios);
app.use('/api/noticias', rutasNoticias);

app.use((error, req, res, next) => {
  console.error(error);
  const esErrorDeSubida = error?.name === 'MulterError' || /imagen/i.test(error?.message || '');
  res.status(esErrorDeSubida ? 400 : 500).json({
    error: esErrorDeSubida ? error.message : 'Error interno del servidor.',
  });
});

const puerto = process.env.PUERTO || 4000;
app.listen(puerto, () => {
  console.log(`API de GLOCAP CENTER corriendo en http://localhost:${puerto}`);
});