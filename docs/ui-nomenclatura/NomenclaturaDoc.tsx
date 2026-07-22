'use client'

import { useState } from 'react'
import { CosmicBg, Reveal, ScrollProgress } from './fx'
import { Mock, type Platform } from './NomenclaturaMocks'
import { SectionMap } from './SectionMap'

type El = { kind: string; es: string; en: string; what: string; when: string; diff?: string }
type Fam = { eyebrow: string; titulo: string; items: El[] }

const FAMILIAS: Fam[] = [
  {
    eyebrow: 'El esqueleto',
    titulo: 'Estructura de la app',
    items: [
      { kind: 'shell', es: 'Shell / Armazón', en: 'Shell / Layout', what: 'El marco fijo que envuelve todo: las barras + la zona de contenido. Es lo que se ve SIEMPRE alrededor, no cambia al navegar; solo cambia el contenido de dentro.', when: 'Es el esqueleto de la app; todo lo demás vive dentro de él.', diff: 'Desktop: barra superior + barra lateral. Móvil: barra superior + barra inferior.' },
      { kind: 'topbar', es: 'Barra superior', en: 'Top bar', what: 'La franja de arriba: normalmente el logo/título a la izquierda y acciones globales (buscar, notificaciones, perfil) a la derecha.', when: 'Identidad y acciones que deben estar siempre a mano arriba.', diff: 'Presente en ambos; en móvil suele llevar el botón ☰ que abre el cajón.' },
      { kind: 'sidebar', es: 'Barra lateral', en: 'Sidebar', what: 'Columna a un lado con la navegación entre secciones. SIEMPRE visible y fija: no se abre ni se cierra, está ahí permanentemente.', when: 'Apps con muchas secciones, cuando hay espacio de sobra (desktop).', diff: 'Desktop: fija y siempre visible. Móvil: no cabe → se oculta y se abre como cajón (drawer).' },
      { kind: 'bottomnav', es: 'Barra inferior', en: 'Bottom nav', what: 'Barra de abajo con 3-5 iconos para saltar entre las secciones principales, al alcance del pulgar.', when: 'La navegación principal en móvil (estilo app nativa iOS/Android).', diff: 'Móvil: es la navegación principal. Desktop: poco común (ahí se usa la barra lateral o la superior).' },
      { kind: 'hero', es: 'Cabecera / Hero', en: 'Hero section', what: 'La primera franja grande de una página: título potente + subtítulo + botón.', when: 'Portadas y landings; lo primero que ve el visitante.' },
      { kind: 'footer', es: 'Pie de página', en: 'Footer', what: 'La franja de abajo con enlaces, legal y copyright.', when: 'Cierre de la página; enlaces secundarios.' },
    ],
  },
  {
    eyebrow: 'Moverse',
    titulo: 'Navegación',
    items: [
      { kind: 'tabs', es: 'Pestañas', en: 'Tabs', what: 'Cambian el contenido dentro de la MISMA pantalla, sin ir a otra página. La pestaña activa se marca (subrayado/color).', when: 'Varias vistas de lo mismo: Resumen / Datos / Ajustes.', diff: 'Igual en ambos; en móvil suelen ir a ancho completo o volverse un control segmentado.' },
      { kind: 'breadcrumbs', es: 'Migas de pan', en: 'Breadcrumbs', what: 'Un rastro (Inicio › Panel › Detalle) que muestra dónde estás dentro de la jerarquía y deja volver a un nivel anterior.', when: 'Estructuras profundas, para orientarse y no perderse.', diff: 'Típico de desktop; en móvil suele reducirse a un simple “‹ Atrás”.' },
      { kind: 'pagination', es: 'Paginación', en: 'Pagination', what: 'Divide una lista larga en páginas numeradas para no cargarlo todo de golpe.', when: 'Listados largos (resultados, tablas) en pantallas amplias.', diff: 'Desktop: páginas numeradas ‹ 1 2 3 ›. Móvil: suele ser “cargar más” o scroll infinito.' },
      { kind: 'commandpalette', es: 'Paleta de comandos', en: 'Command palette', what: 'Buscador de acciones que se abre con un atajo (⌘K / Ctrl+K) para hacer cosas sin ratón.', when: 'Apps con muchas acciones; para usuarios avanzados.', diff: 'Muy de desktop (atajo de teclado). En móvil apenas se usa.' },
      { kind: 'treeview', es: 'Vista de árbol', en: 'Tree view', what: 'Lista jerárquica con carpetas que se expanden y contraen.', when: 'Explorar archivos, categorías anidadas.' },
      { kind: 'menu', es: 'Menú desplegable', en: 'Menu / Dropdown menu', what: 'Lista de acciones u opciones que se abre al pulsar un botón (ej. el menú del avatar).', when: 'Agrupar acciones u opciones de navegación.' },
      { kind: 'link', es: 'Enlace', en: 'Link / Hyperlink', what: 'Texto clicable que lleva a otro sitio o página.', when: 'Navegar desde dentro del texto.' },
    ],
  },
  {
    eyebrow: 'Dónde vive el contenido',
    titulo: 'Contenedores',
    items: [
      { kind: 'card', es: 'Tarjeta', en: 'Card', what: 'Bloque rectangular que agrupa la información de UN item (imagen, título, texto, acción) y lo separa visualmente del resto.', when: 'Listar cosas (productos, posts, usuarios) de forma escaneable.' },
      { kind: 'modal', es: 'Ventana modal', en: 'Modal / Dialog', what: 'Ventana que aparece ENCIMA y oscurece el fondo, bloqueándolo hasta que respondes o la cierras. Exige tu atención.', when: 'Confirmar una acción importante o un formulario corto.', diff: 'Desktop: ventana flotante centrada. Móvil: casi siempre se muestra como bottom sheet (sube desde abajo).' },
      { kind: 'bottomsheet', es: 'Hoja inferior', en: 'Bottom sheet', what: 'Panel que SUBE desde el borde inferior y se puede arrastrar. Lleva un “tirador” arriba. Es cómodo para el pulgar.', when: 'Detalles y acciones en móvil (estilo iOS / Notion / WhatsApp).', diff: 'Es la forma MÓVIL del modal: en vez de flotar en el centro, sube desde abajo.' },
      { kind: 'drawer', es: 'Cajón lateral', en: 'Drawer', what: 'Panel OCULTO que entra deslizando desde un lado al pulsar un botón (☰), oscurece el fondo, y se cierra al terminar. Es temporal.', when: 'Menú o filtros que no caben en pantalla y se muestran bajo demanda.', diff: 'Es la versión que “aparece y desaparece” de la barra lateral. Sidebar = fija · Drawer = oculta hasta que la abres.' },
      { kind: 'accordion', es: 'Acordeón', en: 'Accordion', what: 'Secciones plegables: cada cabecera se expande al tocarla y muestra su contenido; el resto queda colapsado.', when: 'FAQs o listas largas que conviene tener recogidas.' },
      { kind: 'table', es: 'Tabla', en: 'Table / Data grid', what: 'Datos organizados en filas y columnas para comparar de un vistazo.', when: 'Datos densos y comparables (precios, métricas, registros).', diff: 'Desktop: filas y columnas. Móvil: no cabe → cada fila se apila como una tarjeta.' },
      { kind: 'popover', es: 'Popover', en: 'Popover / Popup', what: 'Panel pequeño que FLOTA anclado a un botón o elemento. NO oscurece ni bloquea el fondo (esa es la diferencia con el modal).', when: 'Menús, opciones o info contextual junto a un botón.', diff: 'Lo que llamas “pop” suele ser esto o un modal: modal = bloquea el fondo; popover = flota sin bloquear.' },
      { kind: 'alertdialog', es: 'Diálogo de confirmación', en: 'Alert dialog', what: 'Un modal pequeño que pide CONFIRMAR una acción (¿Seguro? Sí/No), sobre todo si es irreversible.', when: 'Antes de borrar algo o una acción destructiva.' },
      { kind: 'list', es: 'Lista', en: 'List', what: 'Elementos apilados uno debajo de otro, cada uno en una fila.', when: 'Items simples en orden (mensajes, tareas, ajustes).' },
      { kind: 'gridcards', es: 'Rejilla', en: 'Grid', what: 'Elementos colocados en cuadrícula (filas y columnas de tarjetas).', when: 'Galerías, catálogos, tarjetas en varias columnas.' },
    ],
  },
  {
    eyebrow: 'Interactuar',
    titulo: 'Controles',
    items: [
      { kind: 'button', es: 'Botón', en: 'Button', what: 'Dispara una acción. Primario (relleno) para la acción principal; secundario/ghost (contorno) para las menos importantes.', when: 'Cualquier acción: guardar, enviar, continuar.' },
      { kind: 'toggle', es: 'Interruptor', en: 'Toggle / Switch', what: 'Enciende o apaga algo AL INSTANTE, sin botón de confirmar. Su posición ya indica el estado.', when: 'Activar/desactivar un ajuste (notificaciones, modo oscuro).' },
      { kind: 'slider', es: 'Deslizador', en: 'Slider', what: 'Eliges un valor dentro de un rango arrastrando un mando por una barra.', when: 'Volumen, brillo, precio, cualquier rango numérico.' },
      { kind: 'segmented', es: 'Control segmentado', en: 'Segmented control', what: 'Grupo de 2-4 opciones en una pastilla; solo una activa a la vez. Como pestañas, pero para filtrar/elegir.', when: 'Alternar entre pocas vistas (Día/Mes/Año).' },
      { kind: 'dropdown', es: 'Desplegable', en: 'Dropdown / Select', what: 'Un campo que, al pulsarlo, abre una lista para elegir UNA opción.', when: 'Muchas opciones que no caben todas a la vista (país, categoría).' },
      { kind: 'search', es: 'Barra de búsqueda', en: 'Search bar', what: 'Campo con lupa para buscar o filtrar contenido por texto.', when: 'Listas o contenido grande donde hace falta encontrar algo.' },
      { kind: 'datepicker', es: 'Selector de fecha', en: 'Date picker', what: 'Un mini-calendario para elegir una fecha sin escribirla a mano.', when: 'Reservas, fechas de nacimiento, agendar.' },
      { kind: 'avatar', es: 'Avatar / menú de usuario', en: 'Avatar', what: 'Círculo con la foto o iniciales del usuario; al pulsarlo abre su menú (perfil, ajustes, salir).', when: 'Esquina superior, para acceder a la cuenta.' },
      { kind: 'fab', es: 'Botón flotante', en: 'FAB', what: 'Botón circular fijo (normalmente abajo-derecha) para la acción MÁS importante de la pantalla.', when: 'La acción estrella: crear, añadir, componer.', diff: 'Más típico en móvil (al alcance del pulgar). En desktop se suele usar un botón normal.' },
      { kind: 'checkbox', es: 'Casilla', en: 'Checkbox', what: 'Marca una o VARIAS opciones de una lista (cada una independiente).', when: 'Aceptar términos, seleccionar varios items a la vez.' },
      { kind: 'radio', es: 'Selector único', en: 'Radio', what: 'Elige SOLO una opción de un grupo; al marcar una, se desmarca la anterior.', when: 'Opciones excluyentes (una u otra, no varias).' },
      { kind: 'numberstepper', es: 'Contador', en: 'Number stepper', what: 'Sube o baja un número con los botones − y +.', when: 'Cantidades pequeñas (unidades, nº de personas).' },
      { kind: 'rating', es: 'Valoración', en: 'Rating', what: 'Puntuar con estrellas (u otro icono) sobre un máximo.', when: 'Reseñas, encuestas de satisfacción.' },
      { kind: 'splitbutton', es: 'Botón dividido', en: 'Split button', what: 'Un botón con una acción principal + una flechita que abre variantes de esa acción.', when: 'Acción por defecto + alternativas (Guardar / Guardar como…).' },
      { kind: 'fileupload', es: 'Zona de subida', en: 'File upload / Dropzone', what: 'Área donde sueltas o eliges archivos para subirlos.', when: 'Subir imágenes, documentos, adjuntos.' },
      { kind: 'colorpicker', es: 'Selector de color', en: 'Color picker', what: 'Elegir un color de una paleta o rueda.', when: 'Personalizar temas, etiquetas, diseño.' },
      { kind: 'otp', es: 'Código de verificación', en: 'OTP input', what: 'Casillas separadas para teclear un código corto (el que llega por SMS o email).', when: 'Verificar identidad, doble factor (2FA).' },
      { kind: 'taginput', es: 'Input de etiquetas', en: 'Tag input', what: 'Un campo donde escribes y cada palabra se convierte en una etiqueta (chip).', when: 'Tags, destinatarios, palabras clave.' },
      { kind: 'combobox', es: 'Autocompletar', en: 'Combobox / Autocomplete', what: 'Un campo que SUGIERE opciones a medida que escribes.', when: 'Buscar y elegir de una lista grande (ciudad, producto).' },
      { kind: 'passwordfield', es: 'Campo de contraseña', en: 'Password field', what: 'Campo que oculta lo que escribes (••••) con un ojo para mostrarlo.', when: 'Contraseñas y datos sensibles.' },
      { kind: 'textarea', es: 'Área de texto', en: 'Textarea', what: 'Campo de texto de VARIAS líneas (más grande que un input normal).', when: 'Comentarios, descripciones, mensajes largos.' },
      { kind: 'rangeslider', es: 'Deslizador de rango', en: 'Range slider', what: 'Como el slider, pero con DOS manijas para elegir un mínimo y un máximo.', when: 'Filtrar por rango (precio de X a Y).' },
      { kind: 'timepicker', es: 'Selector de hora', en: 'Time picker', what: 'Elegir una hora sin escribirla a mano.', when: 'Agendar, recordatorios, horarios.' },
    ],
  },
  {
    eyebrow: 'Qué está pasando',
    titulo: 'Feedback y estados',
    items: [
      { kind: 'banner', es: 'Aviso / Banner', en: 'Banner / Alert', what: 'Mensaje FIJO dentro de la página (arriba), que se queda hasta que lo cierras o resuelves. Informa de algo importante.', when: 'Avisos persistentes: “tu plan caduca”, “verifica tu email”.', diff: 'Se queda fijo; el toast, en cambio, aparece y se va solo.' },
      { kind: 'toast', es: 'Aviso emergente', en: 'Toast / Snackbar', what: 'Mensaje breve que aparece, confirma algo y desaparece SOLO en unos segundos, sin interrumpir.', when: 'Confirmar que algo salió bien/mal (“Guardado”, “Error al enviar”).' },
      { kind: 'tooltip', es: 'Globo de ayuda', en: 'Tooltip', what: 'Texto pequeño que aparece al pasar el ratón o mantener pulsado un elemento, para explicarlo.', when: 'Aclarar un icono o dar una pista corta.', diff: 'Desktop: aparece al pasar el ratón. Móvil: al mantener pulsado (no hay “hover”).' },
      { kind: 'badgechip', es: 'Insignia y pastilla', en: 'Badge & Chip', what: 'Badge = pequeño contador pegado a un icono (notificaciones sin leer). Chip = etiqueta con texto (categoría, filtro).', when: 'Contar (3 sin leer) o etiquetar/filtrar.' },
      { kind: 'stepper', es: 'Pasos / Asistente', en: 'Stepper / Wizard', what: 'Divide un proceso largo en pasos numerados y muestra en cuál vas (paso 1 de 3).', when: 'Onboarding, checkout, formularios largos por fases.' },
      { kind: 'spinner', es: 'Cargador', en: 'Spinner / Loader', what: 'Un círculo girando que indica que algo se está cargando, sin decir cuánto falta.', when: 'Esperas cortas de duración desconocida.' },
      { kind: 'skeleton', es: 'Esqueleto', en: 'Skeleton', what: 'Silueta gris con la forma del contenido que está por llegar, con un brillo animado.', when: 'Cargar pantallas con estructura conocida (mejor que un spinner: se siente más rápido).' },
      { kind: 'progress', es: 'Barra de progreso', en: 'Progress bar', what: 'Barra que se rellena para mostrar CUÁNTO falta de una tarea.', when: 'Procesos con avance medible (subir un archivo, pasos completados).' },
      { kind: 'notification', es: 'Campana / Notificaciones', en: 'Notification bell', what: 'Icono (campana) con un contador que abre el centro de avisos.', when: 'Avisar de novedades sin interrumpir lo que haces.' },
      { kind: 'progressring', es: 'Anillo de progreso', en: 'Progress ring', what: 'Como la barra de progreso, pero en círculo. Ocupa poco.', when: 'Progreso compacto (perfil completado, carga de algo).' },
      { kind: 'snackbar', es: 'Snackbar', en: 'Snackbar', what: 'Como el toast, pero suele traer una ACCIÓN rápida (ej. “Deshacer”).', when: 'Confirmar algo y dejar revertirlo al instante.' },
      { kind: 'statusdot', es: 'Punto de estado', en: 'Status / Presence dot', what: 'Un puntito de color que indica un estado (en línea, ocupado, offline).', when: 'Presencia de usuarios, estado de un servicio.' },
      { kind: 'coachmark', es: 'Guía / Coach mark', en: 'Coach mark / Tour', what: 'Globo que resalta un elemento la primera vez para enseñarte a usarlo.', when: 'Onboarding, presentar una función nueva.' },
      { kind: 'callout', es: 'Nota destacada', en: 'Callout', what: 'Un bloque resaltado dentro del texto para un aviso o consejo.', when: 'Destacar algo importante dentro de un contenido.' },
      { kind: 'loadingdots', es: 'Puntos de carga', en: 'Loading dots', what: 'Tres puntos que rebotan para indicar que algo se procesa (o que están escribiendo).', when: 'Esperas cortas, indicador de “escribiendo…”.' },
      { kind: 'inlinealert', es: 'Alerta en línea', en: 'Inline alert', what: 'Un aviso corto pegado a un campo o sección (ej. un error de validación).', when: 'Errores de formulario, avisos junto a un elemento.' },
    ],
  },
  {
    eyebrow: 'Componer y mostrar',
    titulo: 'Composición y contenido',
    items: [
      { kind: 'divider', es: 'Separador', en: 'Divider', what: 'Una línea fina que separa visualmente dos grupos de contenido.', when: 'Marcar el fin de una sección y el inicio de otra.' },
      { kind: 'carousel', es: 'Carrusel', en: 'Carousel', what: 'Fila de elementos (imágenes, tarjetas) que se deslizan de uno en uno; los puntos de abajo indican en cuál vas.', when: 'Galerías, destacados, onboarding con varias pantallas.' },
      { kind: 'emptystate', es: 'Estado vacío', en: 'Empty state', what: 'Lo que se muestra cuando aún NO hay contenido: un icono, un texto amable y un botón para empezar.', when: 'Primera vez, listas vacías, sin resultados de búsqueda.' },
      { kind: 'statcard', es: 'Tarjeta de métrica', en: 'Stat card / KPI', what: 'Card que resalta UN número clave (y su tendencia) para verlo de golpe.', when: 'Dashboards, resúmenes de negocio.' },
      { kind: 'timeline', es: 'Línea de tiempo', en: 'Timeline', what: 'Muestra eventos o pasos en orden cronológico, uno debajo de otro.', when: 'Historial, actividad reciente, seguimiento de un proceso.' },
      { kind: 'avatargroup', es: 'Grupo de avatares', en: 'Avatar group', what: 'Avatares apilados que indican varias personas (y un “+N” si hay más).', when: 'Miembros de un equipo, participantes de algo.' },
      { kind: 'kanban', es: 'Tablero Kanban', en: 'Kanban board', what: 'Columnas por estado; las tarjetas se arrastran de una a otra.', when: 'Gestionar tareas por fases (To-do / Haciendo / Hecho).', diff: 'Desktop: columnas en fila. Móvil: una columna a la vez (deslizas).' },
      { kind: 'contextmenu', es: 'Menú contextual', en: 'Context menu', what: 'Menú que aparece encima de un elemento con acciones rápidas.', when: 'Acciones sobre un item (copiar, editar, borrar).', diff: 'Desktop: clic derecho. Móvil: mantener pulsado.' },
      { kind: 'gauge', es: 'Medidor', en: 'Gauge', what: 'Un semicírculo con aguja que muestra un valor sobre un máximo.', when: 'Métricas tipo velocímetro (uso, rendimiento).' },
      { kind: 'barchart', es: 'Gráfico de barras', en: 'Bar chart', what: 'Barras para comparar valores de un vistazo.', when: 'Comparar cifras (ventas por mes, etc.).' },
      { kind: 'speeddial', es: 'Menú flotante', en: 'Speed dial', what: 'Un FAB que, al pulsarlo, despliega varias acciones en abanico.', when: 'Varias acciones rápidas desde un solo botón (móvil).' },
      { kind: 'kbd', es: 'Tecla / Atajo', en: 'Keyboard key (kbd)', what: 'Representa una tecla o combinación de teclas (⌘K).', when: 'Mostrar atajos de teclado.' },
      { kind: 'donut', es: 'Gráfico circular', en: 'Donut / Pie chart', what: 'Un círculo dividido en porciones para ver proporciones de un vistazo.', when: 'Repartos y porcentajes (uso por categoría).' },
      { kind: 'sparkline', es: 'Mini gráfico', en: 'Sparkline', what: 'Una línea de tendencia diminuta, sin ejes, dentro de una fila o card.', when: 'Tendencia rápida junto a un número (subió/bajó).' },
      { kind: 'codeblock', es: 'Bloque de código', en: 'Code block', what: 'Un recuadro monoespaciado para mostrar código.', when: 'Documentación técnica, ejemplos.' },
      { kind: 'quote', es: 'Cita', en: 'Blockquote', what: 'Un texto destacado con una barra al lado, normalmente una frase o cita.', when: 'Testimonios, frases destacadas.' },
    ],
  },
]

