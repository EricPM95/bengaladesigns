import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, Route } from '../../../../lib/types'
import { aplicarPropuesta } from '../../../../lib/hoyCambiarPlanAplicar'
import { evaluarMasTiempo } from '../../../../lib/hoyMasTiempo'
import { proponerSolucion } from '../../../../lib/hoyPeligro'
import type { Propuesta } from '../../../../lib/hoyCambiarPlan'
import { useContexto } from './CambiarPlan'
import { HojaSolucion } from './HojaSolucion'
import { useVentanasDeHoy } from './HorarioHoy'

/**
 * (HOY2b, E, apartado 3) «+15 / +30 min» SIN MOVER LA RUTA. Lo que se ve tras elegir los minutos (en [Necesito más tiempo] y en «Tomaos un respiro» de Cansados): la cuenta está en `src/lib/hoyMasTiempo.ts`.
 *  · nada que avisar: «Tómate 30 min más sin prisa: tu ruta sigue igual.»
 *  · algo que llegarías a ver ya cerrado: solo un aviso, SIN botones («…pero llegarías a la Iglesia de San Miguel ya cerrada: podrás verla por fuera»)
 *  · una reserva o un turno en peligro: «Con 30 min más no llegas a tu entrada de las 15:00» y [Ver solución] (la propuesta de «Tu entrada corre peligro»; nada se mueve sin [Aplicar]).
 */
const TINTA = '#1C2230'
const DORADO_CLARO = '#F3D88F'

export function AvisoMasTiempo({ route, day, dateIso, paradaId, minutos, plural = false, ubicacion, enCoche, ahoraMin, onCerrar, fijo = true, autoCerrar = true }: { route: Route; day: DayPlan; dateIso: string; paradaId: string; minutos: 15 | 30; plural?: boolean; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; onCerrar: () => void; /** Pegado abajo (como el resto de avisos de abajo de HOY) o dentro de una hoja. */ fijo?: boolean; /** Se va solo a los 14 s (sin botones); dentro de una hoja se queda. */ autoCerrar?: boolean }) {
  const ctx = useContexto(route, enCoche)
  const ventanas = useVentanasDeHoy(route, day, dateIso)
  const r = useMemo(() => evaluarMasTiempo({ day, paradaId, minutos, ctx, ahoraMin, enCoche, ventanas, plural }), [day, paradaId, minutos, ctx, ahoraMin, enCoche, ventanas, plural])
  const [abierta, setAbierta] = useState(false)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  
  // Sin botones, el aviso de «cerrado» y el de «tu ruta sigue igual» se van solos; el de la reserva en peligro espera a que se toque [Ver solución] o se cierre.
  useEffect(() => {
    if (!autoCerrar || r.tipo === 'peligro' || abierta) return undefined
    const id = window.setTimeout(onCerrar, 14000)
    return () => window.clearTimeout(id)
  }, [r.tipo, abierta, onCerrar, autoCerrar])
  const ver = () => {
    if (!r.peligro) return
    setPropuestas(proponerSolucion({ route, day, peligro: r.peligro, ctx, ahoraMin: ahoraMin + minutos, ubicacion }))
    setAbierta(true)
  }
  return (
    <>
      <div data-hoy-aviso-tiempo data-mas-tiempo={r.tipo} data-mas-tiempo-minutos={minutos} className={`${fijo ? 'sticky bottom-24 z-10 ' : ''}flex min-h-[46px] flex-none flex-col gap-1.5 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium`} style={{ background: TINTA, color: '#FBF3E2' }}>
        <span data-mas-tiempo-texto className="leading-[1.35]">{r.texto}</span>
        {r.tipo === 'peligro' && (
          <button type="button" onClick={ver} data-mas-tiempo-ver-solucion className="flex h-11 flex-none items-center self-start rounded-full px-4 text-[12.5px] font-bold" style={{ background: 'rgba(243,216,143,.16)', border: '1px solid rgba(243,216,143,.4)', color: DORADO_CLARO }}>
            Ver solución
          </button>
        )}
      </div>
      {abierta && (
        <HojaSolucion
          route={route}
          day={day}
          enCoche={enCoche}
          propuestas={propuestas}
          vacio="Esta vez no hay un cambio pequeño que lo arregle. Mejor no te alargues más en esta parada."
          recalcular={(diaDe) => (r.peligro ? proponerSolucion({ route, day, peligro: r.peligro, ctx, ahoraMin: ahoraMin + minutos, ubicacion, diaDe }).filter((p) => Object.keys(diaDe).every((id) => p.quitadas.some((q) => q.id === id))) : [])}
          onAplicar={(pr) => {
            aplicarPropuesta(route.id, dateIso, pr)
            setAbierta(false)
            onCerrar()
          }}
          onCerrar={() => setAbierta(false)}
        />
      )}
    </>
  )
}
