import { useEffect, useMemo, useState } from 'react'
import type { Coordinates, DayPlan, MealSlot, Route, Stop } from '../../../../lib/types'
import { catalogoEnMemoria } from '../../../../lib/destinationPlacesApi'
import { hasRealCoordinates } from '../../../../lib/distanceMock'
import { displayStopName } from '../../../../lib/format'
import { numberedStopsOf } from '../../../../lib/stopKind'
import { urlComoLlegar } from '../../../../lib/hoyParada'
import { aHora, viajeMin, type Propuesta } from '../../../../lib/hoyCambiarPlan'
import { RESTAURANT_SUB_CATEGORIES } from '../../../../lib/placeCategories'
import { comidaActiva, horarioDeComer, proponerComerAhora, restaurantesAbiertos, type RestauranteCerca } from '../../../../lib/hoyComer'
import { aplicarPropuesta, volverALaRutaOriginal } from '../../../../lib/hoyCambiarPlanAplicar'
import { useDestinationPool } from '../../../../lib/useDestinationPool'
import { StopsMapView, type StopsMapMarker } from '../../../map/StopsMapView'
import { Icono } from '../../../ui/Icono'
import { AvisoPlanActualizado, HojaPropuesta, Titulo, useContexto } from './CambiarPlan'
import { HojaV2 } from './HojasV2'
import { BOTON_ORO, BOTON_CLARO } from '../../../ui/botonesOro'

/**
 * HOY2 (agente C, apartado 3): «Quiero comer ahora» (pantalla 24) y «A la hora de comer» (Completa 4).
 *  · `HojaComerAhora`: el mapa con los restaurantes ABIERTOS AHORA más cercanos (los nuestros) y [Ir aquí]. Al elegir uno, la comida pasa a ahora y el resto del día se recoloca como PROPUESTA con el formato común
 *    (Cambia… / Se mantiene… / [Aplicar] / [Ver otra opción] / «Volver a mi ruta original»); nada se mueve sin [Aplicar] y después sale «Plan actualizado · Deshacer».
 *  · `TarjetaDeComida`: cuando toca comer, la tarjeta de arriba es «Tu restaurante está a N minutos» con [Cómo llegar] y [Cambiar] (este abre la misma hoja).
 */
const TINTA = '#1C2230'
const MARFIL = '#FBF3E2'
const ORO_CLARO = '#F3D88F'
const ORO_TEXTO = '#8E6820'
const BOTON_MARFIL = BOTON_CLARO
const normaliza = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** De dónde cuenta las distancias: tu ubicación; sin ella, donde estabas (la última parada vista) o, si no, tu siguiente parada. */
export function origenDeComer(day: DayPlan, siguiente: Stop, ubicacion: Coordinates | null): { origen: Coordinates | null; exacto: boolean; desde: string | null } {
  if (ubicacion && hasRealCoordinates(ubicacion)) return { origen: ubicacion, exacto: true, desde: null }
  const vistas = numberedStopsOf(day).filter((s) => s.checkedInAt && hasRealCoordinates(s.coordinates))
  const ultima = vistas[vistas.length - 1]
  if (ultima) return { origen: ultima.coordinates, exacto: false, desde: displayStopName(ultima.name) }
  return { origen: hasRealCoordinates(siguiente.coordinates) ? siguiente.coordinates : null, exacto: false, desde: displayStopName(siguiente.name) }
}

