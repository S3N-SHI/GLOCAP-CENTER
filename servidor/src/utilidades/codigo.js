export function generarCodigoDeSeisDigitos() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function minutosDesdeAhora(minutos) {
  return new Date(Date.now() + minutos * 60 * 1000);
}
