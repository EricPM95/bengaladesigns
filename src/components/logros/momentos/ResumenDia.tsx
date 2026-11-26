import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Momento } from '../../../lib/logros'
import { urlParaMostrar } from '../../../lib/fotosViaje'
import { useFotosViaje } from '../../../lib/useFotosViaje'
import { fechaDelDia } from '../../../lib/tarjetasDePropuesta'
import { useRouteStore } from '../../../store/useRouteStore'
import { useSyncStore } from '../../../store/useSyncStore'
import { Chapa, Emblema, Insignia, Sello, type GradoDeSello } from '../dibujos'
import { ORDEN_EMBLEMAS_LANZAROTE, idDeDibujoLanzarote } from '../dibujos/emblemasLanzarote'
import { datosDePrueba, pedirEstado, pedirResumen, pedirViajero, viajeroGuardado, type EstadoLogros, type LogrosViajero, type ResumenLogros } from './api'
import './momentos.css'
import { fila, lineaDeSecretos, ORDEN_FILAS, textoDeSello } from './textosResumen'
import { useMomentosUI } from './useMomentosUI'
import { CruzDeHoja } from '../../ui/CruzDeHoja'
import { TiradorDeHoja } from '../../ui/TiradorDeHoja'
import { FONDO_DE_HOJA } from '../../ui/fondoDeHoja'
import { cifraQueSube, dentroDelEstudio, movimientoReducido, sonarResumenUnaVez, useProgresoDeCifras } from './cifrasQueSuben'

/**
 * EL RESUMEN DEL DÍA (Tanda 8B; V59, Design «Cierre del día» R1, R1b, R2). El mismo al acabar la ruta, al cerrar la hoja de «Por hoy ya está» y a la mañana siguiente. Cuenta lo ganado ese día (del servidor, `GET /api/logros/resumen`;
 * si no contesta, de lo que se acaba de enseñar): arriba la medalla del destino, debajo la tira de las fotos de ese día (si no hay, no sale), una fila por cada cosa ganada (solo las que no son 0, con su miniatura al mismo tamaño),
 * [Ver todos mis logros] y «Roma aún esconde N secretos.». Si ese día no ganó nada, NO sale (se cierra sola: fuera «Aún no has ganado nada hoy»).
 * Por la noche: «TU DÍA EN ROMA · Resumen del día»; a la mañana siguiente: «TU DÍA DE AYER EN ROMA · Resumen de ayer» (`de.manana`). Una vez por día (`abrirElResumenDeUnDia`).
 */
/**
 * Pura (8B4): de los sellos que salieron ese día (`sello` e `id:grado`), cuántos son NUEVOS (nacen ese día: su primer grado, el bronce; el Vaticano no tiene bronce y nace en plata)
 * y cuántos solo SUBEN de grado. Un sello cuenta una vez aunque ese día haya ganado varios grados; si nació ese día, es nuevo.
 */
export function contarSellos(sellos: { sello: string; grado: string }[]): { nuevos: number; subidos: number } {
  const por = new Map<string, boolean>()
  for (const x of sellos) por.set(x.sello, (por.get(x.sello) ?? false) || x.grado === 'bronce' || (x.sello === 'vaticano' && x.grado === 'plata'))
  const nuevos = [...por.values()].filter(Boolean).length
  return { nuevos, subidos: por.size - nuevos }
}

const GRADOS = ['bronce', 'plata', 'oro', 'diamante']
/** Pura (8B5): de los sellos que salieron ese día, una entrada por sello con el grado MÁS ALTO y si nació ese día (si no, solo sube). Mismo criterio que `contarSellos`. */
export function detalleSellos(sellos: { sello: string; grado: string }[]): { sello: string; grado: string; nace: boolean }[] {
  const por = new Map<string, { sello: string; grado: string; nace: boolean }>()
  for (const x of sellos) {
    const nace = x.grado === 'bronce' || (x.sello === 'vaticano' && x.grado === 'plata')
    const antes = por.get(x.sello)
    if (!antes) por.set(x.sello, { sello: x.sello, grado: x.grado, nace })
    else por.set(x.sello, { sello: x.sello, grado: GRADOS.indexOf(x.grado) > GRADOS.indexOf(antes.grado) ? x.grado : antes.grado, nace: antes.nace || nace })
  }
  return [...por.values()]
}

