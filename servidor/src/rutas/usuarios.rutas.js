import { Router } from 'express';
import { listarUsuarios, cambiarRol } from '../controladores/usuarios.controlador.js';
import { requiereSesion, requiereAdmin } from '../middlewares/autenticacion.js';

export const rutasUsuarios = Router();

rutasUsuarios.get('/', requiereSesion, requiereAdmin, listarUsuarios);
rutasUsuarios.patch('/:id/rol', requiereSesion, requiereAdmin, cambiarRol);