import { LogoJutrip } from '../ui/LogoJutrip'
import { useSyncStore } from '../../store/useSyncStore'

/**
 * (10S10 §8) LA PANTALLA DE CARGA DEL ARRANQUE: mientras la app todavía no sabe si hay un viaje guardado (lee la cuenta y los viajes, y con red lenta tarda) sale el logo sobre el marfil de la marca,
 * NUNCA la pantalla de crear viaje (antes se veía un momento el origen y el destino y luego saltaba al viaje). La quita `cargaInicialHecha` (useSyncStore), que TripSync pone cuando ya decidió dónde abrir.
 */
export function CargandoApp() {
  // (V1, 15-nov) Si el servidor no contesta, lo dice con palabras sencillas y reintenta solo.
  const sinServidor = useSyncStore((s) => s.sinServidor)
  return (
    <div data-cargando-app role="status" aria-label="Cargando" className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-bg">
      <LogoJutrip tam={44} tono="claro" />
      {sinServidor && (
        <p data-sin-servidor className="max-w-[280px] px-6 text-center text-[13px] font-medium" style={{ color: 'rgba(28,34,48,.7)' }}>
          No llegamos al servidor. Reintentando…
        </p>
      )}
    </div>
  )
}