/** Pura: de los momentos de una ronda, cuántas cosas de cada tipo (los pedazos se cuentan por sitio). */
export function contarMomentos(ganado: Momento[]): Record<string, number> {
  const c: Record<string, number> = {}
  for (const m of ganado) {
    if (m.tipo === 'suma') c.pedazo = (c.pedazo ?? 0) + (((m.sitios as string[] | undefined)?.length) ?? 1)
    else if (m.tipo === 'suma_sello') continue
    else if (m.tipo === 'sello') {
      const { nuevos } = contarSellos([{ sello: String(m.sello ?? ''), grado: String(m.grado ?? '') }])
      const k = nuevos ? 'sello_nuevo' : 'sello'
      c[k] = (c[k] ?? 0) + 1
    } else c[m.tipo] = (c[m.tipo] ?? 0) + 1
  }
  return c
}

/* ── Las miniaturas de cada fila (V59): TODAS del mismo tamaño (el grande de los pedazos y los emblemas) y alineadas a la misma izquierda ── */
const LADO = 56
const HUECO = 8
const BANDERAS: Record<string, string> = { italia: '🇮🇹', españa: '🇪🇸', francia: '🇫🇷', portugal: '🇵🇹', alemania: '🇩🇪', 'reino unido': '🇬🇧', grecia: '🇬🇷', méxico: '🇲🇽', marruecos: '🇲🇦', 'países bajos': '🇳🇱', bélgica: '🇧🇪', suiza: '🇨🇭', austria: '🇦🇹', 'ciudad del vaticano': '🇻🇦', vaticano: '🇻🇦' }
const bandera = (pais: string): string => BANDERAS[pais.trim().toLowerCase()] ?? ''
const humanizar = (id: string): string => {
  const t = id.replace(/_/g, ' ').trim()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

interface Miniatura {
  clave: string
  /** El dibujo, dentro de un cuadrado de LADO × LADO. */
  dibujo: ReactNode
  /** Lo de debajo, pequeño («🇮🇹 Italia», «Roma», el nombre del logro). */
  pie?: string
}

/** Cuántas miniaturas caben en una fila de `ancho` px: todas si caben; si no, las que caben menos una, que es el «+N». */
export function cuantasCaben(total: number, ancho: number): { ver: number; mas: number } {
  const caben = Math.max(1, Math.floor((ancho + HUECO) / (LADO + HUECO)))
  if (total <= caben) return { ver: total, mas: 0 }
  const ver = Math.max(1, caben - 1)
  return { ver, mas: total - ver }
}

/** El ancho de un elemento (para llenar el ancho de la tira o de la fila). */
function useAncho(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [ancho, setAncho] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setAncho(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => setAncho(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, ancho]
}

const PASTILLA_MAS: React.CSSProperties = { height: LADO, minWidth: LADO, padding: '0 9px', borderRadius: 14, background: '#1C2230', color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 15px 'Geist'", flex: 'none', boxSizing: 'border-box' }

/** Una fila de miniaturas que llena el ancho: caben las que caben y solo el último hueco es «+N». */
function FilaDeMiniaturas({ items }: { items: Miniatura[] }): ReactNode {
  const [ref, ancho] = useAncho()
  const { ver, mas } = ancho > 0 ? cuantasCaben(items.length, ancho) : { ver: items.length, mas: 0 }
  return (
    <div ref={ref} data-miniaturas-fila style={{ display: 'flex', alignItems: 'flex-start', gap: HUECO, overflow: 'hidden', minHeight: LADO }}>
      {items.slice(0, ver).map((m) => (
        <span key={m.clave} data-miniatura style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: LADO, maxWidth: 96, flex: 'none' }}>
          <span style={{ display: 'flex', width: LADO, height: LADO, alignItems: 'center', justifyContent: 'center' }}>{m.dibujo}</span>
          {m.pie && <span style={{ font: "600 9.5px/1.15 'Geist'", textAlign: 'center', color: 'rgba(28,34,48,.7)', maxWidth: 96, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{m.pie}</span>}
        </span>
      ))}
      {mas > 0 && <span data-miniaturas-mas style={PASTILLA_MAS}>{`+${mas}`}</span>}
    </div>
  )
}

/** La tira de las fotos de ese día: llena el ancho; las que caben y el «+N» con las que sobran. */
function TiraDeFotos({ urls }: { urls: string[] }): ReactNode {
  const [ref, ancho] = useAncho()
  const lado = 46
  const caben = ancho > 0 ? Math.max(1, Math.floor((ancho + 8) / (lado + 8))) : urls.length
  const ver = urls.length <= caben ? urls.length : Math.max(1, caben - 1)
  const mas = urls.length - ver
  return (
    <div ref={ref} data-resumen-fotos style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
      {urls.slice(0, ver).map((u, i) => (
        <span key={i} style={{ width: lado, height: lado, borderRadius: 12, flex: 'none', background: `center/cover url(${u}) #E6DCC8`, boxShadow: '0 6px 12px -8px rgba(28,34,48,.5)', border: '2px solid #FFFDF8', boxSizing: 'border-box' }} />
      ))}
      {mas > 0 && <span data-resumen-fotos-mas style={{ width: lado, height: lado, borderRadius: 12, flex: 'none', background: '#1C2230', color: '#F3D88F', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 15px 'Geist'" }}>{`+${mas}`}</span>}
    </div>
  )
}

/** `primeraVez`: el resumen sale por primera vez (al acabar el día; lo pide el anfitrión): solo entonces suben los números y suena. Sin él (abierto otra vez) o con «Reducir movimiento», en silencio y con los números puestos. El estudio de sonidos lo enseña siempre moviéndose. `de`: de qué día es y si sale a la mañana siguiente. */
export function ResumenDia({ ganado, estado: estadoInicial, alCerrar, primeraVez = false, de = null }: { ganado: Momento[]; estado: EstadoLogros | null; alCerrar: () => void; primeraVez?: boolean; de?: { iso: string; manana: boolean } | null }): ReactNode {
  const tripId = useSyncStore((s) => s.activeTripId) ?? null
  const route = useRouteStore((s) => s.route)
  const [estado, setEstado] = useState<EstadoLogros | null>(estadoInicial)
  const [resumen, setResumen] = useState<ResumenLogros | null>(null)
  const [viajero, setViajero] = useState<LogrosViajero | null>(() => viajeroGuardado())
  // Hasta que el servidor contesta (con datos o sin ellos) no se enseña nada: si ese día no ganó nada, el resumen no sale.
  const [listo, setListo] = useState(false)
  useEffect(() => {
    let vivo = true
    void (async () => {
      const e = estadoInicial ?? (await pedirEstado(tripId))
      if (!vivo) return
      setEstado(e)
      const r = await pedirResumen(tripId, de?.iso ?? e?.viaje?.hoy ?? null)
      if (vivo) {
        setResumen(r)
        setListo(true)
      }
      // Los nombres de los logros de viajero (una sola vez al abrir; vienen del archivo del servidor, <5 KB).
      const v = await pedirViajero()
      if (vivo && v) setViajero(v)
    })()
    return () => {
      vivo = false
    }
  }, [tripId, estadoInicial, de?.iso])

  // Las fotos de ESE día (las de las paradas y las sueltas). Una consulta al abrir el resumen (una vez por día): la lista de fotos del viaje, solo las miniaturas (unas decenas de filas, <20 KB); sin bucles.
  const { fotos } = useFotosViaje()
  const numeroDelDia = de && route ? (route.days.find((d) => fechaDelDia(route, d) === de.iso)?.dayNumber ?? null) : null
  const fotosDeEseDia = useMemo(() => {
    if (datosDePrueba.fotos) return datosDePrueba.fotos
    if (!route) return []
    const n = numeroDelDia ?? (route.days.find((d) => fechaDelDia(route, d) === estado?.viaje?.hoy)?.dayNumber ?? null)
    return n == null ? [] : fotos.filter((f) => f.dayNumber === n).map((f) => urlParaMostrar(f)).filter(Boolean)
  }, [fotos, route, numeroDelDia, estado?.viaje?.hoy])

  // Solo lo que ha salido ese día: lo que cuenta el servidor y, si aún no ha contestado, lo que se acaba de enseñar. Nunca se mezclan.
  const cuentas: Record<string, number> = resumen ? { ...resumen.por_categoria } : contarMomentos(ganado)
  if (resumen && (cuentas.sello ?? 0) > 0) {
    // El servidor cuenta «sello»; aquí se separa el que nace ese día del que solo sube de grado (8B4).
    const sellos = resumen.ganado.filter((g) => g.logro === 'sello').map((g) => ({ sello: g.escalon.split(':')[0], grado: g.escalon.split(':')[1] }))
    const { nuevos, subidos } = contarSellos(sellos)
    cuentas.sello_nuevo = nuevos
    cuentas.sello = subidos
  }
  const sellosDelDia = detalleSellos(resumen ? resumen.ganado.filter((g) => g.logro === 'sello').map((g) => ({ sello: g.escalon.split(':')[0], grado: g.escalon.split(':')[1] })) : ganado.filter((m) => m.tipo === 'sello').map((m) => ({ sello: String(m.sello ?? ''), grado: String(m.grado ?? '') })))
  const medallas = sellosDelDia.map((x) => ({ ...x, texto: textoDeSello(x.nace, x.sello, x.grado, estado?.sellos.find((e) => e.id === x.sello)?.nombre) }))
  // Una fila por cada cosa ganada que no es 0 (los sellos no son fila: van arriba, en la tarjeta de la medalla). El viajero se cuenta como «viajero».
  const lineas = ORDEN_FILAS.filter((k) => (cuentas[k] ?? 0) > 0)
  const hayAlgo = lineas.length > 0 || medallas.length > 0
  const esperando = !listo && !hayAlgo
  // Si ese día no ganó nada, no sale el resumen (en el estudio de sonidos sí, para poder verlo y oírlo).
  const sinNada = listo && !hayAlgo && !dentroDelEstudio()
  useEffect(() => {
    if (sinNada) alCerrar()
  }, [sinNada]) // eslint-disable-line react-hooks/exhaustive-deps
  // (V38C) Los números suben (y suena) solo la primera vez y solo si hay números que subir.
  const sube = (primeraVez || dentroDelEstudio()) && !movimientoReducido() && lineas.length > 0
  const progreso = useProgresoDeCifras(sube)
  useEffect(() => {
    if (sube) sonarResumenUnaVez(true)
  }, [sube])
  const ciudad = estado?.ciudad ?? ''
  const lanza = estado?.destino === 'lanzarote'
  const manana = Boolean(de?.manana)
  const pendiente = (resumen?.pendiente ?? estado?.pendiente)?.texto ?? null
  const acabado = estado?.viaje?.hoy && estado.viaje.fin ? estado.viaje.hoy > estado.viaje.fin : false

  // Las miniaturas de cada fila, de lo que se ganó ese día (los datos de `resumen.ganado`: cada uno trae su escalón).
  const ganados = resumen?.ganado ?? []
  const miniaturas = (k: string): Miniatura[] => {
    if (k === 'pedazo') {
      const por = new Map<string, string[]>()
      for (const g of ganados.filter((x) => x.logro === 'pedazo')) por.set(g.escalon.split(':')[0]!, [...(por.get(g.escalon.split(':')[0]!) ?? []), g.escalon.split(':')[1]!])
      return [...por.entries()].map(([id, nuevos]) => {
        const c = estado?.colecciones.find((x) => x.id === id)
        return { clave: `p-${id}`, dibujo: <Insignia coleccion={id} ganados={c ? c.sitios.filter((s) => s.visto).map((s) => s.sitio) : nuevos} nuevos={nuevos} completa={Boolean(c?.completa)} tam={LADO} /> }
      })
    }
    if (k === 'coleccion') return ganados.filter((x) => x.logro === 'coleccion').map((g) => ({ clave: `c-${g.escalon}`, dibujo: <Insignia coleccion={g.escalon} completa tam={LADO} /> }))
    if (k === 'emblema')
      return ganados
        .filter((x) => x.logro === 'emblema')
        .map((g) => ({
          clave: `e-${g.escalon}`,
          // Pensado para fondo oscuro: cada emblema va en su círculo azul oscuro del mismo tamaño que los demás.
          dibujo: (
            <span style={{ display: 'flex', width: LADO, height: LADO, borderRadius: '50%', background: 'radial-gradient(circle at 40% 30%,#2A3050,#1C2230)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Emblema id={lanza && ORDEN_EMBLEMAS_LANZAROTE.includes(g.escalon) ? idDeDibujoLanzarote(g.escalon) : g.escalon} tam={LADO - 6} animado={false} />
            </span>
          ),
        }))
    if (k === 'pais') return ganados.filter((x) => x.logro === 'pais').map((g, i) => ({ clave: `pa-${g.escalon}`, dibujo: <Chapa logro="paises" escalon={i + 1} tam={LADO} igual />, pie: `${bandera(g.escalon)} ${g.escalon}`.trim() }))
    if (k === 'destino_nuevo') return ganados.filter((x) => x.logro === 'destino_nuevo').map((g, i) => ({ clave: `d-${g.escalon}`, dibujo: <Chapa logro="destinos" escalon={i + 1} tam={LADO} igual />, pie: g.escalon === estado?.destino ? ciudad : humanizar(g.escalon) }))
    if (k === 'continente') return ganados.filter((x) => x.logro === 'continente').map((g) => ({ clave: `co-${g.escalon}`, dibujo: <span style={{ height: 30, padding: '0 11px', borderRadius: 999, background: '#DDE6F2', display: 'flex', alignItems: 'center', font: "700 12px 'Geist'", whiteSpace: 'nowrap' }}>{humanizar(g.escalon)}</span> }))
    if (k === 'maravilla') return ganados.filter((x) => x.logro === 'maravilla').map((g, i) => ({ clave: `m-${g.escalon}`, dibujo: <Chapa logro="maravillas" escalon={i + 1} tam={LADO} igual />, pie: g.nombre ?? humanizar(g.escalon) }))
    if (k === 'patrimonio') return ganados.filter((x) => x.logro === 'patrimonio').map((g) => ({ clave: `pt-${g.escalon}`, dibujo: <Chapa logro="patrimonios" escalon={1} tam={LADO} igual />, pie: g.nombre ?? humanizar(g.escalon) }))
    if (k === 'viajero')
      return ganados
        .filter((x) => x.logro.startsWith('viajero:'))
        .map((g) => {
          const id = g.logro.slice('viajero:'.length)
          const def = viajero?.logros?.find((l) => l.id === id)
          const esc = def?.escalones?.find((e) => String(e.n) === String(g.escalon))
          const nombre = (esc?.nombre ?? def?.nombre ?? '').replace(/\{ciudad\}/g, ciudad).replace(/\{anio\}/g, String(g.escalon)).replace(/\{[a-z_]+\}/gi, '').trim()
          return { clave: `v-${g.clave}`, dibujo: <Chapa logro={id} escalon={g.escalon || null} destino={g.destino} ciudad={id === 'edicion_anio' ? ciudad : undefined} tam={LADO} igual />, pie: nombre || undefined }
        })
    return []
  }
  const hayFotos = fotosDeEseDia.length > 0
  const secretos = estado ? lineaDeSecretos(ciudad, estado.secretos.total, estado.secretos.encontrados) : null
  // (V63 §5) Nunca el resumen de un viaje eliminado ni de un día sin paradas: sin viaje, o con un día que no existe o no tiene paradas, no se enseña nada (y se cierra solo, sin dejar una pantalla vacía).
  const diaDelResumen = route && de ? route.days.find((d) => fechaDelDia(route, d) === de.iso) : null
  const sinViajeOSinParadas = !dentroDelEstudio() && (!route || (de != null && (!diaDelResumen || diaDelResumen.stops.filter((s) => !s.isArrival && !s.isBreak).length === 0)))
  useEffect(() => {
    if (sinViajeOSinParadas) alCerrar()
  }, [sinViajeOSinParadas]) // eslint-disable-line react-hooks/exhaustive-deps
  if (esperando || sinNada || sinViajeOSinParadas) return null
  const SERIF = "'Instrument Serif',serif"
  return (
    <div className="mo" role="dialog" aria-modal="true" aria-label="Resumen del día" data-resumen-del-dia={manana ? 'manana' : 'noche'} style={{ position: 'fixed', inset: 0, zIndex: 9000, color: '#1C2230', fontFamily: "'Geist',system-ui,sans-serif" }}>
      <div onClick={alCerrar} style={{ position: 'absolute', inset: 0, background: FONDO_DE_HOJA }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 'calc(env(safe-area-inset-top,0px) + 64px)', margin: '0 auto', maxWidth: 520, borderRadius: '32px 32px 0 0', background: '#FBF3E2', padding: '10px 18px calc(env(safe-area-inset-bottom,0px) + 20px)', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', scrollbarWidth: 'none', boxShadow: '0 -20px 40px rgba(0,0,0,.25)' }}>
        <TiradorDeHoja />
        <div style={{ flex: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span data-resumen-ojo style={{ font: "600 10.5px 'Geist Mono',monospace", letterSpacing: '.14em', color: '#6F4E37', textTransform: 'uppercase' }}>{manana ? `Tu día de ayer en ${ciudad || 'el viaje'}` : ciudad ? `Tu día en ${ciudad}` : 'Tu día'}</span>
            <span data-resumen-titulo style={{ font: `400 30px/1.05 ${SERIF}`, textWrap: 'balance' as never }}>{manana ? 'Resumen de ayer' : 'Resumen del día'}</span>
          </span>
          <CruzDeHoja onCerrar={alCerrar} enLinea />
        </div>
        {medallas.map((m, n) => (
          <div key={`${m.sello}-${n}`} data-resumen-medalla style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 22, background: 'linear-gradient(135deg,#232A3C,#1C2230)', boxShadow: '0 14px 22px -16px rgba(28,34,48,.8)', animation: 'moIn .7s .1s both' }}>
            <span style={{ flex: 'none', display: 'block', width: 64, height: 64, margin: '-6px -4px -6px -6px' }}>
              <Sello id={m.sello} grado={m.grado as GradoDeSello} tam={64} etiqueta={false} animado={false} />
            </span>
            <span style={{ font: `400 21px/1.15 ${SERIF}`, color: '#FFFDF8' }}>{m.texto}</span>
          </div>
        ))}
        {hayFotos && <TiraDeFotos urls={fotosDeEseDia} />}
        {lineas.length > 0 && (
          <div data-resumen-filas style={{ flex: 'none', display: 'flex', flexDirection: 'column', borderRadius: 22, background: '#FFFDF8', border: '1px solid rgba(28,34,48,.08)', overflow: 'hidden' }}>
            {lineas.map((k, i) => {
              const n = Math.max(1, cifraQueSube(cuentas[k] ?? 0, progreso))
              const items = miniaturas(k)
              return (
                <div key={k} data-fila-resumen={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px 8px 14px', borderTop: i ? '1px solid rgba(28,34,48,.07)' : 'none', animation: `moUp .5s ${(0.2 + i * 0.08).toFixed(2)}s ease both` }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: `400 22px/1 ${SERIF}`, color: '#8A6A2C' }}>{n}</span>
                    <span style={{ font: "600 13.5px/1.2 'Geist'" }}>{fila(k, n)}</span>
                  </span>
                  {items.length > 0 && <FilaDeMiniaturas items={items} />}
                </div>
              )
            })}
          </div>
        )}
        <div style={{ flex: 1 }} />
        {pendiente && <span style={{ flex: 'none', textAlign: 'center', font: "600 13.5px 'Geist'", color: 'oklch(0.55 0.17 5)' }}>{pendiente}</span>}
        <button
          type="button"
          data-resumen-ver-logros
          onClick={() => {
            alCerrar()
            useMomentosUI.getState().abrirHojaLogros()
          }}
          className="zona-toque"
          style={{ flex: 'none', border: 'none', background: 'transparent', textAlign: 'center', font: "600 13px 'Geist'", color: '#8E6820', textDecoration: 'underline', cursor: 'pointer', minHeight: 44 }}
        >
          Ver todos mis logros
        </button>
        {secretos && <span data-secretos="" style={{ flex: 'none', textAlign: 'center', font: `italic 400 18px/1.3 ${SERIF}`, color: '#6F4E37', paddingBottom: 6 }}>{secretos}</span>}
        {acabado && (
          <button
            type="button"
            onClick={() => {
              alCerrar()
              useMomentosUI.getState().abrirResumenViaje()
            }}
            className="zona-toque"
            style={{ flex: 'none', border: 'none', background: 'transparent', textAlign: 'center', font: "600 13px 'Geist'", color: '#8E6820', textDecoration: 'underline', cursor: 'pointer', minHeight: 44 }}
          >
            Ver el resumen del viaje
          </button>
        )}
      </div>
    </div>
  )
}
