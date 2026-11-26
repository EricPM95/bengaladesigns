import type { DayPlan, Route, Stop } from '../../../lib/types'
import type { Propuesta } from '../../../lib/hoyCambiarPlan'
import type { FilaDeCambio } from '../../../lib/excursionMove'
import { cuadradoDelDia, nombreDelDia } from '../../../lib/tarjetasDePropuesta'
import { numberedStopsOf } from '../../../lib/stopKind'
import { HojaV2 } from '../hoy/v2/HojasV2'
import { TarjetasDeCambios, Titulo } from '../hoy/v2/CambiarPlan'
import { BOTON_CLARO, BOTON_ORO } from '../../ui/botonesOro'

/**
 * (V69, apartado 2; Design «Entrada Mueve Dias» E1/E2) LA HOJA DE MOVER DÍAS POR UNA ENTRADA O UNA EXCURSIÓN. Sale ANTES de aplicar nada (antes, la hoja vieja «Tu Coliseo, el martes 13. Para que encaje, cambiamos estos días: …» salía con un solo [De acuerdo]):
 *   · el título («Tu entrada del Coliseo, el martes 13» / «Tu excursión a Pompeya, el jueves 15») y el texto de por qué;
 *   · UNA tarjeta por cada DÍA que cambia (`TarjetaDelSitio`, la pieza de las hojas de propuesta: la foto real del sitio principal del día, el nombre del día, «Pasa al miércoles 14» y su cuadrado de fecha; con más de 3, «y N más»);
 *   · DOS botones lado a lado, del mismo tamaño: [Cambiar los días] (dorado, con la etiqueta verde «Recomendado») y [Solo mover la entrada] / [Solo mover la excursión] (blanco con borde: solo se mueven los sitios de esa reserva, a su hora). Nada debajo.
 * Es la hoja de propuesta de siempre (`HojaV2` + `Titulo` + `TarjetasDeCambios` + `BOTON_ORO`/`BOTON_CLARO`): solo se añade la etiqueta «Recomendado» del dibujo. Sin consultas a Supabase (todo sale de la ruta del móvil).
 */
export type TarjetaDeDia = NonNullable<Propuesta['tarjetaDia']>

/** El sitio principal de un día (el que da la foto): la primera visita numerada con foto; si ninguna la trae, la primera. */
export function sitioPrincipalDelDia(day: DayPlan | null | undefined): Stop | null {
  if (!day) return null
  const visitas = numberedStopsOf(day)
  return visitas.find((s) => s.photoUrl || s.fixedPhotoUrl) ?? visitas[0] ?? day.stops.find((s) => !s.isArrival && !s.isBreak) ?? null
}

/**
 * Una tarjeta por cada día que cambia (`filas`: el día, su puesto NUEVO y su fecha). `diaDe` busca el día de la ruta de AHORA al que corresponde cada fila (por su id, o por el nombre del día), para sacar su foto y el sitio principal.
 * El día principal (el de la entrada o la excursión) va el primero.
 */
export function tarjetasDeLosDias(route: Route, filas: FilaDeCambio[], diaDe: (fila: FilaDeCambio) => DayPlan | null): TarjetaDeDia[] {
  return filas.map((fila) => {
    const dia = diaDe(fila)
    const destino = { dayNumber: fila.dayNumber } as DayPlan
    const nombreDestino = nombreDelDia(route, destino)
    const parada = sitioPrincipalDelDia(dia)
    return {
      nombre: fila.nombre,
      fotoUrl: parada?.photoUrl || parada?.fixedPhotoUrl || '',
      cuando: `Pasa al ${nombreDestino}`,
      ...cuadradoDelDia(route, destino),
      destino: nombreDestino,
      diaDeHoy: nombreDestino,
      ...(parada ? { parada, ciudad: dia?.city ?? '' } : {}),
    }
  })
}

export function HojaMoverDias({ titulo, ciudad, tarjetas, solo, onCambiar, onSolo, onCerrar }: { titulo: string; ciudad: string; tarjetas: TarjetaDeDia[]; /** «la entrada» o «la excursión». */ solo: 'la entrada' | 'la excursión'; onCambiar: () => void; onSolo: () => void; onCerrar: () => void }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta={titulo} fondo="#FBF3E2">
      <div data-hoja-mover-dias className="flex flex-col gap-3">
        <Titulo texto={titulo} onCerrar={onCerrar} />
        <span data-mover-dias-texto className="text-[14.5px] font-medium leading-[1.45]">
          Para que disfrutes de tu viaje a {ciudad}, te recomendamos cambiar los días enteros: así cada zona se ve junta y no vas de un lado a otro.
        </span>
        <TarjetasDeCambios tarjetas={tarjetas} franja={null} />
        <div data-dos-botones className="grid grid-cols-2 gap-2.5 pt-2">
          <button type="button" onClick={onCambiar} data-mover-dias-cambiar className="relative flex min-h-[56px] items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold leading-[1.15]" style={BOTON_ORO}>
            Cambiar los días
            <span data-etiqueta-recomendado className="absolute left-1/2 top-[-9px] flex h-[18px] -translate-x-1/2 items-center whitespace-nowrap rounded-full px-[9px] text-[9.5px] font-bold tracking-[.04em] text-white" style={{ background: '#2B7F45' }}>
              Recomendado
            </span>
          </button>
          <button type="button" onClick={onSolo} data-mover-dias-solo className="flex min-h-[56px] items-center justify-center rounded-2xl px-3 text-center text-[14.5px] font-bold leading-[1.15]" style={BOTON_CLARO}>
            Solo mover {solo}
          </button>
        </div>
      </div>
    </HojaV2>
  )
}
