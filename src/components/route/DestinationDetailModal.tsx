import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useHuecoAlFinal } from '../propuesta/BotonDePropuesta'
import { AnimatePresence, motion } from 'framer-motion'
import type { DayPlan } from '../../lib/types'
import { FlagIcon } from '../ui/FlagIcon'
import { buildActivitySearchUrl, withCampaign } from '../../lib/affiliateLinks'
import { useAlojamientoUi } from '../../store/useAlojamientoUi'
import { useRouteStore } from '../../store/useRouteStore'
import { Icono } from '../ui/Icono'
import { fetchPlacePhoto } from '../../lib/placePhoto'
import { addDaysToIso } from '../../lib/dateRange'
import { LoQueTePuedesLlevar, useLoQueTePuedesLlevar } from '../primeraVez/LoQueTePuedesLlevar'
import { desdeTexto, enlaceDeHotel, notaTexto, opinionesTexto, paginaEnMemoria, pedirPaginaDeDestino, type ActividadDeDestino, type HotelDeDestino, type PaginaDeDestino } from '../../lib/paginaDestino'

interface DestinationDetailModalProps {
  city: string | null
  days: DayPlan[]
  /** «5 días · 4 noches · 25 – 29 nov» — la MISMA cuenta que la tarjeta de RUTA; null mientras no se resuelve el tramo. */
  nightsLabel: string | null
  /** Vehículo camper/autocaravana en este destino — se omite la sección de alojamientos, igual que en DIAS/RESERVAS. */
  isCamper: boolean
  onClose: () => void
  /**
   * (V31, Design «Primera Vez» D1 y D2) La página del destino SIN viaje, desde el mapa del Perfil del viajero nuevo: la portada sin fechas (con el país y una línea corta), las mismas actividades y alojamientos, SIN «Tu alojamiento»
   * y SIN «Ver todos en el mapa», «Lo que te puedes llevar» de ESE destino y [Crear mi viaje a …] fijo abajo. Dentro de un viaje la página es la de siempre.
   */
  sinViaje?: { clave: string; pais: string; linea: string | null; iso: string | null; /** (V34) la foto de portada del destino (la misma de la tarjeta del mapa): sin viaje no hay paradas de donde sacar otra. */ portada?: string | null; alCrear: () => void }
}

/**
 * (V21, Design «Destino Pagina» D1 a D3) LA PÁGINA DEL DESTINO: arriba la foto grande con la bandera, el nombre y «5 días · 4 noches · 25 – 29 nov»; «Actividades en …» (de la más popular a la menos, de nota 8,5 o más,
 * con su foto, nota, opiniones, duración y «desde X €» o «Gratis»; toda la tarjeta se toca y abre la actividad en Civitatis con nuestro enlace de afiliado); y «Alojamientos en …» (tu alojamiento si ya lo tienes y los hoteles
 * elegidos, uno por zona, con zona, nota, opiniones y etiqueta; sin precio; toda la tarjeta abre ese hotel en Stay22). Se hunde un poco al tocar y se abre fuera de la app sin perder la página.
 * Sin los botones azul Booking ni rojo Civitatis: todo con el estilo de la app.
 */
const CORTE = 'polygon(0 0,100% 0,100% 100%,0 86%)'
const SERIE = { fontFamily: "'Instrument Serif',serif" } as const

function Estrella({ t = 14 }: { t?: number }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="#8E6820" aria-hidden="true">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    </svg>
  )
}
const Pastilla = ({ nota }: { nota: number }) => (
  <span className="flex h-7 items-center gap-[5px] rounded-full border border-[#D8BE84] bg-[#F6E8BE] pl-2 pr-2.5 text-[15px] font-bold text-[#4A3510]">
    <Estrella />
    {notaTexto(nota)}
  </span>
)
const tarjeta = 'block overflow-hidden rounded-[24px] border border-text/[.08] bg-white shadow-[0_14px_26px_-20px_rgba(28,34,48,.5)] transition-transform active:scale-[.97]'

