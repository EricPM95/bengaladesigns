import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import textos from '../../../data/pase/textos.json'
import { configDelPase, crearPagoDelPase, irAPagar, type ConfigPase } from '../../lib/pagoPase'
import { marcarPeliculaVista } from '../../lib/peliculaVista'
import { usePaseEstado } from '../../lib/paseEstado'
import { nombreDeMoneda } from '../../lib/dinero'
import { guardarMoneda, monedaGuardada, monedaUsable } from '../../lib/precioMoneda'
import { hojaCuantosSois } from '../../lib/precioPelicula'
import { monedaDelViajero, useCambio } from '../../lib/useMoneda'
import { useRouteStore } from '../../store/useRouteStore'
import { DCPieza, cssDe } from './pelicula/dc'
import { bloquesDeLaLista, plantillaDeLaPelicula } from './pelicula/adaptar'
import './pelicula/pelicula.css'

/**
 * LA PELÍCULA DEL PASE (Tanda 10I): la película que Design ha hecho (6 escenas y el final, con sus animaciones, tiempos y textos tal cual), montada en la app a pantalla completa.
 *   · `desde="principio"`: la película entera (la primera vez); `"final"`: directa al final, la lista del pase con [Elegir mi pase] (las siguientes veces); `"compra"`: el final con «¿Cuántos sois?» ya abierta.
 *   · [Saltar] lleva al final. El ✕ del final cierra y vuelve a donde se estaba.
 *   · Los precios de «¿Cuántos sois?» son los de la app (data/pase/precios.json, que da el servidor); [Comprar] crea el pago como siempre. Con el pase comprado: «✓ Tu Pase de {Destino} está activo» y la hoja de compra no se abre.
 * Una sola película para todos los destinos: solo cambian «Pase de {Destino}» y «Tu viaje a {Destino}» (salen del dato del destino).
 */
const PIEZA = 'Piezas/Pase Pelicula'
const ANCHO = 390
const ALTO = 844
/** El alto mínimo (en unidades de Design) que se deja a las escenas: de 844 se pueden recortar hasta 44 por abajo, donde no hay nada. */
const ALTO_MINIMO = 800
const ANCHO_MAXIMO = 480
const IMAGENES = ['marco-nivel1', 'marco-nivel2', 'marco-nivel3', 'hueco-1', 'hueco-2', 'hueco-3']

