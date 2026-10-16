import { cuentasActivas } from './cuentas'
import { supabase } from './supabaseClient'
import { leerDatosDeFoto, type DatosDeFoto } from './exifFoto'

/**
 * LOS LOGROS EN LA APP (Tanda 8A: solo el cerebro; las pantallas llegan en la 8b y la 8c). Todo detrás de un interruptor, apagado en producción: con él apagado
 * (o con las cuentas apagadas) nada de este fichero se ejecuta y la app es la de hoy.
 *
 * El móvil solo MANDA LOS HECHOS; lo decide el servidor (server/logros/):
 *   - el Visto, con su hora y la ubicación de ese momento (solo para decidir: el servidor no guarda las coordenadas);
 *   - los datos de la foto, leídos aquí antes de quitárselos al subirla: la fecha de la cámara, la ubicación si la trae y si es de una cámara.
 * Sin cobertura, el hecho se guarda en el móvil y se manda al volver la señal; la hora que cuenta es la del Visto, no la del envío.
 */

const CLAVE_INTERRUPTOR = 'trazo:logros'
const CLAVE_COLA = 'trazo:logros:cola'

/** Pura: ¿están encendidos los logros? Apagados salvo `VITE_LOGROS_ACTIVOS=true`; en desarrollo también vale `?logros=on` (y `?logros=off`). Y solo con las cuentas encendidas. */
export function calcularLogrosActivos(datos: { entorno?: string | undefined; desarrollo: boolean; parametro?: string | null; guardado?: string | null; cuentas: boolean }): boolean {
  if (!datos.cuentas) return false
  if (datos.desarrollo) {
    const elegido = datos.parametro === 'on' || datos.parametro === 'off' ? datos.parametro : datos.guardado
    if (elegido === 'on') return true
    if (elegido === 'off') return false
  }
  return datos.entorno === 'true'
}

export function logrosActivos(): boolean {
  let parametro: string | null = null
  let guardado: string | null = null
  try {
    parametro = new URLSearchParams(window.location.search).get('logros')
    if (import.meta.env.DEV && (parametro === 'on' || parametro === 'off')) window.sessionStorage.setItem(CLAVE_INTERRUPTOR, parametro)
    guardado = window.sessionStorage.getItem(CLAVE_INTERRUPTOR)
  } catch {
    /* sin ventana o sin almacenamiento: manda el valor de configuración */
  }
  return calcularLogrosActivos({ entorno: import.meta.env.VITE_LOGROS_ACTIVOS, desarrollo: import.meta.env.DEV, parametro, guardado, cuentas: cuentasActivas() })
}

/* ------------------------------------------------------------------ */
/* Lo que devuelve el servidor                                         */
/* ------------------------------------------------------------------ */

/** Un momento de lo que se gana tras un Visto o una foto (server/logros/momentos.js), ya en el orden en que se enseña. */
export interface Momento {
  tipo: 'emblema' | 'suma' | 'suma_sello' | 'coleccion' | 'sello' | 'pais' | 'destino_nuevo' | 'continente' | 'maravilla' | 'patrimonio' | 'viajero'
  nombre: string
  linea?: string | null
  primera_vez: boolean
  /** Solo en los emblemas: la frase de suspense, la primera vez. */
  frase?: string | null
  clave?: string
  [otro: string]: unknown
}

export interface RespuestaDeHecho {
  ok: boolean
  cuenta?: boolean
  valida?: boolean
  motivo?: string | null
  mensaje?: string | null
  aviso?: string | null
  ubic?: 'cerca' | 'lejos' | 'sin'
  nuevos: Momento[]
}

