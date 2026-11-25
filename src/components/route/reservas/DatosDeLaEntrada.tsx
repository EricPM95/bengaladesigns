import { useRef, useState } from 'react'
import { puntualidadDe } from '../../../lib/puntualidadEntradas'
import type { CodigoDelBillete } from '../../../store/useBilleteStore'
import type { Persona } from '../../../store/useViajeCompartido'
import { nombreDe } from '../../../store/useViajeCompartido'
import { DORADO } from '../../ui/botonesOro'
import { CajaDeDato, RejillaDeDatos } from './PiezasDesignReservas'
import { ImagenDelCodigo } from './TarjetaBillete'

/**
 * (V65 §1 y §2) LO QUE COMPARTEN LA TARJETA GUARDADA DE LA ENTRADA Y LA DE LA EXCURSIÓN (D7a-D7d; «al final es lo mismo»):
 *  · «DATOS DE LA ENTRADA» en cajas de dos (PRECIO, LOCALIZADOR, PERSONAS, ACCESO); la que no tiene dato no sale y las demás se recolocan.
 *  · El bloque oscuro del QR, deslizable cuando hay un código por persona: «TU ENTRADA · 1 DE 2» → «ALICIA · 2 DE 2», con sus puntitos.
 * Usa las piezas de la V64 (`CajaDeDato`, `RejillaDeDatos`, el bloque oscuro del vuelo). Los datos por persona los da `entradasPorPersona.ts` (otro agente): aquí solo se pintan.
 */

const D = {
  localizador: 'M3 7h18v10H3zM9 7v10M13 10h4M13 14h3',
  personas: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6 6 0 0 1 3.5 5.5',
  acceso: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
}

/** ACCESO, de la puntualidad de la V54: «Hora exacta · Llega 15 min antes», «Con margen · Hasta N min tarde» o «Todo el día». Sin hora y no libre, no hay dato. */
export function accesoDeLaEntrada(nombre: string, hora: string | null | undefined): { valor: string; sub: string | null } | null {
  const p = puntualidadDe(nombre)
  if (p.tipo === 'libre') return { valor: 'Todo el día', sub: null }
  if (!/^\d{1,2}:\d{2}$/.test(hora ?? '')) return null
  if (p.tipo === 'margen') return { valor: 'Con margen', sub: `Hasta ${p.margenMin} min tarde` }
  return { valor: 'Hora exacta', sub: 'Llega 15 min antes' }
}

