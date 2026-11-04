import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { pagoActivo, usePagoActivo } from '../../lib/pago'
import { diasPuestosEnDuda } from '../../lib/diasEnDuda'
import { diasQueCambian, reorganizarDias } from '../../lib/reorganizarDia'
import { useRouteStore } from '../../store/useRouteStore'
import { useReorganizarStore } from '../../store/useReorganizarStore'
import { useResumenVueloStore } from '../../store/useResumenVueloStore'
import { adaptarLosDias } from '../../lib/adaptarVuelos'
import { useFlotantes, SOBRE_LOS_LOGROS, useReorganizarALaVista } from '../flotantes/flotantes'
import { Icono } from '../ui/Icono'
import { useBotonReorganizarVisible } from './useBotonReorganizarVisible'
import { usePermisosDelViaje } from '../../hooks/usePermisosDelViaje'
import { AvisoNoCabe } from './AvisoNoCabe'

/**
 * EL BOTÓN «REORGANIZAR» DEL PASE (Tanda 10S7, apartado 2; `Piezas/Reorganizar` R1 a R3). Se monta una vez por pantalla del viaje, junto al botón de los logros:
 *
 *     <ReorganizarHost />
 *
 *  - VIGILA los cambios de la ruta (añadir o pasar una parada, la hora de una entrada o del Free Tour, los vuelos, la zona del alojamiento: `diasPuestosEnDuda`) y, con pase, CALCULA si reorganizar
 *    cambiaría algo en esos días. Solo si cambia, sale el botón flotante redondo, encima del de los logros (R1). Nada se reorganiza solo.
 *  - Al tocarlo, la alerta «¿Reorganizamos tu día?» (R2): [Reorganizar] hace el cambio en los días afectados (una franja «Hemos reorganizado tu día» con [Deshacer], R3, y lo movido se ilumina);
 *    [Ahora no] (o la ✕) cierra la alerta y el botón SE QUEDA (LZ3, Eric 4-nov) hasta que reorganices o el día deje de necesitarlo (p. ej. si quitas la parada que lo hizo salir).
 *  - Solo con pase y solo para quien puede editar la ruta. Si hay dos montados (DÍAS y HOY) solo trabaja el primero.
 */
const montados: string[] = []
const oyentes = new Set<() => void>()
function useSoyElPrimero(): boolean {
  const id = useId()
  const [, repintar] = useState(0)
  useEffect(() => {
    montados.push(id)
    const avisar = () => repintar((x) => x + 1)
    oyentes.add(avisar)
    oyentes.forEach((f) => f())
    return () => {
      montados.splice(montados.indexOf(id), 1)
      oyentes.delete(avisar)
      oyentes.forEach((f) => f())
    }
  }, [id])
  return montados[0] === id
}

/** La espera (ms) para juntar cambios seguidos (p. ej. guardar el vuelo toca la ida y la vuelta) antes de calcular. */
const JUNTAR_MS = 700

