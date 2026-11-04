import { useRouteStore } from '../../../store/useRouteStore'
import { useExploreAperturaStore } from '../../../store/useExploreAperturaStore'
import { adaptarDiasDeCoche } from '../../../lib/adaptarVuelos'
import { Icono } from '../../ui/Icono'
import { RentalVehicleRow } from './RentalVehicleRow'

/**
 * (LZ2b1, Eric 4-nov; Design `Coche Lanza` 06a y 06b) El bloque «Coche» de RESERVAS en los destinos de coche (Lanzarote): ya no se pregunta «¿Vas a moverte en coche?» en el formulario; aquí hay un
 * interruptor «Coche de alquiler | Mi coche» (por defecto, alquiler).
 * - «Mi coche»: el bloque sale «Listo», sin nada que rellenar; el día 1 el rato de recoger el coche baja a 20 min.
 * - «Coche de alquiler»: se rellena como el vuelo o el alojamiento (empresa, fechas, precio) con el botón de reservar con nuestro enlace de alquiler; el día 1, de 30 a 45 min para recogerlo.
 * Dentro, la línea pequeña «¿No vas a conducir?», que abre EXPLORAR › Excursiones. La ruta y los trayectos son los mismos con los dos.
 */
export function CocheDeViaje() {
  const coche = useRouteStore((state) => (state.route?.answers.coche === 'propio' ? 'propio' : 'alquiler'))
  const rentalBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const setCocheDeViaje = useRouteStore((state) => state.setCocheDeViaje)
  const setMode = useRouteStore((state) => state.setMode)
  const pedir = useExploreAperturaStore((state) => state.pedir)
  const listo = coche === 'propio' || Boolean(rentalBooking)
  const elegir = (nuevo: 'alquiler' | 'propio') => {
    if (nuevo === coche) return
    setCocheDeViaje(nuevo)
    void adaptarDiasDeCoche({ cambioDeCoche: true })
  }
  const opcion = (id: 'alquiler' | 'propio', etiqueta: string) => (
    <button
      key={id}
      type="button"
      role="radio"
      aria-checked={coche === id}
      data-coche-opcion={id}
      onClick={() => elegir(id)}
      className={`zona-toque h-10 flex-1 rounded-full text-[13.5px] font-semibold transition-colors ${coche === id ? 'bg-text text-bg' : 'text-text/70'}`}
    >
      {etiqueta}
    </button>
  )
  return (
    <div data-bloque-coche={coche} className="flex flex-col gap-2.5 rounded-[20px] border border-text/[.08] bg-bg-card p-3.5">
      <div className="flex items-center gap-2.5">
        <Icono nombre="coche" size={18} />
        <span className="flex-1 font-display text-[22px] leading-none">Coche</span>
        <span
          className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
          style={listo ? { background: 'oklch(0.96 0.035 150)', color: 'oklch(0.3 0.08 150)' } : { background: 'rgba(28,34,48,.08)', color: 'rgba(28,34,48,.7)' }}
        >
          {listo ? 'Listo' : 'Falta'}
        </span>
      </div>
      <div role="radiogroup" aria-label="Tu coche" className="flex gap-1 rounded-full bg-bg p-1">
        {opcion('alquiler', 'Coche de alquiler')}
        {opcion('propio', 'Mi coche')}
      </div>
      {coche === 'propio' ? (
        <p className="text-[13.5px] leading-[1.45] text-text/75" data-coche-listo>
          Vas con tu coche: no hay nada que reservar ni que rellenar. El primer día cuenta unos 20 minutos para recogerlo.
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-[1.45] text-text/65">El primer día cuenta de 30 a 45 minutos para recoger el coche de alquiler.</p>
          <RentalVehicleRow />
        </>
      )}
      <button
        type="button"
        data-no-conduces
        onClick={() => {
          pedir({ categoria: 'excursiones', origen: null })
          setMode('explore')
        }}
        className="zona-toque self-start text-left text-[12.5px] leading-[1.4] text-text/65"
      >
        ¿No vas a conducir? <span className="font-medium text-accent underline underline-offset-[3px]">Mira las excursiones con recogida en tu hotel</span>
      </button>
    </div>
  )
}