export function PeliculaPase({ destino, tripId, desde, onCerrar, configInicial = null }: { destino: string; tripId: string | null; desde: 'principio' | 'final' | 'compra'; onCerrar: () => void; configInicial?: ConfigPase | null }) {
  const [config, setConfig] = useState<ConfigPase | null>(configInicial)
  const [error, setError] = useState<string | null>(null)
  const [dim, setDim] = useState(() => dimensionesPara(window.innerWidth, window.innerHeight))
  // Ya vista: el final sale montado (sin las animaciones de entrada). Al tocar [Ver] o «Verla otra vez» vuelve a ser la película de siempre.
  const [montada, setMontada] = useState(desde !== 'principio')
  const route = useRouteStore((st) => st.route)
  const cambio = useCambio()
  const [codigoMoneda, setCodigoMoneda] = useState<string>(() => monedaGuardada() ?? monedaDelViajero(route))
  const moneda = monedaUsable(codigoMoneda, cambio?.tasas)
  const [letrasListas, setLetrasListas] = useState(false)
  const pase = usePaseEstado(tripId)
  const marcada = useRef(false)
  const ocupado = useRef(false)

  useEffect(() => {
    if (configInicial) return undefined
    let vivo = true
    void configDelPase().then((c) => {
      if (vivo) setConfig(c)
    })
    return () => {
      vivo = false
    }
  }, [configInicial])

  useEffect(() => {
    const alCambiar = () => setDim(dimensionesPara(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', alCambiar)
    return () => window.removeEventListener('resize', alCambiar)
  }, [])

  // Las letras están dentro de la app (src/assets/fonts): antes de empezar se esperan, con un tope, para que no salte la letra a media escena.
  useEffect(() => {
    let vivo = true
    const tope = window.setTimeout(() => vivo && setLetrasListas(true), 1500)
    const pide = ['400 20px "Instrument Serif"', 'italic 400 20px "Instrument Serif"', '500 14px "Geist"', '600 11px "Geist Mono"']
    void Promise.all(pide.map((f) => document.fonts?.load(f).catch(() => undefined))).then(() => vivo && setLetrasListas(true))
    return () => {
      vivo = false
      window.clearTimeout(tope)
    }
  }, [])

  // Las imágenes que salen a mitad de película se bajan ya, mientras se ven las primeras escenas (con mala conexión, que no lleguen tarde).
  useEffect(() => {
    for (const i of IMAGENES) new Image().src = `/pelicula/assets/${i}.png`
  }, [])

  const plantilla = useMemo(() => plantillaDeLaPelicula(destino), [destino])
  const css = useMemo(() => cssDe(PIEZA), [])
  const bloques = useMemo(() => bloquesDeLaLista(), [])
  const planes = config?.precios?.planes ?? []

  const comprar = async (plan: 'uno' | 'duo' | 'grupo', personas: number) => {
    if (ocupado.current || planes.length === 0) return
    ocupado.current = true
    setError(null)
    const r = await crearPagoDelPase({ destino, plan, personas, tripId })
    if (r.url) {
      irAPagar(r.url)
      return // (la app sale a la página de pago; al volver, PagoHost recoge el resultado)
    }
    ocupado.current = false
    setError(r.error)
  }

  const sobre = (logic: any) => {
    const n: number = logic.state.n
    const hoja = hojaCuantosSois(planes, n, moneda)
    const fin = logic.state.i === 7
    const monedas = ['EUR', ...Object.keys(cambio?.tasas ?? {}).sort()]
    if (codigoMoneda && !monedas.includes(codigoMoneda)) monedas.unshift(codigoMoneda)
    const activa = moneda?.codigo ?? 'EUR'
    // La elegida arriba del todo (con su borde de oro), luego el euro y el resto por orden.
    monedas.sort((x, y) => (x === activa ? -1 : y === activa ? 1 : x === 'EUR' ? -1 : y === 'EUR' ? 1 : x.localeCompare(y)))
    const mostradaEuros = moneda ? 'block' : 'none'
    // (se marca como vista al llegar al final, por donde sea: entera, con [Saltar] o directa)
    if (logic.state.i === 7 && !marcada.current) {
      marcada.current = true
      void marcarPeliculaVista()
    }
    return {
      rows: hoja.filas.map((f, k) => ({
        t: f.t,
        sub: f.sub,
        p: f.p,
        old: f.old,
        od: f.old ? 'block' : 'none',
        save: f.save,
        sd: f.save ? 'block' : 'none',
        olde: f.olde,
        pe: f.pe,
        peD: moneda ? 'block' : 'none',
        bd: k === hoja.elegida ? '2px solid #B58A2E' : '1px solid rgba(28,34,48,.12)',
        bg: k === hoja.elegida ? '#FBF3E2' : '#FFFDF8',
        pick: () => logic.setState({ n: k === 0 ? 1 : k === 1 ? 2 : Math.max(hoja.desde, n) }),
      })),
      curs: monedas.map((k) => ({
        k,
        n: nombreDeMoneda(k),
        on: k === activa,
        bg: k === activa ? '#FBF3E2' : '#FFFDF8',
        bd: k === activa ? '2px solid #B58A2E' : '1px solid rgba(28,34,48,.12)',
        ck: k === activa ? 'flex' : 'none',
        pick: () => {
          setCodigoMoneda(k)
          guardarMoneda(k)
          logic.setState({ curOpen: false })
        },
      })),
      curCode: activa,
      endP: hoja.finalGrande,
      endE: hoja.finalEuros,
      endED: mostradaEuros,
      buyEu: hoja.filas[hoja.elegida]?.pe ?? '',
      buyED: moneda ? 'inline' : 'none',
      W: dim.W,
      H: dim.H,
      dx: (dim.W - ANCHO) / 2,
      barR: fin ? 62 : 18,
      tap: !fin && !logic.state.sheet,
      nTxt: hoja.personasTxt,
      buyTxt: hoja.comprarTxt,
      plus: () => logic.setState({ n: Math.min(hoja.hasta, n + 1) }),
      minus: () => logic.setState({ n: Math.max(1, n - 1) }),
      blocks: bloques,
      lineaLegal: textos.linea_legal_compra || '',
      comprar: () => void comprar(hoja.plan, hoja.personas),
      cerrarApp: onCerrar,
      // «Verla otra vez» (con el pase): la película entera desde el principio.
      again: () => {
        setMontada(false)
        logic.setState({ i: -1, p: 0, eff: false, b4: false, gone: false, hold: false, sheet: '' }, () => window.setTimeout(() => logic.setState({ i: 0, p: 0 }), 60))
      },
      replay: () => {
        setMontada(false)
        logic.setState({ i: -1, p: 0, hold: false, sheet: '' }, () => window.setTimeout(() => logic.setState({ i: 0, p: 0 }), 40))
      },
    }
  }

  return createPortal(
    <div data-pelicula={desde} data-montada={montada ? '1' : '0'} data-moneda={moneda?.codigo ?? 'EUR'} data-pelicula-destino={destino} role="dialog" aria-modal="true" aria-label={`Pase de ${destino}`}>
      <style>{css}</style>
      {letrasListas && (
        <div data-escenario style={{ position: 'absolute', top: 0, left: dim.left, width: dim.W, height: dim.H, transform: `scale(${dim.escala})`, transformOrigin: '0 0' }}>
          <DCPieza __nombre={PIEZA} __plantilla={plantilla} __sobre={sobre} scene={desde === 'principio' ? 0 : 7} sheet={desde === 'compra' ? 'buy' : ''} auto="si" pase={pase.conPase ? 'con' : 'sin'} />
        </div>
      )}
      {error && (
        <p role="alert" data-error-compra style={{ position: 'absolute', left: 16, right: 16, bottom: 'max(16px, env(safe-area-inset-bottom))', zIndex: 30, margin: 0, padding: '10px 14px', borderRadius: 14, background: '#FBF3E2', color: '#B3261E', font: "500 13px/1.4 'Geist'", textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>,
    document.body,
  )
}

/**
 * LAS DIMENSIONES DEL ESCENARIO (Tanda 10P, 1.2): la película ocupa TODO el ancho del móvil. La escala es la del ancho (ancho / 390), salvo que así quede menos de ALTO_MINIMO de alto en unidades de Design
 * (un iPhone con la barra de Safari): entonces se escala un poco menos y el escenario se ensancha, con el mismo fondo, para no recortar nada. `W` y `H` son el ancho y el alto del escenario en unidades de Design.
 */
export function dimensionesPara(ancho: number, alto: number): { escala: number; W: number; H: number; left: number } {
  const escala = Math.min(2.5, Math.max(0.3, Math.min(ancho / ANCHO, alto / ALTO_MINIMO)))
  const W = Math.min(ANCHO_MAXIMO, ancho / escala)
  const left = (ancho - W * escala) / 2
  return { escala, W, H: alto / escala, left }
}

/** Cuánto se ve el móvil de Design (390 x 844) para que quepa entero en esta pantalla (la usan las pruebas antiguas). */
export function escalaPara(ancho: number, alto: number): number {
  return Math.min(2, Math.max(0.3, Math.min(ancho / ANCHO, alto / ALTO)))
}
