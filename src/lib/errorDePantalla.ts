import { useRouteStore } from '../store/useRouteStore'

/**
 * EL AVISO DE «ALGO HA IDO MAL» (10S2): cuando una pantalla se rompe (`ErrorBoundary`), se manda al servidor QUÉ ha fallado y EN QUÉ pantalla, para verlo sin tener que reproducirlo
 * (server/errores.js lo guarda en la tabla `errores_pantalla`, migración 0068, y en el registro del servidor). SIN DATOS PRIVADOS: no se manda quién es, ni sus datos, ni el viaje; solo el mensaje
 * del error, su pila, los componentes que se estaban pintando, la pantalla de la app, la ruta de la dirección (sin parámetros) y la versión. El servidor, además, tacha correos, tokens y claves.
 * Nunca lanza: un aviso de error no puede dar otro error. Se manda una sola vez por error distinto.
 */
const YA_AVISADOS = new Set<string>()

/** Pura: tacha lo que podría ser una llave (la vuelta de Google `#access_token=…`, tokens, códigos, correos): esto NUNCA sale del navegador. */
export function tacharLlaves(texto: string): string {
  return texto
    .replace(/#[^\s)'"]*(?:token|code|key|jwt)[^\s)'"]*=[^\s)'"]*/gi, '#<tachado>')
    .replace(/([?&#](?:code|token|access_token|refresh_token|provider_token|provider_refresh_token|id_token|key|apikey|invitacion|codigo)=)[^&\s#)'"]+/gi, '$1<tachado>')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g, '<token>')
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '<correo>')
}

export interface AvisoDeError {
  pantalla: string
  mensaje: string
  pila: string
  componentes: string
  ruta: string
  version: string
}

/** Pura: arma el aviso a partir del error, la pila de componentes y lo que se sabe de la pantalla. */
export function armarAvisoDeError(error: unknown, componentes: string | undefined, contexto: { pantalla?: string; modo?: string; ruta?: string; version?: string }): AvisoDeError {
  const e = error as { message?: unknown; stack?: unknown } | null | undefined
  const mensaje = typeof e?.message === 'string' ? e.message : String(error ?? '')
  const pila = typeof e?.stack === 'string' ? e.stack : ''
  return {
    pantalla: [contexto.pantalla, contexto.modo].filter(Boolean).join(' / ') || 'desconocida',
    mensaje: tacharLlaves(mensaje).slice(0, 500),
    pila: tacharLlaves(pila).slice(0, 2500),
    componentes: tacharLlaves(componentes ?? '').slice(0, 2500),
    ruta: (contexto.ruta ?? '').split(/[?#]/)[0].slice(0, 120),
    version: (contexto.version ?? '').slice(0, 40),
  }
}

export function avisarDeError(error: unknown, componentes?: string, pieza?: string): void {
  try {
    const estado = useRouteStore.getState() as { screen?: unknown; mode?: unknown }
    const aviso = armarAvisoDeError(error, componentes, {
      pantalla: [typeof estado.screen === 'string' ? estado.screen : undefined, pieza ? `pieza ${pieza}` : undefined].filter(Boolean).join(' / ') || undefined,
      modo: typeof estado.mode === 'string' ? estado.mode : undefined,
      ruta: typeof window !== 'undefined' ? window.location.pathname : '',
      version: typeof import.meta.env.MODE === 'string' ? import.meta.env.MODE : '',
    })
    const clave = `${aviso.pantalla}|${aviso.mensaje.slice(0, 120)}`
    if (YA_AVISADOS.has(clave)) return
    YA_AVISADOS.add(clave)
    const cuerpo = JSON.stringify(aviso)
    // sendBeacon sale aunque la página se recargue justo después («Volver al inicio»); si no existe, fetch con keepalive.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon('/api/error-pantalla', new Blob([cuerpo], { type: 'application/json' }))) return
    }
    void fetch('/api/error-pantalla', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true }).catch(() => undefined)
  } catch {
    /* un aviso de error nunca da otro error */
  }
}
