import { precioEnVista, useMonedaViajero } from '../../../lib/moneda'
import { useState } from 'react'
import type { Route } from '../../../lib/types'
import type { DestinationExcursions } from '../../../lib/destinationExcursions'
import { useRouteStore } from '../../../store/useRouteStore'
import { quitarConDeshacer } from '../../../store/useAddFlowStore'
import { useAlojamientoUi } from '../../../store/useAlojamientoUi'
import { estanciasDelViaje, nochesTexto, precioDeAlojamiento, zonaDeAlojamientoElegida } from '../../../lib/tuAlojamiento'
import { BloqueShell, CambiarBoton, EliminarTexto, EstadoBloque, FlechaBloque, ICONOS, IconoBloque, tituloBloqueStyle } from './BloqueReservas'
import { Icono } from '../../ui/Icono'
import { Candado } from '../../pase/Candado'
import { useLoSuyo } from '../../../store/useLoSuyo'
import { useEntradasDelGrupo } from '../../../hooks/useEntradasDelGrupo'
import { nombreDe } from '../../../store/useViajeCompartido'
import { entreEfectivo, idsConLoSuyo } from '../../../lib/loSuyo'
import { EnEsteChips } from './EnEsteChips'
import { HojaAbajo, ojoStyle } from './HojaAbajo'
import { TimeListWheel } from '../../ui/TimeListWheel'
import type { EnCambioDeVuelo } from '../../../lib/cambioDeVuelo'
import { BotonComoLlegarAlojamiento } from '../alojamiento/BotonComoLlegarAlojamiento'

/**
 * La casilla «Dirección de tu alojamiento (opcional)» (Tanda 7, de pago): texto libre que se guarda al salir del campo (`route.accommodationAddress`). Solo con ella existe [Cómo llegar a tu alojamiento]
 * (`BotonComoLlegarAlojamiento`), que aquí sale debajo para que el viajero compruebe que el enlace lleva a su puerta.
 */
