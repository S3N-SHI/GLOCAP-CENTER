// =====================================================
// GLOCAP CENTER — api.js
// Cliente central para hablar con la API del Campus Virtual.
// =====================================================

// Mientras el backend corre en tu computadora, esto queda así.
// Cuando lo despliegues (Render, por ejemplo), cambiá esta URL por
// la real, algo como "https://glocap-servidor.onrender.com/api".
   const API_BASE_URL = 'https://glocap-servidor.onrender.com/api';

function guardarSesion(token, usuario) {
  localStorage.setItem('glocap_token', token);
  localStorage.setItem('glocap_usuario', JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem('glocap_token');
  localStorage.removeItem('glocap_usuario');
}

function obtenerToken() {
  return localStorage.getItem('glocap_token');
}

function obtenerUsuario() {
  const crudo = localStorage.getItem('glocap_usuario');
  return crudo ? JSON.parse(crudo) : null;
}

/**
 * Llamada genérica a la API. Si "cuerpo" es un FormData (para subir
 * imágenes), lo manda tal cual; si es un objeto normal, lo convierte
 * a JSON solo. Agrega el token de sesión automáticamente si existe.
 */
async function llamarApi(ruta, opciones = {}) {
  const encabezados = { ...(opciones.encabezados || {}) };
  const token = obtenerToken();
  if (token) encabezados['Authorization'] = `Bearer ${token}`;

  let cuerpo = opciones.cuerpo;
  if (cuerpo && !(cuerpo instanceof FormData)) {
    encabezados['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(cuerpo);
  }

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    method: opciones.metodo || 'GET',
    headers: encabezados,
    body: cuerpo,
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Ocurrió un error inesperado. Intentá de nuevo.');
  }
  return datos;
}

const ApiGlocap = {
  // --- Autenticación ---
  registro: (nombre, correo, contrasena) =>
    llamarApi('/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, contrasena } }),
  verificar: (correo, codigo) =>
    llamarApi('/auth/verificar', { metodo: 'POST', cuerpo: { correo, codigo } }),
  reenviarCodigo: (correo) =>
    llamarApi('/auth/reenviar-codigo', { metodo: 'POST', cuerpo: { correo } }),
  iniciarSesion: (correo, contrasena) =>
    llamarApi('/auth/iniciar-sesion', { metodo: 'POST', cuerpo: { correo, contrasena } }),
  perfil: () => llamarApi('/auth/perfil'),

  // --- Usuarios / roles (admin) ---
  listarUsuarios: () => llamarApi('/usuarios'),
  cambiarRol: (id, rol) => llamarApi(`/usuarios/${id}/rol`, { metodo: 'PATCH', cuerpo: { rol } }),

  // --- Noticias ---
  listarNoticiasPublicas: () => llamarApi('/noticias'),
  listarNoticiasAdmin: () => llamarApi('/noticias/admin'),
  crearNoticia: (formData) => llamarApi('/noticias', { metodo: 'POST', cuerpo: formData }),
  editarNoticia: (id, formData) => llamarApi(`/noticias/${id}`, { metodo: 'PATCH', cuerpo: formData }),
  borrarNoticia: (id) => llamarApi(`/noticias/${id}`, { metodo: 'DELETE' }),

  // --- Sesión local ---
  guardarSesion,
  cerrarSesion,
  obtenerToken,
  obtenerUsuario,
};
