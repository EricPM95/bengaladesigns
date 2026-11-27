import { useState } from 'react'
import type { DayPlan, Excursion, Route } from '../../../../lib/types'
import type { Reservation } from '../../../../lib/bookings'
import { fechaCorta } from '../../../../lib/nombreDeDia'
import { enlaceComoLlegarAlojamiento } from '../../../../lib/direccionAlojamiento'
import { filasDeBilletes, horaSinCero, nombreDeLaExcursion, palabraDelMedio } from '../../../../lib/reservasUnidas'
import { trayectoDeLaReservaExtra, type ReservaExtra } from '../../../../lib/reservasExtra'
import { excursionConCodigo } from '../../../../store/useBilleteStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useReservasFocusStore, type BloqueReservasId } from '../../../../store/useReservasFocusStore'
import { useBilletesDeExcursiones } from '../../../../hooks/useBilleteExcursion'
import { segunGrupo } from '../../../../lib/viajaEnGrupo'
import { Icono } from '../../../ui/Icono'
import { ImagenConFundido } from '../../../ui/ImagenConFundido'
import { BOTON_ORO } from '../../../ui/botonesOro'
import { IconoDeDocumento } from '../../reservas/BotonesDeReserva'
import { CodigoPantallaCompleta } from '../../reservas/TarjetaBillete'
import { iconoDeMedio } from '../../reservas/BloqueReservas'
import { CajaDeParada, NOMBRE_SOBRE_FOTO, PILDORA_FOTO, TARJETA_PARADA } from './ParadaHoy'
import { BloqueDeConsejos } from './ConsejosDelDia'
import type { ConsejoDelDia } from '../../../../lib/consejosDelDia'

/**
 * (V76; Design «Añadir una reserva» R9 y R10) HOY, EL FERRY (TREN, AUTOBÚS) QUE LLEVA UNA RESERVA, con el formato de la tarjeta de la parada (la misma de la llegada, V62): la imagen arriba con su etiqueta y su título, dos cajas y, debajo, UNA FILA POR BILLETE
 * con su QR (dorado si el billete está guardado en RESERVAS, gris con «+» si falta; al tocar el gris, RESERVAS a subirlo).
 *  · `TarjetaDeExcursionConTransporte` (R9): la excursión que se hace por tu cuenta con el ferry unido. Cajas «SALIDA · Órzola · 10:00» y «EXCURSIÓN · Día entero · Con ferry» («RECOGIDA» es solo de una excursión organizada, con su punto de encuentro, y no sale aquí);
 *    filas «Ferry de las 10:00 desde Órzola» y «Ferry de vuelta · 17:30 · Falta tu billete»; [Cómo llegar] (al puerto de salida).
 *  · `TarjetaDeReservaExtraHoy` (R10): un ferry, tren, autobús u «otra» que no es de ninguna excursión, en su día: «FERRY · Ferry a Fuerteventura», cajas SALE y LLEGA y la fila con su QR. En DÍAS (`sinFoto`) lleva la misma tarjeta sin la imagen.
 * REGLA «HOY y RESERVAS, los mismos datos»: aquí no se guarda NADA. La hora, el puerto y el billete (el código) se leen de la reserva guardada en RESERVAS (`useBilletesDeExcursiones`, la clave es el id de la reserva).
 * Consultas a Supabase: ninguna (todo sale de la ruta y del móvil).
 */
export const TRAZO = {
  barco: 'M3 17l2 3h14l2-3M5 17l1-6h12l1 6M12 11V4M12 4l4 3-4 1',
  dia: 'M7 3v3M17 3v3M4 8h16v12H4zM8 13h3',
  maleta: 'M6 8h12l1 12H5zM9 8a3 3 0 0 1 6 0',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
}

