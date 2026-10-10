/**
 * Los iconos de la app (Tanda 6z3, diseño `docs/diseno/hoy/Iconos y HOY.dc.html`, «Una sola familia»): UN solo sitio. De línea, 1,7 de grosor, puntas y esquinas redondeadas, sobre 24 px.
 * Cada cosa lleva siempre el mismo icono: la excursión una mochila (el autobús es solo la llegada y la vuelta en autobús). Se pintan con `<Icono nombre="…" />` (`src/components/ui/Icono.tsx`).
 */
export const GROSOR_ICONO = 1.7

export const ICONOS = {
  // ── Las cinco pestañas de la barra de abajo y la cabecera ──
  hoy: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  ruta: 'M6 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 18.5h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8',
  dias: 'M5 5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 5 5zM3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01',
  explorar: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.8 8.2l-2.3 5.3-5.3 2.3 2.3-5.3z',
  reservas: 'M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v1.5M10 10.5v3M10 16.5v1.5',
  presupuesto: 'M3.5 7.5v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-13a2 2 0 0 1 0-4h10.5v4M20.5 11.5H17a2 2 0 0 0 0 4h3.5',
  avisos: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4',
  perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c.8-3.5 3.8-5.5 7.5-5.5s6.7 2 7.5 5.5',
  // ── Lo que se reserva, se visita y se añade ──
  free: 'M5.5 21V4M5.5 4.5h11.5l-2.5 3.75 2.5 3.75H5.5',
  /** La excursión: una mochila. */
  excursion: 'M8 7.5V6a4 4 0 0 1 8 0v1.5M6.5 7.5h11a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2zM9 14h6M9.5 11h5',
  cama: 'M3 19.5V5M3 15h18v4.5M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12a1.75 1.75 0 1 0 0-3.5A1.75 1.75 0 0 0 7 12z',
  avion: 'M10.5 20.5L12 16l-4-4-5 1.5-1-1 5-3.5L6 4l1.5-1 4 4.5L18 2a2 2 0 0 1 3 3l-5.5 6.5 4.5 4-1 1.5-5-1-3.5 5z',
  tren: 'M7 3h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2zM5 11h14M9 15h.01M15 15h.01M8 18l-2 3M16 18l2 3',
  /** El autobús: solo la llegada y la vuelta en autobús. */
  bus: 'M6 3.5h12a2 2 0 0 1 2 2V17H4V5.5a2 2 0 0 1 2-2zM4 11h16M7.5 20.5V17M16.5 20.5V17M8 14h.01M16 14h.01M9 7h6',
  barco: 'M3 17l2 4h14l2-4-9-3zM6 14V8h12v6M12 3v5',
  coche: 'M5 16v-5l2-5h10l2 5v5M5 16h14v3H5zM7.5 13h.01M16.5 13h.01',
  tips: 'M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2v2h5v-2c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z',
  maleta: 'M5 7.5h14a1.5 1.5 0 0 1 1.5 1.5v9.5A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5V9A1.5 1.5 0 0 1 5 7.5zM9 7.5V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.5M8 7.5V20M16 7.5V20',
  seguro: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  esim: 'M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9.5 11h5v6h-5zM12 11v6M9.5 14h5',
  extras: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8',
  comida: 'M7 3v6a2 2 0 0 0 4 0V3M9 11v10M17 21V3c-2 1-3.5 3.5-3.5 7 0 1.5.8 2.5 2 2.5H17',
  noche: 'M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z',
  mirador: 'M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5.5V8M5 9.5l1.6 1.6M19 9.5l-1.6 1.6M8 21h8',
  lluvia: 'M7 15.5a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 8a3.75 3.75 0 0 1 .5 7.5zM8.5 18.5l-1 2M12.5 18.5l-1 2M16.5 18.5l-1 2',
  reorg: 'M4 6h9M4 12h6M4 18h11M18 4v13M15 14l3 3 3-3',
  recuperar: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  compartido: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20c.5-3 2.8-5 5.5-5s5 2 5.5 5M16 5.2a3 3 0 0 1 0 5.6M20.5 20c-.3-2.3-1.5-4-3.5-4.7',
  anadir: 'M12 5v14M5 12h14',
  gusta: 'M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.5 12 20 12 20z',
  hecho: 'M5 12.5l4.5 4.5L19 7.5',
  camara: 'M4 8h3l1.8-2.5h6.4L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  mapa: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  banos: 'M7 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 8.5h4v6H8l-.5 6.5h-1L6 14.5H5zM15 8.5h4l1.5 7H19l-.5 5.5h-3l-.5-5.5H13.5zM12 3v18',
  // ── De la misma familia, para lo que el diseño no dibuja (mismo trazo) ──
  cerrar: 'M6 6l12 12M18 6L6 18',
  atras: 'M15 6l-6 6 6 6',
  adelante: 'M9 6l6 6-6 6',
  abajo: 'M6 9l6 6 6-6',
  arriba: 'M6 15l6-6 6 6',
  ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  ojoCerrado: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.4 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  ubicacion: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  hotel: 'M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3M2 21h20',
  columnas: 'M4 20h16M5 9h14M12 4l8 5H4zM7 9v11M12 9v11M17 9v11',
  montana: 'M3 20l6-10 4 6 3-4 5 8z',
  tarjeta: 'M3 6h18v12H3zM3 10h18M7 15h4',
  bandera: 'M5 21V4M5 4h11l-2.5 3.5L16 11H5',
  // Las categorías de EXPLORAR que el diseño no dibuja (mismo trazo que el resto).
  iglesia: 'M12 2v4M10 4h4M6 22V11l6-5 6 5v11M10 22v-5a2 2 0 0 1 4 0v5M3 22h18',
  parque: 'M12 22v-7M12 3c3.5 0 6 2.7 6 6s-2.7 6-6 6-6-2.7-6-6 2.5-6 6-6z',
  fuente: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  casa: 'M3 11l9-7 9 7v10H3zM9 21v-6h6v6',
  localizar: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 12h.01',
  papelera: 'M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  lapiz: 'M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19l-4 1z',
  candado: 'M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3',
  correo: 'M4 6h16v12H4zM4 7l8 6 8-6',
  ajustes: 'M4 7h8M16 7h4M4 17h4M12 17h8M14 7m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M10 17m-2 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  alerta: 'M12 4L3 19h18L12 4zM12 10v4M12 16.8v.1',
  error: 'M12 8v5M12 16.5v.1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  info: 'M12 11v5M12 8v.1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  menu: 'M5 8h14M5 12h14M5 16h14',
  web: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z',
  andando: 'M13 4m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M10.5 8.5L8 12l1.5 1.5L8 20M10.5 8.5l3 1.5 2.5-1.5M9.5 13.5L13 15l1.5 5',
  metro: 'M9 3.5h6a3 3 0 0 1 3 3V14a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6.5a3 3 0 0 1 3-3zM6 11h12M9.5 3.5V11M14.5 3.5V11M8.5 20.5L10 17M15.5 20.5L14 17M9 14h.01M15 14h.01',
  tranvia: 'M9 2.5h6M12 2.5l-1.5 3M8 5.5h8a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 15V8A2.5 2.5 0 0 1 8 5.5zM5.5 11.5h13M8 20.5l1.5-3M16 20.5l-1.5-3M8.5 14.5h.01M15.5 14.5h.01',
  arena: 'M6 3h12M6 21h12M7 3l5 8 5-8M7 21l5-8 5 8',
  hechoCirculo: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9 12l2 2 4-4',
  cafe: 'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2',
  portapapeles: 'M7 4h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM9 3h6v3H9zM9 12h6M9 16h4',
  // ── Los que faltaban para quitar los emojis de la interfaz (Tanda 6z4): mismo trazo ──
  taxi: 'M5 16v-5l2-5h10l2 5v5M5 16h14v3H5zM7.5 13h.01M16.5 13h.01M10 3h4v2.5h-4z',
  arte: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.7-1.6-.7-2.6c0-1 .8-1.9 1.9-1.9H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  playa: 'M4 11a8 8 0 0 1 16 0zM12 11v9M8 20h8',
  bienestar: 'M12 20c-4 0-7-3-7-7 3 0 5.5 1.3 7 3.5 1.5-2.2 4-3.5 7-3.5 0 4-3 7-7 7zM12 16.5C10.5 14 10.5 9 12 4c1.5 5 1.5 10 0 12.5z',
  nieve: 'M12 3v18M4.2 7.5l15.6 9M19.8 7.5L4.2 16.5M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5',
  bolsa: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  fiesta: 'M4 20L8 9l7 7zM13 5l1 2M17 9l2-1M16 4h.01M19.5 12h.01',
  estrella: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z',
  destello: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4',
  gema: 'M6 4h12l3 5-9 11L3 9zM3 9h18M9 4L7.5 9 12 20M15 4l1.5 5L12 20',
  copa: 'M5 4h14l-7 8zM12 12v8M8 20h8',
  abeto: 'M12 3l5 6h-3l4 5H6l4-5H7zM12 14v6',
  pizza: 'M3.5 7c5-3 12-3 17 0L12 21zM9 10h.01M14 10h.01M11.5 14h.01',
  helado: 'M7.5 11a4.5 4.5 0 0 1 9 0zM8 11l4 10 4-10',
  bocadillo: 'M4 11c0-3 3.5-5 8-5s8 2 8 5zM3 14h18M5 17h14a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3z',
  flor: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 10c-2-1-2-5 0-7 2 2 2 6 0 7zM14 12c1-2 5-2 7 0-2 2-6 2-7 0zM12 14c2 1 2 5 0 7-2-2-2-6 0-7zM10 12c-1 2-5 2-7 0 2-2 6-2 7 0z',
  hoja: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8',
  llave: 'M8 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11.5 12H21M18 12v3M15 12v2',
  familia: 'M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 20c.4-3.2 2.3-5 5-5s4.6 1.8 5 5M17 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15.5 20c.2-2.2 1.2-3.5 3-3.8',
} as const

export type NombreIcono = keyof typeof ICONOS

/** ¿Este texto es el nombre de un icono de la familia? (los pines del mapa llevan o un icono o un texto corto como «+»). */
export function esNombreIcono(valor: string | null | undefined): valor is NombreIcono {
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(ICONOS, valor)
}

/** El icono como `<svg>` en texto, para lo que no es React: el HTML de un pin de Mapbox. Del color del texto (`currentColor`). */
export function iconoSvg(nombre: NombreIcono, size = 14, grosor: number = GROSOR_ICONO): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONOS[nombre]}"/></svg>`
}

/** Los colores de los iconos con significado (diseño): el rosa frambuesa = falta o reservar, el verde = hecho o reservado, el azul = llegada, vuelta y el tiempo. */
export const COLOR_ICONO = {
  tinta: '#1C2230',
  falta: 'oklch(0.55 0.17 5)',
  hecho: 'oklch(0.55 0.11 150)',
  azul: 'oklch(0.56 0.1 230)',
} as const
