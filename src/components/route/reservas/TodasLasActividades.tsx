import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono } from '../../ui/Icono'
import { useHuecoAlFinal } from '../../propuesta/BotonDePropuesta'
import { useDestinationExcursions } from '../../../lib/destinationExcursions'
import type { ActividadDeDestino, CategoriaDeActividad } from '../../../lib/paginaDestino'
import { TarjetaDeActividad } from '../DestinationDetailModal'

/**
 * V45 §5: LA PÁGINA DE TODAS LAS EXCURSIONES Y ACTIVIDADES (la del «98 % de viajeros»), la que abre [Ver todas] de RESERVAS (antes abría EXPLORAR › Excursiones con solo 3).
 * Tiene TODAS: lo del carrusel primero y en su orden, y detrás lo demás de Civitatis y nuestras. Arriba, filtros por tipo (Excursiones, Free tours, Actividades, Entradas; solo los que hay).
 * Pantalla completa, con su cruz y sin mapa ni barra detrás (`data-flotantes`). Los datos vienen de /api/destino-pagina (la misma petición de siempre, en memoria).
 */
const ETIQUETAS: Record<CategoriaDeActividad, string> = { excursion: 'Excursiones', free_tour: 'Free tours', actividad: 'Actividades', entrada: 'Entradas' }
const ORDEN: CategoriaDeActividad[] = ['excursion', 'free_tour', 'actividad', 'entrada']

export function TodasLasActividades({ destino, todas, onCerrar }: { destino: string; todas: ActividadDeDestino[]; onCerrar: () => void }) {
  const huecoAlFinal = useHuecoAlFinal(32)
  const info = useDestinationExcursions(destino)
  const [filtro, setFiltro] = useState<CategoriaDeActividad | null>(null)
  const presentes = useMemo(() => ORDEN.filter((c) => todas.some((a) => a.categoria === c)), [todas])
  const lista = filtro ? todas.filter((a) => a.categoria === filtro) : todas
  return createPortal(
    <div data-todas-actividades role="dialog" aria-modal="true" aria-label={`Excursiones y actividades en ${destino}`} data-flotantes className="fixed inset-0 z-[90] flex flex-col bg-bg">
      <div className="relative shrink-0 px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onCerrar} aria-label="Cerrar" data-cerrar-todas className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border border-text/15 bg-bg-card text-text">
          <Icono nombre="cerrar" className="h-5 w-5" />
        </button>
        <p className="font-mono text-[10.5px] font-medium uppercase tracking-[.16em] text-accent">Todo lo que hacer</p>
        <h1 className="mt-1.5 max-w-[calc(100%-3.5rem)] font-display text-[28px] leading-[1.1] text-text">Excursiones y actividades en {destino}</h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5" style={{ paddingBottom: huecoAlFinal }}>
        {info.rating && (
          <div className="rounded-[22px] bg-[#1F1B16] px-5 py-4 text-[#F3EEE4]">
            <div className="flex items-center gap-4">
              <div className="shrink-0 text-center">
                <p className="font-display text-[40px] leading-none text-accent-grande">{info.rating.percent} %</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#F3EEE4]/60">De viajeros</p>
              </div>
              <p className="text-[14px] leading-snug">Así valoran los viajeros lo que se hace en {destino}.</p>
            </div>
          </div>
        )}
        {presentes.length > 1 && (
          <div data-filtros-actividades className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {[{ id: null, etiqueta: 'Todo' }, ...presentes.map((c) => ({ id: c, etiqueta: ETIQUETAS[c] }))].map((c) => (
              <button
                key={String(c.id)}
                type="button"
                onClick={() => setFiltro(c.id)}
                aria-pressed={filtro === c.id}
                data-filtro-actividad={c.id ?? 'todo'}
                className="flex h-9 flex-none items-center rounded-full px-3.5 text-[13px] font-bold"
                style={filtro === c.id ? { background: '#1C2230', color: '#F3D88F' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)', color: '#1C2230' }}
              >
                {c.etiqueta}
              </button>
            ))}
          </div>
        )}
        <div data-lista-todas className="mt-4 flex flex-col gap-4">
          {lista.map((a, i) => (
            <TarjetaDeActividad key={a.id} a={a} i={i} ancho="100%" />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
