import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { abrirMapaEnOtraPestana, buildAppleMapsUrlFromHere, buildGoogleMapsUrlFromHere } from '../../../lib/mapsLinks'
import { useSyncStore } from '../../../store/useSyncStore'
import { Insignia } from '../dibujos'
import { fetchPlacePhoto } from '../../../lib/placePhoto'
import { useAddFlowStore } from '../../../store/useAddFlowStore'
import { useMomentosUI } from '../momentos/useMomentosUI'
import { recorteDeTrozo, trozoDeInsignia } from './destino/trozo'
import { pedirColeccion, type ColeccionDentroDatos } from './destino/api'
import { diaDeRuta, fechaCorta } from './destino/formato'
import { BotonVolver, Esperando, FONDO_PAPEL, useCarga } from './destino/piezas'
import './destino/destino.css'
import { Capa } from './Capa'
import { urlEstable } from '../../../lib/urlsFirmadas'
import { todayIso } from '../../../lib/dateRange'
import { zonaDelDestino } from '../../../lib/zonaHoraria'
import { useLogrosPantallas, type PantallaDe } from './useLogrosPantallas'

/**
 * UNA COLECCIÓN POR DENTRO, COMO UN ÁLBUM DE CROMOS (8C2; pantalla A de «Mi vitrina»). Cada sitio es un cromo: el que ya está visto lleva la fecha;
 * el que falta y está en la ruta del viaje abierto lleva el día de su ruta y [Cómo llegar]; el resto queda en gris.
 * Todo sale del servidor (GET /api/logros/coleccion): ni los días ni las fechas se escriben a mano.
 */
export default function ColeccionPorDentro({ pantalla }: { pantalla: PantallaDe<'coleccion'> }): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const datos = useCarga(() => pedirColeccion(pantalla.destino, pantalla.coleccion, tripId), [pantalla.destino, pantalla.coleccion, tripId], `pantalla:coleccion:${pantalla.destino}:${pantalla.coleccion}:${tripId ?? ''}`)
  const volver = () => useLogrosPantallas.getState().volver()
  return (
    <Capa etiqueta="Una colección por dentro" fondo={FONDO_PAPEL}>
      <div className="dst" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', padding: '4px 16px' }}><BotonVolver onClick={volver} /></div>
        {!datos ? <Esperando cargando={datos === null} /> : <Album datos={datos} />}
      </div>
    </Capa>
  )
}

/** [Cómo llegar]: abre la ruta andando desde donde estés, en el mapa del propio móvil (el de Apple en iPhone y iPad, el otro en el resto). Sin hoja intermedia: así no sale el nombre de ninguna empresa. */
function comoLlegar(destino: string): void {
  const esApple = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  abrirMapaEnOtraPestana(esApple ? buildAppleMapsUrlFromHere(destino) : buildGoogleMapsUrlFromHere(destino))
}

/** «9 nov» (sin el año: dentro de un viaje no hace falta). */
const fechaSinAnio = (f: string | null): string => fechaCorta(f).replace(/\s\d{4}$/, '')

/** (V9) La foto del sitio: la suya (con la que se ganó) o, si no la hay, la de nuestros datos (la misma de las fichas); mientras llega, un degradado cálido. */
function FotoDeSitio({ url, nombre, ciudad, gris }: { url: string | null | undefined; nombre: string; ciudad: string; gris: boolean }): ReactNode {
  const [foto, setFoto] = useState<string | null>(url ?? null)
  useEffect(() => {
    if (url) {
      setFoto(url)
      return
    }
    let vivo = true
    void fetchPlacePhoto(nombre, ciudad, null, 'small').then((u) => vivo && setFoto(u))
    return () => {
      vivo = false
    }
  }, [url, nombre, ciudad])
  return <div data-foto-de-sitio={foto ? '1' : '0'} style={{ position: 'relative', height: 104, background: foto ? `center/cover url(${foto})` : 'linear-gradient(160deg,#E7B98A,#9A6A48)', ...(gris ? { filter: 'grayscale(1)', opacity: 0.55 } : {}) }} />
}

