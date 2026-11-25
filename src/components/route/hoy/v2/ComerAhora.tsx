import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { estaAqui, urlComoLlegar } from '../../../../lib/hoyParada'
import { aHora, viajeMin, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { RESTAURANT_SUB_CATEGORIES } from '../../../../lib/placeCategories'
import { aperturaDeHoy, comidaActiva, horarioDeComer, proponerComerAhora, restaurantesAbiertos, restaurantesMasCercanos, type RestauranteCerca } from '../../../../lib/hoyComer'
import { zonaDeUbicacion, type ZonaUbicacion } from '../../../../lib/ubicacionHoy'
import { useExploreAperturaStore } from '../../../../store/useExploreAperturaStore'
import { useRouteStore } from '../../../../store/useRouteStore'
import { useUbicacionHoy } from './useUbicacionHoy'
import { HojaActivaUbicacion } from './HojaActivaUbicacion'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { useDestinationPool } from '../../../../lib/useDestinationPool'
import { StopsMapView, type StopsMapMarker } from '../../../map/StopsMapView'
import { Icono } from '../../../ui/Icono'
import { AvisoPlanActualizado, BotonCambiarPlan, HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { CajaDeParada, NOMBRE_SOBRE_FOTO, PILDORA_FOTO, RecuadroDeUbicacion, TARJETA_PARADA } from './ParadaHoy'
import { ImagenComida } from '../../../ui/ImagenComida'
import { HojaV2 } from './HojasV2'
import { BOTON_ORO, BOTON_CLARO } from '../../../ui/botonesOro'

/**
 * HOY2 (agente C, apartado 3): «Quiero comer ahora» (pantalla 24) y «A la hora de comer» (Completa 4).
 *  · `HojaComerAhora`: el mapa con los restaurantes ABIERTOS AHORA más cercanos (los nuestros) y [Ir aquí]. Al elegir uno, la comida pasa a ahora y el resto del día se recoloca como PROPUESTA con el formato común
 *    (Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original»); nada se mueve sin [Aplicar] y después sale «Plan actualizado · Deshacer».
 *  · `TarjetaDeComida`: cuando toca comer, la misma tarjeta de la parada con la imagen fija de comida (V59, C1-C6).
 */
const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_TEXTO = '#8E6820'
const normaliza = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** De dónde cuenta las distancias: tu ubicación (solo si estás en la ruta; V44 §1); sin ella, DESDE LA PARADA DE AHORA (V44 §5; si no tiene coordenadas, la última vista). */
export function origenDeComer(day: DayPlan, siguiente: Stop, ubicacion: Coordinates | null): { origen: Coordinates | null; exacto: boolean; desde: string | null } {
  if (ubicacion && hasRealCoordinates(ubicacion)) return { origen: ubicacion, exacto: true, desde: null }
  if (hasRealCoordinates(siguiente.coordinates)) return { origen: siguiente.coordinates, exacto: false, desde: displayStopName(siguiente.name) }
  const vistas = numberedStopsOf(day).filter((s) => s.checkedInAt && hasRealCoordinates(s.coordinates))
  const ultima = vistas[vistas.length - 1]
  return { origen: ultima ? ultima.coordinates : null, exacto: false, desde: ultima ? displayStopName(ultima.name) : null }
}


/* ------------------------------------------------------------------ */
/* La hoja (24)                                                         */
/* ------------------------------------------------------------------ */

export function HojaComerAhora({ route, day, dateIso, siguiente, ubicacion, enCoche, ahoraMin, onCerrar }: { route: Route; day: DayPlan; dateIso: string; siguiente: Stop; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; onCerrar: () => void }) {
  const ctx = useContexto(route, enCoche)
  const { places, resolved } = useDestinationPool(route.destination, true)
  const [paso, setPaso] = useState<'lista' | 'propuesta'>('lista')
  const [elegido, setElegido] = useState<RestauranteCerca | null>(null)
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [indice, setIndice] = useState(0)
  const [activo, setActivo] = useState<string | null>(null)
  const [textoVuelta, setTextoVuelta] = useState<string | null>(null)
  // (V44 §5) El título según la hora: desayunar (hasta las 11:30, con [Café] marcado), comer (hasta las 17:00) o cenar. En el menú de «Cambiar plan» sigue siendo «Quiero comer ahora».
  const tituloHoja = ahoraMin <= 11 * 60 + 30 ? 'Desayunar cerca de ti' : ahoraMin < 17 * 60 ? 'Comer cerca de ti' : 'Cenar cerca de ti'
  const [sub, setSub] = useState<string | null>(() => (ahoraMin <= 11 * 60 + 30 ? 'cafe' : null))
  // (V44 §1 y §5) El GPS solo cuenta en la ruta; sin él, la lista y el mapa salen de la parada de ahora, y se dice que no hay ubicación SIN nombrar ningún sitio.
  const gps = useUbicacionHoy()
  const [hojaUbicacion, setHojaUbicacion] = useState(false)
  const ubicacionUtil = ubicacion ?? (zonaDeUbicacion({ ubicacion: gps.ubicacion, route, referencia: siguiente, enCoche }) === 'ruta' ? gps.ubicacion : null)
  const { origen, exacto } = origenDeComer(day, siguiente, ubicacionUtil)
  const setMode = useRouteStore((s) => s.setMode)
  const abiertos = useMemo(() => (resolved ? restaurantesAbiertos({ restaurantes: places, origen, dateIso, ahoraMin, enCoche, sub, maxMin: 600 }) : []), [resolved, places, origen?.lat, origen?.lng, dateIso, ahoraMin, enCoche, sub])
  // Si aún no ha abierto nada: nunca vacío ni mandar a otra pantalla, los más cercanos con su hora de apertura.
  const noAbiertos = abiertos.length === 0
  const cercanos = useMemo(() => (resolved && noAbiertos ? restaurantesMasCercanos({ restaurantes: places, origen, dateIso, ahoraMin, enCoche, sub }) : []), [resolved, noAbiertos, places, origen?.lat, origen?.lng, dateIso, ahoraMin, enCoche, sub])
  const lista = noAbiertos ? cercanos : abiertos
  const verTodos = () => {
    useExploreAperturaStore.getState().pedir({ categoria: 'restaurantes', origen: ubicacionUtil ?? origen, cerca: false, subfiltro: sub })
    setMode('explore')
    onCerrar()
  } // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!textoVuelta) return undefined
    const id = window.setTimeout(() => setTextoVuelta(null), 6000)
    return () => window.clearTimeout(id)
  }, [textoVuelta])

  const marcadores: StopsMapMarker[] = lista.map((r, i) => ({ id: r.nombre, name: r.nombre, coordinates: r.coordinates, number: i + 1, bg: activo === r.nombre ? '#B58A2E' : TINTA, text: '#fff' }))
  const irAqui = (r: RestauranteCerca) => {
    const lista = proponerComerAhora({ route, day, restaurante: r, ctx, ahoraMin, siguiente, desde: ubicacion })
    setElegido(r)
    setPropuestas(lista)
    setIndice(0)
    setPaso('propuesta')
  }
  const aplicar = (pr: Propuesta) => {
    aplicarPropuesta(route.id, dateIso, pr)
    onCerrar()
  }

  if (paso === 'propuesta')
    return (
      <>
        <HojaPropuesta titulo={tituloHoja} propuestas={propuestas} indice={indice} vacio={`Hoy no cabe comer en ${elegido ? elegido.nombre : 'ese sitio'} sin quitar algo importante.`} onOtra={() => setIndice((i) => (i + 1) % propuestas.length)} onAplicar={aplicar} onOriginal={() => { const n = volverALaRutaOriginal(); setPaso('lista'); setTextoVuelta(n > 0 ? 'Tu ruta vuelve a ser la original.' : 'Tu ruta ya es la original.') }} onCerrar={() => setPaso('lista')} />
      </>
    )
  return (
    <>
      <HojaV2 onCerrar={onCerrar} etiqueta={tituloHoja} fondo={MARFIL}>
        <div data-comer-hoja="lista" className="flex flex-col gap-3">
          <Titulo texto={tituloHoja} onCerrar={onCerrar} />
          <div data-comer-filtros className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {[{ id: null, label: 'Todos' }, ...RESTAURANT_SUB_CATEGORIES].map((c) => (
              <button key={String(c.id)} type="button" onClick={() => setSub(c.id)} data-comer-filtro={c.id ?? 'todos'} aria-pressed={sub === c.id} className="flex h-9 flex-none items-center rounded-full px-3.5 text-[13px] font-bold" style={sub === c.id ? { background: TINTA, color: '#F3D88F' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.16)', color: TINTA }}>
                {c.label}
              </button>
            ))}
          </div>
          {exacto ? (
            <span data-comer-ubicacion className="text-[13px] font-medium leading-[1.3] text-[#1C2230]/65">Cerca de ti</span>
          ) : !gps.ubicacion ? (
            <span data-comer-ubicacion data-comer-sin-ubicacion className="flex flex-wrap items-center gap-x-1 text-[13px] font-medium leading-[1.3] text-[#1C2230]/65">
              No tienes la ubicación activada ·
              <button type="button" onClick={() => (gps.estado === 'no' ? setHojaUbicacion(true) : gps.pedir())} data-comer-usar-ubicacion className="inline-flex min-h-11 items-center font-bold underline underline-offset-[3px]" style={{ color: '#8E6820' }}>
                {gps.estado === 'pidiendo' ? 'Buscando…' : 'Usar mi ubicación'}
              </button>
            </span>
          ) : (
            <span data-comer-ubicacion className="text-[13px] font-medium leading-[1.3] text-[#1C2230]/65">Contamos desde tu parada de ahora</span>
          )}
          {hojaUbicacion && <HojaActivaUbicacion onCerrar={() => setHojaUbicacion(false)} onReintentar={() => { setHojaUbicacion(false); gps.pedir() }} />}
          {lista.length > 0 && (
            <div data-comer-mapa className="h-[112px] flex-none overflow-hidden rounded-[18px]">
              <StopsMapView markers={marcadores} activeStopId={activo} onSelectStop={(id) => setActivo(id)} userPosition={ubicacionUtil} />
            </div>
          )}
          {!resolved && <span className="text-[14px] font-medium text-[#1C2230]/60">Buscando…</span>}
          {resolved && noAbiertos && (
            <span data-comer-vacio className="text-[14.5px] font-medium leading-[1.4]">
              A esta hora aún no han abierto. Los más cercanos:
            </span>
          )}
          {lista.map((r, i) => {
            const cierraPronto = r.cierraMin != null && r.cierraMin - ahoraMin < 60
            return (
              <div key={r.nombre} data-comer-fila={r.nombre} onClick={() => setActivo(r.nombre)} className="flex items-center gap-3 rounded-[20px] py-2.5 pl-3 pr-2.5" style={{ background: '#FFFDF8', border: activo === r.nombre ? '1.5px solid #B58A2E' : '1px solid rgba(28,34,48,.12)' }}>
                <span data-comer-numero className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold" style={{ background: activo === r.nombre ? '#B58A2E' : TINTA, color: '#fff' }}>{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <b className="truncate" style={{ font: "700 14px/1.15 'Geist'" }}>{displayStopName(r.nombre)}</b>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[#1C2230]/65">
                    {r.tipo && <span data-comer-tipo>{r.tipo}</span>}
                    <span data-comer-minutos>{r.minutos} min {r.modo === 'coche' ? 'en coche' : 'a pie'}</span>
                    {r.precio && <span>{r.precio}</span>}
                  </span>
                  {noAbiertos ? (
                    <span data-comer-abre className="text-[12px] font-semibold" style={{ color: '#6E5018' }}>{r.abreMin != null ? `Abre a las ${aHora(r.abreMin, false)}` : 'Hoy no abre más'}</span>
                  ) : cierraPronto ? (
                    <span data-comer-cierra-pronto className="text-[12px] font-bold" style={{ color: '#C2581C' }}>Cierra pronto</span>
                  ) : (
                    <span data-comer-abierto className="text-[12px] font-semibold" style={{ color: 'oklch(0.38 0.1 150)' }}>{r.cierraMin != null ? `Abierto hasta las ${aHora(r.cierraMin, false)}` : 'Abierto ahora'}</span>
                  )}
                </span>
                {!noAbiertos && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); irAqui(r) }} data-comer-ir-aqui className="zona-toque flex h-[34px] flex-none items-center rounded-xl px-3 text-[12.5px] font-bold" style={BOTON_ORO}>
                    Elegir
                  </button>
                )}
              </div>
            )
          })}
          {/* (V44 §5) Abajo del todo: EXPLORAR solo con el filtro Restaurantes (y el subfiltro que hubiera). */}
          {resolved && (
            <button type="button" onClick={verTodos} data-comer-ver-todos className="flex h-12 items-center justify-center rounded-2xl text-[14px] font-bold" style={BOTON_CLARO}>
              Ver todos en Explorar
            </button>
          )}
        </div>
      </HojaV2>
      {textoVuelta && <AvisoPlanActualizado texto={textoVuelta} conDeshacer={false} />}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* A la hora de comer (Completa 4)                                      */
