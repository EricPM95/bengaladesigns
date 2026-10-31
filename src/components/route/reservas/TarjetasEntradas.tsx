import type { CSSProperties } from 'react'
import { Icono } from '../../ui/Icono'
import { BotonCodigoDeEntrada } from './EntradaConBillete'
import type { Stop } from '../../../lib/types'
import { useFotoDeParada } from '../hoy/v2/useFotoDeParada'

/**
 * (10S6) Las tarjetas del bloque «Entradas y Free Tour», exactamente como Design `Piezas/Entradas Lista` (L1 y L2):
 * «Por reservar» (miniatura con la entrada, «En tu ruta · Jueves 26», nombre, [Reservar entrada] y «¿Ya la tienes? Añádela») y
 * «Reservada» (borde verde, ✓ en la miniatura, día entero · hora · precio y «Cambiar»). Sin el botón del código (llega con el billete de las entradas).
 */

const VERDE = '#2B7F45'
const ORO = '#B58A2E'

/** El rótulo de cada parte: «RESERVADAS · 2», «POR RESERVAR · 3». */
export const ROTULO: CSSProperties = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' }

/** El color de la miniatura, estable por nombre (la foto del sitio no está en los datos de la entrada). */
function tono(nombre: string): number {
  let h = 0
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

/**
 * (10S7) La foto del sitio de la entrada: la misma que tiene su parada en DÍAS y en su ficha (`parada.photoUrl`; si la parada viene sin ella, se pide por su nombre como en el resto de la app).
 * Sin parada en la ruta, se pide por el nombre del sitio (salvo el Free Tour). Sin foto, queda el degradado.
 */
function useFotoDeLaEntrada(parada: Stop | null | undefined, nombre: string, ciudad: string, freeTour: boolean): string {
  const base = parada ?? (freeTour ? null : ({ id: `entrada-${nombre}`, name: nombre } as Stop))
  return useFotoDeParada(base, ciudad, null)
}

function Miniatura({ nombre, lado, parada, ciudad = '', freeTour = false, children }: { nombre: string; lado?: number; parada?: Stop | null; ciudad?: string; freeTour?: boolean; children: React.ReactNode }) {
  const h = tono(nombre)
  const foto = useFotoDeLaEntrada(parada, nombre, ciudad, freeTour)
  return (
    <span className="relative block flex-none" style={lado ? undefined : { alignSelf: 'stretch' }}>
      <span
        data-miniatura-entrada={foto ? 'foto' : 'degradado'}
        className="relative block flex-none overflow-hidden"
        style={{ width: lado ?? 82, height: lado ?? '100%', minHeight: lado ?? 96, borderRadius: 16, background: `linear-gradient(150deg,oklch(0.72 0.07 ${h}),oklch(0.46 0.06 ${(h + 25) % 360}))` }}
      >
        {foto ? <img src={foto} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0 2px,transparent 2px 12px)' }} />}
      </span>
      {children}
    </span>
  )
}

export function TarjetaReservada({ etiqueta, name, meta, nota, onChange, parada, ciudad, freeTour, onCodigo }: { etiqueta: string; name: string; meta: string; nota?: string; onChange?: () => void; parada?: Stop | null; ciudad?: string; freeTour?: boolean; /** (10S7 §4) El botón del código (el cuadradito de la derecha): solo si esa entrada tiene su billete. */ onCodigo?: () => void }) {
  return (
    <div data-entrada-color="verde" data-tarjeta-reservada className="flex items-center gap-3 rounded-[22px] bg-[#FFFDF8] p-2.5" style={{ border: `1.5px solid ${VERDE}` }}>
      <Miniatura nombre={name} lado={64} parada={parada} ciudad={ciudad} freeTour={freeTour}>
        <span className="absolute flex h-[26px] w-[26px] items-center justify-center rounded-full" style={{ right: -5, bottom: -5, background: VERDE, border: '2px solid #FFFDF8' }} aria-hidden="true">
          <Icono nombre="hecho" size={13} grosor={3} style={{ color: '#fff' }} />
        </span>
      </Miniatura>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: VERDE, textTransform: 'uppercase' }}>{etiqueta}</span>
        <span className="[overflow-wrap:anywhere]" style={{ font: "400 21px/1.05 'Instrument Serif',serif" }}>
          {name}
        </span>
        <span style={{ font: "500 12.5px 'Geist'", color: 'rgba(28,34,48,.62)' }}>{meta}</span>
        {nota && (
          <span data-nota-reserva className="text-[12px] leading-snug text-text/60">
            {nota}
          </span>
        )}
      </div>
      {(onChange || onCodigo) && (
        <div className={onCodigo ? 'flex flex-none flex-col items-end gap-2' : 'flex-none self-start'}>
          {onCodigo && <BotonCodigoDeEntrada onClick={onCodigo} />}
          {onChange && (
            <button type="button" onClick={onChange} className="zona-toque px-1 py-1 text-ink underline underline-offset-[3px]" style={{ font: "italic 400 16px 'Instrument Serif',serif" }}>
              Cambiar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function TarjetaPorReservar({
  eyebrow,
  name,
  buyLabel,
  onBuy,
  onAdd,
  nota,
  delGrupo = false,
  freeTour = false,
  parada,
  ciudad,
}: {
  parada?: Stop | null
  ciudad?: string
  eyebrow: string
  name: string
  buyLabel: string
  onBuy: () => void
  onAdd: () => void
  nota?: string
  delGrupo?: boolean
  freeTour?: boolean
}) {
  return (
    <div
      data-entrada-color={delGrupo ? 'grupo' : 'falta'}
      data-tarjeta-por-reservar
      className="flex gap-3 rounded-[22px] bg-[#FFFDF8] p-2.5"
      style={{ border: delGrupo ? '1.5px solid rgba(233,199,122,.7)' : '1px solid rgba(28,34,48,.08)', boxShadow: '0 10px 22px -16px rgba(28,34,48,.4)' }}
    >
      <Miniatura nombre={name} parada={parada} ciudad={ciudad} freeTour={freeTour}>
        <span className="absolute flex h-[26px] w-[26px] items-center justify-center rounded-full" style={{ left: 6, top: 6, background: '#1C2230', border: `1.5px solid ${ORO}` }} aria-hidden="true">
          <Icono nombre={freeTour ? 'free' : 'reservas'} size={13} style={{ color: '#F3D88F' }} />
        </span>
      </Miniatura>
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5 pr-0.5">
        <span className="flex flex-col gap-[3px]">
          <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)', textTransform: 'uppercase' }}>{eyebrow}</span>
          <span data-entrada-nombre className="[overflow-wrap:anywhere]" style={{ font: "400 22px/1.05 'Instrument Serif',serif" }}>
            {name}
          </span>
          {nota && <span className="text-[11.5px] leading-snug text-text/60">{nota}</span>}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBuy}
            className="zona-toque flex h-[42px] min-w-0 flex-1 items-center justify-center rounded-[13px] px-2 text-center active:scale-[.98]"
            style={
              delGrupo
                ? { background: '#1C2230', color: '#F3D88F', boxShadow: 'inset 0 0 0 1.2px rgba(233,199,122,.6)', font: "700 13px/1.1 'Geist'" }
                : { background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 14px 'Geist'", boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55),0 8px 16px -12px rgba(110,80,24,.7)' }
            }
          >
            {buyLabel}
          </button>
          <span className="flex-none text-center" style={{ font: "500 12px/1.25 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            ¿Ya la tienes?
            <br />
            <button type="button" onClick={onAdd} className="zona-toque" style={{ color: '#8E6820', textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>
              Añádela
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}