function Album({ datos }: { datos: ColeccionDentroDatos }): ReactNode {
  const c = datos.coleccion
  const total = datos.sitios.length
  const [tocado, setTocado] = useState<string | null>(null)
  const temporizador = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(temporizador.current), [])
  const ganados = datos.sitios.filter((x) => x.visto).map((x) => x.sitio)
  const TAM = 190
  // El orden: primero los ganados (y cada grupo en el orden de la colección, que es el del trozo de la insignia).
  const ordenados = datos.sitios.map((x, k) => ({ x, k })).sort((a, b) => Number(b.x.visto) - Number(a.x.visto) || a.k - b.k)
  const trozoTocado = tocado ? (() => { const k = datos.sitios.findIndex((x) => x.sitio === tocado); return k >= 0 ? trozoDeInsignia(c.id, total, k) : null })() : null
  const tocar = (sitio: string) => {
    setTocado(sitio)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setTocado(null), 2600)
  }
  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', scrollbarWidth: 'none', padding: '6px 20px calc(env(safe-area-inset-bottom,0px) + 40px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{'@keyframes clPulso{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}'}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '6px 0 4px', textAlign: 'center' }}>
        <span data-insignia-grande style={{ position: 'relative', width: TAM, height: TAM, display: 'block' }}>
          <Insignia coleccion={c.id} ganados={ganados} completa={c.completa} tam={TAM} />
          {trozoTocado && tocado && (
            <span data-trozo-iluminado={tocado} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'drop-shadow(0 0 10px #F3D59A) drop-shadow(0 0 4px #FFF1C8)', animation: 'clPulso 1.3s ease-in-out infinite' }}>
              <span style={{ position: 'absolute', inset: 0, clipPath: recorteDeTrozo(trozoTocado, TAM) }}>
                <Insignia coleccion={c.id} ganados={[tocado]} tam={TAM} />
              </span>
            </span>
          )}
        </span>
        <span style={{ font: "400 30px/1.05 'Instrument Serif',serif", textWrap: 'balance' as never }}>{c.nombre}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "600 11px 'Geist Mono',monospace", letterSpacing: '.14em', color: 'oklch(0.48 0.17 5)' }}>
          {`${c.n} DE ${c.total}`}
          {c.completa && <span style={{ height: 20, padding: '0 8px', borderRadius: 999, background: '#1C2230', color: '#F3D59A', display: 'flex', alignItems: 'center', font: "600 9.5px 'Geist Mono',monospace", letterSpacing: '.1em' }}>COMPLETA</span>}
        </span>
        {c.completa && c.al_completar && <span style={{ font: "italic 400 17px 'Instrument Serif',serif", color: 'rgba(28,34,48,.7)' }}>{c.al_completar}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {ordenados.map(({ x, k }) => (
          <Tarjeta key={x.sitio} s={x} k={k} coleccion={c.id} total={total} datos={datos} tocada={tocado === x.sitio} alTocar={() => tocar(x.sitio)} />
        ))}
      </div>
    </main>
  )
}