/* ------------------------------------------------------------------ */

const claveHecha = (rutaId: string, diaId: string, mealId: string) => `trazo:hoy2:comida-hecha:${rutaId}:${diaId}:${mealId}`
const leerHecha = (k: string): boolean => {
  try {
    return window.localStorage.getItem(k) === '1'
  } catch {
    return false
  }
}

/** La comida (o cena) que toca ahora y no se ha dado por hecha. `marcarHecha` («Ya he comido») la deja y vuelve la tarjeta de la parada. */
export function useComidaDeAhora(route: Route, day: DayPlan, siguiente: Stop | null, ahoraMin: number): { meal: MealSlot | null; marcarHecha: () => void } {
  const meal = comidaActiva(day, siguiente, ahoraMin)
  const clave = meal ? claveHecha(route.id, day.id, meal.id) : null
  const [hechas, setHechas] = useState<string[]>([])
  const hecha = clave != null && (hechas.includes(clave) || leerHecha(clave))
  return {
    meal: meal && !hecha ? meal : null,
    marcarHecha: () => {
      if (!clave) return
      try {
        window.localStorage.setItem(clave, '1')
      } catch {
        /* sin almacenamiento: vale hasta cerrar la pantalla */
      }
      setHechas((h) => [...h, clave])
    },
  }
}

