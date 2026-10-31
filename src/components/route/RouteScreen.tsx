import { motion } from 'framer-motion'
import { RouteView } from './RouteView'
import { AvisoSolape } from './reservas/AvisoSolape'
import { AlojamientoHost } from './alojamiento/AlojamientoHost'
import { BotonFlotanteLogros } from '../logros/momentos/BotonFlotanteLogros'
import { ReorganizarHost } from '../reorganizar/ReorganizarHost'
import { PantallaPresupuesto } from './presupuesto/PantallaPresupuesto'

/**
 * La pantalla de la ruta (RUTA, DÍAS, EXPLORAR, RESERVAS, HOY, el mapa, las fichas…). Está en su propio archivo para que la app cargue esto solo cuando se abre (Tanda 8A3):
 * al abrir, el móvil solo lee lo de la primera pantalla. Mientras llega, App.tsx pone un fondo vacío del mismo tamaño.
 */
export default function RouteScreen() {
  return (
    <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="h-dvh">
      <RouteView />
      <AvisoSolape />
      <AlojamientoHost />
      <PantallaPresupuesto />
      <BotonFlotanteLogros />
      <ReorganizarHost />
    </motion.div>
  )
}
