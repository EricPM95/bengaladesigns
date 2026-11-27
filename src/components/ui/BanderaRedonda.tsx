import type { CSSProperties, ReactNode } from 'react'
import { isoDe } from '../panel/banderas'
import { FlagIcon } from './FlagIcon'

/**
 * (V79) LA BANDERA REDONDA de un país, para la esquina de una medalla («Italia · país nuevo», Design VL7a). Es la bandera de verdad (`flag-icons`, la versión cuadrada recortada en círculo, la misma de toda la app:
 * `FlagIcon`; su CSS se baja aparte, después de abrir): nunca el emoji, que en Windows sale como «IT». Sin bandera conocida no pinta nada (nunca un hueco).
 * `esquina`: dónde va dentro de quien la contiene (que debe ser `position: relative`): arriba a la derecha o abajo a la derecha (donde la esquina de arriba ya lleva el círculo de la vitrina, + / ✓).
 */
const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const EXTRAS: Record<string, string> = { vaticano: 'va', 'ciudad del vaticano': 'va', 'san marino': 'sm', monaco: 'mc', liechtenstein: 'li', malta: 'mt', luxemburgo: 'lu', islandia: 'is', 'nueva zelanda': 'nz', egipto: 'eg', tailandia: 'th', indonesia: 'id' }
let inversa: Map<string, string> | null = null

/** Pura: del nombre de un país en español («Italia», «Ciudad del Vaticano») a su código de dos letras, o null. Primero la tabla de la app; después, los nombres en español que ya sabe el navegador. */
export function isoDePais(nombre: string | null | undefined): string | null {
  if (!nombre) return null
  const k = sinTildes(nombre)
  if (EXTRAS[k]) return EXTRAS[k]!
  const conocido = isoDe(nombre)
  if (conocido) return conocido
  if (!inversa) {
    inversa = new Map()
    try {
      const nombres = new Intl.DisplayNames(['es'], { type: 'region' })
      for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) {
        const c = String.fromCharCode(a, b)
        const n = nombres.of(c)
        if (n && n !== c) inversa.set(sinTildes(n), c.toLowerCase())
      }
    } catch {
      /* sin Intl: solo la tabla de la app */
    }
  }
  return inversa.get(k) ?? null
}

export function BanderaRedonda({ pais, tam = 18, esquina, estilo }: { pais: string | null | undefined; tam?: number; esquina?: 'arriba-derecha' | 'abajo-derecha'; estilo?: CSSProperties }): ReactNode {
  const iso = isoDePais(pais)
  if (!iso) return null
  const posicion: CSSProperties = esquina ? { position: 'absolute', right: -3, ...(esquina === 'arriba-derecha' ? { top: -3 } : { bottom: -3 }) } : {}
  return (
    <span
      data-bandera-redonda={iso}
      aria-hidden="true"
      style={{ flex: 'none', display: 'inline-block', width: tam, height: tam, borderRadius: '50%', overflow: 'hidden', background: '#E9E2D2', boxShadow: '0 0 0 2px #FFFDF8, 0 2px 5px rgba(28,34,48,.3)', fontSize: tam, lineHeight: 1, ...posicion, ...estilo }}
    >
      <FlagIcon countryCode={iso} className="fis !block !h-full !w-full !rounded-none" />
    </span>
  )
}
