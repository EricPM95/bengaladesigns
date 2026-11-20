import type { CSSProperties, ReactNode } from 'react'
import destinosDelLanzamiento from '../../../data/primera_vez/destinos.json'
import { FlagIcon } from '../ui/FlagIcon'

/**
 * (V35A) LAS BANDERAS DEL PANEL, UNA SOLA PIEZA: la bandera de verdad (`flag-icons`, la misma de toda la app), nunca un dibujo a mano. Design pintaba las suyas con degradados y le salían mal (España en blanco, México con la de Italia).
 * `iso` es el código de país de dos letras; `Bandera` también acepta un nombre de país («España», «México») o de destino («Lanzarote», «Roma»): `isoDe` lo traduce. Sin bandera conocida, un hueco gris del mismo tamaño
 * (nunca un hueco en blanco que parezca un fallo).
 */
type Destino = { clave: string; nombre: string; iso: string; pais: string }
const DESTINOS: Destino[] = [...((destinosDelLanzamiento as { salida: Destino[] }).salida ?? []), ...((destinosDelLanzamiento as { proximamente: Destino[] }).proximamente ?? [])]
const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Países que salen como ORIGEN de los viajes (y sus nombres más habituales): nombre sin tildes → código. */
const PAISES: Record<string, string> = {
  espana: 'es', spain: 'es', mexico: 'mx', italia: 'it', italy: 'it', francia: 'fr', france: 'fr', 'reino unido': 'gb', 'united kingdom': 'gb', inglaterra: 'gb', portugal: 'pt', alemania: 'de', germany: 'de',
  'paises bajos': 'nl', holanda: 'nl', netherlands: 'nl', chequia: 'cz', 'republica checa': 'cz', 'estados unidos': 'us', 'united states': 'us', eeuu: 'us', colombia: 'co', argentina: 'ar', chile: 'cl', peru: 'pe',
  brasil: 'br', belgica: 'be', suiza: 'ch', austria: 'at', irlanda: 'ie', grecia: 'gr', polonia: 'pl', suecia: 'se', noruega: 'no', dinamarca: 'dk', finlandia: 'fi', canada: 'ca', ecuador: 'ec', venezuela: 'x1',
  uruguay: 'uy', 'republica dominicana': 'do', cuba: 'cu', marruecos: 'ma', turquia: 'tr', japon: 'jp', china: 'cn', india: 'in', australia: 'au', rumania: 'ro', hungria: 'hu', croacia: 'hr', andorra: 'ad',
}
const POR_DESTINO = new Map<string, string>(DESTINOS.flatMap((d) => [[sinTildes(d.nombre), d.iso], [sinTildes(d.clave), d.iso]] as [string, string][]))

/** Pura: de un código («es»), un país («México») o un destino («Lanzarote») al código de dos letras, o null. */
export function isoDe(valor: string | null | undefined): string | null {
  if (!valor) return null
  const v = String(valor).trim()
  if (/^[A-Za-z]{2}$/.test(v)) return v.toLowerCase()
  const k = sinTildes(v)
  const trozos = k.split(' ')
  return PAISES[k] ?? POR_DESTINO.get(k) ?? PAISES[trozos.slice(-1)[0]] ?? PAISES[trozos.slice(-2).join(' ')] ?? null
}

export function Bandera({ iso, tam = 20, estilo }: { iso: string | null | undefined; tam?: number; estilo?: CSSProperties }): ReactNode {
  const codigo = isoDe(iso ?? null)
  const caja: CSSProperties = { flex: 'none', display: 'inline-flex', width: Math.round(tam * 1.4), height: tam, borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(28,34,48,.18)', position: 'relative', ...estilo }
  if (!codigo) return <span data-bandera="sin" aria-hidden="true" style={{ ...caja, background: '#D9D3C4' }} />
  return (
    <span data-bandera={codigo} aria-hidden="true" style={caja}>
      <span style={{ position: 'absolute', inset: 0, fontSize: tam * 1.4, lineHeight: 1, display: 'block', overflow: 'hidden' }}>
        <FlagIcon countryCode={codigo} className="!block !h-full !w-full !rounded-none" />
      </span>
    </span>
  )
}

/** La bandera de un destino por su nombre o su clave («Lanzarote», «nueva_york»). */
export const BanderaDeDestino = ({ destino, tam }: { destino: string; tam?: number }): ReactNode => <Bandera iso={isoDe(destino)} tam={tam} />
