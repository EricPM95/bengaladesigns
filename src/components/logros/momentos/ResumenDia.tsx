import { useEffect, useState, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { useSyncStore } from '../../../store/useSyncStore'
import { Sello, type GradoDeSello } from '../dibujos'
import { pedirEstado, pedirResumen, type EstadoLogros, type ResumenLogros } from './api'
import './momentos.css'
import { useMomentosUI } from './useMomentosUI'

/**
 * EL RESUMEN DEL DÍA (Tanda 8B). El mismo al acabar la ruta y al final de las sorpresas. Cuenta lo ganado hoy (del servidor, `GET /api/logros/resumen`; si no
 * contesta, de lo que se acaba de enseñar), el sello con su grado, «N de 12 secretos encontrados» (sin decir cuáles) y lo que queda por reclamar.
 * Textos propios (el diseño no dibuja esta pantalla): «Tu día en {ciudad}», «Esto es lo que has ganado hoy», «Aún no has ganado nada hoy».
 */
const PLURALES: Record<string, [string, string]> = {
  pedazo: ['pedazo de colección', 'pedazos de colecciones'],
  coleccion: ['colección completada', 'colecciones completadas'],
  sello: ['sello subido de grado', 'sellos subidos de grado'],
  emblema: ['emblema oculto', 'emblemas ocultos'],
  pais: ['país nuevo', 'países nuevos'],
  destino_nuevo: ['destino nuevo', 'destinos nuevos'],
  continente: ['continente nuevo', 'continentes nuevos'],
  maravilla: ['maravilla del mundo', 'maravillas del mundo'],
  patrimonio: ['Patrimonio de la Humanidad', 'Patrimonios de la Humanidad'],
  viajero: ['logro de viajero', 'logros de viajero'],
}
const ORDEN = ['sello', 'pedazo', 'coleccion', 'emblema', 'pais', 'destino_nuevo', 'continente', 'maravilla', 'patrimonio', 'viajero']

/** Pura: de los momentos de una ronda, cuántas cosas de cada tipo (los pedazos se cuentan por sitio). */
export function contarMomentos(ganado: Momento[]): Record<string, number> {
  const c: Record<string, number> = {}
  for (const m of ganado) {
    if (m.tipo === 'suma') c.pedazo = (c.pedazo ?? 0) + (((m.sitios as string[] | undefined)?.length) ?? 1)
    else if (m.tipo === 'suma_sello') continue
    else c[m.tipo] = (c[m.tipo] ?? 0) + 1
  }
  return c
}

export function ResumenDia({ ganado, estado: estadoInicial, alCerrar }: { ganado: Momento[]; estado: EstadoLogros | null; alCerrar: () => void }): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const [estado, setEstado] = useState<EstadoLogros | null>(estadoInicial)
  const [resumen, setResumen] = useState<ResumenLogros | null>(null)
  useEffect(() => {
    let vivo = true
    void (async () => {
      const e = estadoInicial ?? (await pedirEstado(tripId))
      if (!vivo) return
      setEstado(e)
      const r = await pedirResumen(tripId, e?.viaje?.hoy ?? null)
      if (vivo) setResumen(r)
    })()
    return () => {
      vivo = false
    }
  }, [tripId, estadoInicial])

  // Lo del día que cuenta el servidor y, por si aún no lo ha apuntado, lo que se acaba de enseñar: de cada cosa, la cuenta más alta.
  const cuentas = { ...(resumen?.por_categoria ?? {}) }
  for (const [k, v] of Object.entries(contarMomentos(ganado))) cuentas[k] = Math.max(cuentas[k] ?? 0, v)
  const lineas = ORDEN.filter((k) => (cuentas[k] ?? 0) > 0)
  const ciudad = estado?.ciudad ?? ''
  const sello = estado?.sellos[0]
  const pendiente = (resumen?.pendiente ?? estado?.pendiente)?.texto ?? null
  const acabado = estado?.viaje?.hoy && estado.viaje.fin ? estado.viaje.hoy > estado.viaje.fin : false
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Resumen del día" style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#F5EFE4', color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif", display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 34px) 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
        <span style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(28,34,48,.55)', animation: 'moUp .6s ease both' }}>{ciudad ? `Tu día en ${ciudad}` : 'Tu día'}</span>
        <span style={{ font: "400 36px/1.05 'Instrument Serif',serif", animation: 'moUp .6s .1s ease both' }}>{lineas.length > 0 ? 'Esto es lo que has ganado hoy' : 'Aún no has ganado nada hoy'}</span>
        {sello && sello.grado && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'moIn .8s .25s both' }}>
            <Sello id={sello.id} grado={sello.grado as GradoDeSello} tam={112} />
            <span style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(28,34,48,.7)' }}>{sello.nombre_grado} · {sello.grado}</span>
            {sello.linea && <span style={{ font: "italic 400 16px/1.3 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)' }}>{sello.linea}</span>}
          </div>
        )}
      </div>
      {lineas.length > 0 && (
        <ul style={{ margin: '0 20px', padding: 0, listStyle: 'none', borderTop: '1px solid rgba(28,34,48,.1)' }}>
          {lineas.map((k, n) => (
            <li key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '14px 4px', borderBottom: '1px solid rgba(28,34,48,.1)', animation: `moUp .5s ${(0.3 + n * 0.08).toFixed(2)}s ease both` }}>
              <span style={{ font: "400 28px/1 'Instrument Serif',serif", minWidth: 36, color: 'oklch(0.55 0.17 5)' }}>{cuentas[k]}</span>
              <span style={{ font: "500 15px 'Geist'" }}>{PLURALES[k][cuentas[k] === 1 ? 0 : 1]}</span>
            </li>
          ))}
        </ul>
      )}
      <div style={{ padding: '18px 24px 0', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' }}>
        {estado?.secretos.texto && <span style={{ font: "500 13.5px 'Geist'", color: 'rgba(28,34,48,.7)' }}>{estado.secretos.texto}</span>}
        {pendiente && <span style={{ font: "600 13.5px 'Geist'", color: 'oklch(0.55 0.17 5)' }}>{pendiente}</span>}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '24px 20px calc(env(safe-area-inset-bottom,0px) + 28px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" onClick={alCerrar} style={{ height: 54, border: 'none', borderRadius: 999, background: '#1C2230', color: '#FFFDF8', font: "700 15px 'Geist'", cursor: 'pointer' }}>Seguir</button>
        {acabado && (
          <button
            type="button"
            onClick={() => {
              alCerrar()
              useMomentosUI.getState().abrirResumenViaje()
            }}
            style={{ height: 48, border: '1px solid rgba(28,34,48,.2)', borderRadius: 999, background: 'transparent', color: '#1C2230', font: "600 14px 'Geist'", cursor: 'pointer' }}
          >
            Ver el resumen del viaje
          </button>
        )}
      </div>
    </div>
  )
}
