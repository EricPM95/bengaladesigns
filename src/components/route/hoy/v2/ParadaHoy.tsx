import { Fragment, useEffect, useState, type ReactNode } from 'react'
import type { Coordinates, DayPlan, Route, Stop } from '../../../../lib/types'
import type { Reservation } from '../../../../lib/bookings'
import { displayStopName } from '../../../../lib/format'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { formatWeekdayAbbrEs } from '../../../../lib/dateRange'
import { logrosActivos } from '../../../../lib/logros'
import { useRadioDeParada } from '../../../../lib/radiosDeHoy'
import { useSyncStore } from '../../../../store/useSyncStore'
import {
  avisoDeSalida,
  cuentaDelDia,
  estaAqui,
  filasDelDia,
  horaCorta,
  horaFijaDe,
  textoDeSalida,
  tituloDeComida,
  trayectoHasta,
  urlComoLlegar,
  type FilaDeTuDia,
  type TrayectoDeParada,
} from '../../../../lib/hoyParada'
import { useLogrosStore } from '../../../../store/useLogrosStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useVistoStore } from '../../../logros/visto/vistoStore'
import { Icono, IconoRuta } from '../../../ui/Icono'
import type { HorarioDeParada } from '../../../../lib/horarioDeParada'
import { abrirAvisoPase } from '../../../../lib/avisoPase'
import { avisarAbajo } from '../../../../store/useAvisoDeAbajo'
import { useHistoriaDeParada, type HistoriaDeParada } from './useHistoriaDeParada'
import { emblemaDeParada, etiquetaDePedazos, nombreDePedazos, piezaDeParada, usePedazosDeParada } from './usePedazosDeParada'
import { HojaLlegadaOculta } from '../JuegoCerca'
import { anotarQueSalio, yaSalio } from '../AvisosDeCerca'
import { sugerenciasDelCompanero } from '../../../../lib/sugerenciasCompanero'
import type { SitioCerca } from '../useCercaDeAqui'
import { fotoDeParada } from '../../../logros/visto/VistoFlujo'
import { TuEntradaEnHoy } from '../TuEntradaEnHoy'
import { Cruz, HojaV2 } from './HojasV2'
import { ParadaFotoDeParada } from './ParadaFoto'
import { useFotoDeParada } from './useFotoDeParada'
import { ExtraDeParada } from './ExtraDeParada'
import { BotonCambiarPlan, D_RELOJ, Opcion } from './CambiarPlan'
import { AvisoMasTiempo } from './MasTiempo'
import { BOTON_CLARO, BOTON_ORO, DORADO } from '../../../ui/botonesOro'
import { HojaActivaUbicacion } from './HojaActivaUbicacion'
import { origenDelAlojamiento } from '../../../../lib/tuAlojamiento'
import { useAlojamientoDelViaje } from '../../alojamiento/useAlojamientoDelViaje'
import { zonaCorta } from '../../dayDetail/AccommodationBlock'
import { conArticulo, desdeDonde, type ZonaUbicacion } from '../../../../lib/ubicacionHoy'
import { estadoDelHorario, type TonoDeCaja } from '../../../../lib/horarioDeLaCaja'
import { InsigniaPartes } from '../../../logros/dibujos/InsigniaPartes'
import { Etiqueta, RecuadroDePuntos } from '../piezas'
import { ImagenComida } from '../../../ui/ImagenComida'

/** Los colores del diseño «Hoy Estados» (apartado 04): tinta, marfil, oro. */
const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'
const ORO = '#B58A2E'
const ORO_TEXTO = '#8E6820'
const OJO_MONO = { font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.16em', color: '#6F4E37', textTransform: 'uppercase' as const }

/** La hora de ahora en minutos, al día (se refresca cada 30 s). */
export function useAhoraMin(): number {
  const dame = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }
  const [min, setMin] = useState(dame)
  useEffect(() => {
    const id = window.setInterval(() => setMin(dame()), 30000)
    return () => window.clearInterval(id)
  }, [])
  return min
}

/* ------------------------------------------------------------------ */
/* La cabecera: «JUE 26 · CENTRO HISTÓRICO», «Parada 2 de 4» y la barra */
/* ------------------------------------------------------------------ */