/** La imagen fija del trayecto (el mar, el tren…): ningún sitio tiene foto, así que va una de colores como la de la llegada. */
function ImagenDelTrayecto({ foto }: { foto?: string | null }) {
  if (foto) return <ImagenConFundido src={foto} fondo="#2F7C95" loading="lazy" alt="" />
  return (
    <span aria-hidden="true" className="absolute inset-0 block" style={{ background: 'linear-gradient(180deg,#86B4CC 0%,#3B7FA0 52%,#173B5A 100%)' }}>
      <span className="absolute inset-0" style={{ background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 16px)' }} />
    </span>
  )
}

/** Cada reserva se sube en su sitio de RESERVAS: la excursión unida, en «Excursiones»; la suelta, en su bloque (Ferry, Tren…). */
const bloqueDe = (r: ReservaExtra): BloqueReservasId => (r.unidaA ? 'excursiones' : (`extra-${r.kind}` as BloqueReservasId))

/** Una fila de billete: el círculo oscuro con el medio, el título, la línea de debajo y el QR a la derecha. */
export function FilaDeBilleteHoy({ reserva, titulo, sub }: { reserva: ReservaExtra; titulo: string; sub: string }) {
  const billetes = useBilletesDeExcursiones()
  const billete = billetes.de(reserva.id)
  const hay = Boolean(excursionConCodigo(billete)) && Boolean(billete?.codigo)
  const [ampliado, setAmpliado] = useState(false)
  const aReservas = () => {
    useRouteStore.getState().setMode('bookings')
    useReservasFocusStore.getState().pedir(bloqueDe(reserva))
  }
  return (
    <div data-hoy-fila-billete={reserva.id} data-hoy-fila-billete-tipo={reserva.kind} className="flex items-center gap-3 rounded-[18px] py-2.5 pl-3 pr-1.5" style={{ background: '#FBF3E2', border: '1px solid rgba(181,138,46,.4)' }}>
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full" style={{ background: '#1C2230', color: '#F3D88F' }}>
        <Icono nombre={reserva.kind === 'otra' ? 'reservas' : iconoDeMedio(reserva.kind === 'tren' ? 'tren' : reserva.kind === 'bus' ? 'bus' : 'ferry')} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span data-hoy-fila-titulo className="[overflow-wrap:anywhere]" style={{ font: "700 14.5px/1.2 'Geist'", color: '#1C2230' }}>
          {titulo}
        </span>
        {sub && (
          <span data-hoy-fila-sub style={{ font: "500 12px 'Geist'", color: 'rgba(28,34,48,.6)' }}>
            {sub}
          </span>
        )}
      </span>
      <IconoDeDocumento hay={hay} tipo={reserva.kind === 'otra' ? 'reserva' : 'qr'} onAbrir={() => setAmpliado(true)} onAnadir={aReservas} etiqueta={hay ? 'Ver el código en grande' : 'Sube tu billete en RESERVAS'} datos={`hoy-${reserva.kind}`} />
      {ampliado && hay && billete?.codigo && <CodigoPantallaCompleta codigo={billete.codigo} titulo={reserva.name} cuando={`${reserva.dateIso ? fechaCorta(reserva.dateIso) : ''} · ${reserva.time}`.replace(/^ · /, '')} pie={trayectoDeLaReservaExtra(reserva)} onClose={() => setAmpliado(false)} />}
    </div>
  )
}

export function CabeceraDeTrayecto({ etiqueta, titulo, foto }: { etiqueta: string; titulo: string; foto?: string | null }) {
  return (
    <div data-hoy-foto-parada className="relative overflow-hidden" style={{ height: 150 }}>
      <ImagenDelTrayecto foto={foto} />
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.14) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,.38))' }} />
      <span data-hoy-insignia className="absolute left-3.5 top-3.5 flex h-7 items-center rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
        {etiqueta}
      </span>
      <span data-hoy-transporte-titulo className="absolute inset-x-[18px] bottom-3.5 text-left" style={NOMBRE_SOBRE_FOTO}>
        {titulo}
      </span>
    </div>
  )
}

export const columnas = (n: number) => ({ gridTemplateColumns: `repeat(${Math.max(n, 2)}, minmax(0, 1fr))` }) as const

