import { LogoJutrip } from '../ui/LogoJutrip'

/**
 * (10S10 §8) LA PANTALLA DE CARGA DEL ARRANQUE: mientras la app todavía no sabe si hay un viaje guardado (lee la cuenta y los viajes, y con red lenta tarda) sale el logo sobre el marfil de la marca,
 * NUNCA la pantalla de crear viaje (antes se veía un momento el origen y el destino y luego saltaba al viaje). La quita `cargaInicialHecha` (useSyncStore), que TripSync pone cuando ya decidió dónde abrir.
 */
export function CargandoApp() {
  return (
    <div data-cargando-app role="status" aria-label="Cargando" className="flex h-dvh w-full flex-col items-center justify-center bg-bg">
      <LogoJutrip tam={44} tono="claro" />
    </div>
  )
}
