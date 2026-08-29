import { Router } from 'express';
import { registro, verificarCorreo, reenviarCodigo, iniciarSesion, obtenerPerfil } from '../controladores/auth.controlador.js';
import { requiereSesion } from '../middlewares/autenticacion.js';

export const rutasAuth = Router();

rutasAuth.post('/registro', registro);
rutasAuth.post('/verificar', verificarCorreo);
rutasAuth.post('/reenviar-codigo', reenviarCodigo);
rutasAuth.post('/iniciar-sesion', iniciarSesion);
rutasAuth.get('/perfil', requiereSesion, obtenerPerfil);