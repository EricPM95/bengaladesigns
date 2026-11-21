import { llamar } from './logros'

/**
 * (V35B) CÓMO USAN LA APP, lo mínimo. Una vez al día (por móvil), la app avisa al servidor de que esta cuenta ha estado activa. El aviso lleva SOLO:
 *   · el tipo de aparato: iPhone, Android u ordenador (sin modelo; un iPad cuenta como «iphone», es el mundo de Apple en pantalla táctil);
 *   · si la usa instalada (pantalla de inicio) o en el navegador.
 * Nada de dirección IP, ni de ubicación, ni del navegador exacto: ni se manda ni se lee. La fecha la pone el servidor. Solo cuentas de verdad. Si el servidor no contesta bien, se vuelve a intentar la próxima vez que se abra.
 */
export type Aparato = 'iphone' | 'android' | 'ordenador'

const CLAVE = 'trazo:uso:ultimo-aviso'

/** Pura: el tipo de aparato a partir del texto del navegador. Regla simple: iPhone/iPad/iPod → iphone; Android → android; el resto → ordenador. `toquesMaximos` distingue un iPad que se hace pasar por Mac. */
export function aparatoDe(agente: string | null | undefined, plataforma: string | null | undefined = '', toquesMaximos = 0): Aparato {
  const ua = String(agente ?? '')
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iphone'
  if (/Android/i.test(ua)) return 'android'
  if (/Mac/i.test(String(plataforma ?? '')) && toquesMaximos > 1) return 'iphone'
  return 'ordenador'
}

/** ¿La app está abierta desde la pantalla de inicio (instalada) y no en una pestaña del navegador? */
export function estaInstalada(): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true
    return (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

/** El cuerpo del aviso: SOLO aparato e instalada. */
export function cuerpoDeUso(): { aparato: Aparato; instalada: boolean } {
  return { aparato: aparatoDe(navigator.userAgent, navigator.platform, navigator.maxTouchPoints), instalada: estaInstalada() }
}

/** El día de hoy de este móvil («2026-11-21»), solo para no avisar dos veces el mismo día. */
const hoyLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Pura: ¿toca avisar hoy? (no se avisó ya hoy). */
export const tocaAvisar = (ultimo: string | null, hoy: string): boolean => ultimo !== hoy

let enCurso: Promise<boolean> | null = null

/** Avisa de que la cuenta ha estado activa hoy, UNA vez al día. Devuelve true si mandó el aviso y el servidor lo aceptó. Nunca lanza error. Si ya hay un aviso en camino, espera a ese (no manda dos a la vez). */
export function avisarDeUsoUnaVezAlDia(): Promise<boolean> {
  enCurso ??= mandarAviso().finally(() => {
    enCurso = null
  })
  return enCurso
}

async function mandarAviso(): Promise<boolean> {
  try {
    const hoy = hoyLocal()
    let ultimo: string | null = null
    try {
      ultimo = window.localStorage.getItem(CLAVE)
    } catch {
      ultimo = null
    }
    if (!tocaAvisar(ultimo, hoy)) return false
    const r = await llamar<{ ok?: boolean }>('/api/uso', { metodo: 'POST', cuerpo: cuerpoDeUso() })
    if (!r?.ok) return false
    try {
      window.localStorage.setItem(CLAVE, hoy)
    } catch {
      /* sin almacenamiento: se avisará otra vez al abrir, sin problema (el servidor guarda un solo día) */
    }
    return true
  } catch {
    return false
  }
}
