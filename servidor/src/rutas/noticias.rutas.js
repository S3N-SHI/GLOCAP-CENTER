import { Router } from 'express';
import {
  listarNoticiasPublicas,
  listarNoticiasAdmin,
  crearNoticia,
  editarNoticia,
  borrarNoticia,
} from '../controladores/noticias.controlador.js';
import { requiereSesion, requiereAdmin } from '../middlewares/autenticacion.js';
import { subidaImagen } from '../middlewares/subida.js';

export const rutasNoticias = Router();

rutasNoticias.get('/', listarNoticiasPublicas);
rutasNoticias.get('/admin', requiereSesion, requiereAdmin, listarNoticiasAdmin);
rutasNoticias.post('/', requiereSesion, requiereAdmin, subidaImagen.single('imagen'), crearNoticia);
rutasNoticias.patch('/:id', requiereSesion, requiereAdmin, subidaImagen.single('imagen'), editarNoticia);
rutasNoticias.delete('/:id', requiereSesion, requiereAdmin, borrarNoticia);