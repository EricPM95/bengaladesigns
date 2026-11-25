import { useRouteStore } from '../../../store/useRouteStore'
import { diaConFecha, diaProsa, fichaDelDia } from '../../../lib/nombreDeDia'
import { esDiaDeExcursion, tituloSimpleDelDia, useNombreDeDias } from '../../../lib/tituloDelDia'
import type { Route } from '../../../lib/types'
import { Icono } from '../../ui/Icono'
import { CuadradoFecha } from '../../ui/CuadradoFecha'
import { Etiqueta } from '../../ui/Etiqueta'
import { MARFIL, ORO_BORDE } from '../../ui/botonesOro'

/** La etiqueta de un día de excursión entera en la lista: no se mueven paradas a una excursión. */
export const ETIQUETA_DIA_DE_EXCURSION = 'Día de excursión'

interface DiaDeLaLista {
  id: string
  dayNumber: number
  city: string
}

/**
 * LA lista de días a los que se puede mover una parada («Mover a otro día»), del diseño «Mover Parada» (13-oct-2026): arriba «MOVER A» con «Ahora: {día}» y, por cada día, su fecha en su cuadrado
 * («VIE» y «30»; sin fechas, el número del día), su nombre («Viernes 30», sin fechas «Día 2») y su título (el mismo de DÍAS, `tituloDelDia.ts`). El día de vuelta no sale. Un día de excursión entera
 * sale en gris, con su icono y «Día de excursión», y no se puede elegir (a una excursión no se le mueven paradas). La única que hay: la usan el menú «···» de cada parada en DÍAS (StopMenu)
 * y el aviso «Saltada» de HOY («Pasarla a otro día»). Ninguna hora a la vista: el sitio de la parada en el día nuevo lo decide el almacén.
 *
 * `ahora`: el número del día en el que está la parada hoy (para el «Ahora: …» de arriba).
 */
export function ListaDeDias({ dias, onElegir, ahora, recomendado, cerrados }: { dias: DiaDeLaLista[]; onElegir: (dayId: string) => void; ahora?: number; recomendado?: string | null; cerrados?: Set<string> }) {
  const route = useRouteStore((state) => state.route)
  if (!route) return null
  return <ListaDeDiasDeLaRuta route={route} dias={dias} onElegir={onElegir} ahora={ahora} recomendado={recomendado} cerrados={cerrados} />
}

function ListaDeDiasDeLaRuta({ route, dias, onElegir, ahora, recomendado, cerrados }: { route: Route; dias: DiaDeLaLista[]; onElegir: (dayId: string) => void; ahora?: number; recomendado?: string | null; cerrados?: Set<string> }) {
  const nombreDe = useNombreDeDias(route)
  return (
    <div data-lista-de-dias="1" className="flex flex-col gap-0.5 text-text">
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        <Icono nombre="dias" size={15} className="shrink-0 text-accent" />
        <span className="flex-1 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-text/60">Mover a</span>
        {ahora !== undefined && <span data-ahora-en="1" className="text-[11.5px] text-text/50">Ahora: {diaProsa(route, ahora)}</span>}
      </div>
      {dias.map((dia) => {
        const day = route.days.find((candidate) => candidate.id === dia.id)
        // El día de vuelta no sale (no lleva paradas).
        if (day?.isReturnLeg) return null
        // (V43 §4) «Cerrado ese día»: en gris y sin poder elegirlo; el mejor día va con «Te lo recomendamos».
        const cerrado = Boolean(cerrados?.has(dia.id))
        const excursion = (day ? esDiaDeExcursion(day) : false) || cerrado
        const ficha = fichaDelDia(route, dia.dayNumber)
        const titulo = day ? nombreDe(day).titulo || tituloSimpleDelDia(route, day) : dia.city
        // (V46, dibujo 26a) El día recomendado, en su PROPIA tarjeta destacada (borde dorado), con «Te lo recomendamos» encima del nombre y su flecha.
        const destacado = !excursion && recomendado === dia.id
        return (
          <button
            key={dia.id}
            type="button"
            data-dia-de-la-lista={dia.id}
            data-excursion={excursion ? '1' : undefined}
            data-dia-cerrado={cerrado ? '1' : undefined}
            disabled={excursion}
            aria-disabled={excursion}
            onClick={() => onElegir(dia.id)}
            data-dia-destacado={destacado ? '1' : undefined}
            className={`flex w-full items-center gap-3 text-left ${destacado ? 'mb-1.5 min-h-[72px] rounded-[18px] px-3 py-2.5' : 'min-h-[58px] rounded-2xl px-2 py-[7px]'} ${excursion ? 'cursor-not-allowed' : destacado ? '' : 'hover:bg-bg-hover'}`}
            style={destacado ? { background: MARFIL, border: `1.5px solid ${ORO_BORDE}` } : undefined}
          >
            <span className={excursion ? 'opacity-50' : ''}>
              {/* (Noche 24-25 nov) El cuadrado de la fecha de toda la app: azul oscuro con el día y el número en dorado. */}
              <CuadradoFecha semana={ficha?.semana ?? 'DÍA'} numero={ficha?.numero ?? dia.dayNumber} />
            </span>
            <span className={`flex min-w-0 flex-1 flex-col gap-0.5 ${excursion ? 'opacity-60' : ''}`}>
              {destacado && (
                <Etiqueta tono="destacada" datos={{ 'data-dia-recomendado': '1' }}>Te lo recomendamos</Etiqueta>
              )}
              {/* Tanda 10O: «Jue 26 Nov · Roma antigua y Centro histórico» (la fecha en negrita, el nombre del día detrás). */}
              <span data-dia-etiqueta="1" className="flex items-start gap-[5px] text-[13.5px] leading-[1.3]">
                {excursion && !cerrado && <Icono nombre="montana" size={12} className="mt-[3px] shrink-0" />}
                <span className="min-w-0">
                  <span className="font-semibold">{diaConFecha(route, dia.dayNumber)}</span>
                  {titulo && <span className="text-text/60"> · {titulo}</span>}
                </span>
              </span>
              {cerrado && (
                <span data-dia-cerrado-texto="1" className="text-[11.5px] leading-none text-accent-warm">
                  Cerrado ese día
                </span>
              )}
            </span>
            {excursion ? (
              cerrado ? null : <Etiqueta tono="gris">{ETIQUETA_DIA_DE_EXCURSION}</Etiqueta>
            ) : (
              <Icono nombre="adelante" size={14} className={`shrink-0 ${destacado ? 'text-accent' : 'text-text/35'}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}