/** «Eric y Alicia» / «Tú, Eric y Alicia». En el móvil de quien no la compró, él sale como «Tú». */
export function nombresDeLasPersonas(gente: Persona[], mia: boolean): string {
  const nombres = gente.map((p) => (p.esYo && !mia ? 'Tú' : nombreDe(p) || (p.esYo ? 'Tú' : 'Alguien')))
  if (!mia) nombres.sort((a, b) => (a === 'Tú' ? -1 : b === 'Tú' ? 1 : 0))
  return nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/**
 * «DATOS DE LA ENTRADA» (D7a-D7c). `personas` = cuántas; `quienes` = «Eric y Alicia» (solo en un viaje en grupo); `compro` = «Eric» en el móvil de quien no la compró («Tú y Eric · La compró Eric»).
 * `rotulo` cambia en la excursión («DATOS DE LA EXCURSIÓN»). Sin ningún dato, no sale nada.
 */
export function DatosDeLaEntrada({ rotulo = 'DATOS DE LA ENTRADA', precio, localizador, personas, quienes, compro, acceso, datos }: { rotulo?: string; precio: string | null; localizador: string | null; personas: number | null; quienes?: string | null; compro?: string | null; acceso: { valor: string; sub: string | null } | null; datos: string }) {
  if (!precio && !localizador && !personas && !acceso) return null
  const sub = [quienes, compro ? `La compró ${compro}` : null].filter(Boolean).join(' · ')
  return (
    <RejillaDeDatos rotulo={rotulo} datos={datos}>
      {precio && (
        <CajaDeDato rotulo="PRECIO" icono={{ eur: true }} datos="precio">
          {precio}
        </CajaDeDato>
      )}
      {localizador && (
        <CajaDeDato rotulo="LOCALIZADOR" icono={{ d: D.localizador }} datos="localizador">
          {localizador}
        </CajaDeDato>
      )}
      {personas ? (
        <CajaDeDato rotulo="PERSONAS" icono={{ d: D.personas }} datos="personas">
          {personas}
          {sub && <span className="block" style={{ font: "400 12px/1.25 'Geist'", color: 'rgba(28,34,48,.62)' }}>{sub}</span>}
        </CajaDeDato>
      ) : null}
      {acceso && (
        <CajaDeDato rotulo="ACCESO" icono={{ d: D.acceso }} datos="acceso">
          <span className="whitespace-nowrap" style={{ fontSize: 13.5 }}>{acceso.valor}</span>
          {acceso.sub && <span className="block" style={{ font: "400 12px/1.25 'Geist'", color: 'rgba(28,34,48,.62)' }}>{acceso.sub}</span>}
        </CajaDeDato>
      )}
    </RejillaDeDatos>
  )
}

/** Un código del bloque: el suyo (`tuya`) o el de otra persona del grupo (`nombre`). */
export interface DocumentoDelBloque {
  clave: string
  codigo: CodigoDelBillete
  nombre?: string | null
  tuya?: boolean
}

/**
 * El bloque oscuro del QR (D7d), el mismo del vuelo de la V64. Con varios códigos se desliza (uno por persona, la tuya primero) y lleva sus puntitos; [Ampliar] amplía el que se ve (`onAmpliar(documento)`).
 * Rótulo: «TU ENTRADA» (uno solo), «TU ENTRADA · 1 DE 2» / «ALICIA · 2 DE 2» (uno por persona) y «ENTRADA PARA 4» (un solo código para todos: `paraTodos`).
 */
export function BloqueDelCodigo({ documentos, paraTodos = null, onAmpliar, datos, faltan = [], onSubir }: { documentos: DocumentoDelBloque[]; paraTodos?: number | null; onAmpliar: (d: DocumentoDelBloque) => void; datos: string; /** (V65) Las personas de la entrada que aún no tienen su código: una diapositiva «Falta · [Subir]» cada una. */ faltan?: { clave: string; nombre: string }[]; onSubir?: () => void }) {
  const [vista, setVista] = useState(0)
  const pista = useRef<HTMLDivElement>(null)
  if (documentos.length === 0) return null
  const total = documentos.length + (onSubir ? faltan.length : 0)
  const varios = total > 1
  const rotuloDe = (d: DocumentoDelBloque, i: number) => {
    if (!varios) return paraTodos && paraTodos > 1 ? `ENTRADA PARA ${paraTodos}` : 'TU ENTRADA'
    const n = `${i + 1} DE ${total}`
    return d.tuya ? `TU ENTRADA · ${n}` : `${(d.nombre ?? 'Alguien').toUpperCase()} · ${n}`
  }
  const alDeslizar = () => {
    const el = pista.current
    if (!el) return
    const paso = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth
    setVista(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / Math.max(1, paso + 8)))))
  }
  return (
    <div className="flex flex-col gap-2.5" data-bloque-codigo={datos}>
      <div ref={pista} onScroll={alDeslizar} className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-3.5 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: 'x mandatory', marginBottom: -10 }} data-codigo-pista>
        {documentos.map((d, i) => (
          <div key={d.clave} data-billete-codigo-pequeno data-codigo-slide={i} className="flex flex-none items-center gap-3.5 rounded-[20px] p-3.5" style={{ width: varios ? 'calc(100% - 26px)' : '100%', scrollSnapAlign: 'start', background: 'linear-gradient(160deg,#232A3C,#1C2230)', boxShadow: '0 16px 24px -18px rgba(28,34,48,.9)' }}>
            <button type="button" onClick={() => onAmpliar(d)} aria-label="Ampliar el código" data-billete-codigo-qr className="flex-none rounded-[14px] border-none bg-white p-2">
              <ImagenDelCodigo codigo={d.codigo} tam={84} />
            </button>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="whitespace-nowrap" data-codigo-rotulo style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>
                {rotuloDe(d, i)}
              </span>
              <span style={{ font: "400 20px/1.15 'Instrument Serif',serif", color: '#FFFDF8' }}>Enséñala en la puerta</span>
              <button type="button" onClick={() => onAmpliar(d)} data-billete-ampliar className="flex h-[34px] items-center gap-[7px] self-start rounded-xl border-none px-[13px] text-[12.5px] font-bold" style={{ background: DORADO, color: '#4A3510' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A3510" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
                </svg>
                Ampliar
              </button>
            </span>
          </div>
        ))}
        {onSubir && faltan.map((f, j) => (
          <div key={f.clave} data-codigo-falta={f.clave} className="flex flex-none items-center gap-3.5 rounded-[20px] p-3.5" style={{ width: 'calc(100% - 26px)', scrollSnapAlign: 'start', background: 'linear-gradient(160deg,#232A3C,#1C2230)', boxShadow: '0 16px 24px -18px rgba(28,34,48,.9)', minHeight: 116 }}>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="whitespace-nowrap" style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#F3D88F' }}>{`${(f.nombre || 'Alguien').toUpperCase()} · ${documentos.length + j + 1} DE ${total}`}</span>
              <span style={{ font: "400 20px/1.15 'Instrument Serif',serif", color: 'rgba(255,253,248,.7)' }}>Falta</span>
              <button type="button" onClick={onSubir} data-codigo-falta-subir className="flex h-[34px] items-center gap-[7px] self-start rounded-xl border-none px-[13px] text-[12.5px] font-bold" style={{ background: DORADO, color: '#4A3510' }}>Subir</button>
            </span>
          </div>
        ))}
      </div>
      {varios && (
        <div className="flex items-center justify-center gap-1.5" data-codigo-puntos aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} data-punto={i === vista ? 'activo' : 'inactivo'} className="h-1.5 rounded-full" style={{ width: i === vista ? 22 : 6, background: i === vista ? '#B58A2E' : 'rgba(28,34,48,.2)' }} />
          ))}
        </div>
      )}
    </div>
  )
}