export function ReorganizarHost(): ReactNode {
  const primero = useSoyElPrimero()
  const visible = useBotonReorganizarVisible()
  const alerta = useReorganizarStore((s) => s.alerta)
  const trabajando = useReorganizarStore((s) => s.trabajando)
  const iluminadas = useReorganizarStore((s) => s.iluminadas)
  const vuelos = useReorganizarStore((s) => s.vuelos)
  const conPase = usePagoActivo()
  const hojaAbierta = useResumenVueloStore((s) => s.hoja !== null)
  const { debajo, alto } = useFlotantes()
  const modo = useRouteStore((s) => s.mode)
  const { puedeEditar } = usePermisosDelViaje()
  const mostrar = visible && primero
  useReorganizarALaVista(mostrar)

  // La vigilancia de los cambios (solo el primero montado, solo con pase y solo si se puede editar).
  useEffect(() => {
    if (!primero || !puedeEditar) return undefined
    let pendientes = new Set<string>()
    let reloj = 0
    const calcular = async () => {
      reloj = 0
      const ids = [...pendientes]
      pendientes = new Set()
      if (ids.length === 0 || !pagoActivo()) return
      const cambian = await diasQueCambian(ids)
      useReorganizarStore.getState().poner(cambian.map((c) => c.dayId), ids)
    }
    const anular = useRouteStore.subscribe((estado, previo) => {
      if (estado.route?.id !== previo.route?.id) {
        pendientes = new Set()
        useReorganizarStore.getState().reiniciar()
        return
      }
      if (estado.route === previo.route && estado.reservations === previo.reservations) return
      if (!pagoActivo()) return
      const dudosos = diasPuestosEnDuda({ route: previo.route, reservations: previo.reservations }, { route: estado.route, reservations: estado.reservations })
      // (LZ3) Un día que ya tiene el botón y al que se le QUITA una parada se vuelve a calcular: si ya no cambiaría nada, el botón se va.
      if (estado.route && previo.route) {
        const conBoton = useReorganizarStore.getState().dias
        for (const dayId of conBoton) {
          const antes = previo.route.days.find((day) => day.id === dayId)
          const ahora = estado.route.days.find((day) => day.id === dayId)
          if (!antes || !ahora) continue
          const siguen = new Set(ahora.stops.map((stop) => stop.id))
          if (antes.stops.some((stop) => !siguen.has(stop.id))) dudosos.push(dayId)
        }
      }
      if (dudosos.length === 0) return
      for (const id of dudosos) pendientes.add(id)
      window.clearTimeout(reloj)
      reloj = window.setTimeout(() => void calcular(), JUNTAR_MS)
    })
    return () => {
      anular()
      window.clearTimeout(reloj)
    }
  }, [primero, puedeEditar])

  // Lo movido se ilumina un momento (la marca de siempre de la parada que llega: `data-parada-marcada`).
  useEffect(() => {
    if (iluminadas.length === 0) return undefined
    const marcadas = new Set<Element>()
    let intentos = 0
    const poner = () => {
      for (const id of iluminadas) {
        for (const el of Array.from(document.querySelectorAll(`[data-stop-id="${id}"]`))) {
          if (marcadas.has(el)) continue
          marcadas.add(el)
          el.setAttribute('data-parada-marcada', '1')
        }
      }
      intentos++
    }
    poner()
    const repetir = window.setInterval(() => (intentos < 6 ? poner() : window.clearInterval(repetir)), 250)
    const quitar = window.setTimeout(() => {
      marcadas.forEach((el) => el.removeAttribute('data-parada-marcada'))
      useReorganizarStore.getState().limpiarIluminadas()
    }, 2600)
    return () => {
      window.clearInterval(repetir)
      window.clearTimeout(quitar)
      marcadas.forEach((el) => el.removeAttribute('data-parada-marcada'))
    }
  }, [iluminadas])

  const reorganizar = async () => {
    const store = useReorganizarStore.getState()
    if (store.trabajando) return
    store.fijarTrabajando(true)
    try {
      await reorganizarDias(store.dias)
    } finally {
      useReorganizarStore.getState().terminar()
    }
  }

  if (!primero) return null
  return (
    <>
      {mostrar && (
        <button
          type="button"
          data-boton-reorganizar="1"
          aria-label="Reorganizar tu día"
          onClick={() => useReorganizarStore.getState().abrirAlerta()}
          className="hoja-pop"
          style={{
            position: 'fixed',
            right: 15,
            bottom: alto !== null ? `${alto + SOBRE_LOS_LOGROS}px` : `calc(env(safe-area-inset-bottom,0px) + ${(modo === 'today' ? 120 : 88) + SOBRE_LOS_LOGROS}px)`,
            width: 56,
            height: 56,
            padding: 0,
            borderRadius: '50%',
            background: '#1C2230',
            border: '2px solid #B58A2E',
            boxShadow: '0 10px 20px -8px rgba(0,0,0,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: debajo ? 31 : 100,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h10l3-3 3 3M20 16H10l-3 3-3-3M17 5v6M7 13v6" />
          </svg>
        </button>
      )}
      {primero && puedeEditar && conPase && vuelos && !hojaAbierta && <AlertaAdaptarVuelos />}
      {primero && puedeEditar && conPase && <AvisoNoCabe />}
      {mostrar && alerta && <AlertaReorganizar trabajando={trabajando} onReorganizar={() => void reorganizar()} />}
    </>
  )
}

/** La alerta «¿Reorganizamos tu día?» (R2): hoja de abajo con el texto de Eric y [Reorganizar] [Ahora no]. */
function AlertaReorganizar({ trabajando, onReorganizar }: { trabajando: boolean; onReorganizar: () => void }): ReactNode {
  const ahoraNo = () => useReorganizarStore.getState().ahoraNo()
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useReorganizarStore.getState().trabajando) useReorganizarStore.getState().ahoraNo()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])
  return createPortal(
    <div data-hoja="reorganizar" data-alerta-reorganizar="1" role="dialog" aria-modal="true" aria-label="¿Reorganizamos tu día?" style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="hoja-fondo" onClick={trabajando ? undefined : ahoraNo} style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,.5)' }} />
      <div className="hoja-panel" style={{ position: 'relative', width: '100%', maxWidth: 520, borderRadius: '32px 32px 0 0', background: '#FBF3E2', color: '#1C2230', padding: '10px 18px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 40px rgba(0,0,0,.25)' }}>
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }}>¿Reorganizamos tu día?</span>
          <button className="zona-toque" type="button" onClick={ahoraNo} disabled={trabajando} aria-label="Cerrar" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(28,34,48,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2230' }}>
            <Icono nombre="cerrar" size={17} grosor={2} />
          </button>
        </div>
        <span style={{ font: "400 14.5px/1.45 'Geist',sans-serif", color: 'rgba(28,34,48,.7)' }}>Adaptamos tus paradas a tu viaje y tus reservas a su hora, para que no pierdas tiempo.</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" data-reorganizar-si="1" onClick={onReorganizar} disabled={trabajando} style={{ flex: 1.2, height: 50, borderRadius: 15, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 15.5px 'Geist',sans-serif", boxShadow: '0 10px 20px -14px rgba(110,80,24,.7), inset 0 1px 0 rgba(255,255,255,.55)', opacity: trabajando ? 0.7 : 1 }}>
            Reorganizar
          </button>
          <button type="button" data-reorganizar-no="1" onClick={ahoraNo} disabled={trabajando} style={{ flex: 1, height: 50, borderRadius: 15, cursor: 'pointer', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: '#1C2230', font: "600 15px 'Geist',sans-serif" }}>
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * (10S7b) La alerta «¿Adaptamos tu primer y tu último día a tus vuelos?»: sale al guardar o cambiar el vuelo, con pase, solo a quien lo cambió y solo si adaptar esos días cambiaría algo. [Sí, adaptarlos] rehace
 * SOLO el día de llegada y el de vuelta (franja «Hemos adaptado tus días a tus vuelos» con [Deshacer]); [Ahora no] no cambia nada y deja el botón «Reorganizar» en esos días.
 */