export function CabeceraParada({ ojo, ahora, total, hechas, derecha }: { ojo: string; ahora: number; total: number; hechas: number; derecha?: ReactNode }) {
  return (
    <>
      <div data-hoy-parada-cabecera className="flex flex-none items-end justify-between gap-3 px-1 pt-1">
        <div className="flex min-w-0 flex-col gap-[5px]">
          <span className="truncate" style={OJO_MONO}>{ojo}</span>
          <span data-hoy-parada-n style={{ font: "400 33px/1 'Instrument Serif',serif" }}>
            {ahora > 0 ? (
              <>
                Parada <em style={{ color: ORO_TEXTO }}>{ahora} de {total}</em>
              </>
            ) : (
              <>
                Todo <em style={{ color: ORO_TEXTO }}>visto</em> por hoy
              </>
            )}
          </span>
        </div>
        {/* HOY1-B: aquí van la cámara de viaje y la campana (los pone el agente B con UNA línea). */}
        {derecha}
      </div>
      <div data-hoy-progreso className="flex flex-none gap-[5px] px-1 pb-0.5 pt-0.5" aria-hidden="true">
        {Array.from({ length: Math.max(total, 1) }, (_, i) => (
          <span key={i} className="h-1 flex-1 rounded-sm" style={{ background: i < hechas ? ORO : 'rgba(28,34,48,.14)' }} />
        ))}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* H4: la línea dorada del logro                                        */
/* ------------------------------------------------------------------ */

/** Lo último que ha sumado un Visto («Los imprescindibles de Roma»): se apunta de lo que cae en el almacén de los logros mientras HOY está abierto. */
export function useUltimaSuma(clave: string | null): string | null {
  const [suma, setSuma] = useState<{ clave: string; nombre: string } | null>(null)
  useEffect(() => {
    if (!clave) return
    return useLogrosStore.subscribe((s, antes) => {
      if (s.momentos === antes.momentos) return
      const nuevos = s.momentos.filter((m) => !antes.momentos.includes(m))
      const m = [...nuevos].reverse().find((x) => x.tipo === 'suma' || x.tipo === 'suma_sello')
      if (m && typeof m.nombre === 'string') setSuma({ clave, nombre: m.nombre })
    })
  }, [clave])
  return suma && suma.clave === clave ? suma.nombre : null
}

export function LineaDelLogro({ texto }: { texto: string }) {
  return (
    <div data-hoy-linea-logro className="flex h-9 flex-none items-center gap-2 rounded-xl px-3" style={{ background: 'linear-gradient(135deg,#FBF1D2,#F0DCA0)', border: '1px solid #C9A24E', color: '#6E5018', font: "700 13px 'Geist'" }}>
      <Icono nombre="estrella" size={15} grosor={1.9} />
      {texto}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* La tarjeta de la siguiente parada (V2: «Ya estás aquí» y «De camino») */
/* ------------------------------------------------------------------ */

/** La foto de la parada de arriba de la tarjeta (nunca el mapa; sin foto, el fondo de color de siempre) con su degradado. */
function FotoDeLaParada({ parada, ciudad, dateIso, alto, children }: { parada: Stop; ciudad: string; dateIso: string; alto: number; children?: ReactNode }) {
  const foto = useFotoDeParada(parada, ciudad, dateIso)
  const [fallo, setFallo] = useState(false)
  return (
    <div data-hoy-foto-parada className="relative overflow-hidden" style={{ height: alto, background: 'linear-gradient(150deg,#6B5A44,#2A3141)' }}>
      {foto && !fallo && <img src={foto} alt="" className="h-full w-full object-cover" onError={() => setFallo(true)} />}
      <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(20,16,10,.4) 0%,rgba(20,16,10,0) 38%,rgba(20,16,10,.78) 100%)' }} />
      {children}
    </div>
  )
}

/** (Noche 24-25 nov; Design «Parada Tarjeta» T1-T3) La tarjeta de la parada: esquinas de 28, fondo marfil claro, filo finito y sombra suave. */
export const TARJETA_PARADA = { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.07)', boxShadow: '0 20px 34px -24px rgba(28,34,48,.5)' } as const
export const PILDORA_FOTO = { background: 'rgba(28,34,48,.55)', color: '#FFFDF8' } as const
export const NOMBRE_SOBRE_FOTO = { font: "400 34px/1 'Instrument Serif',serif", color: '#FFFDF8', textShadow: '0 2px 16px rgba(0,0,0,.55)', textWrap: 'balance' as never }
const BOTON_ORO_A = BOTON_ORO
const BOTON_BLANCO_A = { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', color: TINTA }

/** «9:30–16:45»: del primer tramo que abre al último que cierra (null si no hay horario o ese día no abre). */
export function rangoDeHorario(h: HorarioDeParada | null): string | null {
  if (!h || h.cerrado || h.tramos.length === 0) return null
  return `${h.tramos[0].abre}–${h.tramos[h.tramos.length - 1].cierra}`
}

/** (V43 §8) «Cerrado ahora · abre a las 8:30» si ahora está cerrado (fuera de todos los tramos del día); null si está abierto o no hay horario. */
export function cerradoAhora(h: HorarioDeParada | null, ahoraMin: number): string | null {
  if (!h || h.cerrado || h.tramos.length === 0) return null
  const aMin = (t: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t)
    return m ? Number(m[1]) * 60 + Number(m[2]) : null
  }
  for (const t of h.tramos) {
    const a = aMin(t.abre)
    const c = aMin(t.cierra)
    if (a != null && c != null && a <= ahoraMin && ahoraMin < c) return null
  }
  const proxima = h.tramos.find((t) => (aMin(t.abre) ?? 0) > ahoraMin)
  return proxima ? `Cerrado ahora · abre a las ${proxima.abre}` : 'Cerrado ahora'
}

/** Minutos que faltan para que cierre (el cierre del tramo en el que estamos, o la última entrada si ya solo queda esa); null si no se sabe o ya cerró. */
export function minutosParaCerrar(h: HorarioDeParada | null, ahoraMin: number): number | null {
  if (!h || h.cerrado || h.tramos.length === 0) return null
  const aMin = (t: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(t)
    return m ? Number(m[1]) * 60 + Number(m[2]) : null
  }
  for (const t of h.tramos) {
    const a = aMin(t.abre)
    const c = aMin(t.cierra)
    if (a != null && c != null && ahoraMin >= a && ahoraMin <= c) return c - ahoraMin
  }
  return null
}

/** La barrita con las ondas y [Pausa] de la historia sonando (A4). */
function BarraDeHistoria({ h }: { h: HistoriaDeParada }) {
  const sonando = h.estado === 'hablando'
  return (
    <div data-escuchar-barra data-escuchar={h.estado} className="flex h-[54px] items-center gap-3 rounded-2xl pl-2 pr-3.5" style={{ background: TINTA, color: MARFIL }}>
      <button type="button" onClick={sonando ? h.pausar : h.seguir} aria-label={sonando ? 'Pausar la historia' : 'Seguir con la historia'} className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full" style={{ background: ORO_CLARO, color: '#3E2A0C' }}>
        <Icono nombre={sonando ? 'pausa' : 'seguir'} size={15} relleno grosor={1.6} />
      </button>
      <span className="flex flex-1 flex-col gap-1.5">
        <span className="flex h-3.5 items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} style={{ width: 3, height: 14, borderRadius: 2, background: i < Math.round(h.progreso * 24) + 6 ? ORO_CLARO : 'rgba(251,243,226,.28)', animation: sonando ? `hoyYaBar ${(0.8 + (i % 5) * 0.15).toFixed(2)}s ease-in-out infinite` : undefined }} />
          ))}
        </span>
        <span className="h-[3px] rounded-sm" style={{ background: 'rgba(251,243,226,.2)' }}>
          <span className="block h-full rounded-sm" style={{ width: `${Math.round(h.progreso * 100)}%`, background: ORO_CLARO }} />
        </span>
      </span>
      <button type="button" onClick={sonando ? h.pausar : h.seguir} className="text-[13px] font-bold" style={{ color: ORO_CLARO }}>{sonando ? 'Pausa' : 'Seguir'}</button>
      <button type="button" onClick={h.parar} aria-label="Parar la historia" className="flex h-8 w-8 flex-none items-center justify-center" style={{ color: 'rgba(251,243,226,.7)' }}>
        <Icono nombre="cerrar" size={13} grosor={2} />
      </button>
    </div>
  )
}

/** Un icono de acción SIN texto (decisión de Eric): lleva su `aria-label`. */
const COLOR_CAJA: Record<TonoDeCaja | 'gris', string> = { negro: '#1C2230', verde: '#2E7D4F', rojo: '#B3321F', gris: 'rgba(28,34,48,.65)' }

/**
 * (V47; Design «Parada Tarjeta» T1-T3) UNA caja de las tres de la tarjeta de la parada: la etiqueta con su icono (HORARIO, A PIE / EN COCHE, VISITA), lo grande y la línea pequeña de debajo.
 * Tres en una fila: a 375 px caben sin cortar texto (lo largo baja a otra línea).
 */