function CampoDireccion({ valor, onGuardar }: { valor: string; onGuardar: (texto: string | null) => void }) {
  const [texto, setTexto] = useState(valor)
  return (
    <div className="flex flex-col gap-2" data-direccion-alojamiento>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium">Dirección de tu alojamiento (opcional)</span>
        <input
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onBlur={() => onGuardar(texto)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          maxLength={160}
          autoComplete="street-address"
          placeholder="Calle, número y ciudad"
          data-casilla="direccion"
          className="h-12 w-full rounded-[14px] border border-text/15 bg-white px-3.5 text-[14.5px] outline-none placeholder:text-text/35 focus:border-text/40"
        />
      </label>
      <BotonComoLlegarAlojamiento direccion={valor} />
    </div>
  )
}

/** La hoja de la zona (Tanda 6v): las zonas del destino en una rueda, como la de la hora, y [Guardar]. */
export function HojaZona({ zonas, actual, onGuardar, onClose }: { zonas: DestinationExcursions['zonasAlojamiento']; actual: string | null; onGuardar: (id: string) => void; onClose: () => void }) {
  const [id, setId] = useState(() => (zonas.some((zona) => zona.id === actual) ? (actual as string) : (zonas[0]?.id ?? '')))
  const elegida = zonas.find((zona) => zona.id === id) ?? zonas[0]
  return (
    <HojaAbajo titleId="hoja-zona" onClose={onClose}>
      <p className="max-w-[calc(100%-2.5rem)] text-text/50" style={ojoStyle}>
        Alojamiento
      </p>
      <h2 id="hoja-zona" className="mt-1 max-w-[calc(100%-3rem)] font-display text-[26px] leading-none text-text">
        ¿En qué zona te alojas?
      </h2>
      <div className="mt-4">
        <TimeListWheel
          tipo="lista"
          label="Zona del alojamiento"
          items={zonas.map((zona) => zona.nombre)}
          value={elegida?.nombre ?? ''}
          onChange={(nombre) => setId(zonas.find((zona) => zona.nombre === nombre)?.id ?? id)}
        />
        <p className="mt-2 min-h-[18px] text-center text-[12px] text-text/55">{elegida?.sub ?? ''}</p>
      </div>
      <button type="button" onClick={() => elegida && onGuardar(elegida.id)} className="mt-3 h-12 w-full rounded-full btn-champan text-[15px] font-semibold transition-transform active:scale-[.98]">
        Guardar
      </button>
    </HojaAbajo>
  )
}

/**
 * El bloque «Alojamiento» de RESERVAS (Tanda 6s, 6v y 6z). Cerrado, como «Llegada y vuelta» y «Entradas y Free Tour»: el icono, el título y una línea que dice cómo va («Falta», «✓ Hotel Artemide», de pago
 * «✓ Hotel Artemide · Monti» o «✓ Hotel Artemide · Falta la zona») con su flecha.
 *
 * Abierto, sin alojamiento: «¿Ya tienes alojamiento?» con [Añadir mi alojamiento] (la hoja «Tu alojamiento») y «¿Aún no?» con [Buscar alojamiento] (el mapa a pantalla completa). Con alojamiento: su nombre, las
 * noches del viaje, el precio si lo dijo, [Cambiar] y [Eliminar]. De pago, además, «¿En qué zona te alojas?» con su campo y su rueda (siempre a la vista; «Aún no lo sé» sigue contando «Falta»).
 * Poner el alojamiento es gratis en las dos versiones; la zona, solo de pago. El alojamiento solo informa: la zona (de pago) es lo que orienta la ruta. Se guarda con el viaje, uno por destino.
 */
export function AlojamientoReservas({
  route,
  info,
  pago,
  abierto,
  onToggle,
}: {
  route: Route
  info: DestinationExcursions
  pago: boolean
  abierto: boolean
  onToggle: () => void
  /** (Se conserva por el panel: la zona se elige en la hoja y el rehacer lo lanza `AlojamientoHost`.) */
  onCambioDeVuelo?: EnCambioDeVuelo
}) {
  useMonedaViajero() // (10N7) se repinta al cambiar la moneda
  const zona = useRouteStore((state) => state.route?.accommodationZone ?? null)
  const direccion = useRouteStore((state) => state.route?.accommodationAddress ?? null)
  const setDireccion = useRouteStore((state) => state.setAccommodationAddress)
  const setHotel = useRouteStore((state) => state.setAccommodationHotel)
  const abrirMapa = useAlojamientoUi((state) => state.abrirMapa)
  const abrirTuAlojamiento = useAlojamientoUi((state) => state.abrirTuAlojamiento)
  const grupoLoSuyo = useLoSuyo((s) => s.grupo)
  const g = useEntradasDelGrupo()
  const cuentasEntre = useRouteStore((state) => state.route?.cuentasEntre)
  const estancia = estanciasDelViaje(route)[0] ?? null
  const segmentDayId = estancia?.segmentDayId ?? route.days[0]?.id ?? ''
  const noches = estancia?.noches ?? 0
  const hotel = useRouteStore((state) => state.accommodationSelections[segmentDayId]) ?? null
  const zonas = info.zonasAlojamiento
  const elegida = zonas.find((candidate) => candidate.id === zona) ?? null
  const zonaHecha = alojamientoHecho(elegida?.id)
  const precio = precioDeAlojamiento(hotel)

  // Con el hotel puesto pero sin la zona (de pago) la línea sigue en rosa: lo que falta es la zona.
  const resumenVerde = pago ? zonaHecha : true

  const hayAlgo = Boolean(hotel) || zonaHecha
  // «En este alojamiento · Tú y Viajes»: a quién cubre (solo el administrador, en un viaje con más gente).
  const adminId = g.gente.find((p) => p.esAdmin)?.id ?? null
  const todos = g.gente.map((p) => p.id)
  const efectivo = entreEfectivo(cuentasEntre?.[`aloj-${segmentDayId}`] ?? null, todos, idsConLoSuyo(grupoLoSuyo, 'alojamiento'), adminId)
  const quienes = g.gente.filter((p) => efectivo.includes(p.id))
  const nombresQuienes = (() => {
    const n = quienes.map((p) => (p.esYo ? 'Tú' : nombreDe(p) || 'Alguien'))
    return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`
  })()
  const etiquetaMono = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase' as const }

  return (
    <>
      <BloqueShell bloque="aloj">
        {hayAlgo ? (
          <>
            {/* (Tanda 10N10 §7c; `Piezas/Vuelo Reservas` 09) La tarjeta guardada: «TU ZONA · Prati» con [Cambiar], el hotel si lo hay y «En este alojamiento · Tú y Viajes» con [Cambiar]. */}
            <div onClick={onToggle} className="flex cursor-pointer items-center gap-3.5 px-4 pb-3 pt-4">
              <IconoBloque nombre={ICONOS.hotel} hecho={resumenVerde} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span style={tituloBloqueStyle}>Alojamiento</span>
                <span className="text-[13px] text-text/55">{estancia?.city ?? route.days[0]?.city ?? route.destination}</span>
              </span>
              <EstadoBloque texto={resumenVerde ? 'Listo' : 'Falta la zona'} hecho={resumenVerde} />
            </div>
            {elegida && (
              <div className="mx-3.5 mb-3 flex flex-col gap-1 rounded-[18px] px-3.5 pb-3.5 pt-3" style={{ background: '#FBF1D8', border: '1px solid rgba(181,138,46,.3)' }} data-tu-zona>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-6 items-center gap-1 rounded-full px-2.5" style={{ background: '#1C2230', color: '#F3D88F', ...etiquetaMono }}>
                    <Icono nombre="ubicacion" size={11} />
                    Tu zona
                  </span>
                  <CambiarBoton onClick={() => abrirTuAlojamiento(segmentDayId)} />
                </div>
                <span style={{ font: "400 34px/1.05 'Instrument Serif',serif" }}>{elegida.nombre}</span>
                {elegida.sub && <span className="text-[13px] text-text/60">{elegida.sub}</span>}
                {hotel && hotel.name === elegida.nombre && precio !== null && <span className="text-[13px] text-text/60">{precioEnVista(precio)}{noches > 0 ? ` · ${nochesTexto(noches)}` : ''}</span>}
              </div>
            )}
            {hotel && !(elegida && hotel.name === elegida.nombre) && (
              <div className="mx-3.5 mb-3 flex items-center gap-2.5 rounded-[14px] py-2.5 pl-3 pr-1.5" style={{ background: 'oklch(0.97 0.025 150)' }} data-hotel-puesto>
                <span className="min-w-0 flex-1 text-[13.5px] leading-[1.4]">
                  <span className="block truncate text-[15px] font-medium">{hotel.name}</span>
                  {noches > 0 && <span className="block text-text/65">{nochesTexto(noches)}</span>}
                  {precio !== null && <span className="block text-text/65">{precioEnVista(precio)}</span>}
                </span>
                {!elegida && <CambiarBoton onClick={() => abrirTuAlojamiento(segmentDayId)} />}
              </div>
            )}
            {g.gente.length >= 2 && g.esAdmin && (
              <div className="mx-4 mb-4 flex flex-col gap-2.5" data-en-este-alojamiento>
                <span className="flex items-center justify-between text-text/55" style={etiquetaMono}>
                  En este alojamiento
                  <CambiarBoton onClick={() => abrirTuAlojamiento(segmentDayId)} />
                </span>
                <EnEsteChips gente={quienes} datos="alojamiento" />
                <span hidden data-en-este-alojamiento-nombres>
                  {nombresQuienes}
                </span>
              </div>
            )}
            {abierto && (
              <div className="flex flex-col gap-3.5 px-4 pb-4">
                {hotel && <EliminarTexto texto="Eliminar" onClick={() => quitarConDeshacer('Alojamiento quitado del viaje', () => setHotel(segmentDayId, null))} />}
                <CampoDireccion key={direccion ?? ''} valor={direccion ?? ''} onGuardar={setDireccion} />
              </div>
            )}
          </>
        ) : (
          <>
            <div onClick={onToggle} className="flex cursor-pointer items-center gap-3.5 p-4">
              <IconoBloque nombre={ICONOS.hotel} hecho={false} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span style={tituloBloqueStyle}>Alojamiento</span>
                <EstadoBloque texto="Falta" hecho={false} />
              </span>
              <FlechaBloque abierto={abierto} />
            </div>
            {abierto && (
              <div className="flex flex-col gap-3.5 px-4 pb-4">
                <div className="flex flex-col gap-2.5">
                  <span className="text-[14px] font-medium">¿Ya tienes alojamiento?</span>
                  <button
                    type="button"
                    onClick={() => abrirTuAlojamiento(segmentDayId)}
                    data-anadir-alojamiento
                    className="flex h-12 w-full items-center justify-center rounded-full border border-text/20 bg-white text-[14.5px] font-semibold text-text transition-transform active:scale-[.98]"
                  >
                    Añadir mi alojamiento
                  </button>
                  <span className="mt-1 text-[14px] font-medium">¿Aún no?</span>
                  <button
                    type="button"
                    onClick={() => abrirMapa(segmentDayId)}
                    data-activo-invitado
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full btn-champan text-[14.5px] font-semibold transition-transform active:scale-[.98]"
                  >
                    <Icono nombre={ICONOS.lupa} size={15} />
                    Buscar alojamiento
                  </button>
                </div>
                {!pago && <Candado datos="alojamiento-zona" titulo="¿En qué zona te alojas?" texto="Con el {pase}, adaptamos tu ruta a tu alojamiento." />}
                {pago && <CampoDireccion key={direccion ?? ''} valor={direccion ?? ''} onGuardar={setDireccion} />}
              </div>
            )}
          </>
        )}
      </BloqueShell>
      {/* La caja del pase del alojamiento: con la zona ya elegida no vuelve a preguntarla («Adaptamos tu ruta a Prati»); sin zona, la pregunta de siempre (la del bloque cerrado va dentro). */}
      {!pago && hayAlgo && (
        <Candado
          className="mt-2.5"
          datos="alojamiento-zona"
          titulo={elegida ? `Adaptamos tu ruta a ${elegida.nombre}` : '¿En qué zona te alojas?'}
          texto={elegida ? 'Con el {pase}, tu primer y tu último día salen desde tu zona.' : 'Con el {pase}, adaptamos tu ruta a tu alojamiento.'}
        />
      )}
    </>
  )
}

/** ¿Está hecha la zona del alojamiento? Con una zona elegida («Aún no lo sé» no cuenta). */
export const alojamientoHecho = zonaDeAlojamientoElegida
