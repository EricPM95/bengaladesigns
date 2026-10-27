import { useState } from 'react'
import { AVISO_FUERA_DE_RUTA, volverAPonerEnSuDia } from '../../../lib/quitarConEntrada'

/**
 * (Tanda 10N6, 1c) Bajo la entrada que se quedó en RESERVAS cuando el viajero quitó su parada «solo de la ruta»: «Ya no está en tu ruta» y [Volver a ponerla en su día].
 */
export function FueraDeRutaFila({ reservaId, esFreeTour = false }: { reservaId: string; esFreeTour?: boolean }) {
  const [ocupado, setOcupado] = useState(false)
  return (
    <div data-fuera-de-ruta="1" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-[14px] px-3.5 py-2.5" style={{ background: 'color-mix(in srgb, rgb(var(--accent-gold)) 14%, transparent)' }}>
      <span className="text-[12.5px] leading-snug text-text">{AVISO_FUERA_DE_RUTA}</span>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => {
          setOcupado(true)
          void volverAPonerEnSuDia(reservaId).finally(() => setOcupado(false))
        }}
        className="h-8 whitespace-nowrap rounded-full border border-accent px-3.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
      >
        {esFreeTour ? 'Volver a ponerlo en su día' : 'Volver a ponerla en su día'}
      </button>
    </div>
  )
}
