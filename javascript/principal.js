// =====================================================
// GLOCAP CENTER — principal.js
// Interacciones base del sitio institucional
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  inicializarEncabezado();
  inicializarMenuMovil();
  inicializarRevelado();
  inicializarConmutadorOferta();
  inicializarFiltros();
  inicializarVolverArriba();
  inicializarAnioFooter();
  inicializarWhatsApp();
});

/* ---- Encabezado sólido al hacer scroll ---- */
function inicializarEncabezado() {
  const encabezado = document.querySelector('.encabezado');
  if (!encabezado) return;

  const alDesplazar = () => {
    encabezado.classList.toggle('con-scroll', window.scrollY > 40);
  };

  alDesplazar();
  window.addEventListener('scroll', alDesplazar, { passive: true });
}

/* ---- Menú de navegación en móvil ---- */
function inicializarMenuMovil() {
  const interruptor = document.querySelector('.interruptor-menu');
  const nav = document.querySelector('.nav-principal');
  if (!interruptor || !nav) return;

  interruptor.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    interruptor.classList.toggle('abierto', abierto);
    interruptor.setAttribute('aria-expanded', String(abierto));
  });

  nav.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => {
      nav.classList.remove('abierto');
      interruptor.classList.remove('abierto');
      interruptor.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---- Revelado suave de secciones al hacer scroll ---- */
function inicializarRevelado() {
  const elementos = document.querySelectorAll('[data-revelar]');
  if (!elementos.length) return;

  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observador.observe(el));
}

/* ---- Conmutador entre programas de formación y educación continua ---- */
function inicializarConmutadorOferta() {
  const botones = document.querySelectorAll('.conmutador-oferta button');
  const paneles = document.querySelectorAll('.panel-oferta');
  if (!botones.length || !paneles.length) return;

  botones.forEach((boton) => {
    boton.addEventListener('click', () => {
      const objetivo = boton.dataset.panel;

      botones.forEach((b) => b.classList.toggle('activo', b === boton));
      paneles.forEach((panel) => {
        panel.classList.toggle('activo', panel.dataset.panel === objetivo);
      });
    });
  });
}

/* ---- Chips de filtro en catálogos (cursos / certificaciones) ---- */
function inicializarFiltros() {
  document.querySelectorAll('.barra-filtros').forEach((barra) => {
    const chips = barra.querySelectorAll('.chip-filtro');
    const tarjetas = document.querySelectorAll('[data-categoria]');

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        chips.forEach((c) => c.classList.remove('activo'));
        chip.classList.add('activo');

        const filtro = chip.dataset.filtro;
        tarjetas.forEach((tarjeta) => {
          const coincide = filtro === 'todos' || tarjeta.dataset.categoria === filtro;
          tarjeta.style.display = coincide ? '' : 'none';
        });
      });
    });
  });
}

/* ---- Botón flotante para volver arriba ---- */
function inicializarVolverArriba() {
  const boton = document.querySelector('.volver-arriba');
  if (!boton) return;

  window.addEventListener(
    'scroll',
    () => boton.classList.toggle('visible', window.scrollY > 640),
    { passive: true }
  );

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- Año dinámico en el pie de página ---- */
function inicializarAnioFooter() {
  const nodo = document.querySelector('[data-anio]');
  if (nodo) nodo.textContent = new Date().getFullYear();
}


/* ---- Enlaces de WhatsApp ---- */
function inicializarWhatsApp() {
  const urlWhatsApp = 'https://api.whatsapp.com/send/?phone=593999023286&text&type=phone_number&app_absent=0';

  const enlaces = document.querySelectorAll('.enlace-whatsapp');

  enlaces.forEach((enlace) => {
    enlace.href = urlWhatsApp;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
  });
}