type PropsTarjetaDeComida = { route: Route; day: DayPlan; dateIso: string; meal: MealSlot; siguiente: Stop; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; onHecha: () => void; zonaUbicacion: ZonaUbicacion; ubicacionEstado: 'libre' | 'pidiendo' | 'no'; pedirUbicacion: () => void; hayUbicacion?: boolean; onSaltar: () => void }

/** El rótulo de las cajas: lo que se tarda en comer (por dentro 1 h; cena 1 h 30; se enseña). */
const TIEMPO_DE_COMER = '1 h'
const TIEMPO_DE_CENAR = '1 h 30'

/**
 * (V59 §3; Design «Hora de Comer», C1-C6) LA TARJETA DE LA COMIDA Y DE LA CENA: la misma tarjeta de la parada (esquinas, cajas, recuadro de la ubicación, botones) con la imagen fija de comida (`ImagenComida`) en lugar de la foto.
 *  · C1/C2, con restaurante: «COMIDA» / «CENA», «Es hora de comer · Nombre»; HORARIO / A PIE / COMIDA (1 h; cena 1 h 30); el recuadro de la ubicación; [Cómo llegar] y [Elegir otro sitio] (abre «Comer cerca de ti»); «Ya he comido · seguir con el plan».
 *  · C5/C6, ya en el restaurante (GPS a 150 m o [Ya he llegado]): A PIE «Aquí · Ya has llegado»; sin recuadro, botones ni enlace; solo [He terminado] verde (pasa a la siguiente parada).
 *  · C3/C4, sin restaurante: «12 abiertos · Restaurantes cerca de ti», [Elegir sitio] y [Cambiar plan]. Al elegir uno en la hoja, la comida lleva ese restaurante y pasa a C1/C2.
 * Si pasa la hora de la comida (`comidaActiva`) sin pulsar nada, la tarjeta se va sola y sale la de la parada. Vale igual en coche (Lanzarote: «EN COCHE»).
 */
