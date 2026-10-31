import { useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouteStore } from '../../store/useRouteStore'
import { useReorganizarStore } from '../../store/useReorganizarStore'
import { useRectDelMenu } from '../ui/AvisoSobreLaBarra'
import { HojaDia, filasDeDias } from '../ui/HojaDia'
import { Icono } from '../ui/Icono'
import { alDia, ElDia } from '../../lib/nombreDeDia'
import { esDiaDeExcursion } from '../../lib/tituloDelDia'
import { elSitio, sitioEnPlural } from '../../lib/articulos'
import { pasarImprescindibleAOtroDia } from '../../lib/pasarImprescindible'
import type { NoCabe } from '../../lib/adaptarVuelos'

/** «El Coliseo no cabe el jueves.» (sin fechas, «el día 1»). Con plural: «Los Museos Capitolinos no caben el jueves.» */
export function textoNoCabe(item: NoCabe, sinFechas: boolean): string {
  const sitio = elSitio(item.nombre)
  const cuando = sinFechas || !item.weekday ? `el día ${item.dayNumber}` : `el ${item.weekday}`
  return `${sitio.charAt(0).toUpperCase()}${sitio.slice(1)} ${sitioEnPlural(item.nombre) ? 'no caben' : 'no cabe'} ${cuando}.`
}

/**
 * (Tanda 10S7c) DEBAJO DE LA FRANJA «Hemos adaptado tus días a tus vuelos»: por cada IMPRESCINDIBLE que no cabe en el día adaptado (el Coliseo, el Vaticano…), su aviso con [Pasarlo a otro día].
 * No se queda escondido en «Si te sobra tiempo»: el aviso sigue ahí hasta que el viajero lo pasa a otro día, lo cierra (✕) o deshace la adaptación. Solo cuenta el que SIGUE en «Si te sobra tiempo»
 * de su día (lo que sale de ahí —pasado a otro día, devuelto por Deshacer— desaparece solo, sin sincronizar nada).
 */
export function AvisoNoCabe(): ReactNode {
  const noCaben = useReorganizarStore((s) => s.noCaben)
  const route = useRouteStore((s) => s.route)
  const rect = useRectDelMenu()
  const [eligiendo, setEligiendo] = useState<NoCabe | null>(null)
  const vigentes = useMemo(() => noCaben.filter((item) => route?.days.find((day) => day.id === item.dayId)?.spareStops?.some((stop) => stop.id === item.stopId)), [noCaben, route])
  if (!route) return null
  const sinFechas = !route.answers.dateRange?.start
  return (
    <>
      {vigentes.length > 0 &&
        createPortal(
          <div
            data-aviso-no-cabe="1"
            style={{ position: 'fixed', left: rect ? rect.left : 0, width: rect ? rect.width : '100%', bottom: rect ? `calc(100vh - ${rect.top}px)` : 'calc(72px + env(safe-area-inset-bottom))', zIndex: 101, display: 'flex', flexDirection: 'column', maxHeight: '38vh', overflowY: 'auto', background: '#1C2230', color: '#FBF3E2' }}
          >
            {vigentes.map((item) => (
              <div key={item.stopId} data-no-cabe={item.stopId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(251,243,226,.12)' }}>
                <span data-no-cabe-texto="1" style={{ flex: 1, minWidth: 0, font: "500 14px/1.3 'Geist',sans-serif" }}>
                  {textoNoCabe(item, sinFechas)}
                </span>
                <button type="button" data-pasar-otro-dia="1" onClick={() => setEligiendo(item)} style={{ flex: 'none', height: 34, padding: '0 12px', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)', color: '#4A3510', font: "700 13px 'Geist',sans-serif" }}>
                  Pasarlo a otro día
                </button>
                <button type="button" className="zona-toque" aria-label="Cerrar el aviso" data-no-cabe-cerrar="1" onClick={() => useReorganizarStore.getState().quitarNoCaben(item.stopId)} style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(251,243,226,.12)', color: '#FBF3E2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icono nombre="cerrar" size={14} grosor={2} />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
      {eligiendo && <ElegirDia item={eligiendo} onCerrar={() => setEligiendo(null)} />}
    </>
  )
}

/** La hoja de mover parada de siempre (`HojaDia`): elige el día y el imprescindible pasa a ser LA PRIMERA parada de ese día. */
function ElegirDia({ item, onCerrar }: { item: NoCabe; onCerrar: () => void }): ReactNode {
  const route = useRouteStore((s) => s.route)
  const dias = useMemo(() => (route ? route.days.filter((day) => !day.isReturnLeg) : []), [route])
  const [elegido, setElegido] = useState<string | null>(null)
  if (!route) return null
  const filas = filasDeDias(route, dias, (day) => (day.id === item.dayId ? 'No cabe ese día con tu vuelo.' : esDiaDeExcursion(day) ? `${ElDia(route, day.dayNumber)} es el día de tu excursión.` : null))
  const primero = filas.find((fila) => !fila.bloqueo)?.id ?? null
  const idElegido = elegido ?? primero
  const dia = dias.find((day) => day.id === idElegido) ?? null
  return (
    <HojaDia
      etiqueta={item.nombre}
      titulo="¿A qué día lo pasamos?"
      filas={filas}
      elegido={idElegido}
      onElegir={setElegido}
      boton={dia ? `Pasar ${alDia(route, dia.dayNumber)}` : 'Elige un día'}
      onConfirmar={() => {
        if (!dia) return
        pasarImprescindibleAOtroDia(item, dia.id)
        onCerrar()
      }}
      onCerrar={onCerrar}
      z={120}
      datos="pasar-imprescindible"
    />
  )
}