function AlertaAdaptarVuelos(): ReactNode {
  const ahoraNo = () => {
    const propuesta = useReorganizarStore.getState().vuelos
    useReorganizarStore.getState().cerrarVuelos()
    if (propuesta) {
      const ids = propuesta.dias.map((dia) => dia.dayId)
      useReorganizarStore.getState().poner(ids, ids)
    }
  }
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') ahoraNo()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])
  return createPortal(
    <div data-hoja="adaptar-vuelos" data-alerta-adaptar="1" role="dialog" aria-modal="true" aria-label="¿Adaptamos tu primer y tu último día a tus vuelos?" style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="hoja-fondo" onClick={ahoraNo} style={{ position: 'absolute', inset: 0, background: 'rgba(20,16,10,.5)' }} />
      <div className="hoja-panel" style={{ position: 'relative', width: '100%', maxWidth: 520, borderRadius: '32px 32px 0 0', background: '#FBF3E2', color: '#1C2230', padding: '10px 18px calc(28px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 -20px 40px rgba(0,0,0,.25)' }}>
        <span aria-hidden="true" style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, background: 'rgba(28,34,48,.25)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ font: "400 28px/1.1 'Instrument Serif',serif" }}>¿Adaptamos tu primer y tu último día a tus vuelos?</span>
          <button className="zona-toque" type="button" onClick={ahoraNo} aria-label="Cerrar" style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', border: 'none', background: 'rgba(28,34,48,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2230' }}>
            <Icono nombre="cerrar" size={17} grosor={2} />
          </button>
        </div>
        <span style={{ font: "400 14.5px/1.45 'Geist',sans-serif", color: 'rgba(28,34,48,.7)' }}>Solo cambiamos esos dos días, para que no pongan nada antes de que llegues ni después de irte. El resto de tu ruta se queda como está.</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" data-adaptar-si="1" onClick={() => void adaptarLosDias()} style={{ flex: 1.2, height: 50, borderRadius: 15, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 15.5px 'Geist',sans-serif", boxShadow: '0 10px 20px -14px rgba(110,80,24,.7), inset 0 1px 0 rgba(255,255,255,.55)' }}>
            Sí, adaptarlos
          </button>
          <button type="button" data-adaptar-no="1" onClick={ahoraNo} style={{ flex: 1, height: 50, borderRadius: 15, cursor: 'pointer', background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: '#1C2230', font: "600 15px 'Geist',sans-serif" }}>
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