export function TarjetaDeComida(p: PropsTarjetaDeComida) {
  const sitio = p.meal.chosenRestaurant ?? p.meal.recommendedRestaurant ?? null
  return sitio ? <TarjetaDeComidaConSitio {...p} /> : <TarjetaDeComidaSinSitio {...p} />
}

/** Sin restaurante: cuenta los abiertos cerca (en el móvil, del catálogo que ya está en memoria; no pregunta a Supabase). */
function TarjetaDeComidaSinSitio(p: PropsTarjetaDeComida) {
  const { places, resolved } = useDestinationPool(p.route.destination, true)
  const { origen } = origenDeComer(p.day, p.siguiente, p.ubicacion)
  const abiertos = useMemo(() => (resolved ? restaurantesAbiertos({ restaurantes: places, origen, dateIso: p.dateIso, ahoraMin: p.ahoraMin, enCoche: p.enCoche, limite: 999, maxMin: 600 }) : []), [resolved, places, origen?.lat, origen?.lng, p.dateIso, p.ahoraMin, p.enCoche]) // eslint-disable-line react-hooks/exhaustive-deps
  return <TarjetaDeComidaBase {...p} cerca={resolved ? { n: abiertos.length, minutos: abiertos[0]?.minutos ?? null } : null} />
}