/** Una tarjeta de sitio (V9): la foto (en color si está ganado, en gris suave si no), su trozo de la insignia pequeño en una esquina y lo que toque (fecha, día y [Cómo llegar], [Añadir a mi viaje] o nada). */
function Tarjeta({ s, k, coleccion, total, datos, tocada, alTocar }: { s: ColeccionDentroDatos['sitios'][number]; k: number; coleccion: string; total: number; datos: ColeccionDentroDatos; tocada: boolean; alTocar: () => void }): ReactNode {
  const trozo = useMemo(() => trozoDeInsignia(coleccion, total, k), [coleccion, total, k])
  const TAM = 150
  // (V25) El «hoy» es el de ahora en el destino (no el que trajera lo guardado): el mismo momento del viaje que en la hoja de logros.
  const hoy = todayIso(zonaDelDestino(datos.destino) ?? zonaDelDestino(datos.ciudad))
  const terminado = Boolean(datos.viaje && hoy > datos.viaje.fin)
  const conViaje = Boolean(datos.viaje)
  const dia = s.dia ? diaDeRuta(s.dia) + (s.dia.fecha && datos.viaje && s.dia.fecha === hoy ? ' · Hoy' : '') : ''
  const botones = !s.visto && conViaje && !terminado
  return (
    <div data-sitio-de-coleccion={s.sitio} data-ganado={s.visto ? '1' : '0'} role="button" tabIndex={0} onClick={alTocar} onKeyDown={(e) => e.key === 'Enter' && alTocar()} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 22, background: s.visto ? '#FFFDF8' : '#EFE7D8', border: tocada ? '2px solid #C99A4C' : `1px solid rgba(28,34,48,${s.visto ? 0.08 : 0.1})`, overflow: 'hidden', boxShadow: tocada ? '0 10px 22px -12px rgba(150,105,30,.7)' : s.visto ? '0 8px 20px -16px rgba(28,34,48,.35)' : 'none', cursor: 'pointer' }}>
      <FotoDeSitio url={urlEstable(s.foto_url)} nombre={s.nombre} ciudad={datos.ciudad} gris={!s.visto} />
      {trozo && (
        <span data-trozo-de-sitio aria-hidden="true" style={{ position: 'absolute', left: 8, top: 8, width: 46, height: 46, borderRadius: '50%', background: '#FFFDF8', boxShadow: '0 4px 10px -4px rgba(28,34,48,.5)', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', left: 23 - trozo.centro[0] * TAM, top: 23 - trozo.centro[1] * TAM, width: TAM, height: TAM, clipPath: recorteDeTrozo(trozo, TAM) }}>
            <Insignia coleccion={coleccion} ganados={s.visto ? [s.sitio] : []} tam={TAM} />
          </span>
        </span>
      )}
      {s.visto && (
        <span aria-hidden="true" style={{ position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: '50%', background: 'oklch(0.5 0.1 150)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
      )}
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <span style={{ font: "400 17px/1.1 'Instrument Serif',serif", color: s.visto ? '#1C2230' : 'rgba(28,34,48,.55)', textWrap: 'balance' as never }}>{s.nombre}</span>
        {s.visto && s.fecha && <span style={{ font: "500 11.5px 'Geist Mono',monospace", color: 'rgba(28,34,48,.6)' }}>{fechaSinAnio(s.fecha)}</span>}
        {botones && s.en_ruta && (
          <>
            <span data-dia-del-sitio style={{ font: "600 11px 'Geist Mono',monospace", color: 'oklch(0.48 0.17 5)' }}>{dia}</span>
            <button type="button" data-como-llegar onClick={(e) => { e.stopPropagation(); comoLlegar(`${s.nombre}, ${datos.ciudad}`) }} style={{ alignSelf: 'flex-start', height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span style={{ height: 32, padding: '0 14px', borderRadius: 999, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.18)', display: 'flex', alignItems: 'center', font: "600 12.5px 'Geist'", color: '#1C2230' }}>Cómo llegar</span>
            </button>
          </>
        )}
        {botones && !s.en_ruta && (
          <button type="button" data-anadir-a-mi-viaje onClick={(e) => { e.stopPropagation(); anadirAMiViaje(s.nombre) }} style={{ alignSelf: 'flex-start', height: 44, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span style={{ height: 32, padding: '0 12px', borderRadius: 999, background: '#1C2230', color: '#F3D59A', display: 'flex', alignItems: 'center', font: "600 12px 'Geist'" }}>Añadir a mi viaje</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** [Añadir a mi viaje]: cierra las pantallas de logros y abre el flujo de «Añadir» con el sitio ya elegido (el mejor día y el mejor hueco los pone el propio flujo). */
function anadirAMiViaje(nombre: string): void {
  useLogrosPantallas.getState().cerrarTodo()
  useMomentosUI.getState().cerrarHojaLogros()
  useAddFlowStore.getState().openAddFlow(null, nombre)
}
