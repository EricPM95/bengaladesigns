import { useState, type CSSProperties } from 'react'
import { useRouteStore } from '../../../store/useRouteStore'
import { useExploreAperturaStore } from '../../../store/useExploreAperturaStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useViajeCompartido, nombreDe } from '../../../store/useViajeCompartido'
import { adaptarDiasDeCoche } from '../../../lib/adaptarVuelos'
import { buildCarRentalLink } from '../../../lib/vehicleRentalLinks'
import { fechaCorta } from '../../../lib/nombreDeDia'
import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { precioGuardado, type Importe } from '../../../lib/dinero'
import { GeneralBookingModal } from './GeneralBookingModal'

/**
 * (LZ2b1, Eric 4-nov; Design `Coche Lanza` 06a y 06b, copiado tal cual: medidas, colores y textos) El bloque «Coche» de RESERVAS en los destinos de coche (Lanzarote): ya no se pregunta «¿Vas a moverte en coche?» en el formulario;
 * aquí hay un interruptor «Coche de alquiler | Mi coche» (por defecto, alquiler).
 * - «Mi coche» (06b): el bloque sale «Listo», sin nada que rellenar; el día 1 el rato de recoger el coche baja a 20 min.
 * - «Coche de alquiler» (06a): «Falta» hasta que se pone el alquiler; filas «Recogida y devolución» (con sus fechas) y «¿Para quién es?», y el botón «Reservar coche» con nuestro enlace de alquiler; el día 1, de 30 a 45 min para recogerlo.
 * Debajo, la línea «¿No vas a conducir?», que abre EXPLORAR › Excursiones. La ruta y los trayectos son los mismos con los dos.
 * Las piezas de Design usan el oro y el frambuesa de «Falta» tal cual (la regla de «frambuesa solo en piezas permitidas» no aplica a lo que Design pone).
 */
const NEGRO = '#1C2230'
const OSCURO = '#1C2230'
const CREMA = '#FBF3E2'
const TARJETA: CSSProperties = {
  flex: 'none',
  borderRadius: 22,
  background: '#FFFDF8',
  border: '1px solid rgba(181,138,46,.45)',
  boxShadow: '0 10px 22px -16px rgba(60,40,10,.5)',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}
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

export function CocheDeViaje() {
  useMonedaViajero()
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
  const celdaFecha = (etiqueta: string, iso: string, clave: string) => (
    <button
      type="button"
      data-coche-fecha={clave}
      onClick={() => setHoja(true)}
      style={{ flex: 1, minWidth: 0, height: 54, borderRadius: 15, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.12)', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
    >
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.12em', color: 'rgba(28,34,48,.5)' }}>{etiqueta}</span>
        <span style={{ font: "500 15px 'Geist'" }}>{fecha(iso)}</span>
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
    <div data-bloque-coche={coche} style={TARJETA}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 46, height: 46, flex: 'none', borderRadius: '50%', background: OSCURO, border: '1.5px solid #B58A2E', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#F3D88F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
            <path d="M3 15.5V13l2-1.5 2.2-4.2A1.5 1.5 0 0 1 8.5 6.5h5.8a1.5 1.5 0 0 1 1.3.8L17.8 11.5 20.5 13v2.5H3zM8.5 6.5L7.4 11.5H17.8M12 6.5v5M7.5 15.5a2.2 2.2 0 1 0 .01 0M16.5 15.5a2.2 2.2 0 1 0 .01 0" />
          </svg>
        </span>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ font: "400 24px/1 'Instrument Serif',serif" }}>Coche</span>
          <span style={{ font: "400 13px 'Geist'", color: 'rgba(28,34,48,.6)' }}>{route?.destination ?? ''}</span>
        </span>
        {listo ? (
          <span data-coche-estado="listo" style={{ height: 24, padding: '0 10px', borderRadius: 999, background: '#EAF4EC', color: '#2B7F45', display: 'inline-flex', alignItems: 'center', gap: 5, font: "600 12px 'Geist'" }}>
            <Tic size={12} color="#2B7F45" />
            Listo
          </span>
        ) : (
          <span data-coche-estado="falta" style={{ height: 24, padding: '0 10px', borderRadius: 999, background: 'rgba(190,60,95,.12)', color: 'oklch(0.55 0.17 5)', display: 'inline-flex', alignItems: 'center', font: "600 12px 'Geist'" }}>
            Falta
          </span>
        )}
      </div>

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
              {celdaFecha('RECOGIDA', recogida, 'recogida')}
              {celdaFecha('DEVOLUCIÓN', devolucion, 'devolucion')}
            </div>
            {rentalBooking && (
              <span data-coche-reserva style={{ font: "400 13px/1.4 'Geist'", color: 'rgba(28,34,48,.6)' }}>
                {[rentalBooking.provider, precioGuardado(rentalBooking) ? precioEnVista(precioGuardado(rentalBooking) as Importe) : null].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>

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

      <GeneralBookingModal
        open={hoja}
        title="Coche de alquiler"
        itemLabel="el coche de alquiler"
        providerLabel="Empresa de alquiler"
        providerPlaceholder="Hertz, Cicar, Goldcar…"
        initial={rentalBooking}
        onSave={setRentalVehicleBooking}
        onRemove={() => quitarConDeshacer('Alquiler quitado del viaje', () => setRentalVehicleBooking(null))}
        onClose={() => setHoja(false)}
      />
    </div>
  )
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