function TarjetaDeComidaConSitio(p: PropsTarjetaDeComida) {
  return <TarjetaDeComidaBase {...p} cerca={null} />
}

function TarjetaDeComidaBase({ route, day, dateIso, meal, siguiente, ubicacion, enCoche, ahoraMin, onHecha, zonaUbicacion, ubicacionEstado, pedirUbicacion, onSaltar, cerca }: PropsTarjetaDeComida & { cerca: { n: number; minutos: number | null } | null }) {
  const [hoja, setHoja] = useState(false)
  const [forzada, setForzada] = useState(false)
  const sitio = meal.chosenRestaurant ?? meal.recommendedRestaurant ?? null
  const esCena = meal.mealTime === 'dinner'
  const catalogo = catalogoEnMemoria(route.destination)
  const ficha = sitio ? (catalogo?.places.find((x) => x.kind === 'restaurant' && normaliza(x.name) === normaliza(sitio.name)) ?? null) : null
  const estado = ficha ? horarioDeComer(ficha, dateIso, ahoraMin) : null
  const cerrado = estado?.abierto === false
  // Sin tu ubicación se cuenta desde la ÚLTIMA parada que has hecho (`Desde el Panteón`); si aún no has hecho ninguna, desde el origen de siempre (`origenDeComer`).
  const base = origenDeComer(day, siguiente, ubicacion)
  const ultima = numberedStopsOf(day).filter((x) => x.checkedInAt && hasRealCoordinates(x.coordinates)).pop() ?? null
  const exacto = base.exacto
  const origen = !exacto && ultima ? ultima.coordinates : base.origen
  const desde = !exacto && ultima ? displayStopName(ultima.name) : base.desde
  const coordsSitio = sitio && hasRealCoordinates(sitio.coordinates) ? sitio.coordinates : null
  const minutos = coordsSitio ? viajeMin(origen ? { coordinates: origen } : null, { coordinates: coordsSitio }, enCoche) : null
  // «Ya has llegado»: el GPS a 150 m del restaurante (solo si estás en la ruta: `ubicacion` ya viene filtrada) o [Ya he llegado].
  const llegado = Boolean(sitio) && (forzada || (coordsSitio != null && estaAqui(ubicacion, { coordinates: coordsSitio } as Stop)))
  const modo = enCoche ? 'coche' : 'pie'
  const nombre = sitio ? displayStopName(sitio.name) : null
  const aloj = useRouteStore((s) => s.accommodationSelections)
  const conHotel = Object.values(aloj ?? {}).some((x) => Boolean((x as { name?: string } | null)?.name))
  const subTitulo = nombre ?? (conHotel ? 'Cerca de tu alojamiento' : 'Cerca de ti')

  // HORARIO: «Abierto» en verde (V46), «Cerrado» en rojo; la línea de debajo, hasta cuándo o cuándo abre.
  const abre = cerrado && ficha ? aperturaDeHoy(ficha, dateIso, ahoraMin) : null
  const horario = !sitio
    ? null
    : cerrado
      ? { grande: 'Cerrado', tono: 'rojo' as const, sub: abre != null ? `Abre a las ${aHora(abre, false)}` : 'Hoy no abre más', subTono: 'rojo' as const }
      : { grande: 'Abierto', tono: 'verde' as const, sub: estado?.cierraMin != null ? `Cierra a las ${aHora(estado.cierraMin, false)}` : 'Sin horario fijo', subTono: 'gris' as const }
  const cajaCome = <CajaDeParada dato="comida" icono="arena" etiqueta={esCena ? 'CENA' : 'COMIDA'} grande={esCena ? TIEMPO_DE_CENAR : TIEMPO_DE_COMER} sub="Lo que recomendamos" datos={{ 'data-hoy-comida-duracion': esCena ? 'cena' : 'comida' }} />
  const cajaPie = (grande: string, sub: string, zona: string) => <CajaDeParada dato="minutos" icono={enCoche ? 'coche' : 'andando'} etiqueta={enCoche ? 'EN COCHE' : 'A PIE'} grande={grande} sub={sub} datos={{ 'data-hoy-trayecto': modo, 'data-hoy-trayecto-zona': zona }} />
  const estadoDeLaTarjeta = !sitio ? 'sin_sitio' : llegado ? 'llegado' : cerrado ? 'cerrado' : 'normal'

  return (
    <>
      <div data-hoy-comida data-hoy-siguiente data-tarjeta="clara" data-hoy-comida-estado={estadoDeLaTarjeta} className="flex-none overflow-hidden rounded-[28px]" style={TARJETA_PARADA}>
        <div data-hoy-foto-parada className="relative overflow-hidden" style={{ height: 156 }}>
          <ImagenComida tipo={esCena ? 'cenar' : 'comer'} />
          <span className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,0) 40%,rgba(0,0,0,.35))' }} />
          <span data-hoy-insignia className="absolute left-3.5 top-3.5 flex h-7 items-center rounded-full px-[13px]" style={{ ...PILDORA_FOTO, font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em' }}>{esCena ? 'CENA' : 'COMIDA'}</span>
          <div className="absolute inset-x-[18px] bottom-3.5 flex flex-col gap-1">
            <span data-hoy-comida-titulo style={NOMBRE_SOBRE_FOTO}>{esCena ? 'Es hora de cenar' : 'Es hora de comer'}</span>
            <span data-hoy-comida-sitio className="text-[15px] font-semibold leading-[1.2]" style={{ color: '#FFFDF8', textShadow: '0 2px 12px rgba(0,0,0,.4)' }}>{subTitulo}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3.5">
          <div data-hoy-cajas className="grid grid-cols-3 gap-2">
            {sitio && horario ? (
              <>
                <CajaDeParada dato="horario" icono="reloj" etiqueta="HORARIO" grande={horario.grande} tono={horario.tono} sub={horario.sub} subTono={horario.subTono} />
                {llegado ? cajaPie('Aquí', 'Ya has llegado', 'aqui') : cajaPie(minutos != null ? `${minutos} min` : '—', exacto ? 'Desde ti' : desde ? `Desde ${desde}` : 'Desde tu parada', zonaUbicacion)}
                {cajaCome}
              </>
            ) : (
              <>
                <CajaDeParada dato="cerca" icono="comida" etiqueta="CERCA" grande={cerca ? `${cerca.n} abiertos` : '—'} sub="Restaurantes cerca de ti" datos={{ 'data-hoy-comida-abiertos': String(cerca?.n ?? '') }} />
                {cajaPie(cerca?.minutos != null ? `${cerca.minutos} min` : '—', 'El más cercano', zonaUbicacion)}
                {cajaCome}
              </>
            )}
          </div>
          {llegado ? (
            <button type="button" onClick={onHecha} data-hoy-comida-terminado className="flex h-[54px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-bold text-white" style={{ background: 'linear-gradient(180deg,#3E9A5E,#2B7F45)', boxShadow: '0 10px 16px -12px rgba(30,100,60,.8),inset 0 1px 0 rgba(255,255,255,.25)' }}>
              <Icono nombre="hecho" size={17} grosor={2.4} />
              He terminado
            </button>
          ) : (
            <>
              <RecuadroDeUbicacion zona={zonaUbicacion} destino={route.destination} ubicacionEstado={ubicacionEstado} pedirUbicacion={pedirUbicacion} onLlegado={sitio ? () => setForzada(true) : undefined} nombre={nombre ?? 'el restaurante'} textoSin={sitio ? undefined : 'Sin tu ubicación, te enseñamos los de cerca de tu última parada'} />
              <div className="flex gap-[9px]">
                {sitio && coordsSitio && !cerrado ? (
                  <a href={urlComoLlegar(coordsSitio, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-hoy-comida-como-llegar className="flex h-[52px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-bold no-underline" style={BOTON_ORO}>
                    <Icono nombre="localizar" size={17} grosor={2} />
                    Cómo llegar
                  </a>
                ) : (
                  <button type="button" onClick={() => setHoja(true)} data-hoy-comida-elegir className="flex h-[52px] flex-[1.5] items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-bold" style={BOTON_ORO}>
                    <Icono nombre="comida" size={17} grosor={2} />
                    {sitio ? 'Elegir otro sitio' : 'Elegir sitio'}
                  </button>
                )}
                {sitio && coordsSitio && !cerrado ? (
                  <button type="button" onClick={() => setHoja(true)} data-hoy-comida-cambiar className="flex h-[52px] flex-[1.3] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-2 text-[14px] font-bold" style={BOTON_CLARO}>
                    <Icono nombre="comida" size={16} grosor={2} />
                    Elegir otro sitio
                  </button>
                ) : (
                  <BotonCambiarPlan route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onSaltar={onSaltar} />
                )}
              </div>
              <button type="button" onClick={onHecha} data-hoy-comida-hecha className="-mt-0.5 flex min-h-11 items-center justify-center text-[13.5px] font-semibold underline underline-offset-[3px]" style={{ color: '#6E5018' }}>
                Ya he {esCena ? 'cenado' : 'comido'} · seguir con el plan
              </button>
            </>
          )}
        </div>
      </div>
      {hoja && <HojaComerAhora route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={() => setHoja(false)} />}
    </>
  )
}

void ORO_TEXTO
