import { abrirPase } from '../../../../lib/pago'
import { nombreDelPase } from '../../../../lib/nombrePase'
import type { FilaDeHoy } from '../../../../lib/diaDePrueba'
import { Icono } from '../../../ui/Icono'
import { TextoConPase } from '../../../cuenta/TextoConPase'

const ORO = 'linear-gradient(110deg,#E4C58A,#F7E6BE 50%,#E4C58A)'
const BORDE_ORO = 'linear-gradient(120deg,oklch(0.72 0.13 65),oklch(0.92 0.1 90) 45%,oklch(0.72 0.13 65))'

/** P3 (App · Pase y cuenta): el día de llegada sin pase. La misma pieza que en RESERVAS, aquí en HOY. «Ver el pase» abre la compra (el evento de pago de la app). */
export function TarjetaP3({ etiqueta, destino }: { etiqueta: string; destino: string }) {
  return (
    <div data-hoy-p3="1" className="flex flex-none flex-col gap-3 rounded-[22px] bg-[#FFFDF8] p-[18px]" style={{ border: '1px solid rgba(28,34,48,.07)' }}>
      <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgb(var(--accent-hover))' }}>{etiqueta}</span>
      <span style={{ font: "400 24px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        <TextoConPase texto={`¿Acabas de llegar? Con el ${nombreDelPase(destino)}, tu primer día se ajusta a tu vuelo.`} grande />
      </span>
      <button type="button" onClick={abrirPase} className="h-[54px] rounded-full text-[15px] font-bold text-[#17120a]" style={{ background: ORO }}>
        {`Ver el ${nombreDelPase(destino)}`}
      </button>
    </div>
  )
}

/** La pantalla 12: al terminar el día de prueba (o si la prueba ya se gastó). «¿Te ha gustado HOY?» con los días que quedan y [Seguir con HOY]. */
export function TarjetaDiaDePrueba({ dias, fila = null, destino }: { dias: { w: string; n: number }[]; fila?: FilaDeHoy | null; destino: string }) {
  // (Tanda 10H) El texto sale de la tabla del día de prueba (src/lib/diaDePrueba.ts): «¿Qué tal ayer con HOY?» + lo que sigue, o «Tu modo Hoy es parte del Pase de Roma.».
  const texto = fila?.texto ?? `Tu modo Hoy es parte del ${nombreDelPase(destino)}.`
  const corte = fila?.tipo === 'tras_prueba' ? texto.indexOf('? ') : -1
  const titulo = corte >= 0 ? texto.slice(0, corte + 1) : texto
  const cuerpo = corte >= 0 ? texto.slice(corte + 2) : null
  return (
    <div data-hoy-prueba="1" className="relative flex-none rounded-[26px] p-[1.5px]" style={{ background: BORDE_ORO, boxShadow: '0 20px 36px -22px oklch(0.6 0.13 70 / .8)' }}>
      <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-[25px] bg-[#FFFDF8] px-[18px] pb-[18px] pt-[22px]">
        <span aria-hidden="true" className="absolute h-[200px] w-[200px] rounded-full" style={{ right: -60, top: -60, background: 'radial-gradient(circle,oklch(0.86 0.12 85 / .35),transparent 65%)' }} />
        <span className="relative" style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: 'oklch(0.5 0.12 65)' }}>
          {fila?.tipo === 'parte_del_pase' ? 'HOY' : 'Tu día de prueba'}
        </span>
        <span data-hoy-prueba-fila={fila?.tipo ?? 'parte_del_pase'} className="relative" style={{ font: "400 32px/1.02 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          <TextoConPase texto={titulo} grande />
        </span>
        {cuerpo && (
          <span className="relative text-[15px] leading-[1.5] text-[#1C2230]/75">
            <TextoConPase texto={cuerpo} />
          </span>
        )}
        {dias.length > 0 && (
          <div className="relative mt-1 grid gap-1.5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
            {dias.slice(0, 8).map((d) => (
              <span key={`${d.w}${d.n}`} className="flex h-[50px] flex-col items-center justify-center gap-0.5 rounded-[13px] bg-[#F5EFE4]" style={{ border: '1px solid rgba(28,34,48,.06)' }}>
                <span style={{ font: "600 9px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.55)' }}>{d.w}</span>
                <span style={{ font: "400 20px/1 'Instrument Serif',serif" }}>{d.n}</span>
              </span>
            ))}
          </div>
        )}
        <button type="button" onClick={abrirPase} className="relative mt-1.5 flex h-[54px] items-center justify-center gap-2 rounded-full text-[15px] font-bold text-[#1C2230]" style={{ background: ORO, boxShadow: '0 12px 24px -12px oklch(0.75 0.13 70)' }}>
          {`Ver el ${nombreDelPase(destino)}`}
          <Icono nombre="flecha" size={15} grosor={2.2} />
        </button>
      </div>
    </div>
  )
}
