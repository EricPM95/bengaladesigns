import { useEffect, useState, type CSSProperties } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExploreAperturaStore } from '../../../store/useExploreAperturaStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useViajeCompartido, nombreDe } from '../../../store/useViajeCompartido'
import { adaptarDiasDeCoche } from '../../../lib/adaptarVuelos'
import { buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { precioGuardado, type Importe } from '../../../lib/dinero'
import { BotonAnadirReservaCoche, HojaReservaCoche } from './ReservaDelCoche'
import { CabeceraBloque, ICONOS } from './BloqueReservas'
import { BloqueClaro } from './PiezasDesignReservas'
import type { DatosReservaCocheLeida } from '../../../lib/billeteLeer'

/**
 * (LZ2b1, Eric 4-nov; Design `Coche Lanza` 06a y 06b, copiado tal cual: medidas, colores y textos) El bloque «Coche» de RESERVAS en los destinos de coche (Lanzarote): ya no se pregunta «¿Vas a moverte en coche?» en el formulario;
 * aquí hay un interruptor «Coche de alquiler | Mi coche» (por defecto, alquiler).
 * - «Mi coche» (06b): el bloque sale «Listo», sin nada que rellenar; el día 1 el rato de recoger el coche baja a 20 min.
 * - «Coche de alquiler» (06a): «Falta» hasta que se pone el alquiler; filas «Recogida y devolución» (con sus fechas) y «¿Para quién es?», y el botón «Reservar coche» con nuestro enlace de alquiler; el día 1, de 30 a 45 min para recogerlo.
 * (6-nov) «¿Para quién es?» solo con 2 personas o más en el viaje (la regla de todo RESERVAS). [Añadir tu reserva] a la vista, como en el alojamiento (A1): «Desde el PDF, una foto o una captura.»; la app lee la confirmación (compañía, coche,
 * recogida y devolución con su sitio, día y hora, precio y código) y todo se corrige a mano. Con la reserva puesta, «Listo» con compañía · coche · precio y las dos filas (recogida y devolución); con pase, la hora de recogida cuenta en el día de llegada y
 * la de devolución en el último día (la hora límite de la LL).
 * Debajo, la línea «¿No vas a conducir?», que abre EXPLORAR › Excursiones. La ruta y los trayectos son los mismos con los dos.
 * Las piezas de Design usan el oro y el frambuesa de «Falta» tal cual (la regla de «frambuesa solo en piezas permitidas» no aplica a lo que Design pone).
 */
const NEGRO = '#1C2230'
const OSCURO = '#1C2230'
const CREMA = '#FBF3E2'
const BOTON_BASE: CSSProperties = { flex: 1, minWidth: 0, height: 54, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: "600 15px 'Geist'" }
const ELEGIDO: CSSProperties = { ...BOTON_BASE, background: OSCURO, color: CREMA, border: `1px solid ${OSCURO}` }
const NO_ELEGIDO: CSSProperties = { ...BOTON_BASE, background: '#FFFDF8', color: NEGRO, border: '1px solid rgba(28,34,48,.14)' }
const TITULO_FILA: CSSProperties = { font: "700 14.5px 'Geist'", color: NEGRO }

function Tic({ size = 15, color = '#F3D88F', grosor = 2.6 }: { size?: number; color?: string; grosor?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function CocheDeViaje({ abierto = false }: { abierto?: boolean }) {
  useMonedaViajero()
  // (6-nov, RETOQUES 5c) Como «Entradas y Free Tour»: cerrado al entrar; el viajero lo abre y lo cierra, y la ficha «Alquiler coche» del resumen lo abre.
  const [desplegadoUsuario, setDesplegadoUsuario] = useState<boolean | null>(null)
  useEffect(() => setDesplegadoUsuario(null), [abierto])
  const desplegado = desplegadoUsuario ?? abierto
  const route = useRouteStore((state) => state.route)
  const coche = route?.answers.coche === 'propio' ? 'propio' : 'alquiler'
  const rentalBooking = useRouteStore((state) => state.rentalVehicleBooking)
  const setRentalVehicleBooking = useRouteStore((state) => state.setRentalVehicleBooking)
  const setCocheDeViaje = useRouteStore((state) => state.setCocheDeViaje)
  const setCuentasEntre = useRouteStore((state) => state.setCuentasEntre)
  const setMode = useRouteStore((state) => state.setMode)
  const pedir = useExploreAperturaStore((state) => state.pedir)
  const gente = useViajeCompartido((s) => s.gente)
  const [hoja, setHoja] = useState(false)
  /** Lo que acaba de leer la app de un archivo (para rellenar la hoja); null si la hoja se abre a mano o para cambiar lo guardado. */
  const [leidos, setLeidos] = useState<DatosReservaCocheLeida | null>(null)
  const abrirHoja = (datosLeidos: DatosReservaCocheLeida | null) => {
    setLeidos(datosLeidos)
    setHoja(true)
  }
  const listo = coche === 'propio' || Boolean(rentalBooking)
  const { url } = buildCarRentalLink()
  const elegir = (nuevo: 'alquiler' | 'propio') => {
    if (nuevo === coche) return
    setCocheDeViaje(nuevo)
    void adaptarDiasDeCoche({ cambioDeCoche: true })
  }
  const opcion = (id: 'alquiler' | 'propio', etiqueta: string) => (
    <button key={id} type="button" role="radio" aria-checked={coche === id} data-coche-opcion={id} onClick={() => elegir(id)} style={coche === id ? ELEGIDO : NO_ELEGIDO}>
      {coche === id && <Tic />}
      {etiqueta}
    </button>
  )

  // Fechas: las del alquiler puesto o, mientras no hay, las del viaje.
  const recogida = rentalBooking?.startDate || route?.answers.dateRange?.start || ''
  const devolucion = rentalBooking?.endDate || route?.answers.dateRange?.end || ''
  const fecha = (iso: string) => (iso ? `${fechaCorta(iso).slice(0, 3)} ${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1] ?? ''}` : 'Elegir fecha')
  const celdaFecha = (etiqueta: string, iso: string, clave: string, hora?: string | null) => (
    <button
      type="button"
      data-coche-fecha={clave}
      onClick={() => abrirHoja(null)}
      style={{ flex: 1, minWidth: 0, height: 54, borderRadius: 15, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
    >
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>{etiqueta}</span>
        <span style={{ font: "500 15px 'Geist'" }}>
          {fecha(iso)}
          {hora ? ` · ${hora}` : ''}
        </span>
      </span>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(28,34,48,.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
        <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />
      </svg>
    </button>
  )

  // ¿Para quién es?: la gente del viaje (sin nadie más, solo tú). Sin elegir, todos.
  const personas = gente.length > 0 ? gente.map((p) => ({ id: p.id, nombre: p.esYo ? 'Tú' : nombreDe(p) || 'Alguien' })) : [{ id: 'yo', nombre: 'Solo yo' }]
  const declarado = route?.cuentasEntre?.coche ?? null
  const marcadas = declarado && declarado.length > 0 ? personas.filter((p) => declarado.includes(p.id)).map((p) => p.id) : personas.map((p) => p.id)
  const alternar = (id: string) => {
    if (gente.length < 2) return
    const nuevas = marcadas.includes(id) ? marcadas.filter((x) => x !== id) : [...marcadas, id]
    if (nuevas.length === 0) return
    setCuentasEntre('coche', nuevas.length === personas.length ? null : nuevas)
  }

  return (
    <div data-bloque-coche={coche} className="relative">
      {/* (6-nov, RETOQUES 5c) «SÚPER RECOMENDADO»: con «Coche de alquiler» y sin reserva. Cuelga del borde de arriba a la derecha: no tapa ni el estado ni la flecha. */}
      {coche === 'alquiler' && !rentalBooking && (
        <span
          data-coche-super-recomendado
          className="absolute right-4 top-[-9px] z-[1] rounded-full px-2.5 py-[3px]"
          style={{ background: '#F3E3B2', color: '#6B4E12', border: '1px solid rgba(181,138,46,.45)', font: "600 10px 'Geist Mono',monospace", letterSpacing: '.12em', textTransform: 'uppercase' }}
        >
          Súper recomendado
        </span>
      )}
      <BloqueClaro bloque="coche">
        <span data-cabecera-coche className="block">
          <CabeceraBloque
            icono={ICONOS.coche}
            titulo="Coche"
            datos="coche"
            onClick={() => setDesplegadoUsuario(!desplegado)}
            estado={`${route?.destination ?? ''} · ${listo ? 'Listo' : 'Falta'}`}
            hecho={listo}
            abierto={desplegado}
            atributos={{ 'data-coche-estado': listo ? 'listo' : 'falta' }}
            className="px-0.5"
          />
        </span>
        {desplegado && (
          <>
      <div role="radiogroup" aria-label="Tu coche" style={{ flex: 'none', display: 'flex', gap: 8 }}>
        {opcion('alquiler', 'Coche de alquiler')}
        {opcion('propio', 'Mi coche')}
      </div>

      {coche === 'propio' ? (
        <span data-coche-listo style={{ font: "400 14px/1.45 'Geist'", color: 'rgba(28,34,48,.65)' }}>
          Vas con tu coche por la isla.
        </span>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }} data-coche-fila="recogida">
            <span style={TITULO_FILA}>Recogida y devolución</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {celdaFecha('RECOGIDA', recogida, 'recogida', rentalBooking?.horaRecogida)}
              {celdaFecha('DEVOLUCIÓN', devolucion, 'devolucion', rentalBooking?.horaDevolucion)}
            </div>
            {rentalBooking && (
              <>
                <span data-coche-reserva style={{ font: "500 14px/1.4 'Geist'", color: 'rgba(28,34,48,.8)' }}>
                  {[rentalBooking.provider, rentalBooking.coche, precioGuardado(rentalBooking) ? precioEnVista(precioGuardado(rentalBooking) as Importe) : null].filter(Boolean).join(' · ')}
                </span>
                {(rentalBooking.lugarRecogida || rentalBooking.lugarDevolucion) && (
                  <span data-coche-lugares style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                    {[rentalBooking.lugarRecogida ? `Recoges: ${rentalBooking.lugarRecogida}` : null, rentalBooking.lugarDevolucion ? `Devuelves: ${rentalBooking.lugarDevolucion}` : null].filter(Boolean).join(' · ')}
                  </span>
                )}
                <button type="button" data-coche-cambiar-reserva onClick={() => abrirHoja(null)} className="zona-toque self-start border-none bg-transparent p-0 text-[13px] font-semibold underline underline-offset-2" style={{ color: '#8E6820' }}>
                  Cambiar los datos
                </button>
              </>
            )}
          </div>

          {/* (6-nov) La regla de todo RESERVAS: «¿Para quién es?» solo si en el viaje hay 2 personas o más (antes el coche se la saltaba y salía «Tú» solo). */}
          {gente.length >= 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }} data-coche-fila="para-quien">
              <span style={TITULO_FILA}>¿Para quién es?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {personas.map((p) => {
                  const on = marcadas.includes(p.id)
                  return (
                    <button key={p.id} type="button" data-coche-persona={p.id} aria-pressed={on} onClick={() => alternar(p.id)} style={on ? ELEGIDO : NO_ELEGIDO}>
                      {on && <Tic />}
                      {p.nombre}
                    </button>
                  )
                })}
              </div>
            </div>
          )}


          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            data-coche-reservar
            style={{
              height: 50,
              borderRadius: 15,
              background: 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)',
              color: '#4A3510',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              font: "700 15.5px 'Geist'",
              boxShadow: '0 10px 20px -14px rgba(110,80,24,.7), inset 0 1px 0 rgba(255,255,255,.55)',
            }}
          >
            Reservar coche
          </a>
          {/* (6-nov) «¿Ya lo has reservado?» [Añadir tu reserva], a la vista y sin reserva (A1 del alojamiento); con la reserva puesta se cambia con «Cambiar los datos». */}
          {!rentalBooking && <span style={TITULO_FILA} data-coche-ya-reservado>¿Ya lo has reservado?</span>}
          {!rentalBooking && <BotonAnadirReservaCoche año={Number(route?.answers.dateRange?.start?.slice(0, 4)) || undefined} onLeida={(datosLeidos) => abrirHoja(datosLeidos)} onAMano={() => abrirHoja(null)} />}

        </>
      )}

      <button
        type="button"
        data-no-conduces
        onClick={() => {
          pedir({ categoria: 'excursiones', origen: null })
          setMode('explore')
        }}
        style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px', textAlign: 'left' }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8E6820" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
          <path d="M5 5h14v12H5zM5 11h14M8 20l-1 1.5M16 20l1 1.5" />
        </svg>
        <span style={{ font: "400 13.5px/1.35 'Geist'", color: 'rgba(28,34,48,.7)' }}>
          ¿No vas a conducir? <span style={{ color: '#8E6820', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Mira las excursiones con recogida en tu hotel</span>
        </span>
      </button>

          </>
        )}
      </BloqueClaro>

      {hoja && (
        <HojaReservaCoche
          key={leidos ? 'leida' : 'manual'}
          reserva={rentalBooking}
          leidos={leidos}
          fechasDelViaje={{ start: route?.answers.dateRange?.start ?? '', end: route?.answers.dateRange?.end ?? '' }}
          onGuardar={(reserva) => {
            const cambiaLaHora = reserva.horaRecogida !== (rentalBooking?.horaRecogida ?? null) || reserva.horaDevolucion !== (rentalBooking?.horaDevolucion ?? null)
            setRentalVehicleBooking(reserva)
            setHoja(false)
            setLeidos(null)
            // Con pase, la hora de recogida cuenta en el día de llegada y la de devolución en el último día: se rehacen.
            if (cambiaLaHora) void adaptarDiasDeCoche({ cambioDeCoche: true })
          }}
          onQuitar={
            rentalBooking
              ? () => {
                  setHoja(false)
                  setLeidos(null)
                  quitarConDeshacer('Alquiler quitado del viaje', () => setRentalVehicleBooking(null))
                }
              : undefined
          }
          onClose={() => {
            setHoja(false)
            setLeidos(null)
          }}
        />
      )}
    </div>
  )
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
