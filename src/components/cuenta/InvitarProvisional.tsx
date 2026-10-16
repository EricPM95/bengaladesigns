import { useCallback, useEffect, useState } from 'react'
import { leerAvisoDeInvitacion, olvidarAvisoDeInvitacion, guardarAvisoDeInvitacion } from '../../lib/cuentas'
import { anularInvitacion, canjearInvitacion, crearInvitacion, enlaceDeInvitacion, listarInvitaciones, normalizarCodigo, type Invitacion } from '../../lib/invitaciones'
import { textoDeRecomendacion, type Recomendacion } from '../../lib/aplicarRecomendacion'
import { aceptarRecomendacion, listarRecomendaciones, rechazarRecomendacion } from '../../lib/recomendacionesViaje'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'

const ETIQUETA = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em' } as const
const boton = 'h-10 rounded-full border border-text/20 px-4 text-[13px] font-medium disabled:opacity-50'

/**
 * INVITAR Y RECOMENDACIONES, PROVISIONAL (cuentas, parte 2): una pantalla sencilla para probar la lógica, solo con las cuentas encendidas y con una cuenta de verdad.
 *   · «Tengo un código»: entrar en el viaje de otra persona.
 *   · Si el viaje abierto es tuyo: crear una invitación (enlace y código), ver las que hay y anularlas.
 *   · Si el viaje abierto es tuyo: las recomendaciones que te han mandado, con [Aceptar] y [No, gracias].
 * Las pantallas de verdad las dibuja Design.
 */
export function InvitarProvisional() {
  const tripId = useSyncStore((s) => s.activeTripId)
  const savedTrips = useSyncStore((s) => s.savedTrips)
  const route = useRouteStore((s) => s.route)
  const esMio = Boolean(tripId) && !(savedTrips ?? []).some((v) => v.id === tripId && v.esInvitado)
  const [codigo, setCodigo] = useState('')
  const [usos, setUsos] = useState(1)
  const [mensaje, setMensaje] = useState<string | null>(() => leerAvisoDeInvitacion())
  const [ocupado, setOcupado] = useState(false)
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([])
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([])

  const recargar = useCallback(async () => {
    if (!tripId || !esMio) return // (sin viaje propio abierto no se enseña nada de esto: no hace falta vaciar las listas)
    setInvitaciones(await listarInvitaciones(tripId))
    setRecomendaciones(await listarRecomendaciones(tripId, true))
  }, [tripId, esMio])
  useEffect(() => {
    void recargar()
  }, [recargar])
  useEffect(() => {
    if (mensaje) olvidarAvisoDeInvitacion()
  }, [mensaje])

  const entrar = async () => {
    setOcupado(true)
    const r = await canjearInvitacion(codigo)
    setOcupado(false)
    if (r.error) {
      setMensaje(r.error)
      return
    }
    guardarAvisoDeInvitacion(r.yaEstaba ? 'Ya estabas en ese viaje.' : 'Has entrado en el viaje como invitado.')
    window.location.reload()
  }
  const crear = async () => {
    if (!tripId) return
    setOcupado(true)
    const r = await crearInvitacion(tripId, { usos })
    setOcupado(false)
    setMensaje(r.error ?? null)
    await recargar()
  }
  const anular = async (id: string) => {
    setMensaje(await anularInvitacion(id))
    await recargar()
  }
  const aceptar = async (rec: Recomendacion) => {
    setOcupado(true)
    const r = await aceptarRecomendacion(rec)
    setOcupado(false)
    setMensaje(r.estado === 'aceptada' ? (r.mensaje ?? 'Hecho: la ruta ha cambiado. Si te arrepientes, la varita lo deja como estaba.') : (r.mensaje ?? 'No se ha podido aceptar.'))
    await recargar()
  }
  const rechazar = async (rec: Recomendacion) => {
    setMensaje(await rechazarRecomendacion(rec.id))
    await recargar()
  }

  return (
    <div className="flex flex-col gap-3" data-invitar-provisional>
      <h3 className="m-0 px-1 uppercase text-text/55" style={ETIQUETA}>
        Invitar y recomendaciones
      </h3>
      <div className="flex flex-col gap-3 rounded-2xl border border-text/10 p-4">
        {mensaje && (
          <p role="status" data-mensaje-invitar className="m-0 text-[13px] text-text/80">
            {mensaje}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[13px] text-text/60">¿Te han dado un código?</p>
          <div className="flex gap-2">
            <input value={codigo} onChange={(e) => setCodigo(normalizarCodigo(e.target.value))} placeholder="CÓDIGO" aria-label="Código de invitación" className="h-10 min-w-0 flex-1 rounded-xl border border-text/15 bg-transparent px-3 text-[15px] uppercase tracking-widest outline-none" />
            <button type="button" disabled={ocupado || codigo.length < 6} onClick={() => void entrar()} className={boton}>
              Entrar en el viaje
            </button>
          </div>
        </div>
        {route && tripId && esMio && (
          <>
            <div className="flex flex-col gap-2 border-t border-text/10 pt-3">
              <p className="m-0 text-[13px] text-text/60">Invitar a este viaje ({route.destination})</p>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-[13px] text-text/70">
                  Personas
                  <input type="number" min={1} max={50} value={usos} onChange={(e) => setUsos(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-10 w-16 rounded-xl border border-text/15 bg-transparent px-2 text-[15px]" />
                </label>
                <button type="button" disabled={ocupado} onClick={() => void crear()} className={boton}>
                  Crear invitación
                </button>
              </div>
              {invitaciones.map((i) => (
                <div key={i.id} data-invitacion={i.codigo} className="flex flex-col gap-1 rounded-xl bg-text/5 px-3 py-2">
                  <span className="text-[15px] font-semibold tracking-widest">{i.codigo}</span>
                  <span className="break-all text-[12px] text-text/60">{enlaceDeInvitacion(window.location.origin, i.codigo)}</span>
                  <span className="text-[12px] text-text/60">
                    {i.anulada ? 'Anulada' : i.usosUsados >= i.usosMax && !i.passId ? 'Sin plazas' : `${i.usosUsados} de ${i.usosMax} plazas usadas`}
                    {i.passId ? ' · con pase' : ''}
                  </span>
                  {!i.anulada && (
                    <button type="button" onClick={() => void anular(i.id)} className="self-start p-1 text-[12px] text-[#b3261e] underline underline-offset-[3px]">
                      Anular
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-text/10 pt-3">
              <p className="m-0 text-[13px] text-text/60">Recomendaciones pendientes</p>
              {recomendaciones.length === 0 && <p className="m-0 text-[13px] text-text/45">Ninguna.</p>}
              {recomendaciones.map((rec) => (
                <div key={rec.id} data-recomendacion={rec.id} className="flex flex-col gap-2 rounded-xl bg-text/5 px-3 py-2">
                  <span className="text-[14px]">{textoDeRecomendacion(rec, route)}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={ocupado} onClick={() => void aceptar(rec)} className={boton}>
                      Aceptar
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => void rechazar(rec)} className="h-10 px-2 text-[13px] text-text/70">
                      No, gracias
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
