import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import textos from '../../../data/pase/textos.json'
import { configDelPase, crearPagoDelPase, irAPagar, type ConfigPase } from '../../lib/pagoPase'
import { usePaseEstado } from '../../lib/paseEstado'
import { nombreDeMoneda } from '../../lib/dinero'
import { guardarMoneda, monedaGuardada, monedaUsable } from '../../lib/precioMoneda'
import { hojaCuantosSois } from '../../lib/precioPelicula'
import { monedaDelViajero, useCambio } from '../../lib/useMoneda'
import { monedaElegida } from '../../lib/moneda'
import { useRouteStore } from '../../store/useRouteStore'
import { DCPieza, cssDe } from './pelicula/dc'
import { bloquesDeLaLista, plantillaDeLaPelicula } from './pelicula/adaptar'
import './pelicula/pelicula.css'

/**
 * LA LISTA DEL PASE (Tanda 10N10, 8b: antes, la película del pase). Pantalla completa con «Todo lo que incluye tu Pase» y [Elegir mi pase]; lo abre SIEMPRE todo lo que antes abría la película (la pastilla de RUTA, el aviso del pase,
 * las cajas pequeñas, los candados…), la primera vez y las siguientes. Es la pantalla final de la pieza de Design (`Pase Pelicula`, escena 7), sin las escenas de antes; Design la va a rediseñar.
 *   · `desde="lista"`: la lista; `"compra"`: la lista con «¿Cuántos sois?» ya abierta.
 *   · Los precios de «¿Cuántos sois?» son los de la app (data/pase/precios.json, que da el servidor); [Comprar] crea el pago como siempre. Con el pase comprado: «✓ Tu Pase de {Destino} está activo» y la hoja de compra no se abre.
 *   · El ✕ cierra y vuelve a donde se estaba.
 */
const PIEZA = 'Piezas/Pase Pelicula'

export function ListaDelPase({ destino, tripId, desde, onCerrar, configInicial = null }: { destino: string; tripId: string | null; desde: 'lista' | 'compra'; onCerrar: () => void; configInicial?: ConfigPase | null }) {
  const [config, setConfig] = useState<ConfigPase | null>(configInicial)
  const [error, setError] = useState<string | null>(null)
  const route = useRouteStore((st) => st.route)
  const cambio = useCambio()
  const [codigoMoneda, setCodigoMoneda] = useState<string>(() => monedaElegida() ?? monedaGuardada() ?? monedaDelViajero(route))
  const moneda = monedaUsable(codigoMoneda, cambio?.tasas)
  const [letrasListas, setLetrasListas] = useState(false)
  const pase = usePaseEstado(tripId)
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
    const monedas = ['EUR', ...Object.keys(cambio?.tasas ?? {}).sort()]
    if (codigoMoneda && !monedas.includes(codigoMoneda)) monedas.unshift(codigoMoneda)
    const activa = moneda?.codigo ?? 'EUR'
    // La elegida arriba del todo (con su borde de oro), luego el euro y el resto por orden.
    monedas.sort((x, y) => (x === activa ? -1 : y === activa ? 1 : x === 'EUR' ? -1 : y === 'EUR' ? 1 : x.localeCompare(y)))
    const mostradaEuros = moneda ? 'block' : 'none'
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
      nTxt: hoja.personasTxt,
      buyTxt: hoja.comprarTxt,
      plus: () => logic.setState({ n: Math.min(hoja.hasta, n + 1) }),
      minus: () => logic.setState({ n: Math.max(1, n - 1) }),
      blocks: bloques,
      lineaLegal: textos.linea_legal_compra || '',
      comprar: () => void comprar(hoja.plan, hoja.personas),
      cerrarApp: onCerrar,
    }
  }

  return createPortal(
    <div data-lista-del-pase={desde} data-moneda={moneda?.codigo ?? 'EUR'} role="dialog" aria-modal="true" aria-label={`Pase de ${destino}`}>
      <style>{css}</style>
      {letrasListas && (
        // Pantalla completa como `Pase Pelicula Movil`: el fondo llena toda la pantalla y Design centra y escala el palco (pantalla="si"); aquí no se estira nada.
        <div data-escenario style={{ position: 'absolute', inset: 0 }}>
          <DCPieza __nombre={PIEZA} __plantilla={plantilla} __sobre={sobre} scene={7} sheet={desde === 'compra' ? 'buy' : ''} auto="no" pase={pase.conPase ? 'con' : 'sin'} pantalla="si" />
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