/** R9: la excursión por tu cuenta, con su ferry (tren, autobús) unido. */
export function TarjetaDeExcursionConTransporte({ route, day, excursion, unidas, consejos = [] }: { route: Route; day: DayPlan; excursion: Excursion | null; unidas: ReservaExtra[]; /** (V77, 13) Los consejos de la excursión (de los datos del destino), entre las cajas y los billetes. */ consejos?: ConsejoDelDia[] }) {
  const billetes = useBilletesDeExcursiones()
  const primero = unidas[0]
  if (!primero) return null
  const nombre = excursion ? nombreDeLaExcursion(excursion) : (day.curatedTitle ?? day.title ?? `Excursión desde ${day.city}`)
  const medio = palabraDelMedio(primero).toLowerCase()
  const mediaJornada = excursion?.page?.halfDay ?? excursion?.length === 'half-day'
  const filas = filasDeBilletes(unidas, (r) => Boolean(excursionConCodigo(billetes.de(r.id))))
  const salida = primero.origen?.trim() || route.destination
  const enlace = enlaceComoLlegarAlojamiento([primero.origen, route.destination].filter(Boolean).join(', '))
  return (
    <div data-hoy-excursion-transporte={excursion?.id ?? day.id} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
      <CabeceraDeTrayecto etiqueta="EXCURSIÓN" titulo={nombre} foto={excursion?.page?.photoUrl ?? null} />
      <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
        <div className="grid gap-2" style={columnas(2)}>
          {/* Por tu cuenta: SALIDA (el puerto de donde sale el ferry y su hora); «RECOGIDA» es solo de una excursión organizada. */}
          <CajaDeParada dato="salida" trazo={TRAZO.dia} etiqueta="SALIDA" grande={salida} sub={horaSinCero(primero.time)} />
          <CajaDeParada dato="excursion" trazo={TRAZO.maleta} etiqueta="EXCURSIÓN" grande={mediaJornada ? 'Medio día' : 'Día entero'} sub={`Con ${medio}`} />
        </div>
        <BloqueDeConsejos consejos={consejos} cuando="la excursión" tono="claro" />
        {filas.map((f) => (
          <FilaDeBilleteHoy key={f.reserva.id} reserva={f.reserva} titulo={f.titulo} sub={f.sub} />
        ))}
        {enlace && (
          <a href={enlace} target="_blank" rel="noopener noreferrer" data-hoy-excursion-como-llegar className="flex h-[54px] items-center justify-center gap-[9px] rounded-2xl text-[15px] font-bold no-underline" style={BOTON_ORO}>
            <Icono nombre="localizar" size={18} grosor={2} />
            {segunGrupo('Cómo llegar', 'Cómo llegar')}
          </a>
        )}
      </div>
    </div>
  )
}

/** R10: un ferry, tren, autobús u «otra» que no es de ninguna excursión, en su día. `sinFoto`: la misma tarjeta sin la imagen (la lista de DÍAS). */
export function TarjetaDeReservaExtraHoy({ reserva, sinFoto = false }: { reserva: Reservation; sinFoto?: boolean }) {
  const r = reserva as ReservaExtra
  const esOtra = r.kind === 'otra'
  const etiqueta = esOtra ? 'RESERVA' : palabraDelMedio(r).toUpperCase()
  const llega = !esOtra && r.returnTime ? horaSinCero(r.returnTime) : null
  const cajas: { dato: string; etiqueta: string; grande: string; sub: string; trazo: string }[] = []
  if (esOtra) cajas.push({ dato: 'hora', etiqueta: 'A LAS', grande: horaSinCero(r.time), sub: r.lugar ?? '', trazo: TRAZO.reloj })
  else {
    cajas.push({ dato: 'sale', etiqueta: 'SALE', grande: horaSinCero(r.time), sub: r.origen ?? '', trazo: TRAZO.barco })
    if (llega) cajas.push({ dato: 'llega', etiqueta: 'LLEGA', grande: llega, sub: r.destinoDeViaje ?? '', trazo: TRAZO.dia })
  }
  const titulo = r.name
  const fila = esOtra ? `${titulo}${r.time ? ` · A las ${horaSinCero(r.time)}` : ''}` : `${titulo} · Sale a las ${horaSinCero(r.time)}`
  return (
    <div data-hoy-reserva-extra={r.kind} data-hoy-reserva-extra-id={r.id} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
      {sinFoto ? (
        <div className="flex items-center gap-2 px-3.5 pt-3.5">
          <span data-hoy-insignia className="flex h-7 items-center rounded-full px-[13px]" style={{ background: '#1C2230', color: '#F3D88F', font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
            {etiqueta}
          </span>
          <span data-hoy-transporte-titulo className="min-w-0 flex-1 [overflow-wrap:anywhere]" style={{ font: "400 24px/1.05 'Instrument Serif',serif" }}>
            {titulo}
          </span>
        </div>
      ) : (
        <CabeceraDeTrayecto etiqueta={etiqueta} titulo={titulo} />
      )}
      <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
        <div className="grid gap-2" style={columnas(cajas.length)}>
          {cajas.map((c) => (
            <CajaDeParada key={c.dato} dato={c.dato} trazo={c.trazo} etiqueta={c.etiqueta} grande={c.grande} sub={c.sub} />
          ))}
        </div>
        <FilaDeBilleteHoy reserva={r} titulo={fila} sub="" />
      </div>
    </div>
  )
}