export function CajaDeParada({ icono, trazo, etiqueta, grande, tono = 'negro', sub, subTono = 'gris', dato, extra, datos }: { icono?: Parameters<typeof Icono>[0]['nombre']; /** (V62) Un trazo suelto (el de Design) en lugar de un icono de la familia: la fila del vuelo (terminal, asiento, referencia) de la tarjeta de llegada. */ trazo?: string; etiqueta: string; grande: string; tono?: TonoDeCaja; sub: string; subTono?: TonoDeCaja | 'gris'; dato: string; extra?: ReactNode; datos?: Record<string, string | undefined> }) {
  return (
    <div data-caja-parada={dato} {...datos} className="flex min-h-[98px] min-w-0 flex-col gap-1.5 rounded-[18px] px-2.5 pb-3 pt-[11px]" style={{ background: '#F7F1E4' }}>
      <span className="flex items-center gap-[5px]" style={{ color: '#6F4E37' }}>
        <span style={{ color: '#6E5018', display: 'flex', flex: 'none' }}>
          {trazo ? <IconoRuta d={trazo} size={15} grosor={1.9} /> : <Icono nombre={icono ?? "info"} size={15} grosor={1.9} />}
        </span>
        <span style={{ font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.08em' }}>{etiqueta}</span>
      </span>
      <b data-caja-grande className={`${trazo ? 'break-words' : 'whitespace-nowrap'} font-bold leading-[1.15]`} style={{ color: COLOR_CAJA[tono], fontSize: grande.length > 8 ? 14 : 15 }}>{grande}</b>
      <span data-caja-sub className="text-[11px] font-medium leading-[1.3]" style={{ color: COLOR_CAJA[subTono] }}>{sub}</span>
      {extra}
    </div>
  )
}

function BotonIcono({ icono, etiqueta, dato, onClick, oro = false, candado = false, texto }: { icono: Parameters<typeof Icono>[0]['nombre']; etiqueta: string; dato: string; onClick: () => void; oro?: boolean; candado?: boolean; /** (V47) El nombre debajo del icono («Qué ver», «Escuchar historia», «Hacer foto»). */ texto?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={etiqueta} data-hoy-icono={dato} className={`relative flex min-w-0 flex-1 items-center justify-center rounded-[18px] ${texto ? 'h-[78px] flex-col gap-[7px]' : 'h-[60px]'}`} style={oro ? BOTON_ORO : BOTON_CLARO}>
      <Icono nombre={icono} size={texto ? 24 : 26} grosor={1.8} />
      {texto && <span data-boton-nombre className="px-1 text-center text-[12.5px] font-bold leading-[1.15]">{texto}</span>}
      {candado && (
        <span className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full" style={{ background: TINTA, color: ORO_CLARO }}>
          <Icono nombre="candado" size={10} grosor={2.2} />
        </span>
      )}
    </button>
  )
}

/** El círculo con la chincheta del recuadro de la ubicación (T1: 32 px, fondo #F3E3B2). */
export function IconoDeUbicacion() {
  return (
    <span aria-hidden="true" className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: '#F3E3B2' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E5018" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
      </svg>
    </span>
  )
}

/**
 * (V46; V59 §3) El recuadro de la ubicación de la tarjeta de la parada Y de la de la comida («Estás lejos…» / «Sin tu ubicación no sabemos cuándo llegas»). Una sola pieza.
 * `onLlegado`: con él sale [Ya he llegado] junto a [Usar mi ubicación]; sin él, solo [Usar mi ubicación]. `textoSin` cambia la frase de «sin ubicación» (la comida sin restaurante).
 */
export function RecuadroDeUbicacion({ zona, destino, ubicacionEstado, pedirUbicacion, onLlegado, nombre, textoSin }: { zona: ZonaUbicacion; destino: string; ubicacionEstado: 'libre' | 'pidiendo' | 'no'; pedirUbicacion: () => void; onLlegado?: () => void; nombre: string; textoSin?: string }) {
  const [hoja, setHoja] = useState(false)
  if (zona === 'fuera')
    return (
      <RecuadroDePuntos data-hoy-lejos className="flex-col gap-1">
        <span className="flex items-center gap-2.5 text-[13px] font-medium leading-[1.35]" style={{ color: 'rgba(28,34,48,.75)' }}>
          <IconoDeUbicacion />
          Estás lejos de {destino}. Cuando llegues, contaremos desde donde estés.
        </span>
      </RecuadroDePuntos>
    )
  if (zona !== 'sin') return null
  return (
    <>
      <RecuadroDePuntos data-hoy-sin-ubicacion className="flex-col gap-2.5">
        <span className="flex items-center gap-2.5 text-[13px] font-medium leading-[1.35]" style={{ color: 'rgba(28,34,48,.75)' }}>
          <IconoDeUbicacion />
          {textoSin ?? 'Sin tu ubicación no sabemos cuándo llegas'}
        </span>
        <div className="flex gap-2.5">
          <button type="button" onClick={() => (ubicacionEstado === 'no' ? setHoja(true) : pedirUbicacion())} disabled={ubicacionEstado === 'pidiendo'} data-hoy-usar-ubicacion className="flex h-11 flex-1 items-center justify-center rounded-[14px] text-[14px] font-bold" style={BOTON_ORO}>
            {ubicacionEstado === 'pidiendo' ? 'Buscando…' : 'Usar mi ubicación'}
          </button>
          {onLlegado && (
            <button type="button" onClick={onLlegado} data-hoy-ya-he-llegado aria-label={`Ya he llegado a ${nombre}`} className="flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-[14px] text-[14px] font-bold" style={BOTON_CLARO}>
              Ya he llegado
            </button>
          )}
        </div>
      </RecuadroDePuntos>
      {hoja && <HojaActivaUbicacion onCerrar={() => setHoja(false)} onReintentar={() => { setHoja(false); pedirUbicacion() }} />}
    </>
  )
}

/** La hoja «Más tiempo aquí» con +15 y +30 (H3b). */
function HojaMasTiempo({ onElegir, onCerrar }: { onElegir: (min: 15 | 30) => void; onCerrar: () => void }) {
  return (
    <HojaV2 onCerrar={onCerrar} etiqueta="Más tiempo aquí" fondo={MARFIL}>
      <div className="flex items-center justify-between" data-hoy-mas-tiempo>
        <span style={{ font: "400 30px/1 'Instrument Serif',serif" }}>Más tiempo aquí</span>
        <Cruz onClick={onCerrar} />
      </div>
      {([
        [15, '+15 min', 'Un poco más, sin prisa'],
        [30, '+30 min', 'Un buen rato más, sin prisa'],
      ] as const).map(([min, titulo, sub]) => (
        <Opcion key={min} dato={`mas-tiempo-${min}`} d={D_RELOJ} titulo={titulo} sub={sub} onClick={() => onElegir(min)} datos={{ 'data-hoy-mas-tiempo-opcion': String(min) }} />
      ))}
    </HojaV2>
  )
}

export interface PropsParada {
  route: Route
  day: DayPlan
  dateIso: string
  siguiente: Stop
  anterior?: Stop
  reservaSiguiente: Reservation | null
  ubicacion: Coordinates | null
  ubicacionEstado: 'libre' | 'pidiendo' | 'no'
  pedirUbicacion: () => void
  enCoche: boolean
  /** Al tocar [He terminado] (= el Visto de siempre). */
  onTerminado: () => void
  /** «Saltar parada» y [Cambiar plan] › saltar: la parada se salta y pasa a «Lugares pendientes» (sin hoja ni pregunta en el enlace). */
  onSaltar: () => void
  /** El pase (o el día de prueba) está abierto. */
  conPase: boolean
  onQueVasAVer: () => void
  /** El horario de hoy de la parada (para «9:30–16:45» y «Cierra en 25 min»). */
  horario: HorarioDeParada | null
  /** La zona del alojamiento: de dónde sale la primera parada del día. */
  casa?: Coordinates | null
  /** (V46) El centro de lo que hay hoy: sin alojamiento en el viaje, los minutos de la primera parada se cuentan desde aquí (el centro de su zona). */
  centroDelDia?: Coordinates | null
  /** (V47) Cuándo vuelve a abrir esta parada si ya cerró: «mañana a las 9:00» / «el jueves a las 9:00». */
  proximaApertura?: string | null
  /** (V44 §1) Dónde está el viajero: en la ruta, en el destino pero lejos de ella, fuera del destino (> 50 km) o sin ubicación. */
  zonaUbicacion?: ZonaUbicacion
  /** (V44 §1) Si el viajero ha dado su ubicación (aunque HOY no la use: `ubicacion` solo llega aquí cuando está en la ruta). */
  hayUbicacion?: boolean
  /** (V52 §1) La parada ya ha cerrado (o cerrará al llegar): etiqueta «YA HA CERRADO», [Pasar a otro día] y [Guardar en pendientes], sin el recuadro de la ubicación. */
  cerrada?: boolean
}

/**
 * LA TARJETA DE LA PARADA (V2; `Piezas/Hoy Aqui` de Design, A1 a A9). Dos formas:
 *  · «YA ESTÁS AQUÍ» (A1 a A4, A7): la foto con la etiqueta y el nombre; «Visita de unos 50 min» (y «Cierra en 25 min» solo si cierra en menos de 45 min); «Aquí ganas 2 pedazos: …» (los emblemas
 *    ocultos NUNCA se anuncian); los iconos SIN texto (Qué vas a ver, Escuchar historia, Tu entrada si hay reserva y Haz tu foto, en oro); [He terminado] y [Necesito más tiempo]; y «Saltar parada».
 *    Fuera de aquí: [Dónde has aparcado], [Cambiar plan], el horario, el trayecto y los minutos de aparcar.
 *  · «SIGUIENTE PARADA» / «PRIMERA PARADA» (A5, A6, A9): la foto con el nombre; el reloj y «9:30–16:45»; el trayecto «En coche · 22 min · 17 km»; «Escucha su historia por el camino · 3 min»;
 *    [Cómo llegar] y [Cambiar plan]; y «¿No te detecta el GPS? Ya he llegado». Sin «+10 min para aparcar» (esos minutos siguen contando por dentro).
 */
export function TarjetaParada(p: PropsParada) {
  const { route, day, dateIso, siguiente, anterior, reservaSiguiente, ubicacion, enCoche } = p
  const [forzada, setForzada] = useState<string | null>(null)
  const [hojaTiempo, setHojaTiempo] = useState(false)
  const [verEntrada, setVerEntrada] = useState(false)
  const ahoraMin = useAhoraMin()
  // (V58 §1) De dónde cuenta los minutos la primera parada: del alojamiento (hotel puesto), de la zona elegida o del centro.
  const aloj = useAlojamientoDelViaje()
  const seleccionesAloj = useRouteStore((s) => s.accommodationSelections)
  const origenAloj = origenDelAlojamiento(route, seleccionesAloj, aloj.zonaNombre ? zonaCorta(aloj.zonaNombre) : null)
  // (LG1) «Ya estás aquí» con el radio de cada sitio en los datos de logros (La Graciosa y Timanfaya, 2.500 m); sin radio, 150 m.
  const tripId = useSyncStore((s) => s.activeTripId) ?? route.id
  const radioAqui = useRadioDeParada(tripId, siguiente.name)
  const aqui = forzada === siguiente.id || estaAqui(ubicacion, siguiente, radioAqui)
  const trayecto: TrayectoDeParada | null = trayectoHasta({ siguiente, ubicacion, anterior, enCoche, casa: p.casa ?? p.centroDelDia, ida: day.coche?.activo ? day.coche.ida : null })
  const fija = horaFijaDe(siguiente, reservaSiguiente)
  const salida = aqui ? null : avisoDeSalida(ahoraMin, fija, trayecto?.totalMin ?? null)
  const desde = ubicacion ?? (anterior && hasRealCoordinates(anterior.coordinates) ? anterior.coordinates : null) ?? p.casa ?? null
  const comoLlegar = hasRealCoordinates(siguiente.coordinates) ? urlComoLlegar(siguiente.coordinates, ubicacion ? null : desde, enCoche) : null
  const historia = useHistoriaDeParada(route.destination, siguiente)
  // (V46) Se pregunta en cuanto esta es la SIGUIENTE parada (no solo al llegar): al llegar ya está en memoria y la línea sale a la vez que la tarjeta.
  // Consulta: /api/logros/cerca con la coordenada de la parada, UNA vez por parada y viaje cada 2 minutos (`unaSolaVez`); baja ~1-3 KB. No va a Supabase desde el móvil.
  const nombresPedazos = usePedazosDeParada(tripId, siguiente, true)
  const pedazos = nombresPedazos.length > 0 ? nombresPedazos : null
  const pieza = piezaDeParada(tripId, siguiente.id)
  // (V52 §4) El emblema oculto sale EN EL MOMENTO DE LLEGAR: cuando el GPS dice que estás aquí o cuando pulsas [Ya he llegado] (`aqui` es las dos cosas), antes de [He terminado]. Una vez por sitio y día (la misma marca que usa el aviso del servidor, así nunca salen dos).
  const emblemaOculto = emblemaDeParada(tripId, siguiente)
  const [hojaOculta, setHojaOculta] = useState<SitioCerca | null>(null)
  useEffect(() => {
    if (!aqui || !p.conPase || !emblemaOculto || !sugerenciasDelCompanero()) return
    if (yaSalio(tripId, dateIso, emblemaOculto.sitio, 'llegada')) return
    anotarQueSalio(tripId, dateIso, emblemaOculto.sitio, 'llegada')
    setHojaOculta(emblemaOculto)
  }, [aqui, p.conPase, emblemaOculto?.sitio, tripId, dateIso]) // eslint-disable-line react-hooks/exhaustive-deps
  const [masTiempo, setMasTiempo] = useState<15 | 30 | null>(null)

  // (HOY2b, E; Eric, 5-nov) +15 / +30 NO mueve la ruta: la app solo mira si con ese tiempo de más llegas a algo cerrado o tarde a una reserva (v2/MasTiempo.tsx).
  const elegirTiempo = (min: 15 | 30) => {
    setHojaTiempo(false)
    if (!p.conPase) {
      // Sin el pase solo se apunta: el día no se toca.
      useRouteStore.getState().noteStopDelay(day.id, siguiente.id)
      avisarAbajo({ id: `tiempo:${siguiente.id}:${min}`, texto: `Anotado: +${min} min aquí. Con el pase te avisamos si algo se te cierra.` })
      return
    }
    setMasTiempo(min)
  }
  const hacerFoto = () => {
    if (logrosActivos()) fotoDeParada({ tripId: route.id, dayId: day.id, dayNumber: day.dayNumber, stopId: siguiente.id, nombre: siguiente.name }, 'pedazo')
  }
  const alEscuchar = () => {
    if (historia.candado) abrirAvisoPase('escuchar_historia', { destino: route.destination })
    else if (historia.estado === 'parado') historia.escuchar()
    else if (historia.estado === 'hablando') historia.pausar()
    else historia.seguir()
  }
  const cierraEn = aqui ? minutosParaCerrar(p.horario, ahoraMin) : null
  const nombre = displayStopName(siguiente.name)

  // (V47) Las tres cajas (HORARIO, A PIE / EN COCHE, VISITA): lo que dice cada una según la hora real y el sitio de salida.
  const estadoBase = estadoDelHorario(p.horario, ahoraMin, p.proximaApertura ?? null)
  // (V52 §1) Si la parada ya ha cerrado (también por la última entrada o por el trayecto), la caja lo dice en rojo: «Cerrado · Abre mañana a las 9:00».
  const estadoH: typeof estadoBase = p.cerrada && estadoBase.caso !== 'despues' && estadoBase.caso !== 'cerrado_hoy' ? { grande: 'Cerrado', tono: 'rojo', sub: p.proximaApertura ? `Abre ${p.proximaApertura}` : 'Cerrado ahora', subTono: 'rojo', caso: 'despues' } : estadoBase
  const modoCaja = trayecto?.modo ?? (enCoche ? 'coche' : 'pie')
  const minutosVisita = siguiente.durationMinutes > 0 ? `${Math.round(siguiente.durationMinutes)} min` : '—'
  const dialogos = (
    <>
      {masTiempo && <AvisoMasTiempo route={route} day={day} dateIso={dateIso} paradaId={siguiente.id} minutos={masTiempo} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={() => setMasTiempo(null)} />}
      {hojaOculta && <HojaLlegadaOculta sitio={hojaOculta} onCerrar={() => setHojaOculta(null)} onDesmarcar={() => { useRouteStore.getState().setStopVisto(day.id, siguiente.id, false); useVistoStore.getState().quitarPendiente(siguiente.id) }} />}
      {hojaTiempo && <HojaMasTiempo onElegir={elegirTiempo} onCerrar={() => setHojaTiempo(false)} />}
    </>
  )

  if (aqui) {
    return (
      <>
        <div data-hoy-siguiente data-hoy-estado="aqui" data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
          <FotoDeLaParada parada={siguiente} ciudad={day.city} dateIso={dateIso} alto={170}>
            <div className="absolute inset-x-[18px] bottom-3.5 flex flex-col gap-[9px]">
              <span data-hoy-insignia className="flex h-7 items-center gap-2 self-start rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4CC46E', animation: 'hoyYaPulse 2s infinite' }} />
                YA ESTÁS AQUÍ
              </span>
              <button type="button" onClick={p.onQueVasAVer} data-hoy-titulo aria-label={`Qué vas a ver en ${nombre}`} className="text-left" style={NOMBRE_SOBRE_FOTO}>
                {nombre}
              </button>
            </div>
          </FotoDeLaParada>
          <div className="flex flex-col gap-3 px-3.5 pb-[18px] pt-3.5">
            {/* (V47) Las mismas tres cajas que antes de llegar; en la de minutos, «Aquí · Ya has llegado». */}
            <div data-hoy-cajas className="grid grid-cols-3 gap-2">
              <CajaDeParada dato="horario" icono="reloj" etiqueta="HORARIO" grande={estadoH.grande} tono={estadoH.tono} sub={estadoH.sub} subTono={estadoH.subTono} datos={{ 'data-hoy-horario': estadoH.caso }} />
              <CajaDeParada dato="minutos" icono={modoCaja === 'coche' ? 'coche' : 'andando'} etiqueta={modoCaja === 'coche' ? 'EN COCHE' : 'A PIE'} grande="Aquí" sub="Ya has llegado" datos={{ 'data-hoy-trayecto': modoCaja, 'data-hoy-trayecto-zona': 'aqui' }} />
              <CajaDeParada dato="visita" icono="arena" etiqueta="VISITA" grande={minutosVisita} sub="Lo que recomendamos" datos={{ 'data-hoy-visita': '1' }} />
            </div>
            {cierraEn != null && cierraEn < 45 && (
              <Etiqueta tono="rojo" grande datos={{ 'data-hoy-cierra-pronto': '1' }} className="self-start">
                <Icono nombre="alerta" size={14} grosor={1.9} />
                Cierra en {cierraEn} min
              </Etiqueta>
            )}
            {pedazos && (
              <div data-hoy-pedazos className="flex items-center gap-3 rounded-[18px] px-3.5 py-3" style={{ background: 'linear-gradient(135deg,#FFF4D2,#F1DC9C 60%,#E3C77E)', border: '1px solid rgba(181,138,46,.65)', boxShadow: '0 10px 18px -14px rgba(110,80,24,.8)' }}>
                {/* (V47) El icono es el trozo de ESE sitio, en color, sobre su círculo blanco (la misma pieza que se gana al terminar); sin ids del servidor, la estrella de siempre. */}
                {pieza ? (
                  <span data-hoy-pedazo-icono={pieza.coleccion} className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full" style={{ background: '#fff', border: '2px solid #1C2230' }}>
                    <InsigniaPartes coleccion={pieza.coleccion} ganados={[pieza.sitio]} tam={34} />
                  </span>
                ) : (
                  <Icono nombre="estrella" size={20} grosor={1.8} style={{ color: '#8E6820', flex: 'none' }} />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span data-hoy-pedazos-etiqueta style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: '#6F4E37' }}>{etiquetaDePedazos(pedazos)}</span>
                  <span data-hoy-pedazos-nombre style={{ font: "400 20px/1.1 'Instrument Serif',serif", color: '#2A1D0A' }}>{nombreDePedazos(pedazos)}</span>
                </span>
              </div>
            )}
            {historia.hay && !historia.candado && historia.estado !== 'parado' && <BarraDeHistoria h={historia} />}
            <div className="flex gap-[9px]">
              <BotonIcono icono="ojo" etiqueta="Qué vas a ver" dato="que-vas-a-ver" texto="Qué ver" onClick={p.onQueVasAVer} />
              {historia.hay && <BotonIcono icono={historia.estado === 'hablando' ? 'pausa' : 'altavoz'} etiqueta={historia.estado === 'parado' ? 'Escuchar historia' : historia.estado === 'hablando' ? 'Pausar la historia' : 'Seguir con la historia'} dato="escuchar" texto={historia.estado === 'hablando' ? 'Pausar historia' : 'Escuchar historia'} candado={historia.candado} onClick={alEscuchar} />}
              {reservaSiguiente && <BotonIcono icono="reservas" etiqueta="Tu entrada" dato="entrada" texto="Tu entrada" onClick={() => setVerEntrada((v) => !v)} />}
              <BotonIcono icono="camara" etiqueta="Haz tu foto" dato="haz-tu-foto" texto="Hacer foto" oro onClick={hacerFoto} />
            </div>
            {verEntrada && reservaSiguiente && <TuEntradaEnHoy route={route} reserva={reservaSiguiente} />}
            <div className="flex gap-[9px]">
              <button type="button" onClick={p.onTerminado} data-boton-visto data-hoy-he-terminado className="flex h-[50px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[14.5px] font-bold text-white" style={{ background: 'linear-gradient(180deg,#3E9A5E,#2B7F45)', boxShadow: '0 10px 16px -12px rgba(30,100,60,.8),inset 0 1px 0 rgba(255,255,255,.25)' }}>
                <Icono nombre="hecho" size={17} grosor={2.4} />
                He terminado
              </button>
              <button type="button" onClick={() => setHojaTiempo(true)} data-hoy-necesito-mas-tiempo className="flex h-[50px] flex-1 items-center justify-center whitespace-nowrap rounded-2xl text-[14px] font-bold" style={BOTON_BLANCO_A}>
                Necesito más tiempo
              </button>
            </div>
            <button type="button" onClick={p.onSaltar} data-hoy-saltar-parada className="-mt-0.5 flex min-h-11 items-center justify-center gap-[5px] text-[13.5px] font-semibold underline underline-offset-[3px]" style={{ color: '#6E5018' }}>
              <Icono nombre="adelante" size={14} grosor={2} />
              Saltar parada
            </button>
          </div>
        </div>
        {dialogos}
      </>
    )
  }

  const etiqueta = p.cerrada ? 'YA HA CERRADO' : anterior ? 'SIGUIENTE PARADA' : 'PRIMERA PARADA'
  // (V44 §1) La caja de minutos: en la ruta, «12 min · Desde ti»; en el destino pero lejos de la ruta (el aeropuerto) o sin ubicación, el tiempo del plan («Del alojamiento al Coliseo», «Del Panteón a la Fontana de Trevi»); fuera del destino, «—» y «Estás lejos».
  const zona: ZonaUbicacion = p.zonaUbicacion ?? (ubicacion ? 'ruta' : 'sin')
  const origenDelPlan = anterior && !anterior.isBreak ? displayStopName(anterior.name) : null
  const minutosCaja = zona === 'fuera' || !trayecto ? '—' : `${trayecto.min} min`
  // (V63 §9) La tarjeta dice SIEMPRE desde dónde cuenta de verdad la cifra («13 min · Desde la Casa-Museo»): `trayecto.origenNombre` es la parada anterior (o el punto del que el motor la contó).
  const subCaja = zona === 'fuera' ? 'Estás lejos' : zona === 'ruta' ? 'Desde ti' : trayecto?.origenNombre ? `Desde ${conArticulo(trayecto.origenNombre)}` : desdeDonde(origenDelPlan, origenAloj.tipo !== 'alojamiento', origenAloj.tipo === 'zona' ? origenAloj.zonaNombre : null)
  return (
    <>
      <div data-hoy-siguiente data-hoy-estado={p.cerrada ? 'cerrada' : 'llegar'} data-tarjeta="clara" className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <div onClick={p.onQueVasAVer} data-hoy-abrir-ficha="1">
          <FotoDeLaParada parada={siguiente} ciudad={day.city} dateIso={dateIso} alto={140}>
            <span data-hoy-insignia className="absolute left-3.5 top-3.5 flex h-7 items-center rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>{etiqueta}</span>
            <span data-hoy-titulo className="absolute inset-x-[18px] bottom-3.5 text-left" style={NOMBRE_SOBRE_FOTO}>{nombre}</span>
          </FotoDeLaParada>
        </div>
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          {/* (V47) Tres cajas en una fila: HORARIO (según la hora real), A PIE / EN COCHE («Desde el alojamiento», «Desde el Panteón», «Desde ti») y VISITA (el tiempo que recomendamos). */}
          <div data-hoy-cajas className="grid grid-cols-3 gap-2">
            <CajaDeParada dato="horario" icono="reloj" etiqueta="HORARIO" grande={estadoH.grande} tono={estadoH.tono} sub={estadoH.sub} subTono={estadoH.subTono} datos={{ 'data-hoy-horario': estadoH.caso }} />
            <CajaDeParada
              dato="minutos"
              icono={modoCaja === 'coche' ? 'coche' : 'andando'}
              etiqueta={modoCaja === 'coche' ? 'EN COCHE' : 'A PIE'}
              grande={minutosCaja}
              sub={subCaja}
              datos={{ 'data-hoy-trayecto': modoCaja, 'data-hoy-trayecto-zona': zona }}
              extra={
                zona === 'ruta' && !p.cerrada ? (
                  <button type="button" onClick={p.pedirUbicacion} data-hoy-actualizar-ubicacion className="-mb-1 flex min-h-11 items-center self-start text-[11px] font-bold underline underline-offset-[3px]" style={{ color: ORO_TEXTO }}>
                    {p.ubicacionEstado === 'pidiendo' ? 'Buscando…' : 'Actualizar'}
                  </button>
                ) : null
              }
            />
            <CajaDeParada dato="visita" icono="arena" etiqueta="VISITA" grande={minutosVisita} sub="Lo que recomendamos" datos={{ 'data-hoy-visita': '1' }} />
          </div>
          {salida && fija != null && !p.cerrada && (
            <div data-hoy-salida={salida} className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold leading-[1.3]" style={salida === 'tarde' ? { background: '#FBE6E2', border: '1px solid #E5766B', color: '#8A2A1F' } : { background: '#F6F0E2', border: '1px solid rgba(181,138,46,.4)', color: '#6E5018' }}>
              <Icono nombre="reloj" size={15} grosor={2} />
              {textoDeSalida(salida, fija)}
            </div>
          )}
          {/* (V46) El recuadro de la ubicación («Estás lejos…» / «Sin tu ubicación…») va DEBAJO de las cajas y ENCIMA de «Escucha su historia» (dibujo T2 y T4). */}
          {!p.cerrada && <RecuadroDeUbicacion zona={zona} destino={route.destination} ubicacionEstado={p.ubicacionEstado} pedirUbicacion={p.pedirUbicacion} onLlegado={() => setForzada(siguiente.id)} nombre={nombre} />}
          {/* (V44 §2) «Escucha su historia por el camino · 3 min», en azul oscuro DESDE EL PRINCIPIO: al darle al play solo cambia ▶ por ❚❚ y se mueven las ondas. */}
          {historia.hay && (
            <button type="button" onClick={alEscuchar} data-hoy-escuchar-camino data-escuchar={historia.candado ? 'candado' : historia.estado} aria-label={historia.estado === 'hablando' ? 'Pausar la historia' : 'Escuchar su historia por el camino'} className="flex min-h-[68px] items-center gap-3 rounded-[20px] py-3 pl-3 pr-3.5 text-left" style={{ background: 'linear-gradient(135deg,#232A3C,#1C2230)', color: '#FFFDF8', boxShadow: '0 14px 22px -16px rgba(28,34,48,.8)' }}>
              <style>{'@keyframes ondaV44{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}'}</style>
              <span aria-hidden="true" className="flex h-11 w-11 flex-none items-center justify-center rounded-full" style={{ background: DORADO, boxShadow: '0 0 0 4px rgba(243,216,143,.18)' }}>
                {historia.estado === 'hablando' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#4A3510"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#4A3510"><path d="M8 5v14l11-7z" /></svg>
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-[14.5px] font-semibold leading-[1.2]">
                <span>Escucha su historia por el camino</span>
                <span className="text-[12px] font-normal opacity-60">{historia.minutos} min</span>
              </span>
              <span aria-hidden="true" className="flex h-7 flex-none items-center gap-[3px]">
                {[10, 16, 8, 20, 12, 18, 9, 14, 20, 11].map((h, i) => (
                  <i key={i} style={{ display: 'block', width: 3, height: h, borderRadius: 2, background: 'rgba(243,216,143,.55)', opacity: historia.estado === 'hablando' ? 1 : 0.9, transformOrigin: 'center', animation: historia.estado === 'hablando' ? `ondaV44 .9s ease-in-out ${i * 0.09}s infinite` : 'none' }} />
                ))}
              </span>
              {historia.candado && <Icono nombre="candado" size={13} grosor={2} />}
            </button>
          )}
          <div className="flex gap-[9px]">
            {p.cerrada ? null : comoLlegar ? (
              <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-[52px] flex-[1.5] items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-bold no-underline" style={BOTON_ORO_A}>
                <Icono nombre="localizar" size={17} grosor={2} />
                Cómo llegar
              </a>
            ) : (
              <span className="flex h-[52px] flex-[1.5] items-center justify-center rounded-2xl text-[15px] font-bold opacity-50" style={BOTON_ORO_A}>Cómo llegar</span>
            )}
            {/* HOY2 (B): [Cambiar plan] sustituye a [No me da tiempo] (v2/CambiarPlan.tsx) */}
            <BotonCambiarPlan route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onSaltar={p.onSaltar} cerrada={p.cerrada} />
          </div>
          <ExtraDeParada parada={siguiente} dayId={day.id} vista={false} contexto="tarjeta" route={route} reserva={reservaSiguiente} />
          {/* (V43 §8) Con ubicación: «¿Ya estás aquí?» y [Ya he llegado]; sin ella, el recuadro «Sin tu ubicación no sabemos cuándo llegas» con [Usar mi ubicación] y [Ya he llegado]. */}
          {/* (V46) «¿Ya estás aquí? Ya he llegado» (con ubicación en la ruta) se queda abajo, como en el dibujo (T1). */}
          {(zona === 'ruta' || zona === 'destino') && !p.cerrada && (
            <div className="flex items-center justify-center gap-1 text-center text-[12.5px] font-medium" style={{ color: 'rgba(28,34,48,.55)' }}>
              ¿Ya estás aquí?
              <button type="button" onClick={() => setForzada(siguiente.id)} data-hoy-ya-he-llegado aria-label={`Ya he llegado a ${nombre}`} className="inline-flex min-h-11 items-center px-1 font-bold underline underline-offset-[3px]" style={{ color: ORO_TEXTO }}>
                Ya he llegado
              </button>
            </div>
          )}
        </div>
      </div>
      {dialogos}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* H6: por la mañana                                                    */
/* ------------------------------------------------------------------ */

export function TarjetaPorLaManana({ route, day, dateIso, primera, hora, trayecto, comoLlegar }: { route: Route; day: DayPlan; dateIso: string; primera: Stop; hora: string; trayecto: TrayectoDeParada; comoLlegar: string | null }) {
  void route
  return (
    <div data-hoy-por-la-manana className="flex flex-none flex-col gap-3.5 rounded-[26px] p-[18px]" style={{ background: '#FFFDF8', border: '1px solid rgba(181,138,46,.4)' }}>
      <span style={OJO_MONO}>Primera parada</span>
      <span data-hoy-sal-de-casa style={{ font: "400 36px/1.05 'Instrument Serif',serif" }}>
        Sal de casa a las <em style={{ color: ORO_TEXTO }}>{hora}</em>
      </span>
      <div className="flex items-center gap-3 rounded-[18px] p-2.5" style={{ background: '#F5EFE4' }}>
        <ParadaFotoDeParada parada={primera} ciudad={day.city} dateIso={dateIso} vista marca={false} size={56} />
        <span className="flex flex-1 flex-col gap-[3px]">
          <b style={{ font: "600 16px 'Geist'" }}>{displayStopName(primera.name)}</b>
          <span className="flex items-center gap-1.5 text-[13px] text-[#1C2230]/60">
            <Icono nombre={trayecto.modo === 'coche' ? 'coche' : 'andando'} size={14} grosor={1.8} />
            {trayecto.titulo}
            {trayecto.detalle ? ` · ${trayecto.detalle}` : ''}
          </span>
        </span>
      </div>
      {comoLlegar && (
        <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-1.5 rounded-2xl text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
          <Icono nombre="localizar" size={17} grosor={1.9} />
          Cómo llegar
        </a>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* «Tu día»: la lista que se cierra y se abre                           */
/* ------------------------------------------------------------------ */

export type FranjaDeTuDia = 'manana' | 'mediodia' | 'tarde' | 'noche'
const ETIQUETA_FRANJA: Record<FranjaDeTuDia, string> = { manana: 'Mañana', mediodia: 'Mediodía', tarde: 'Tarde', noche: 'Noche' }

/**
 * (V2; `Piezas/Hoy Entero`, H2) Las filas de «Tu día» por franjas: MAÑANA (lo de antes de la comida), MEDIODÍA (la comida), TARDE (entre la comida y la cena) y NOCHE (la cena y lo nocturno).
 * La cabecera de cada franja sale cuando cambia. Sin comida ni cena, las paradas nocturnas abren NOCHE. Las paradas saltadas o cerradas ya no salen aquí: están en «Lugares pendientes».
 */
export type FilaConFranja = FilaDeTuDia & { franja: FranjaDeTuDia; cabecera: boolean }
export function filasConFranja(day: DayPlan, paradas: Stop[]): FilaConFranja[] {
  const vigentes = paradas.filter((s) => !s.saltada)
  const filas = filasDelDia(day, vigentes).filter((f) => f.tipo !== 'noche')
  let franja: FranjaDeTuDia = 'manana'
  const salida: FilaConFranja[] = []
  let ultima: FranjaDeTuDia | null = null
  for (const f of filas) {
    let esta: FranjaDeTuDia = franja
    if (f.tipo === 'comida') {
      const cena = f.meal.mealTime === 'dinner'
      esta = cena ? 'noche' : franja === 'noche' ? 'noche' : 'mediodia'
      franja = cena || franja === 'noche' ? 'noche' : 'tarde'
    } else if (f.tipo === 'parada' && (f.stop.isNightExperience || f.stop.isNightView)) {
      franja = 'noche'
      esta = 'noche'
    }
    salida.push({ ...f, franja: esta, cabecera: ultima !== esta })
    ultima = esta
  }
  return salida
}

export function TuDia({ route, day, dateIso, paradas, siguienteId, reservaDe, horaDelSol = null, inicialAbierta = true, onAbrirParada, ahoraMin = null }: { /** (V45) Los minutos de ahora (hoy): la comida o la cena cuya hora ya pasó no es una visita y sale de la lista. */ ahoraMin?: number | null;  route: Route; day: DayPlan; dateIso: string; paradas: Stop[]; siguienteId: string | null; reservaDe: (s: Stop) => Reservation | null; /** «18:04»: la hora del atardecer, que es de las pocas que se enseñan (con la de las reservas y los turnos). */ horaDelSol?: string | null; /** Abierta o cerrada al montarse (el día acabado, cerrada). */ inicialAbierta?: boolean; onAbrirParada?: (s: Stop) => void }) {
  // (V2, apartado 4) ABIERTO por defecto; si se cierra, se recuerda (en el móvil).
  const [abierta, setAbiertaEstado] = useState(() => {
    try {
      const g = window.localStorage.getItem('trazo:hoy:tu-dia')
      return g === 'cerrado' ? false : g === 'abierto' ? true : inicialAbierta
    } catch {
      return inicialAbierta
    }
  })
  const alternar = () =>
    setAbiertaEstado((v) => {
      const n = !v
      try {
        window.localStorage.setItem('trazo:hoy:tu-dia', n ? 'abierto' : 'cerrado')
      } catch {
        /* sin almacenamiento */
      }
      return n
    })
  const { total, hechas } = cuentaDelDia(paradas)
  // (V45) Lo que ya pasó y no es una visita (la comida del mediodía a las 22:35) sale de la lista: una comida o cena sin hacer no se queda «pendiente» ni ocupa un sitio. Pasan 2 h desde su hora.
  const filas = (() => {
    const todas = filasConFranja(day, paradas)
    if (ahoraMin == null) return todas
    const pasada = (f: FilaConFranja) => {
      if (f.tipo !== 'comida') return false
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(f.meal.time ?? '').trim())
      return Boolean(m) && ahoraMin > Number(m![1]) * 60 + Number(m![2]) + 120
    }
    let ultima: FranjaDeTuDia | null = null
    return todas
      .filter((f) => !pasada(f))
      .map((f) => {
        const r = { ...f, cabecera: ultima !== f.franja }
        ultima = f.franja
        return r
      })
  })()
  void route
  return (
    <div data-hoy-tu-dia={abierta ? 'abierta' : 'cerrada'} className="flex flex-none flex-col gap-3 rounded-[22px] px-3.5 pb-2.5 pt-3.5" style={{ background: '#FFFDF8', border: '1px solid rgba(28,34,48,.1)' }}>
      <button type="button" onClick={alternar} aria-expanded={abierta} data-hoy-tu-dia-cabecera className="-my-1 flex min-h-11 items-center gap-2.5 text-left">
        <b className="flex-1 text-[14px] font-semibold" data-hoy-tu-dia-cuenta>Tu día · {hechas} de {total} hechas</b>
        <Icono nombre={abierta ? 'arriba' : 'abajo'} size={15} grosor={2} style={{ color: 'rgba(28,34,48,.55)' }} />
      </button>
      {abierta && (
        <div className="flex flex-col gap-3" data-hoy-lista>
          {filas.map((fila, i) => {
            const cabecera = fila.cabecera && (
              <span data-hoy-franja={fila.franja} style={{ font: "600 10px 'Geist Mono',monospace", letterSpacing: '.16em', color: 'rgba(28,34,48,.45)', textTransform: 'uppercase' }}>
                {ETIQUETA_FRANJA[fila.franja]}
              </span>
            )
            if (fila.tipo === 'comida')
              return (
                <Fragment key={`m-${fila.meal.id}-${i}`}>
                  {cabecera}
                  {/* La comida y la cena, sin hora: se hacen en su franja, cuando toque. */}
                  <div data-hoy-fila="comida" className="flex items-center gap-3 py-1.5">
                    <ImagenComida tipo={fila.meal.mealTime === 'dinner' ? 'cenar' : 'comer'} tam={46} />

                    <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{tituloDeComida(fila.meal)}</span>
                  </div>
                </Fragment>
              )
            if (fila.tipo !== 'parada') return null
            const s = fila.stop
            const hecha = Boolean(s.checkedInAt)
            const ahora = siguienteId === s.id
            const reserva = reservaDe(s)
            const hora = reserva?.time ? horaCorta(reserva.time) : null
            const alAtardecer = Boolean(s.isSunset) && horaDelSol
            return (
              <Fragment key={s.id}>
                {cabecera}
                <div
                  data-hoy-fila="parada"
                  data-hoy-fila-estado={hecha ? 'hecha' : ahora ? 'ahora' : 'viene'}
                  onClick={onAbrirParada ? () => onAbrirParada(s) : undefined}
                  className="flex items-center gap-3 py-1.5"
                  style={ahora ? { margin: '0 -4px', padding: '6px 10px 6px 6px', borderRadius: 16, background: '#FFFDF8', border: '1px solid rgba(181,138,46,.5)' } : undefined}
                >
                  <span style={{ opacity: hecha ? 0.55 : 1 }} className="flex flex-none">
                    <ParadaFotoDeParada parada={s} ciudad={day.city} dateIso={dateIso} vista marca={false} size={46} carga="eager" />
                  </span>
                  <span className="min-w-0 flex-1 truncate" style={{ font: ahora ? "700 14.5px 'Geist'" : "600 14.5px 'Geist'", color: hecha ? 'rgba(28,34,48,.5)' : TINTA }}>
                    {displayStopName(s.name)}
                  </span>
                  {/* Solo llevan hora lo fijo (un turno o una reserva) y el atardecer. */}
                  {hora && <Etiqueta tono="verde" datos={{ 'data-hoy-fila-hora': 'reserva' }}>{hora}</Etiqueta>}
                  {!hora && alAtardecer && <span data-hoy-fila-hora="atardecer" className="text-[12px] font-semibold text-[#1C2230]/55" style={{ fontFamily: "'Geist Mono',monospace" }}>{horaDelSol}</span>}
                  {hecha && (
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-white" style={{ background: ORO }} aria-label="Hecha">
                      <Icono nombre="hecho" size={13} grosor={3} />
                    </span>
                  )}
                  {ahora && <span className="flex h-[22px] flex-none items-center rounded-full px-2.5 text-[10.5px] font-bold text-white" style={{ background: ORO }}>Ahora</span>}
                </div>
              </Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const ojoDeParada = (dateIso: string, titulo: string): string => `${formatWeekdayAbbrEs(dateIso)} ${Number(dateIso.slice(8, 10))} · ${titulo}`