const SECTIONS = FAMILIAS.map((f, i) => ({ id: `fam-${i}`, label: f.titulo.split(' ')[0] }))

function MonitorIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" strokeLinecap="round" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" strokeLinecap="round" />
    </svg>
  )
}
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'desktop', label: 'Ordenador' },
  { id: 'mobile', label: 'Móvil' },
]

export function NomenclaturaDoc({ backHref = '/' }: { backHref?: string }) {
  const [platform, setPlatform] = useState<Platform>('desktop')

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      <CosmicBg />

      {/* Barra de progreso de scroll (ref + rAF, sin lag) */}
      <ScrollProgress />

      {/* Mapa de secciones (desktop) */}
      <SectionMap sections={SECTIONS} />

      <header className="safe-pt safe-px relative z-10 mx-auto max-w-5xl px-6 pb-8 pt-20 md:px-10 md:pt-28">
        <Reveal>
          <div className="mb-6 border-l-2 border-accent pl-4">
            <p className="text-eyebrow text-accent-soft">Diseño · Vocabulario de interfaces</p>
          </div>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-gradient-accent md:text-7xl">Cómo se llama<br />cada cosa</h1>
          <p className="mt-8 max-w-3xl font-body text-base leading-relaxed text-ink-soft md:text-xl">
            El nombre correcto de cada parte de una interfaz, para <span className="text-accent-soft">cualquier software</span>.
            Cambia entre <span className="text-accent-soft">ordenador</span> y <span className="text-accent-soft">móvil</span> para ver
            cómo cambia cada elemento; muchos no se llaman ni se ven igual según la pantalla.
          </p>
        </Reveal>
      </header>

      {/* Toggle Ordenador / Móvil (pill flotante centrado · alto contraste · NO tapa a lo ancho) */}
      <div className="safe-px sticky top-3 z-40 mx-auto mt-1 flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-white/15 bg-canvas/90 px-2 py-1.5 shadow-[0_12px_34px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <span className="hidden pl-2 font-display text-[11px] uppercase tracking-wider text-ink-soft sm:inline">Ver en</span>
        <div className="inline-flex gap-1 rounded-full bg-black/40 p-1">
          {PLATFORMS.map(({ id, label }) => {
            const active = platform === id
            return (
              <button
                key={id}
                onClick={() => setPlatform(id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold transition ${
                  active
                    ? 'bg-accent text-black shadow-[0_4px_14px_-4px_rgba(194,166,101,0.75)]'
                    : 'bg-white/[0.06] text-ink-soft hover:bg-white/[0.12] hover:text-ink'
                }`}
              >
                {id === 'desktop' ? <MonitorIcon /> : <PhoneIcon />}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {FAMILIAS.map((fam, idx) => (
        <section key={fam.titulo} id={`fam-${idx}`} className="safe-px relative z-10 mx-auto max-w-5xl scroll-mt-24 px-6 pb-16 pt-12 md:px-10 md:pb-24">
          <Reveal>
            <div className="mb-8 border-l-2 border-accent pl-4">
              <p className="text-eyebrow text-accent-soft">{fam.eyebrow}</p>
              <h2 className="mt-2 font-display text-2xl tracking-tight text-ink md:text-4xl">{fam.titulo}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fam.items.map((el) => (
                <div key={el.kind} className="flex min-w-0 flex-col rounded-2xl surface-elevated p-5 md:p-6">
                  <div className="overflow-hidden rounded-xl border border-white/[0.14] bg-black/40 p-2">
                    <Mock kind={el.kind} platform={platform} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-display text-base tracking-wide text-ink">{el.es}</h3>
                    <span className="max-w-full break-words rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 font-display text-[9px] uppercase tracking-wider text-accent-soft">{el.en}</span>
                  </div>
                  <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">{el.what}</p>
                  <p className="mt-2 font-body text-xs leading-snug text-ink-soft"><span className="font-semibold text-accent-soft">Cuándo:</span> {el.when}</p>
                  {el.diff && (
                    <p className="mt-2.5 rounded-lg border border-accent/35 bg-accent/[0.09] px-2.5 py-1.5 font-body text-[11px] leading-snug text-ink-soft">
                      <span className="font-semibold text-accent-soft">▭ vs ▯ · </span>{el.diff}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      ))}

      <footer className="safe-pb safe-px relative z-10 mx-auto max-w-5xl px-8 pb-28 pt-6 text-center md:px-10 md:pb-32">
        <Reveal>
          <p className="font-body text-base italic text-ink-soft">Habla con propiedad y la IA te entiende a la primera.</p>
          <a href={backHref} className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-6 py-3 font-display text-eyebrow text-accent transition hover:bg-accent/25 active:scale-95">
            Volver
          </a>
        </Reveal>
      </footer>
    </main>
  )
}
