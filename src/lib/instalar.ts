/**
 * QUE LA WEB SE PUEDA INSTALAR EN EL MÓVIL (Tanda 8A, apartado 7). Con su icono, su nombre y su pantalla de inicio, abierta a pantalla completa, sin la barra del
 * navegador. Todo detrás del interruptor de los logros: con él apagado no se añade nada a la página y la app es la de hoy.
 *
 *   - El nombre y los colores salen de `data/marca.json` (un solo sitio); el manifiesto lo da el servidor: GET /api/manifest.webmanifest.
 *   - Un service worker mínimo (`public/sw.js`): sin modo sin conexión y sin guardar ninguna respuesta del servidor, para no enseñar datos viejos.
 *   - El aviso «Añádela a tu pantalla de inicio»: sale una vez, se puede cerrar y no sale si ya está instalada. La lógica está aquí (pura, se prueba en Node);
 *     la pantalla de ahora es provisional (src/components/logros/AvisoInstalar.tsx) y el diseño llega con Design.
 */

export type Plataforma = 'ios' | 'android' | 'otra'

const CLAVE_AVISO = 'trazo:instalar'

/** Pura: iPhone / iPad, Android u otra cosa, según el navegador. */
export function plataformaDe(userAgent: string, maxTouchPoints = 0): Plataforma {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  return 'otra'
}

/** Pura: ¿se debe enseñar el aviso? Una sola vez, nunca si ya está instalada, y solo en un móvil. */
export function debeEnseñarAvisoDeInstalar(e: { instalada: boolean; yaMostrado: boolean; plataforma: Plataforma }): boolean {
  return !e.instalada && !e.yaMostrado && e.plataforma !== 'otra'
}

/** Pura: cómo se hace en cada móvil. En Android, con el aviso del propio navegador si lo da. */
export function pasosParaInstalar(plataforma: Plataforma, nombreApp: string, hayAvisoDelNavegador: boolean): string[] {
  if (plataforma === 'ios') return ['Toca el botón Compartir, abajo en Safari.', 'Elige «Añadir a pantalla de inicio».', `Toca Añadir: ${nombreApp} aparecerá con su icono.`]
  if (plataforma === 'android') {
    return hayAvisoDelNavegador ? [`Toca Instalar: ${nombreApp} aparecerá con su icono.`] : ['Abre el menú del navegador (los tres puntos).', 'Elige «Instalar aplicación» o «Añadir a pantalla de inicio».', `Toca Instalar: ${nombreApp} aparecerá con su icono.`]
  }
  return []
}

export function yaEstaInstalada(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

export function avisoYaMostrado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_AVISO) === 'si'
  } catch {
    return false
  }
}
export function marcarAvisoMostrado() {
  try {
    window.localStorage.setItem(CLAVE_AVISO, 'si')
  } catch {
    /* sin almacenamiento: puede volver a salir */
  }
}

/** Añade a la página lo que hace falta para instalarla (el manifiesto, los iconos y el service worker). Solo se llama con los logros encendidos. */
export function prepararInstalacion(marca: { nombre: string; color_tema: string; icono_apple: string }) {
  if (typeof document === 'undefined') return
  const poner = (rel: string, href: string) => {
    if (document.head.querySelector(`link[rel="${rel}"]`)) return
    const l = document.createElement('link')
    l.rel = rel
    l.href = href
    document.head.appendChild(l)
  }
  poner('manifest', '/api/manifest.webmanifest')
  poner('apple-touch-icon', marca.icono_apple)
  const meta = (nombre: string, contenido: string) => {
    if (document.head.querySelector(`meta[name="${nombre}"]`)) return
    const m = document.createElement('meta')
    m.name = nombre
    m.content = contenido
    document.head.appendChild(m)
  }
  meta('theme-color', marca.color_tema)
  meta('apple-mobile-web-app-title', marca.nombre)
  if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
}
