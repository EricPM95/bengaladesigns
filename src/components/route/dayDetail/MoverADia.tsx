import { useMemo, useState } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { diaConFecha, diaProsa } from '../../../lib/nombreDeDia'
import { esDiaDeExcursion, tituloSimpleDelDia, useNombreDeDias } from '../../../lib/tituloDelDia'
import { BotonHoja } from '../../ui/Hoja'
import { TimeListWheel } from '../../ui/TimeListWheel'
import type { Route } from '../../../lib/types'

interface DiaDeLaRueda {
  id: string
  dayNumber: number
  city: string
}

/**
 * «MOVER A OTRO DÍA» CON UNA RUEDITA (Tanda 10N §6c, Eric 25-oct): el contenido de la hoja baja de «Mover a». Arriba «Ahora: jueves 26»; en medio la rueda de días (se desliza arriba y abajo y el elegido queda en el
 * centro, como la hora del iPhone: `TimeListWheel`), y debajo [Mover aquí]. Así la hoja no crece aunque el viaje tenga muchos días. Los días de excursión entera y el de vuelta no salen (no se mueven paradas a ellos).
 * Se pinta DENTRO de una hoja (`HojaDelMenu`), que pone el nombre de la parada arriba.
 */
export function MoverADia({ dias, ahora, onMover }: { dias: DiaDeLaRueda[]; ahora?: number; onMover: (dayId: string) => void }) {
  const route = useRouteStore((state) => state.route)
  if (!route) return null
  return <Rueda route={route} dias={dias} ahora={ahora} onMover={onMover} />
}

function Rueda({ route, dias, ahora, onMover }: { route: Route; dias: DiaDeLaRueda[]; ahora?: number; onMover: (dayId: string) => void }) {
  const nombreDe = useNombreDeDias(route)
  const opciones = useMemo(
    () =>
      dias
        .map((dia) => ({ dia, day: route.days.find((candidate) => candidate.id === dia.id) }))
        .filter(({ day }) => day && !day.isReturnLeg && !esDiaDeExcursion(day))
        .map(({ dia, day }) => {
          const titulo = day ? nombreDe(day).titulo || tituloSimpleDelDia(route, day) : dia.city
          return { id: dia.id, texto: titulo ? `${diaConFecha(route, dia.dayNumber)} · ${titulo}` : diaConFecha(route, dia.dayNumber) }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route, dias, nombreDe],
  )
  const [elegido, setElegido] = useState(opciones[0]?.texto ?? '')
  const actual = opciones.find((o) => o.texto === elegido) ?? opciones[0]
  return (
    <div data-mover-a-dia="1" className="flex flex-col gap-3">
      {ahora !== undefined && (
        <span data-ahora-en="1" style={{ font: "500 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
          Ahora: {diaProsa(route, ahora)}
        </span>
      )}
      {opciones.length === 0 ? (
        <p style={{ margin: 0, font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)' }}>No hay otro día al que moverla.</p>
      ) : (
        <TimeListWheel items={opciones.map((o) => o.texto)} value={actual?.texto ?? ''} onChange={setElegido} label="Día al que mover la parada" tipo="lista" />
      )}
      <BotonHoja datos="mover-aqui" disabled={!actual} onClick={() => actual && onMover(actual.id)}>
        Mover aquí
      </BotonHoja>
    </div>
  )
}
