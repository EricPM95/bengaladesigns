import { useEffect, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { Insignia, Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, type EstadoLogros } from './api'
import { lineaDeSecretos } from './textosResumen'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * LA HOJA SENCILLA DEL BOTÓN FLOTANTE (Tanda 8B). Abre lo que ya hay: los sellos con su grado, las colecciones (las completas primero, luego las de su ruta, luego
 * las demás, como las manda el servidor) con su avance y «Roma aún esconde N secretos.» sin decir cuáles. Nunca enseña los emblemas. La hoja de verdad (insignias con sus
 * pedazos, pantalla de cada colección, emblemas guardados que se repiten) es de la tanda 8c: aquí solo hay lo mínimo para que el botón abra algo.
 */
export default function HojaLogros(): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  const [cargado, setCargado] = useState(false)
  useEffect(() => {
    let vivo = true
    void pedirEstado(tripId).then((e) => {
      if (!vivo) return
      setEstado(e)
      setCargado(true)
    })
    return () => {
      vivo = false
    }
  }, [tripId])
  const cerrar = () => useMomentosUI.getState().cerrarHojaLogros()
  const acabado = estado?.viaje?.hoy && estado.viaje.fin ? estado.viaje.hoy > estado.viaje.fin : false
  return (
    <div className="mo" style={{ position: 'fixed', inset: 0, zIndex: 9000, fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div onClick={cerrar} style={{ position: 'absolute', inset: 0, background: 'rgba(28,34,48,.45)', animation: 'moFade .3s ease both' }} />
      <div role="dialog" aria-modal="true" aria-label="Tus logros" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '86%', overflowY: 'auto', borderRadius: '28px 28px 0 0', background: '#FFFDF8', color: '#1C2230', padding: '12px 20px calc(env(safe-area-inset-bottom,0px) + 24px)', animation: 'moSube .4s cubic-bezier(.2,.8,.2,1) both' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ width: 42, height: 4, borderRadius: 4, background: 'rgba(28,34,48,.18)' }} /></div>
        <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 6, top: 8, width: 48, height: 48, border: 'none', background: 'transparent', cursor: 'pointer', color: '#1C2230' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <span style={{ font: "400 28px/1 'Instrument Serif',serif" }}>{estado?.ciudad ? `Tus logros en ${estado.ciudad}` : 'Tus logros'}</span>
        </div>
        {!estado ? (
          <p style={{ textAlign: 'center', font: "400 13.5px 'Geist'", color: 'rgba(28,34,48,.6)', margin: '24px 0' }}>{cargado ? 'Todavía no hay logros que enseñar.' : 'Un momento…'}</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 22, margin: '18px 0 6px' }}>
              {estado.sellos.map((s) => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: s.grado ? 1 : 0.4 }}>
                  <Sello id={s.id} grado={(s.grado ?? 'bronce') as GradoDeSello} tam={84} />
                  <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}>{s.nombre}</span>
                  <span style={{ font: "400 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{s.grado ? `${s.n} de ${s.total}` : 'Por conseguir'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {estado.colecciones.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(28,34,48,.08)', opacity: c.n === 0 && !c.en_tu_ruta ? 0.6 : 1 }}>
                  <Insignia coleccion={c.id} ganados={c.sitios.filter((x) => x.visto).map((x) => x.sitio)} completa={c.completa} tam={56} />
                  <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ font: "500 14.5px 'Geist'" }}>{c.nombre}</span>
                    <span style={{ font: "600 11px 'Geist Mono',monospace", color: c.completa ? 'oklch(0.45 0.11 150)' : 'rgba(28,34,48,.6)' }}>{c.completa ? '✓ Completa' : `${c.n} de ${c.total}`}</span>
                  </span>
                  {c.en_tu_ruta && <span style={{ font: "600 10.5px 'Geist'", padding: '4px 9px', borderRadius: 999, background: 'oklch(0.55 0.17 5 / .1)', color: 'oklch(0.45 0.17 5)' }}>En tu ruta</span>}
                </div>
              ))}
            </div>
            {lineaDeSecretos(estado.ciudad, estado.secretos.total, estado.secretos.encontrados) && <p style={{ textAlign: 'center', font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.7)', margin: '16px 0 4px' }}>{lineaDeSecretos(estado.ciudad, estado.secretos.total, estado.secretos.encontrados)}</p>}
            {estado.pendiente.texto && <p style={{ textAlign: 'center', font: "600 13px 'Geist'", color: 'oklch(0.55 0.17 5)', margin: '4px 0' }}>{estado.pendiente.texto}</p>}
            {acabado && (
              <button
                type="button"
                onClick={() => {
                  cerrar()
                  useMomentosUI.getState().abrirResumenViaje()
                }}
                style={{ width: '100%', height: 50, marginTop: 14, border: 'none', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "700 14.5px 'Geist'", cursor: 'pointer' }}
              >
                Ver el resumen del viaje
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
