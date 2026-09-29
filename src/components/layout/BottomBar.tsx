import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { useTripReadiness } from '../../hooks/useTripReadiness'
import { hasUnresolvedYellowItems } from '../../lib/readiness'
import { formatCompactDateRangeEs } from '../../lib/dateRange'
import type { SavedTrip } from '../../lib/tripPersistence'
import { BudgetPanel } from '../budget/BudgetPanel'
import { Modal } from '../ui/Modal'

/** Crema sobre la píldora oscura. */
const CREAM = '#F5EFE4'
const LINE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...LINE} aria-hidden="true">
      {children}
    </svg>
  )
}

function Slot({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="relative flex h-11 w-11 items-center justify-center rounded-full transition-opacity hover:opacity-80" style={{ color: CREAM }}>
      {children}
    </button>
  )
}

interface BottomBarProps {
  /** El mapa: lo abre si está plegado; si ya se ve, va a la pestaña Ruta (el mapa de todo el viaje). */
  onMap: () => void
}

/**
 * La barra de abajo (PROMPT_UI_REPASO_2, 1): una píldora oscura que flota sobre la lista, con cinco sitios sin texto,
 * iconos de línea en crema y 44 × 44 px de toque. Maleta (nuevo viaje), presupuesto, perfil en el centro (círculo
 * terracota: «Hola, viajero» y MIS VIAJES), mapa y reservas (con su «!» naranja mientras falte algo por reservar).
 * Sustituye a los botones flotantes sueltos y a la pestaña Reservas de arriba. En escritorio, igual, con el ancho de la
 * lista (va dentro de su columna).
 */
export function BottomBar({ onMap }: BottomBarProps) {
  const setScreen = useRouteStore((state) => state.setScreen)
  const setMode = useRouteStore((state) => state.setMode)
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const savedTrips = useSyncStore((state) => state.savedTrips) ?? []
  const activeTripId = useSyncStore((state) => state.activeTripId)
  const readiness = useTripReadiness()
  const bookingsAlert = readiness ? hasUnresolvedYellowItems(readiness.items) : false
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const newTrip = () => {
    // El próximo guardado crea una fila nueva, no sobrescribe el viaje abierto (como «+ Crear nuevo viaje»).
    useSyncStore.getState().setActiveTripId(null)
    setScreen('destination')
  }
  const openTrip = (trip: SavedTrip) => {
    setProfileOpen(false)
    useSyncStore.getState().setActiveTripId(trip.id)
    hydrateTrip(trip)
  }

  return (
    <>
      <nav
        aria-label="Barra del viaje"
        className="pointer-events-auto absolute bottom-[26px] left-6 right-6 z-30 flex h-16 items-center justify-between rounded-full px-3 shadow-[0_14px_34px_-14px_rgba(20,16,12,.55)]"
        style={{ background: '#1F1B16' }}
      >
        <Slot label="Nuevo viaje" onClick={newTrip}>
          <Icon>
            <rect x="4" y="8" width="16" height="12" rx="2" />
            <path d="M9 8V5h6v3M9 12v4M15 12v4" />
          </Icon>
        </Slot>
        <Slot label="Presupuesto" onClick={() => setBudgetOpen(true)}>
          <Icon>
            <path d="M7 8V7a5 5 0 0 1 10 0v1" />
            <path d="M5 8h14l-1 12H6z" />
          </Icon>
        </Slot>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Perfil y mis viajes"
          title="Perfil y mis viajes"
          className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-accent transition-transform active:scale-95"
          style={{ color: CREAM }}
        >
          <Icon>
            <circle cx="12" cy="9" r="3.5" />
            <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
          </Icon>
        </button>
        <Slot label="Mapa" onClick={onMap}>
          <Icon>
            <path d="m9 4-6 2.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" />
            <path d="M9 4v13M15 6.5v13" />
          </Icon>
        </Slot>
        <Slot label={bookingsAlert ? 'Reservas (falta algo por reservar)' : 'Reservas'} onClick={() => setMode('bookings')}>
          <Icon>
            <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
            <path d="M14 7v10" strokeDasharray="1.5 2" />
          </Icon>
          {bookingsAlert && (
            <span className="absolute right-0.5 top-0.5 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-accent-gold text-[10px] font-bold leading-none text-white" aria-hidden="true">
              !
            </span>
          )}
        </Slot>
      </nav>

      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)}>
        <BudgetPanel />
      </Modal>

      {/* El perfil: una hoja desde abajo. La cuenta llegará más adelante; de momento, los viajes de este dispositivo. */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={() => setProfileOpen(false)}>
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-bg px-5 pb-8 pt-3"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-text/20" />
              <h2 className="font-display text-[28px] leading-tight text-text">Hola, viajero</h2>
              <p className="mt-1 text-[13px] text-text/60">Pronto podrás guardar tus viajes en tu cuenta.</p>
              <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-text/55">Mis viajes</p>
              <div className="mt-2 divide-y divide-text/[.08] rounded-2xl border border-text/[.10] bg-bg-card">
                {savedTrips.length === 0 && <p className="px-4 py-3 text-[13px] text-text/60">Aún no hay viajes guardados en este dispositivo.</p>}
                {savedTrips.map((trip) => {
                  const active = trip.id === activeTripId
                  const range = trip.route.answers.dateRange
                  return (
                    <button key={trip.id} type="button" onClick={() => openTrip(trip)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg-hover">
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium text-text">{trip.route.destination}</span>
                        <span className="block text-[12.5px] text-text/55">{range ? formatCompactDateRangeEs(range.start, range.end) : `${trip.route.answers.days ?? ''} días`}</span>
                      </span>
                      {active && <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">Abierto</span>}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