const textoMin = (min: number, modo: 'coche' | 'pie') => `${modo === 'coche' ? 'En coche' : 'A pie'} · ${min} min`

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
  const [sub, setSub] = useState<string | null>(null)
  const { origen, exacto, desde } = origenDeComer(day, siguiente, ubicacion)
  // (V43 §3) El título dice «comer» o «cenar» (desde las 17:00).
  const tituloHoja = ahoraMin >= 17 * 60 ? 'Quiero cenar ahora' : 'Quiero comer ahora'
  const abiertos = useMemo(() => (resolved ? restaurantesAbiertos({ restaurantes: places, origen, dateIso, ahoraMin, enCoche, sub }) : []), [resolved, places, origen?.lat, origen?.lng, dateIso, ahoraMin, enCoche, sub]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!textoVuelta) return undefined
    const id = window.setTimeout(() => setTextoVuelta(null), 6000)
    return () => window.clearTimeout(id)
  }, [textoVuelta])

  const marcadores: StopsMapMarker[] = abiertos.map((r, i) => ({ id: r.nombre, name: r.nombre, coordinates: r.coordinates, number: i + 1, bg: activo === r.nombre ? '#B58A2E' : TINTA, text: '#fff' }))
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
          <div data-comer-filtros className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {[{ id: null, label: 'Todos' }, ...RESTAURANT_SUB_CATEGORIES].map((c) => (
              <button key={String(c.id)} type="button" onClick={() => setSub(c.id)} data-comer-filtro={c.id ?? 'todos'} aria-pressed={sub === c.id} className="flex h-9 flex-none items-center rounded-full px-3.5 text-[13px] font-bold" style={sub === c.id ? { background: TINTA, color: '#F3D88F' } : { background: '#FFFDF8', border: '1px solid rgba(28,34,48,.14)', color: TINTA }}>
                {c.label}
              </button>
            ))}
          </div>
          <span data-comer-ubicacion className="text-[12.5px] text-[#1C2230]/60">{exacto ? 'Cerca de ti' : `Sin tu ubicación, contamos desde ${desde ?? 'tu siguiente parada'}`}</span>
          {abiertos.length > 0 && (
            <div data-comer-mapa className="h-[190px] flex-none overflow-hidden rounded-[22px]" style={{ border: '1px solid rgba(28,34,48,.12)' }}>
              <StopsMapView markers={marcadores} activeStopId={activo} onSelectStop={(id) => setActivo(id)} userPosition={ubicacion} />
            </div>
          )}
          {!resolved && <span className="text-[14px] font-medium text-[#1C2230]/60">Buscando…</span>}
          {resolved && abiertos.length === 0 && (
            <span data-comer-vacio className="text-[14.5px] font-medium leading-[1.4]">
              Ahora no hay ninguno de nuestros restaurantes abierto cerca de ti. Prueba con «Comer» en «Cerca de ti».
            </span>
          )}
          {abiertos.map((r, i) => {
            const cierraPronto = r.cierraMin != null && r.cierraMin - ahoraMin < 60
            return (
              <div key={r.nombre} data-comer-fila={r.nombre} onClick={() => setActivo(r.nombre)} className="flex items-center gap-3 rounded-[20px] py-2.5 pl-3 pr-2.5" style={{ background: '#FFFDF8', border: activo === r.nombre ? '1.5px solid #B58A2E' : '1px solid rgba(28,34,48,.12)' }}>
                <span data-comer-numero className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-bold" style={{ background: activo === r.nombre ? '#B58A2E' : TINTA, color: '#fff' }}>{i + 1}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <b className="truncate" style={{ font: "400 20px/1.1 'Instrument Serif',serif" }}>{displayStopName(r.nombre)}</b>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-[#1C2230]/65">
                    {r.cocina && <span data-comer-cocina>{r.cocina}</span>}
                    <span data-comer-minutos>{r.minutos} min {r.modo === 'coche' ? 'en coche' : 'a pie'}</span>
                    {r.precio && <span>{r.precio}</span>}
                  </span>
                  {cierraPronto ? (
                    <span data-comer-cierra-pronto className="text-[12px] font-bold" style={{ color: '#C2581C' }}>Cierra pronto</span>
                  ) : (
                    <span data-comer-abierto className="text-[12px] font-semibold" style={{ color: 'oklch(0.38 0.1 150)' }}>{r.cierraMin != null ? `Abierto hasta las ${aHora(r.cierraMin, false)}` : 'Abierto ahora'}</span>
                  )}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); irAqui(r) }} data-comer-ir-aqui className="flex h-11 flex-none items-center rounded-2xl px-4 text-[13.5px] font-bold" style={BOTON_ORO}>
                  Elegir
                </button>
              </div>
            )
          })}
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

