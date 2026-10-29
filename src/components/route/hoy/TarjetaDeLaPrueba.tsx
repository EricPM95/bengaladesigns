import type { FilaDeHoy } from '../../../lib/diaDePrueba'
import { abrirPase } from '../../../lib/pago'
import { nombreDelPase } from '../../../lib/nombrePase'
import { TextoConPase } from '../../cuenta/TextoConPase'
import { TarjetaOscura, botonOro, ojoMono } from './piezas'

const ETIQUETA_DE_PRUEBA = 'Tu día de prueba'
const CON_ETIQUETA = new Set<FilaDeHoy['tipo']>(['prueba_otro_dia', 'prueba_primer_dia', 'manana_es_prueba', 'hoy_es_prueba', 'prueba_mas_adelante', 'tras_prueba'])

/**
 * LA FRANJA DEL DÍA DE PRUEBA (Tanda 10H): arriba de HOY entero, el día de la prueba (de 00:00 a 23:59, hora del destino): «Hoy es tu día de prueba: tienes el Pase Roma completo, gratis, hasta medianoche. Disfrútalo.»
 */
export function FranjaDiaDePrueba({ fila }: { fila: FilaDeHoy }) {
  if (!fila.texto) return null
  return (
    <div data-franja-prueba className="flex flex-none items-center gap-3 rounded-[20px] px-4 py-3" style={{ background: 'linear-gradient(110deg,#F7E6BE,#FBF3E2)', border: '1px solid rgba(166,124,82,.35)' }}>
      <span style={{ font: "500 14px/1.4 'Geist'", color: '#1C2230', textWrap: 'pretty' as never }}>
        <TextoConPase texto={fila.texto} />
      </span>
    </div>
  )
}

/**
 * LO QUE DICE HOY SIN PASE sobre la prueba, según la fila de la tabla (`filaDeHoySinPase`, src/lib/diaDePrueba.ts):
 *  - antes del viaje (desde 5 días antes, con la prueba sin usar): una tarjeta clara debajo de la cuenta atrás y de «Hoy te dará»;
 *  - durante y después del viaje: la tarjeta oscura con el texto de la fila y, si toca, [Ver el Pase Roma].
 * El destino y el pase salen siempre de los datos; «HOY» y «Pase X» van en oro (`TextoConPase`).
 */
export function TarjetaDeLaPrueba({ fila, destino, enOscuro = false }: { fila: FilaDeHoy; destino: string; enOscuro?: boolean }) {
  if (!fila.texto || fila.tipo === 'hoy_es_prueba') return null
  const etiqueta = CON_ETIQUETA.has(fila.tipo) ? ETIQUETA_DE_PRUEBA : null
  const boton = fila.verElPase && (
    <button type="button" onClick={abrirPase} data-hoy-ver-pase className="relative mt-3 flex h-[54px] items-center justify-center rounded-full text-[15px] font-bold" style={botonOro()}>
      {`Ver el ${nombreDelPase(destino)}`}
    </button>
  )
  if (enOscuro) {
    return (
      <TarjetaOscura>
        {etiqueta && (
          <span className="relative" style={{ ...ojoMono, color: '#E9C77A' }}>
            {etiqueta}
          </span>
        )}
        <span data-hoy-prueba-fila={fila.tipo} className="relative" style={{ font: "400 28px/1.12 'Instrument Serif',serif", textWrap: 'balance' as never }}>
          <TextoConPase texto={fila.texto} oscuro grande />
        </span>
        {boton}
      </TarjetaOscura>
    )
  }
  return (
    <div data-hoy-sin-pase data-hoy-prueba-fila={fila.tipo} className="flex flex-none flex-col gap-3 rounded-[22px] bg-[#FFFDF8] p-[18px]" style={{ border: '1px solid rgba(166,124,82,.22)' }}>
      {etiqueta && <span style={{ ...ojoMono, color: 'rgb(var(--accent-hover))' }}>{etiqueta}</span>}
      <span style={{ font: "400 24px/1.15 'Instrument Serif',serif", textWrap: 'balance' as never }}>
        <TextoConPase texto={fila.texto} grande />
      </span>
      {boton}
    </div>
  )
}
