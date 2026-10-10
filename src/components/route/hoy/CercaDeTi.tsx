import type { Coordinates } from '../../../lib/types'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExploreAperturaStore, type AperturaExplorar } from '../../../store/useExploreAperturaStore'
import type { NombreIcono } from '../../../lib/iconos'
import { Icono } from '../../ui/Icono'
import { CajaBlanca, ojoMono } from './piezas'

/** Los tres botones de «Cerca de ti» de HOY, durante el viaje (de pago): cada uno abre EXPLORAR con ese filtro y ordenado por cercanía a `origen`. */
const BOTONES: { categoria: AperturaExplorar['categoria']; etiqueta: string; icono: NombreIcono }[] = [
  { categoria: 'banos', etiqueta: 'Baños', icono: 'banos' },
  { categoria: 'fuentes', etiqueta: 'Fuentes', icono: 'fuente' },
  { categoria: 'restaurantes', etiqueta: 'Comer', icono: 'comida' },
]

/**
 * @param origen  donde está el viajero (si compartió su ubicación) o, si no, la siguiente parada; null si no hay ninguno de los dos (EXPLORAR pide entonces la ubicación como siempre)
 */
export function CercaDeTi({ origen }: { origen: Coordinates | null }) {
  const setMode = useRouteStore((state) => state.setMode)
  const pedir = useExploreAperturaStore((state) => state.pedir)
  return (
    <CajaBlanca className="!gap-2 !px-3.5 !py-3">
      <span className="text-text/55" style={{ ...ojoMono, letterSpacing: '.14em' }}>
        Cerca de ti
      </span>
      <div className="grid grid-cols-3 gap-2">
        {BOTONES.map((boton) => (
          <button
            key={boton.categoria}
            type="button"
            onClick={() => {
              pedir({ categoria: boton.categoria, origen })
              setMode('explore')
            }}
            className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-text/15 bg-white text-[13px] font-semibold text-text hover:bg-bg-hover"
          >
            <Icono nombre={boton.icono} size={16} />
            {boton.etiqueta}
          </button>
        ))}
      </div>
    </CajaBlanca>
  )
}