/**
 * (V28) La foto de una tarjeta: un fondo suave del MISMO tamaño (sin saltos) y la foto encima como imagen de verdad (se guarda en el móvil: las del operador llevan caché de un año). `prioridad`: las primeras del carrusel se piden
 * antes que las demás. Sin foto, solo el fondo suave.
 */
const FONDO_SUAVE = 'linear-gradient(135deg,#EFE8D8,#E3D8C0)'
function Foto({ url, alto, prioridad = false, children }: { url: string | null; fondo?: string; alto: number; prioridad?: boolean; children?: ReactNode }) {
  return (
    <div className="relative" style={{ height: alto }}>
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: CORTE, background: FONDO_SUAVE }}>
        {url && <img src={url} alt="" width={236} height={alto} loading={prioridad ? 'eager' : 'lazy'} decoding="async" {...(prioridad ? { fetchPriority: 'high' as const } : {})} className="h-full w-full object-cover" />}
      </div>
      <div className="absolute inset-0" style={{ clipPath: CORTE, background: 'linear-gradient(180deg,rgba(20,30,50,.05),rgba(20,30,50,.38))' }} />
      {children}
    </div>
  )
}

export function TarjetaDeActividad({ a, i, ancho }: { a: ActividadDeDestino; i: number; ancho: string }) {
  const precio = desdeTexto(a)
  return (
    <a href={withCampaign(a.url, null)} target="_blank" rel="noopener noreferrer" data-actividad={a.id} className={tarjeta} style={{ flex: 'none', width: ancho, scrollSnapAlign: 'start' }}>
      <Foto url={a.foto} prioridad={i < 2} alto={128}>
        {precio && (
          <span className="absolute right-2.5 top-2.5 flex items-baseline gap-[5px] whitespace-nowrap rounded-xl bg-text px-[11px] py-[5px] text-bg">
            {precio !== 'Gratis' && <span className="font-mono text-[9px] tracking-[.1em] opacity-70">DESDE</span>}
            <span data-precio-actividad className="text-[20px] leading-none" style={SERIE}>{precio}</span>
          </span>
        )}
      </Foto>
      <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-1.5">
        <span className="flex h-[46px] items-start overflow-hidden text-[21px] leading-[1.1]" style={SERIE}>{a.nombre}</span>
        <span className="flex items-center gap-2">
          {typeof a.nota === 'number' && <span data-nota-actividad><Pastilla nota={a.nota} /></span>}
          <span className="flex h-[34px] flex-col justify-center leading-[1.25]">
            <span className="whitespace-nowrap text-[13px] font-semibold text-text">{opinionesTexto(a.opiniones)}</span>
            {a.duracion && <span className="whitespace-nowrap text-[12px] text-text/55">{a.duracion}</span>}
          </span>
        </span>
      </div>
    </a>
  )
}

function TarjetaDeHotel({ h, i, viaje }: { h: HotelDeDestino; i: number; viaje: { entrada: string | null; salida: string | null; personas: number | null } }) {
  return (
    <a href={enlaceDeHotel(h.enlace, viaje)} target="_blank" rel="noopener noreferrer" data-hotel={h.id} className={tarjeta} style={{ flex: 'none', width: 236, scrollSnapAlign: 'start' }}>
      <Foto url={h.foto} prioridad={i < 1} alto={136} />
      <div className="flex flex-col gap-[7px] px-3.5 pb-3.5 pt-1.5">
        <span className="text-[21px] leading-[1.1]" style={SERIE}>{h.nombre}</span>
        <span className="text-[12.5px] font-medium text-text/55">{h.zona}</span>
        <span className="flex items-center gap-2">
          <span data-nota-hotel><Pastilla nota={h.nota} /></span>
          <span className="text-[13px] font-semibold text-text">{opinionesTexto(h.opiniones)}</span>
        </span>
      </div>
    </a>
  )
}

