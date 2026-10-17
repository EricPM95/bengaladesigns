import { useEffect, useState, type ReactNode } from 'react'
import { useSyncStore } from '../../../store/useSyncStore'
import { Chapa, Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, pedirResumen, pedirViajero, type EstadoLogros, type LogrosViajero, type ResumenLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL RESUMEN DEL VIAJE (Tanda 8B, R1 y R2 de «Logros · Momentos»). Arriba el texto que toca (`roma.json › textos.resumen_viaje`: «¡Wow!» si tiene al menos 3
 * colecciones y 2 secretos, y si no «con ganas de verte» con los secretos que quedan), el sello, las colecciones, «N de 12 secretos encontrados», los logros
 * de viajero nuevos y lo pendiente con su cuenta atrás de 30 días. Al final, [Compartir mi viaje] y [Ver mi viaje].
 * No lleva «Estampar mi sello» (el pasaporte es de otra tanda).
 */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function rangoDeFechas(inicio: string, fin: string): string {
  const a = new Date(`${inicio}T12:00:00`)
  const b = new Date(`${fin}T12:00:00`)
  return `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]}`
}

const Titulo = ({ children }: { children: ReactNode }) => <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)', padding: '0 20px', marginTop: 24 }}>{children}</span>

export default function ResumenViaje(): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const [estado, setEstado] = useState<EstadoLogros | null>(null)
  const [resumen, setResumen] = useState<ResumenLogros | null>(null)
  const [viajero, setViajero] = useState<LogrosViajero | null>(null)
  const [cargado, setCargado] = useState(false)
  useEffect(() => {
    let vivo = true
    void Promise.all([pedirEstado(tripId), pedirResumen(tripId, null), pedirViajero()]).then(([e, r, v]) => {
      if (!vivo) return
      setEstado(e)
      setResumen(r)
      setViajero(v)
      setCargado(true)
    })
    return () => {
      vivo = false
    }
  }, [tripId])
  const cerrar = () => useMomentosUI.getState().cerrarResumenViaje()

  const nuevos = (resumen?.ganado ?? [])
    .filter((g) => g.logro.startsWith('viajero:'))
    .map((g) => {
      const id = g.logro.slice('viajero:'.length)
      const def = viajero?.logros.find((l) => l.id === id)
      const esc = def?.escalones.find((e) => String(e.n) === String(g.escalon))
      return { id, escalon: g.escalon || null, nombre: esc?.nombre ?? def?.nombre ?? null }
    })
    .filter((x) => x.nombre)
  const sello = estado?.sellos[0]
  const colecciones = (estado?.colecciones ?? []).filter((c) => c.n > 0)
  const pend = resumen?.pendiente ?? estado?.pendiente
  const secretos = estado?.secretos
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Resumen del viaje" style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <button type="button" aria-label="Cerrar" onClick={cerrar} style={{ position: 'absolute', right: 8, top: 'calc(env(safe-area-inset-top,0px) + 8px)', width: 48, height: 48, border: 'none', background: 'transparent', color: '#1C2230', cursor: 'pointer' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      {!estado ? (
        <div style={{ margin: 'auto', font: "400 14px 'Geist'", color: 'rgba(28,34,48,.6)', textAlign: 'center', padding: 24 }}>{cargado ? 'Todavía no hay nada que enseñar de este viaje.' : 'Preparando tu resumen…'}</div>
      ) : (
        <>
          <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 40px) 24px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)' }}>{estado.ciudad ? `Tu viaje a ${estado.ciudad}` : 'Tu viaje'}{estado.viaje?.inicio && estado.viaje?.fin ? ` · ${rangoDeFechas(estado.viaje.inicio, estado.viaje.fin)}` : ''}</span>
            {resumen?.texto_viaje && <span style={{ font: "400 28px/1.12 'Instrument Serif',serif", textWrap: 'balance', animation: 'moUp .6s ease both' }}>{resumen.texto_viaje} Echa un vistazo a todo lo que conseguiste.</span>}
            {sello?.grado && (
              <>
                <div style={{ marginTop: 8, animation: 'moIn .8s .2s both' }}><Sello id={sello.id} grado={sello.grado as GradoDeSello} tam={112} /></div>
                <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.7)' }}>{sello.nombre_grado} · {sello.grado}</span>
              </>
            )}
          </div>
          {colecciones.length > 0 && (
            <>
              <Titulo>Colecciones</Titulo>
              <div style={{ padding: '10px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {colecciones.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Insignia coleccion={c.id} ganados={c.sitios.filter((s) => s.visto).map((s) => s.sitio)} completa={c.completa} tam={63} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ font: "500 13px/1.2 'Geist'" }}>{c.nombre}</span>
                      <span style={{ font: "600 11px 'Geist Mono',monospace", color: c.completa ? 'oklch(0.45 0.11 150)' : 'rgba(28,34,48,.6)' }}>{c.completa ? '✓ Completa' : `${c.n} de ${c.total}`}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {secretos && (secretos.total > 0 || secretos.encontrados > 0) && (
            <>
              <Titulo>{secretos.encontrados > 0 ? secretos.texto || `${secretos.encontrados} de ${secretos.total} secretos encontrados` : estado.ciudad ? `${estado.ciudad} esconde ${secretos.total} secretos` : `${secretos.total} secretos por descubrir`}</Titulo>
              <div style={{ padding: '10px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {secretos.encontrados_lista.map((e) => (
                  <span key={e.id} style={{ width: 63, height: 63, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Emblema id={e.id} tam={63} /></span>
                ))}
                {Array.from({ length: Math.max(0, secretos.total - secretos.encontrados) }, (_, i) => (
                  <span key={`c${i}`} aria-hidden style={{ width: 63, height: 63, borderRadius: '50%', border: '1.5px dashed rgba(28,34,48,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 24px 'Instrument Serif',serif", color: 'rgba(28,34,48,.4)' }}>?</span>
                ))}
              </div>
            </>
          )}
          {nuevos.length > 0 && (
            <>
              <Titulo>Logros de viajero nuevos</Titulo>
              <div style={{ padding: '10px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {nuevos.map((n, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Chapa logro={n.id} escalon={n.escalon} tam={70} />
                    <span style={{ font: "400 18px/1.1 'Instrument Serif',serif", maxWidth: 120 }}>{n.nombre}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {pend && (pend.sorpresas > 0 || pend.pedazos > 0) && (
            <div style={{ margin: '24px 20px 0', padding: '14px 16px', borderRadius: 16, border: '1px solid oklch(0.55 0.17 5 / .35)', background: 'oklch(0.55 0.17 5 / .06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: "600 14px 'Geist'", color: 'oklch(0.45 0.17 5)' }}>{pend.sorpresas > 0 ? `Te quedan ${pend.sorpresas} ${pend.sorpresas === 1 ? 'sorpresa' : 'sorpresas'} por reclamar` : `Te quedan ${pend.pedazos} ${pend.pedazos === 1 ? 'pedazo' : 'pedazos'} por reclamar`}</span>
              {pend.dias_para_reclamar != null && <span style={{ font: "400 12.5px 'Geist'", color: 'rgba(28,34,48,.65)' }}>{`Te quedan ${pend.dias_para_reclamar} ${pend.dias_para_reclamar === 1 ? 'día' : 'días'} para reclamarlas`}</span>}
            </div>
          )}
          <div style={{ flex: 1, minHeight: 24 }} />
          <div style={{ padding: '24px 20px calc(env(safe-area-inset-bottom,0px) + 24px)', display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => useMomentosUI.getState().abrirCompartir({ tipo: 'viaje' })} style={{ flex: 1, height: 52, border: 'none', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "700 14px 'Geist'", cursor: 'pointer' }}>Compartir mi viaje</button>
            <button type="button" onClick={cerrar} style={{ flex: 1, height: 52, border: '1px solid rgba(28,34,48,.25)', borderRadius: 999, background: 'transparent', color: '#1C2230', font: "600 14px 'Geist'", cursor: 'pointer' }}>Ver mi viaje</button>
          </div>
        </>
      )}
    </div>
  )
}
