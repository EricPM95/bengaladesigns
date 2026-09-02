import { useState } from 'react'
import { countryDisplayName } from '../../../lib/readiness'
import { useRouteStore } from '../../../store/useRouteStore'
import { Modal } from '../../ui/Modal'
import { Button } from '../../ui/Button'
import { ConfirmDeleteButton } from '../../ui/ConfirmDeleteButton'
import { ReservasItemRow } from './ReservasItemRow'

interface EsimRowProps {
  countryCode: string
}

/**
 * Fila de eSIM — toggle "Necesito internet" ↔ "Ya tengo internet", ambos sincronizados por país
 * (misma clave en `esimSelections` para todas las apariciones de ese país en la ruta). Los dos
 * estados cuentan como resuelto para el % de viaje listo.
 */
export function EsimRow({ countryCode }: EsimRowProps) {
  const status = useRouteStore((state) => state.esimSelections[countryCode])
  const setEsimSelection = useRouteStore((state) => state.setEsimSelection)
  const [open, setOpen] = useState(false)

  const countryName = countryDisplayName(countryCode)
  const resolved = Boolean(status)
  const subtitle = status === 'have' ? 'Ya tienes internet' : status === 'booked' ? 'Reservada' : countryName

  return (
    <>
      <ReservasItemRow
        kind="esim"
        label="eSIM"
        subtitle={subtitle}
        resolved={resolved}
        onClick={() => setOpen(true)}
        bookAction={{
          label: 'Obtener con 5% dto.',
          href: 'https://esim.holafly.com',
          onGet: () => setEsimSelection(countryCode, 'booked'),
        }}
      />

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <h2 className="font-display text-h2 font-semibold text-text">Internet en {countryName}</h2>

          <div className="flex rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => setEsimSelection(countryCode, 'booked')}
              className={`flex-1 rounded-lg py-2 text-small font-medium transition-colors ${
                status === 'booked' ? 'bg-accent text-white' : 'text-text-soft hover:bg-bg-hover'
              }`}
            >
              Necesito internet
            </button>
            <button
              type="button"
              onClick={() => setEsimSelection(countryCode, 'have')}
              className={`flex-1 rounded-lg py-2 text-small font-medium transition-colors ${
                status === 'have' ? 'bg-accent text-white' : 'text-text-soft hover:bg-bg-hover'
              }`}
            >
              Ya tengo internet
            </button>
          </div>

          {status === 'have' && (
            <p className="text-small text-text-soft">
              Marcado como resuelto — no hace falta volver a indicarlo en el resto de destinos de {countryName}.
            </p>
          )}

          {status !== 'have' && (
            <div className="space-y-2">
              <a
                href="https://esim.holafly.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setEsimSelection(countryCode, 'booked')}
              >
                <Button className="w-full font-bold shadow-sm">Reserva internet ilimitado en {countryName} →</Button>
              </a>
              {status === 'booked' && <p className="text-center text-caption font-medium text-accent-hover">✓ Reservada</p>}
            </div>
          )}

          {status && (
            <ConfirmDeleteButton
              itemLabel={`la eSIM de ${countryName}`}
              onConfirm={() => {
                setEsimSelection(countryCode, null)
                setOpen(false)
              }}
            />
          )}
        </div>
      </Modal>
    </>
  )
}