async function cabeceras(): Promise<Record<string, string> | null> {
  const sesion = (await supabase?.auth.getSession())?.data.session
  if (!sesion?.access_token) return null
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.access_token}` }
}

export async function llamar<T = unknown>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T | null> {
  try {
    const cab = await cabeceras()
    if (!cab) return null
    const r = await fetch(ruta, { method: opciones.metodo ?? (opciones.cuerpo ? 'POST' : 'GET'), headers: cab, body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* La ubicación del momento                                            */
/* ------------------------------------------------------------------ */

export interface Ubicacion {
  lat: number
  lng: number
}

/** La ubicación de ahora, o null si no dio permiso o no hay señal. Se usa solo para decidir; no se guarda. */
export function ubicacionDeAhora(esperaMs = 4000): Promise<Ubicacion | null> {
  return new Promise((resolver) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolver(null)
    const fin = setTimeout(() => resolver(null), esperaMs + 500)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(fin)
        resolver({ lat: p.coords.latitude, lng: p.coords.longitude })
      },
      () => {
        clearTimeout(fin)
        resolver(null)
      },
      { enableHighAccuracy: true, timeout: esperaMs, maximumAge: 30000 },
    )
  })
}

/* ------------------------------------------------------------------ */
/* Los hechos, con cola para cuando no hay cobertura                   */
/* ------------------------------------------------------------------ */

export type HechoPendiente =
  | { tipo: 'visto'; cuerpo: { trip_id: string; stop_id?: string | null; nombre?: string | null; sitio?: string | null; instante: string; ubicacion: Ubicacion | null } }
  | { tipo: 'deshacer'; cuerpo: { trip_id: string; stop_id?: string | null; nombre?: string | null } }
  | { tipo: 'foto'; cuerpo: Record<string, unknown> }

const RUTA: Record<HechoPendiente['tipo'], string> = { visto: '/api/logros/visto', deshacer: '/api/logros/deshacer', foto: '/api/logros/foto' }

function leerCola(): HechoPendiente[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE_COLA)
    const lista = crudo ? JSON.parse(crudo) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}
function guardarCola(cola: HechoPendiente[]) {
  try {
    window.localStorage.setItem(CLAVE_COLA, JSON.stringify(cola.slice(-200)))
  } catch {
    /* sin almacenamiento: lo pendiente se pierde al cerrar */
  }
}

/** Manda un hecho. Si no hay cobertura (o el servidor no responde), se guarda en el móvil y se manda después, con la hora de cuando pasó. */
export async function mandarHecho(hecho: HechoPendiente): Promise<RespuestaDeHecho | null> {
  const r = await llamar<RespuestaDeHecho>(RUTA[hecho.tipo], { cuerpo: hecho.cuerpo })
  if (r) return r
  guardarCola([...leerCola(), hecho])
  return null
}

let vaciando = false
/** Manda lo que quedó sin enviar (al volver la señal y al abrir la app). Devuelve lo nuevo que se ha ganado al mandarlo. */
export async function vaciarCola(): Promise<RespuestaDeHecho[]> {
  if (vaciando) return []
  vaciando = true
  const respuestas: RespuestaDeHecho[] = []
  try {
    const cola = leerCola()
    const sobran: HechoPendiente[] = []
    for (const hecho of cola) {
      const r = await llamar<RespuestaDeHecho>(RUTA[hecho.tipo], { cuerpo: hecho.cuerpo })
      if (r) respuestas.push(r)
      else sobran.push(hecho)
    }
    guardarCola(sobran)
  } finally {
    vaciando = false
  }
  return respuestas
}

export const hayPendientes = () => leerCola().length

/** Un Visto: con la hora de ahora y la ubicación de este momento. */
export async function enviarVisto(p: { tripId: string; stopId: string; nombre: string }): Promise<RespuestaDeHecho | null> {
  const instante = new Date().toISOString()
  const ubicacion = await ubicacionDeAhora()
  return mandarHecho({ tipo: 'visto', cuerpo: { trip_id: p.tripId, stop_id: p.stopId, nombre: p.nombre, instante, ubicacion } })
}

export async function enviarDeshacerVisto(p: { tripId: string; stopId: string; nombre: string }): Promise<RespuestaDeHecho | null> {
  return mandarHecho({ tipo: 'deshacer', cuerpo: { trip_id: p.tripId, stop_id: p.stopId, nombre: p.nombre } })
}

/* ------------------------------------------------------------------ */
/* Las fotos                                                           */
/* ------------------------------------------------------------------ */

/** Lo que el servidor necesita de una foto de la galería: la fecha de la cámara, la ubicación si la trae y si es de una cámara. */
export async function datosDeFotoDeLaGaleria(archivo: Blob): Promise<DatosDeFoto> {
  return leerDatosDeFoto(new Uint8Array(await archivo.arrayBuffer()))
}

export async function enviarFotoDeGaleria(p: { tripId: string; stopId?: string | null; nombre: string; archivo: Blob; fotoId?: string | null }): Promise<RespuestaDeHecho | null> {
  const datos = await datosDeFotoDeLaGaleria(p.archivo)
  return mandarHecho({
    tipo: 'foto',
    cuerpo: { trip_id: p.tripId, stop_id: p.stopId ?? null, nombre: p.nombre, origen: 'galeria', tomada_en: datos.tomadaEn, con_camara: datos.conCamara, ubicacion: datos.lat != null && datos.lng != null ? { lat: datos.lat, lng: datos.lng } : null, foto_id: p.fotoId ?? null },
  })
}

export async function enviarFotoDeLaCamara(p: { tripId: string; stopId?: string | null; nombre: string; fotoId?: string | null }): Promise<RespuestaDeHecho | null> {
  const ubicacion = await ubicacionDeAhora()
  return mandarHecho({ tipo: 'foto', cuerpo: { trip_id: p.tripId, stop_id: p.stopId ?? null, nombre: p.nombre, origen: 'app', tomada_en: new Date().toISOString(), con_camara: true, ubicacion, foto_id: p.fotoId ?? null } })
}