export function TarjetaDeComida({ route, day, dateIso, meal, siguiente, ubicacion, enCoche, ahoraMin, onHecha }: { route: Route; day: DayPlan; dateIso: string; meal: MealSlot; siguiente: Stop; ubicacion: Coordinates | null; enCoche: boolean; ahoraMin: number; onHecha: () => void }) {
  const [hoja, setHoja] = useState(false)
  const sitio = meal.chosenRestaurant ?? meal.recommendedRestaurant ?? null
  const catalogo = catalogoEnMemoria(route.destination)
  const ficha = sitio ? (catalogo?.places.find((p) => p.kind === 'restaurant' && normaliza(p.name) === normaliza(sitio.name)) ?? null) : null
  const estado = ficha ? horarioDeComer(ficha, dateIso, ahoraMin) : null
  const cerrado = estado?.abierto === false
  const { origen, exacto } = origenDeComer(day, siguiente, ubicacion)
  const coordsSitio = sitio && hasRealCoordinates(sitio.coordinates) ? sitio.coordinates : null
  const minutos = coordsSitio ? viajeMin(origen ? { coordinates: origen } : null, { coordinates: coordsSitio }, enCoche) : null
  const modo = enCoche ? 'coche' : 'pie'
  const cocina = ficha?.what_to_order ? ficha.what_to_order.split(/[,;(.]/)[0].trim().slice(0, 40) : null
  const esCena = meal.mealTime === 'dinner'
  const titulo = !sitio ? (esCena ? 'Es hora de cenar' : 'Es hora de comer') : cerrado ? `${displayStopName(sitio.name)} está cerrado ahora` : exacto && minutos != null ? `Tu restaurante está a ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}` : `${esCena ? 'Hoy cenas' : 'Hoy comes'} en ${displayStopName(sitio.name)}`
  return (
    <>
      <div data-hoy-comida data-hoy-comida-estado={!sitio ? 'sin_sitio' : cerrado ? 'cerrado' : 'normal'} className="flex-none overflow-hidden rounded-[26px]" style={{ background: TINTA, color: MARFIL, boxShadow: '0 18px 30px -18px rgba(28,34,48,.7)' }}>
        <div className="flex items-center gap-2.5 px-4 pt-3.5">
          <span className="rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-[.14em]" style={{ background: 'rgba(243,216,143,.16)', border: '1px solid rgba(243,216,143,.4)', color: ORO_CLARO, fontFamily: "'Geist Mono',monospace" }}>{esCena ? 'CENA' : 'COMIDA'}</span>
        </div>
        <div className="flex flex-col gap-[9px] px-4 pb-4 pt-2.5">
          <span data-hoy-comida-titulo style={{ font: "400 30px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{titulo}</span>
          {sitio && minutos != null && !cerrado && (
            <span className="flex items-center gap-2.5 text-[13.5px]" data-hoy-comida-trayecto={modo}>
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: 'rgba(251,243,226,.1)', color: ORO_CLARO }}>
                <Icono nombre={enCoche ? 'coche' : 'andando'} size={17} grosor={1.8} />
              </span>
              <span className="flex flex-col gap-px">
                <b style={{ font: "700 14.5px 'Geist'" }}>{textoMin(minutos, modo)}</b>
                <span className="text-[12px]" style={{ color: 'rgba(251,243,226,.65)' }}>
                  {displayStopName(sitio.name)}
                  {cocina ? ` · ${cocina}` : ''}
                  {!exacto ? ' · desde tu última parada' : ''}
                </span>
              </span>
            </span>
          )}
          {cerrado && <span className="text-[13px] leading-[1.35]" style={{ color: '#FFC2BA' }}>Mira otro sitio abierto cerca.</span>}
          {!sitio && <span className="text-[13px] leading-[1.35]" style={{ color: 'rgba(251,243,226,.75)' }}>Te enseñamos los restaurantes abiertos más cerca de ti.</span>}
          <div className="grid grid-cols-2 gap-2">
            {coordsSitio && !cerrado ? (
              <a href={urlComoLlegar(coordsSitio, ubicacion, enCoche)} target="_blank" rel="noopener noreferrer" data-hoy-comida-como-llegar className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold no-underline" style={BOTON_ORO}>
                <Icono nombre="localizar" size={17} grosor={1.9} />
                Cómo llegar
              </a>
            ) : (
              <button type="button" onClick={() => setHoja(true)} data-hoy-comida-elegir className="flex h-12 items-center justify-center rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_ORO}>
                Elegir sitio
              </button>
            )}
            <button type="button" onClick={() => setHoja(true)} data-hoy-comida-cambiar className="flex h-12 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-[13.5px] font-bold" style={BOTON_MARFIL}>
              Cambiar
            </button>
          </div>
          <button type="button" onClick={onHecha} data-hoy-comida-hecha className="flex min-h-11 items-center justify-center text-[12.5px] underline underline-offset-2" style={{ color: 'rgba(251,243,226,.7)' }}>
            Ya he {esCena ? 'cenado' : 'comido'} · seguir con el plan
          </button>
        </div>
      </div>
      {hoja && <HojaComerAhora route={route} day={day} dateIso={dateIso} siguiente={siguiente} ubicacion={ubicacion} enCoche={enCoche} ahoraMin={ahoraMin} onCerrar={() => setHoja(false)} />}
    </>
  )
}

void ORO_TEXTO