const botonOscuro = 'zona-toque flex h-[46px] w-full items-center justify-center gap-[9px] rounded-[15px] bg-text text-[14.5px] font-bold text-bg shadow-[0_12px_20px_-14px_rgba(28,34,48,.8),inset_0_0_0_1.5px_rgba(243,213,154,.5)] transition-transform active:scale-[.98]'

export function DestinationDetailModal({ city, days, nightsLabel, isCamper, onClose, sinViaje }: DestinationDetailModalProps) {
  const huecoAlFinal = useHuecoAlFinal(32) // (10S5) los botones flotantes no tapan lo último de la ficha
  const route = useRouteStore((s) => s.route)
  const selecciones = useRouteStore((s) => s.accommodationSelections)
  const cityDays = city ? days.filter((day) => day.city === city) : []
  const countryCode = cityDays[0]?.countryCode ?? sinViaje?.iso ?? null
  const llevar = useLoQueTePuedesLlevar(sinViaje ? sinViaje.clave : '')
  const [bajado, setBajado] = useState(false)
  const [pagina, setPagina] = useState<PaginaDeDestino | null>(() => (city ? paginaEnMemoria(city) : null))
  const [foto, setFoto] = useState<string | null>(() => sinViaje?.portada ?? null)
  useEffect(() => {
    if (!city) return undefined
    let vivo = true
    setPagina(paginaEnMemoria(city))
    void pedirPaginaDeDestino(city).then((p) => {
      if (!vivo) return
      setPagina(p)
      // (V28) Las fotos empiezan a bajar en cuanto llega la lista (las primeras del carrusel antes) y se quedan en el móvil para la próxima vez.
      for (const url of [...p.actividades.map((a) => a.foto), ...p.hoteles.map((h) => h.foto)]) {
        if (!url) continue
        const im = new Image()
        im.decoding = 'async'
        im.src = url
      }
    })
    // La foto grande: la del destino; si no hay, la de su primera parada con foto, y si no, el degradado.
    // (V34) Sin viaje: la portada del destino (la de la tarjeta del mapa); nunca el degradado si el destino tiene foto. Con viaje, como siempre.
    const deParada = cityDays.flatMap((d) => d.stops).find((st) => st.photoUrl)?.photoUrl ?? null
    setFoto(sinViaje?.portada ?? deParada)
    if (!sinViaje?.portada) void fetchPlacePhoto(city, city, null, 'regular').then((u) => vivo && u && setFoto(u)).catch(() => undefined)
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city])
  // Tu alojamiento (si ya lo has puesto en este destino): la selección está guardada en el primer día del destino.
  const alojamiento = cityDays[0] ? (selecciones[cityDays[0].id] ?? null) : null
  // Las fechas y las personas del viaje para el enlace del hotel (Stay22 las pasa a Booking).
  const rango = route?.answers.dateRange
  const primero = cityDays[0]?.dayNumber
  const ultimo = cityDays[cityDays.length - 1]?.dayNumber
  const entrada = rango?.start && primero ? addDaysToIso(rango.start, primero - 1) : null
  const salidaTramo = rango?.start && ultimo ? addDaysToIso(rango.start, ultimo) : null
  const salida = salidaTramo && rango?.end && salidaTramo > rango.end ? rango.end : salidaTramo
  const companion = route?.answers.companion as string | undefined
  const fechasDelViaje = { entrada, salida, personas: companion === 'solo' ? 1 : companion === 'couple' ? 2 : null }
  const actividades = pagina?.actividades ?? []
  const hoteles = pagina?.hoteles ?? []
  // (V28) Tu alojamiento: si lo añadiste desde nuestros hoteles, su foto; si no, el icono de la cama en grande (nunca un cuadrado de color vacío).
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const fotoDeTuAlojamiento = alojamiento ? (hoteles.find((h) => norm(h.nombre) === norm(alojamiento.name))?.foto ?? null) : null

  // (En el body, por encima de la barra, la cabecera y el mapa: pantalla completa de verdad. PARA_CODE_TODO_2026-10-01, 6.1.)
  return createPortal(
    <AnimatePresence>
      {city && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-pagina-destino className="map-cover-overlay fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-bg" onScroll={sinViaje ? (e) => setBajado(e.currentTarget.scrollTop > 150) : undefined}>
          <div className="mx-auto w-full max-w-lg" style={{ paddingBottom: sinViaje ? 'calc(env(safe-area-inset-bottom,0px) + 138px)' : huecoAlFinal }}>
            {/* D1: la foto grande, la bandera y el nombre, y «5 días · 4 noches · 25 – 29 nov». */}
            <div className="relative h-[250px]">
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 90%)', background: foto ? `url("${foto}") center/cover, linear-gradient(135deg,#E8B070,#5A2A18)` : 'linear-gradient(135deg,#E8B070 0%,#B8602A 50%,#5A2A18 100%)' }} />
              <div className="absolute inset-0" style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 90%)', background: 'linear-gradient(180deg,rgba(20,24,40,.25),rgba(20,24,40,0) 40%,rgba(20,24,40,.6))' }} />
              {!sinViaje && <button type="button" onClick={onClose} aria-label="Cerrar" title="Cerrar" className="zona-toque absolute left-[22px] top-[calc(env(safe-area-inset-top,0px)+16px)] flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-[#B58A2E] bg-[#FFFDF8] shadow-[0_8px_16px_-8px_rgba(28,34,48,.5)]">
                <Icono nombre="cerrar" size={17} />
              </button>}
              <div className="absolute bottom-[34px] left-6 right-6 flex flex-col gap-1.5 text-[#FFFDF8]">
                <span className="flex items-center gap-2.5">
                  <FlagIcon countryCode={countryCode} />
                  <span data-nombre-destino className="text-[40px] leading-none" style={SERIE}>{city}</span>
                </span>
                {sinViaje ? <span data-linea-destino className="text-[14px] font-medium opacity-90">{sinViaje.linea ? `${sinViaje.pais} · ${sinViaje.linea}` : sinViaje.pais}</span> : nightsLabel && <span data-noches-destino className="text-[14px] font-medium opacity-90">{nightsLabel}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-[34px] pt-1.5">
              {/* D2: Actividades. */}
              {actividades.length > 0 && (
                <section data-actividades className="flex flex-col gap-3">
                  <div className="flex flex-col gap-[3px] px-6">
                    <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#8E6820]">QUÉ HACER</span>
                    <span className="text-[28px] leading-[1.05]" style={SERIE}>Actividades en <em className="text-[#8E6820]">{city}</em></span>
                  </div>
                  {/* (V28) En carrusel en TODOS los destinos, tengas o no tu alojamiento puesto. */}
                  <div data-carrusel-actividades className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3.5 pt-1" style={{ scrollbarWidth: 'none', scrollPaddingLeft: 24 }}>
                    {actividades.map((a, i) => <TarjetaDeActividad key={a.id} a={a} i={i} ancho="232px" />)}
                    <span style={{ flex: 'none', width: 12 }} />
                  </div>
                  <div className="px-6">
                    <a href={withCampaign(buildActivitySearchUrl(city), null)} target="_blank" rel="noopener noreferrer" data-ver-todas-actividades className={botonOscuro}>Ver todas las actividades</a>
                  </div>
                </section>
              )}

              {/* D3: Dónde dormir. */}
              {!isCamper && (
                <section data-donde-dormir className="flex flex-col gap-3">
                  <div className="flex flex-col gap-[3px] px-6">
                    <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#8E6820]">DÓNDE DORMIR</span>
                    <span className="text-[28px] leading-[1.05]" style={SERIE}>Alojamientos en <em className="text-[#8E6820]">{city}</em></span>
                  </div>
                  {alojamiento && (
                    <div className="flex flex-col gap-2.5 px-6">
                      <div data-tu-alojamiento className="flex gap-3 rounded-[22px] border border-[rgba(181,138,46,.4)] bg-white p-2.5 shadow-[0_14px_26px_-20px_rgba(110,80,24,.5)]">
                        <span data-foto-tu-alojamiento={fotoDeTuAlojamiento ? 'hotel' : 'cama'} className="flex h-[86px] w-[86px] flex-none items-center justify-center overflow-hidden rounded-2xl" style={{ background: FONDO_SUAVE, color: '#8E6820' }}>
                          {fotoDeTuAlojamiento ? <img src={fotoDeTuAlojamiento} alt="" width={86} height={86} decoding="async" className="h-full w-full object-cover" /> : <Icono nombre="cama" size={40} grosor={1.5} />}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
                          <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#8E6820]">TU ALOJAMIENTO</span>
                          <span className="text-[22px] leading-[1.1]" style={SERIE}>{alojamiento.name}</span>
                        </span>
                        <span className="flex h-7 w-7 flex-none items-center justify-center self-start rounded-full bg-[oklch(0.5_0.1_150)] text-white">
                          <Icono nombre="hecho" size={13} grosor={2.8} />
                        </span>
                      </div>
                      {hoteles.length > 0 && <span className="pt-1.5 font-mono text-[10px] font-semibold tracking-[.14em] text-text/50">OTRAS OPCIONES</span>}
                    </div>
                  )}
                  {hoteles.length > 0 && (
                    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-3.5 pt-1" style={{ scrollbarWidth: 'none', scrollPaddingLeft: 24 }}>
                      {hoteles.map((h, i) => <TarjetaDeHotel key={h.id} h={h} i={i} viaje={fechasDelViaje} />)}
                      <span style={{ flex: 'none', width: 12 }} />
                    </div>
                  )}
                  <div className="px-6">
                    {!sinViaje && <button type="button" data-ver-todos-mapa onClick={() => useAlojamientoUi.getState().abrirMapa()} className={botonOscuro}>
                      <Icono nombre="mapa" size={17} className="text-[#F3D88F]" />
                      Ver todos en el mapa
                    </button>}
                  </div>
                </section>
              )}
              {sinViaje && <LoQueTePuedesLlevar datos={llevar} />}
            </div>
          </div>
          {sinViaje && (
            <>
              {/* La ✕ de arriba no se monta encima del texto al bajar: va en una barra con su fondo que aparece al bajar. */}
              <div data-barra-superior className="pointer-events-none fixed inset-x-0 top-0 z-[85]" style={{ height: 'calc(env(safe-area-inset-top,0px) + 72px)', background: bajado ? 'linear-gradient(180deg,#F6EFE0 70%,rgba(246,239,224,0))' : 'transparent', transition: 'background .2s' }} />
              <button type="button" data-cerrar-destino onClick={onClose} aria-label="Cerrar" title="Cerrar" className="zona-toque fixed left-[22px] top-[calc(env(safe-area-inset-top,0px)+16px)] z-[86] flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-[#B58A2E] bg-[#FFFDF8] text-text shadow-[0_8px_16px_-8px_rgba(28,34,48,.5)]">
                <Icono nombre="cerrar" size={17} />
              </button>
              <div data-crear-mi-viaje-barra className="pointer-events-none fixed inset-x-0 bottom-0 z-[85] flex justify-center" style={{ padding: '34px 22px calc(env(safe-area-inset-bottom,0px) + 22px)', background: 'linear-gradient(180deg,rgba(246,239,224,0),#F6EFE0 55%)' }}>
                <button type="button" data-crear-mi-viaje onClick={sinViaje.alCrear} className="pointer-events-auto zona-toque flex h-[58px] w-full max-w-lg items-center justify-center gap-2.5 rounded-[18px] text-[16.5px] font-bold" style={{ background: 'linear-gradient(135deg,#F6E8BE,#D8BE84 55%,#BE9440)', boxShadow: '0 12px 22px -14px rgba(110,80,24,.75),inset 0 1px 0 rgba(255,255,255,.6)', color: '#4A3510' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  Crear mi viaje a {city}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
