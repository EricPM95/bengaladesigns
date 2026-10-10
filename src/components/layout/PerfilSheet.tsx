import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouteStore } from '../../store/useRouteStore'
import { useSyncStore } from '../../store/useSyncStore'
import { formatCompactDateRangeEs } from '../../lib/dateRange'
import { empezarViajeNuevo } from '../../lib/nuevoViaje'
import type { SavedTrip } from '../../lib/tripPersistence'
import { Icono } from '../ui/Icono'
import { NewTripSheet } from './NewTripSheet'

/**
 * El Perfil (Tanda 6z3): la hoja de abajo que abre el círculo de la cabecera. La cuenta llegará más adelante; de momento, «Mis viajes» (los de este dispositivo), con el «+ Nuevo viaje» (que estaba
 * en la cabecera) y los tips del viaje (la bombilla que estaba en la cabecera).
 */
export function PerfilSheet({ open, onClose, onTips }: { open: boolean; onClose: () => void; onTips: () => void }) {
  const hydrateTrip = useRouteStore((state) => state.hydrateTrip)
  const savedTrips = useSyncStore((state) => state.savedTrips) ?? []
  const activeTripId = useSyncStore((state) => state.activeTripId)
  const [newTripOpen, setNewTripOpen] = useState(false)

  const openTrip = (trip: SavedTrip) => {
    onClose()
    useSyncStore.getState().setActiveTripId(trip.id)
    useSyncStore.getState().setResumeTrip(null)
    hydrateTrip(trip)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
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
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewTripOpen(true)}
                  className="flex h-11 items-center gap-2 rounded-full bg-text px-4 text-[13.5px] font-semibold text-bg transition-transform active:scale-[.98]"
                >
                  <Icono nombre="anadir" size={15} grosor={2.2} />
                  Nuevo viaje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onTips()
                  }}
                  className="flex h-11 items-center gap-2 rounded-full border border-text/15 px-4 text-[13.5px] font-semibold text-text transition-colors hover:bg-bg-hover"
                >
                  <Icono nombre="tips" size={16} />
                  Tips del viaje
                </button>
              </div>
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
      {newTripOpen && (
        <NewTripSheet
          onConfirm={() => {
            setNewTripOpen(false)
            onClose()
            empezarViajeNuevo()
          }}
          onCancel={() => setNewTripOpen(false)}
        />
      )}
    </>
  )
}
