import { useState } from 'react'
import type { DayPlan, Route } from '../../../../lib/types'
import { diaAdmite, mejorDiaPara, opcionesDeDia, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { ListaDeDias } from '../../dayDetail/ListaDeDias'
import { HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'

/**
 * (V54 §3) LA HOJA DE «PASAR A OTRO DÍA» PARA LAS SOLUCIONES. Sustituye a la vieja «Una solución» de «Tu entrada corre peligro», de «Necesito más tiempo» y de «A este ritmo llegarías…»: la pieza A2 de la V50
 * (HojaPropuesta con la tarjeta del sitio y la franja verde; el botón dorado dice la acción; [Elegir otro día]; [Dejarlo como está]). Si el sitio que sale es UNO solo y va a otro día, [Elegir otro día] abre la lista de
 * días de Cambiar plan (solo posteriores a hoy; el recomendado, destacado; los cerrados, en gris) y se vuelve a calcular la propuesta con ese día (`recalcular`).
 */
export function HojaSolucion({ route, day, enCoche, propuestas: inicial, vacio, recalcular, onAplicar, onCerrar }: { route: Route; day: DayPlan; enCoche: boolean; propuestas: Propuesta[]; vacio: string; /** Vuelve a calcular las propuestas con otro día para un sitio. */ recalcular: (diaDe: Record<string, string>) => Propuesta[]; onAplicar: (p: Propuesta) => void; onCerrar: () => void }) {
  const [propuestas, setPropuestas] = useState(inicial)
  const [indice, setIndice] = useState(0)
  const [eligiendo, setEligiendo] = useState(false)
  const ctx = useContexto(route, enCoche)
  const p = propuestas[indice] ?? null
  const unico = p && p.quitadas.length === 1 && p.quitadas[0].destino === 'manana' ? p.quitadas[0] : null
  const stop = unico ? day.stops.find((s) => s.id === unico.id) : undefined
  const iHoy = route.days.findIndex((d) => d.id === day.id)
  const dias = route.days.filter((d, i) => i > iHoy && d.id !== day.id && diaAdmite(d)).map((d) => ({ id: d.id, dayNumber: d.dayNumber, city: d.city }))
  if (eligiendo && stop)
    return (
      <HojaV2 onCerrar={() => setEligiendo(false)} etiqueta="Pasar a otro día" fondo="#FBF3E2">
        <div data-hoy-elegir-dia className="flex flex-col gap-3">
          <Titulo texto="Pasar a otro día" onCerrar={() => setEligiendo(false)} />
          <ListaDeDias
            dias={dias}
            ahora={day.dayNumber}
            recomendado={mejorDiaPara({ route, day, stop, ctx })?.dia.id ?? null}
            cerrados={new Set(opcionesDeDia({ route, day, stop, ctx }).filter((o) => o.cerrado).map((o) => o.dia.id))}
            onElegir={(id) => {
              const nuevas = recalcular({ [stop.id]: id })
              if (nuevas.length > 0) {
                setPropuestas(nuevas)
                setIndice(0)
              }
              setEligiendo(false)
            }}
          />
        </div>
      </HojaV2>
    )
  return (
    <HojaPropuesta
      titulo="Pasar a otro día"
      propuestas={propuestas}
      indice={indice}
      vacio={vacio}
      onOtra={() => setIndice((i) => (i + 1) % propuestas.length)}
      onElegirOtroDia={unico && stop ? () => setEligiendo(true) : undefined}
      onAplicar={onAplicar}
      onCerrar={onCerrar}
    />
  )
}
