import { lugarCon } from '../../../../lib/articulos'
import { useState } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import { proponerPasarLoQueFalta, type Propuesta, type YaNoDaTiempo } from '../../../../lib/hoyCambiarPlan'
import { aplicarPropuesta } from '../../../../lib/hoyCambiarPlanAplicar'
import { BOTON_CLARO, BOTON_ORO } from '../../../ui/botonesOro'
import { HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'
import { EnlaceDejarlo } from '../piezas'

/**
 * V43 §2: la hoja «Hoy ya no da tiempo a todo». Sale UNA vez al día: con más de una hora de retraso, o al abrir HOY con la mañana ya pasada y nada hecho.
 * [Ver lo que queda hoy] (cierra y se ve la lista), [Pasar lo que falta a otro día] (una propuesta: cada parada al mejor día donde quepa; lo que no cabe se queda en «Lugares pendientes») y [Dejarlo como está].
 * Sin «Propuesta», «Cambia:», [Aplicar] ni «Volver a mi ruta original» (regla de CLAUDE.md, V43 §1).
 */
export function HoyYaNoDaTiempo({ route, day, dateIso, info, enCoche, ahoraMin, onCerrar }: { route: Route; day: DayPlan; dateIso: string; siguiente?: Stop; ubicacion?: Coordinates | null; info: YaNoDaTiempo; enCoche: boolean; ahoraMin: number; onCerrar: () => void }) {
  const ctx = useContexto(route, enCoche)
  const [propuesta, setPropuesta] = useState<Propuesta | null | undefined>(undefined)
  const pasar = () => setPropuesta(proponerPasarLoQueFalta({ route, day, ctx, ahoraMin }))
  if (propuesta !== undefined)
    return (
      <HojaPropuesta
        titulo="Hoy ya no da tiempo a todo"
        propuestas={propuesta ? [propuesta] : []}
        indice={0}
        vacio="No queda nada que pasar a otro día: tu día sigue igual."
        onOtra={() => undefined}
        onAplicar={(p) => {
          aplicarPropuesta(route.id, dateIso, p)
          onCerrar()
        }}
        onCerrar={onCerrar}
      />
    )
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Hoy ya no da tiempo a todo" fondo="#FBF3E2">
      <div data-hoy-ya-no-da-tiempo className="flex flex-col gap-3">
        <Titulo texto="Hoy ya no da tiempo a todo" onCerrar={onCerrar} />
        <span className="text-[14.5px] font-medium leading-[1.4]">Lo que tenías por la mañana ya ha pasado. ¿Qué hacemos?</span>
        {info.entrada && (
          <span data-ya-no-entrada className="text-[13.5px] leading-[1.4] text-[#1C2230]/70">
            {info.entrada.freeTour ? `Tu ${info.entrada.nombre} de las ${info.entrada.hora} ya ha pasado.` : `Tu entrada de las ${info.entrada.hora} ${lugarCon('en', info.entrada.nombre)} ya ha pasado.`}
          </span>
        )}
        <button type="button" onClick={onCerrar} data-ya-no-ver className="flex h-[50px] items-center justify-center rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
          Ver lo que queda hoy
        </button>
        <button type="button" onClick={pasar} data-ya-no-pasar className="flex min-h-[46px] items-center justify-center rounded-2xl px-3 text-center text-[14px] font-bold" style={BOTON_CLARO}>
          Pasar lo que falta a otro día
        </button>
        <EnlaceDejarlo onClick={onCerrar} datos={{ 'data-ya-no-dejar': '1' }} />
      </div>
    </HojaV2>
  )
}
