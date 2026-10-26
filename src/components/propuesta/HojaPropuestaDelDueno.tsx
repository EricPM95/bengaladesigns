import { useEffect, useMemo, useState } from 'react'
import { cambiosDeUnaPropuesta, textoDeCuantos, textoDeDecididos, titularDeLaPropuesta } from '../../lib/propuesta'
import type { Recomendacion } from '../../lib/aplicarRecomendacion'
import { mandarAvisosPendientes } from '../../lib/permisoAvisos'
import { aceptarTodos, decidirCambio, type Decision } from '../../lib/propuestaDueno'
import { nombreDe, useViajeCompartido } from '../../store/useViajeCompartido'
import { useRouteStore } from '../../store/useRouteStore'
import { Hoja } from '../ui/Hoja'
import { DetalleDeCambio } from './DetalleDeCambio'
import { FilaDeCambio } from './FilaDeCambio'

/**
 * LA PROPUESTA DE UN INVITADO, EN LA CAMPANA DEL ADMINISTRADOR (Tanda 10N, apartado 6; «Propuesta Cambios · Eric»): «Ana te propone 5 cambios», la misma lista que mandó, con [Aceptar] [Rechazar] en cada
 * cambio y [Aceptar todos] arriba. Aceptar pone el cambio en la ruta DE VERDAD, donde decía (o donde mejor encaje si ese día cambió). Después, la lista se queda con «3 aceptados · 2 rechazados».
 * Lo deciden el administrador y quien puede editar; si dos la miran a la vez, vale lo que decida el primero (el otro lo ve ya decidido).
 */
export function HojaPropuestaDelDueno({ rec: inicial, onCerrar }: { rec: Recomendacion; onCerrar: () => void }) {
  const route = useRouteStore((s) => s.route)
  const gente = useViajeCompartido((s) => s.gente)
  const cargar = useViajeCompartido((s) => s.cargar)
  const [decisiones, setDecisiones] = useState<Record<string, Decision>>(inicial.decisiones ?? {})
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [abierto, setAbierto] = useState<string | null>(null)
  // Si otra persona decide mientras esta hoja está abierta, la lista de la app se refresca sola: lo nuevo se suma a lo que ya se sabe.
  const viva = useViajeCompartido((s) => s.recomendaciones.find((r) => r.id === inicial.id))
  useEffect(() => {
    if (viva?.decisiones) setDecisiones((previas) => ({ ...viva.decisiones, ...previas }))
  }, [viva?.decisiones])
  const rec = useMemo(() => ({ ...inicial, decisiones }), [inicial, decisiones])
  const cambios = useMemo(() => cambiosDeUnaPropuesta(inicial.payload), [inicial])
  const autor = nombreDe(gente.find((p) => p.id === inicial.authorId) ?? null)
  if (!route) return null
  const aceptados = cambios.filter((c) => decisiones[c.id] === 'aceptado').length
  const rechazados = cambios.filter((c) => decisiones[c.id] === 'rechazado').length
  const pendientes = cambios.length - aceptados - rechazados
  const titulo = pendientes > 0 ? titularDeLaPropuesta(autor, cambios.length, route.destination) : autor ? `Propuesta de ${autor}` : 'Propuesta'
  const quien = pendientes > 0 ? `Viaje a ${route.destination}` : textoDeDecididos(aceptados, rechazados)

  const refrescar = () => {
    void cargar(inicial.tripId)
    mandarAvisosPendientes()
  }
  const decidir = async (id: string, decision: Decision) => {
    const c = cambios.find((x) => x.id === id)
    if (!c || ocupado) return
    setOcupado(true)
    setMensaje(null)
    const r = await decidirCambio(rec, c, decision)
    setOcupado(false)
    if (r.estado === 'error') return setMensaje(r.mensaje)
    setDecisiones((p) => ({ ...p, ...r.decisiones }))
    if (r.estado === 'ya_decidido') setMensaje('Ya lo había decidido otra persona del viaje.')
    else if (r.nota) setMensaje(r.nota)
    refrescar()
  }
  const todos = async () => {
    setOcupado(true)
    setMensaje(null)
    const r = await aceptarTodos(rec)
    setOcupado(false)
    setDecisiones((p) => ({ ...p, ...r.decisiones }))
    if (r.fallos.length) setMensaje(r.fallos[0])
    refrescar()
  }
  const detalle = abierto ? cambios.find((c) => c.id === abierto) : null
  const i = detalle ? cambios.indexOf(detalle) : -1
  return (
    <>
      <Hoja onCerrar={onCerrar} etiqueta={`Propuesta de ${autor || 'un invitado'}`} datos="propuesta-dueno" z={96}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 34 }}>
          <span data-propuesta-titulo style={{ font: "400 28px/1.05 'Instrument Serif',serif" }}>
            {titulo}
          </span>
          <span data-propuesta-quien style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            {quien}
          </span>
        </span>
        {pendientes > 1 && (
          <button type="button" data-aceptar-todos disabled={ocupado} onClick={() => void todos()} style={{ alignSelf: 'flex-start', minHeight: 44, padding: '0 17px', borderRadius: 999, border: 'none', background: '#1C2230', color: '#E9C77A', font: "700 12.5px 'Geist'", cursor: 'pointer', opacity: ocupado ? 0.6 : 1 }}>
            Aceptar todos
          </button>
        )}
        <div data-propuesta-lista style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '58dvh', overflowY: 'auto', scrollbarWidth: 'none', paddingBottom: 6 }}>
          {cambios.map((c) => (
            <FilaDeCambio key={c.id} cambio={c} modo="dueno" decision={decisiones[c.id] ?? null} ocupado={ocupado} onAbrir={() => setAbierto(c.id)} onAceptar={() => void decidir(c.id, 'aceptado')} onRechazar={() => void decidir(c.id, 'rechazado')} />
          ))}
        </div>
        {mensaje && (
          <p role="status" data-propuesta-mensaje style={{ margin: 0, font: "500 13px/1.4 'Geist'", color: 'rgba(28,34,48,.7)' }}>
            {mensaje}
          </p>
        )}
        <span style={{ font: "400 11.5px 'Geist'", color: 'rgba(28,34,48,.5)' }}>{textoDeCuantos(cambios.length)}</span>
      </Hoja>
      {detalle && (
        <DetalleDeCambio
          cambio={detalle}
          sobre={route}
          cabecera={`${(autor || 'Quien propone').toUpperCase()} ${decisiones[detalle.id] ? 'PROPUSO' : 'PROPONE'} · ${i + 1} DE ${cambios.length}`}
          modo="dueno"
          decision={decisiones[detalle.id] ?? null}
          ocupado={ocupado}
          onCerrar={() => setAbierto(null)}
          onAceptar={async () => {
            await decidir(detalle.id, 'aceptado')
          }}
          onRechazar={async () => {
            await decidir(detalle.id, 'rechazado')
          }}
        />
      )}
    </>
  )
}
