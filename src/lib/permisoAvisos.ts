import { llamarServidor } from './servidor'
import { plataformaDe, yaEstaInstalada, type Plataforma } from './instalar'
import { supabase } from './supabaseClient'

/**
 * EL PERMISO DE LOS AVISOS DEL MÓVIL (cuentas parte 3, punto 4). Ya no hay tarjetas que pregunten si queremos avisos: la ventana del móvil (la del propio navegador) sale UNA SOLA VEZ, justo
 * después de [Compartir viaje] o de [Enviar a Elena], o al acabar el primer día del viaje (lo que pase antes). Si dice que no, todo sigue llegando a la campanita.
 * En iPhone, los avisos de una web solo llegan si está en la pantalla de inicio: si no lo está, NO se pide el permiso. Los avisos se encienden y se apagan de verdad desde Ajustes.
 */

const CLAVE_PREGUNTADO = 'trazo:push:preguntado'

export interface EstadoParaPedir {
  plataforma: Plataforma
  instalada: boolean
  /** El navegador sabe de avisos (service worker, push y notificaciones). */
  disponible: boolean
  preguntado: boolean
  /** `Notification.permission` */
  permiso: NotificationPermission | 'sin'
  /** El servidor tiene los avisos encendidos (clave pública). */
  servidorListo: boolean
}

/** Pura: ¿toca pedir el permiso ahora? Una sola vez en la vida, nunca en iPhone sin la web instalada, nunca si el permiso ya está decidido y solo si el servidor los tiene encendidos. */
export function tocaPedirPermiso(e: EstadoParaPedir): boolean {
  if (!e.disponible || !e.servidorListo || e.preguntado) return false
  if (e.permiso !== 'default') return false
  if (e.plataforma === 'ios' && !e.instalada) return false
  return true
}

const avisosDisponibles = (): boolean => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function yaPreguntado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_PREGUNTADO) === 'si'
  } catch {
    return false
  }
}
function apuntarPreguntado(): void {
  try {
    window.localStorage.setItem(CLAVE_PREGUNTADO, 'si')
  } catch {
    /* sin almacenamiento: se podría volver a pedir; el navegador ya recuerda lo que se contestó */
  }
}

let claveEnCache: string | null = null
async function clavePublica(): Promise<string | null> {
  if (claveEnCache) return claveEnCache
  const r = await llamarServidor<{ ok: boolean; clave: string | null }>('/api/avisos/push/clave', { sinCuenta: true })
  claveEnCache = r.datos?.ok && r.datos.clave ? r.datos.clave : null
  return claveEnCache
}

/** Se llama al empezar: así, cuando toque pedir el permiso, la ventana del móvil sale EN EL MISMO TOQUE de la persona (los navegadores no la dejan salir si hay una espera de red de por medio). */
export async function prepararPermisoDeAvisos(): Promise<void> {
  if (avisosDisponibles() && !yaPreguntado()) await clavePublica()
}

const aBytes = (base64: string): Uint8Array => {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const crudo = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...crudo].map((c) => c.charCodeAt(0)))
}

/** Suscribe este móvil a los avisos y lo guarda en la cuenta. Devuelve false si no se pudo. */
async function suscribir(clave: string): Promise<boolean> {
  try {
    const registro = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    const sub = (await registro.pushManager.getSubscription()) ?? (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) as BufferSource }))
    const json = sub.toJSON()
    if (!supabase || !json.endpoint || !json.keys) return false
    const { error } = await supabase.from('push_suscripciones').upsert({ endpoint: json.endpoint, claves: json.keys }, { onConflict: 'endpoint' })
    return !error
  } catch {
    return false
  }
}

export type ResultadoDelPermiso = 'concedido' | 'rechazado' | 'no_toca'

/** La ventana del móvil, UNA vez. Devuelve qué pasó (para no preguntar otra vez ni enseñar nada más). Hay que llamarla desde un toque de la persona (los navegadores lo exigen). */
export async function pedirPermisoUnaVez(): Promise<ResultadoDelPermiso> {
  const clave = claveEnCache
  const toca = tocaPedirPermiso({
    plataforma: plataformaDe(navigator.userAgent, navigator.maxTouchPoints),
    instalada: yaEstaInstalada(),
    disponible: avisosDisponibles(),
    preguntado: yaPreguntado(),
    permiso: avisosDisponibles() ? Notification.permission : 'sin',
    servidorListo: clave != null,
  })
  if (!toca || !clave) return 'no_toca'
  let permiso: NotificationPermission = 'default'
  try {
    permiso = await Notification.requestPermission()
  } catch {
    permiso = 'default'
  }
  // Si el navegador no llegó a preguntar (sin toque de la persona), no se gasta la única vez.
  if (permiso === 'default') return 'no_toca'
  apuntarPreguntado()
  if (permiso !== 'granted') return 'rechazado'
  return (await suscribir(clave)) ? 'concedido' : 'rechazado'
}

/** Ajustes: ¿están encendidos los avisos de ESTE móvil? (permiso dado y una suscripción guardada). */
export async function avisosDelMovilEncendidos(): Promise<boolean> {
  if (!avisosDisponibles() || Notification.permission !== 'granted') return false
  try {
    const registro = await navigator.serviceWorker.getRegistration('/sw.js')
    return Boolean(await registro?.pushManager.getSubscription())
  } catch {
    return false
  }
}

/** Ajustes: enciende los avisos de este móvil (pide el permiso si hace falta). Devuelve true si quedaron encendidos. */
export async function encenderAvisosDelMovil(): Promise<boolean> {
  if (!avisosDisponibles()) return false
  const clave = await clavePublica()
  if (!clave) return false
  const permiso = Notification.permission === 'default' ? await Notification.requestPermission().catch(() => 'denied' as const) : Notification.permission
  apuntarPreguntado()
  if (permiso !== 'granted') return false
  return suscribir(clave)
}

/** Ajustes: apaga los avisos de este móvil (borra la suscripción de aquí y de la cuenta). */
export async function apagarAvisosDelMovil(): Promise<void> {
  try {
    const registro = await navigator.serviceWorker.getRegistration('/sw.js')
    const sub = await registro?.pushManager.getSubscription()
    if (!sub) return
    const endpoint = sub.endpoint
    await sub.unsubscribe()
    await supabase?.from('push_suscripciones').delete().eq('endpoint', endpoint)
  } catch {
    /* sin suscripción que quitar */
  }
}

/** Justo después de una acción que avisa a otra persona (enviar una propuesta, contestarla), se pide al servidor que mande los avisos pendientes. No espera ni falla en voz alta. */
export function mandarAvisosPendientes(): void {
  void llamarServidor('/api/avisos/enviar', { metodo: 'POST', cuerpo: {} })
}

/** Guarda la zona horaria de esta persona (para no avisarle de noche). Una vez por sesión del navegador. */
export async function guardarMiZona(): Promise<void> {
  try {
    if (!supabase || window.sessionStorage.getItem('trazo:zona') === 'ok') return
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zona) await supabase.rpc('poner_zona', { p_zona: zona })
    window.sessionStorage.setItem('trazo:zona', 'ok')
  } catch {
    /* sin zona: el servidor usa la del destino */
  }
}
