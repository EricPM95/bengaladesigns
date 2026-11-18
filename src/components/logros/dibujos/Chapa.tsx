/**
 * Las chapas de los logros de viajero (data/logros/viajero.json › logros), con los dibujos del DASHBOARD de Design (pestaña «De viajero», Tanda 8C1):
 *  · las familias con escalones (países, destinos, capitales, patrimonios, viajes, con quién viajas, cazador, coleccionista, conocedor) → «Medalla Destino»: la misma
 *    medalla que sube de grado (bronce, plata, oro… hasta el multicolor) con el icono de su familia;
 *  · los de un solo paso → «Medalla Destino» en su último grado, con su icono; «Tres ciudades de oro/diamante» → «Medalla Grado»;
 *  · las cuatro estaciones → «Cuatro Estaciones»; los 12 meses → «Doce Meses» (cada mes, un pedazo); las 7 maravillas → la medalla de las 7;
 *  · los exclusivos → «Exclusivo Holo»; «Dos países en un día» → su medalla de un paso.
 * Los logros de la versión 2 (continentes, pequeños gigantes, vuelta al mundo…) conservan sus piezas por si se encienden más adelante.
 * Cada pieza se carga solo cuando se usa.
 */
import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { IC_ESCALONES, IC_UNICOS } from './iconosDashboard'
import './dibujos.css'

const MedallaDestino = lazy(() => import('./piezas/MedallaDestino'))
const MedallaGrado = lazy(() => import('./piezas/MedallaGrado'))
const DoceMeses = lazy(() => import('./piezas/DoceMeses'))
const CuatroEstaciones = lazy(() => import('./piezas/CuatroEstaciones'))
const Continentes = lazy(() => import('./piezas/Continentes'))
const Microestados = lazy(() => import('./piezas/Microestados'))
const ExclusivoHolo = lazy(() => import('./piezas/ExclusivoHolo'))
const MedallaSiete = lazy(() => import('./MedallaSiete').then((m) => ({ default: m.MedallaSiete })))

/** Familias con escalones: icono ('globo' y 'pin' los dibuja la propia medalla; el resto, un trazo), los números de sus escalones (los de `escalones[].n` de viajero.json) y, si no es 1, 2, 3…, el grado de cada uno. */
const ESCALONADOS: Record<string, { icono: string; pasos: number[]; grados?: number[] }> = {
  paises: { icono: 'globo', pasos: [1, 3, 5, 8, 10, 15, 20, 25, 30] },
  destinos: { icono: 'pin', pasos: [1, 3, 5, 10, 15, 20, 25, 30] },
  capitales: { icono: 'capital', pasos: [5, 10, 15, 25] },
  patrimonios: { icono: 'templo', pasos: [1, 5, 10, 15, 25] },
  viajes: { icono: 'maleta', pasos: [1, 5, 10, 15, 20, 25, 30] },
  con_quien_solo: { icono: 'brujula', pasos: [1, 3, 5, 10] },
  con_quien_pareja: { icono: 'pareja', pasos: [1, 3, 5, 10] },
  con_quien_amigos: { icono: 'amigos', pasos: [1, 3, 5, 10] },
  con_quien_familia: { icono: 'familia', pasos: [1, 3, 5, 10] },
  cazador_emblemas: { icono: 'lupa', pasos: [5, 10, 15] },
  coleccionista: { icono: 'grid', pasos: [5, 10, 15] },
  conocedor: { icono: 'ciudad', pasos: [25, 50], grados: [5, 10] },
}

/** Los de un solo paso: el nombre que les da el Dashboard (para su icono). Se dibujan con «Medalla Destino» en su último grado. */
const DE_UN_PASO: Record<string, string> = {
  viajero_nacional: 'Viajero nacional',
  destino_cuatro_estaciones: 'Un destino, cuatro estaciones',
  navidad_fuera: 'Navidad fuera de casa',
  nochevieja_fuera: 'Nochevieja fuera de casa',
  tres_viajes_ano: 'Tres viajes en un año',
  de_sol_a_sol: 'De sol a sol',
  alondra: 'Alondra',
  buho: 'Búho',
  dia_perfecto: 'Día perfecto',
  viaje_perfecto: 'Viaje perfecto',
  imparable: 'Imparable',
  escapada: 'Escapada',
  gran_viaje: 'Gran viaje',
  el_fotografo: 'El fotógrafo',
  diamante_primera: 'Diamante a la primera',
  ciudad_completa: 'Roma al completo',
  nunca_ultima_vez: 'Nunca es la última vez',
  otro_lado_ecuador: 'Al otro lado del ecuador',
  todos_secretos: 'Todos los secretos de Roma',
}
const ICONO_DOS_PAISES = 'M8 21s-4.5-3.8-4.5-8a4.5 4.5 0 0 1 9 0c0 4.2-4.5 8-4.5 8zM16 21s-4.5-3.8-4.5-8a4.5 4.5 0 0 1 9 0c0 4.2-4.5 8-4.5 8zM8 12.6h.01M16 12.6h.01'
const ICONO_TRES_CIUDADES = 'M3 20.5h18M4.5 20.5v-6l2.3-1.6 2.3 1.6v6M9.5 20.5V9.5l2.5-1.8 2.5 1.8v11M14.9 20.5v-6l2.3-1.6 2.3 1.6v6M12 4l.8 1.7 1.7.8-1.7.8L12 9l-.8-1.7-1.7-.8 1.7-.8z'
const EXCLUSIVOS: Record<string, string> = { fundador: 'fundador', pionero: 'pionero', edicion_anio: 'roma', probador: 'probador' }
const TODOS_LOS_MESES = '1,2,3,4,5,6,7,8,9,10,11,12'

/** Ids de todos los logros que sabe dibujar (para la página de prueba). */
export const LOGROS_CON_CHAPA: string[] = [
  ...Object.keys(ESCALONADOS), 'maravillas', ...Object.keys(DE_UN_PASO), ...Object.keys(EXCLUSIVOS), 'tres_oro', 'tres_diamante', 'doce_meses', 'cuatro_estaciones',
  'dos_paises_en_un_dia', 'continentes', 'pequenos_gigantes',
]
/** Escalones de cada familia con escalones (para la página de prueba). */
export const ESCALONES_DE: Record<string, (string | number)[]> = { ...Object.fromEntries(Object.entries(ESCALONADOS).map(([k, v]) => [k, v.pasos])), maravillas: [1, 2, 3, 4, 5, 6, 7] }

/** (V9) «lanzarote» → «Lanzarote»; «roma» → «Roma» (el nombre de la ciudad para la moneda `{ciudad} {anio}`); sin destino, Roma como siempre. */
export function nombreDeCiudadDeDestino(destino?: string | null): string {
  if (!destino || destino === '*') return 'Roma'
  return destino.split(/[_s]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
}

/** (V12) Cuánto de su caja llena el DIBUJO de cada logro de viajero cuando se pintan todos «del mismo tamaño» (el bronce llenaba el 74 %, los exclusivos más del 100 %). */
export const LLENADO_IGUAL = 0.9

/**
 * (V12) Los logros de viajero, todos del MISMO tamaño: una caja cuadrada de `tam` y, dentro, el dibujo, medido (la unión de sus trazos visibles, sin los brillos ni los textos) y escalado y centrado para que llene
 * `LLENADO_IGUAL` de la caja, sea una medalla de bronce, un exclusivo con su marco o «Día perfecto». Cada uno conserva su dibujo y su marco. Si la medida no vale (un dibujo hecho con otras cosas), se deja como está.
 * Las piezas se cargan a demanda, así que se vuelve a medir cuando llegan (el escalado es relativo a la caja: no le afecta ninguna animación de quien la contiene).
 */
function CajaIgual({ tam, fijo, children }: { tam: number; fijo?: number; children: ReactNode }): ReactNode {
  const caja = useRef<HTMLSpanElement>(null)
  const dentro = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const c = caja.current
    const d = dentro.current
    if (!c || !d) return undefined
    const medir = () => {
      // Los exclusivos se dibujan con capas de CSS y giran en 3D: no se pueden medir por sus trazos; su marco llena toda la caja (`fijo`).
      if (fijo) {
        d.style.transform = `scale(${(LLENADO_IGUAL / fijo).toFixed(3)})`
        c.dataset.llenadoFijo = String(fijo)
        return
      }
      d.style.transform = 'none'
      const b = c.getBoundingClientRect()
      if (b.width < 1) return
      let l = 1e9
      let t = 1e9
      let r = -1e9
      let bo = -1e9
      d.querySelectorAll('path,circle,rect,ellipse,polygon,line,polyline,image').forEach((e) => {
        const cs = getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return
        const fill = e.getAttribute('fill') ?? cs.fill
        const stroke = e.getAttribute('stroke') ?? cs.stroke
        if ((fill === 'none' || fill === 'rgba(0, 0, 0, 0)') && (!stroke || stroke === 'none')) return
        const q = e.getBoundingClientRect()
        if (q.width < 0.5 || q.height < 0.5) return
        l = Math.min(l, q.left)
        t = Math.min(t, q.top)
        r = Math.max(r, q.right)
        bo = Math.max(bo, q.bottom)
      })
      if (r <= l || bo <= t) return
      const ratio = Math.max(r - l, bo - t) / b.width
      if (ratio < 0.45) return
      const s = Math.min(1.45, Math.max(0.6, LLENADO_IGUAL / ratio))
      const k = b.width / tam // por si quien la contiene la está agrandando (animación de entrada)
      const dx = ((l + r) / 2 - (b.left + b.width / 2)) / k
      const dy = ((t + bo) / 2 - (b.top + b.height / 2)) / k
      d.style.transform = `translate(${(-dx * s).toFixed(2)}px,${(-dy * s).toFixed(2)}px) scale(${s.toFixed(3)})`
      c.dataset.llenado = ratio.toFixed(2)
    }
    medir()
    const mo = new MutationObserver(medir)
    mo.observe(d, { childList: true, subtree: true })
    const tarde = window.setTimeout(medir, 600)
    return () => {
      mo.disconnect()
      window.clearTimeout(tarde)
    }
  }, [tam, fijo])
  return (
    <span ref={caja} data-chapa-igual style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: tam, height: tam }}>
      <span ref={dentro} style={{ display: 'block', flex: 'none', transformOrigin: 'center' }}>
        {children}
      </span>
    </span>
  )
}

export function ChapaDibujo({
  logro, escalon, tam = 88, bloqueado = false, animada = false, progreso, ciudad: ciudadDada, destino, igual = false,
}: { ciudad?: string; destino?: string; logro: string; escalon?: string | number | null; tam?: number; bloqueado?: boolean; animada?: boolean; progreso?: number | string; igual?: boolean }) {
  const n = escalon == null ? null : Number(escalon)
  let dibujo: ReactNode = null
  let alto = tam

  const esc = ESCALONADOS[logro]
  if (esc) {
    // El escalón de ese número, o el más alto que ya se haya pasado (el país 2 se dibuja como el escalón del país 1).
    const ix = Math.max(0, n == null ? 0 : esc.pasos.filter((p) => p <= n).length - 1)
    const grado = esc.grados?.[ix] ?? ix + 1
    dibujo = esc.icono === 'globo' || esc.icono === 'pin'
      ? <MedallaDestino stage={grado} icon={esc.icono} size={tam} />
      : <MedallaDestino stage={grado} icon="path" icd={IC_ESCALONES[esc.icono]} size={tam} />
  } else if (logro === 'maravillas') {
    const ORD = ['coliseo', 'gran_muralla', 'petra', 'cristo_redentor', 'machu_picchu', 'chichen_itza', 'taj_mahal']
    alto = (tam * 400) / 340
    dibujo = <MedallaSiete encendidas={ORD.slice(0, n ?? 1)} tam={tam} />
  } else if (DE_UN_PASO[logro]) {
    dibujo = <MedallaDestino stage={10} icon="path" icd={IC_UNICOS[DE_UN_PASO[logro]]} size={tam} metal={logro === 'todos_secretos' ? 'rosa' : ''} />
  } else if (logro === 'dos_paises_en_un_dia') {
    dibujo = <MedallaDestino stage={10} icon="path" icd={ICONO_DOS_PAISES} size={tam} />
  } else if (logro === 'tres_oro' || logro === 'tres_diamante') {
    dibujo = <MedallaGrado grade={logro === 'tres_oro' ? 'oro' : 'diamante'} shape="hex" icon={ICONO_TRES_CIUDADES} fx={logro === 'tres_oro' ? '2' : '6'} lau="1" size={tam} />
  } else if (logro === 'doce_meses') {
    dibujo = <DoceMeses got={progreso != null ? String(progreso) : TODOS_LOS_MESES} size={tam} />
  } else if (logro === 'cuatro_estaciones') {
    dibujo = <CuatroEstaciones got={progreso != null ? Number(progreso) : 4} size={tam} />
  } else if (EXCLUSIVOS[logro]) {
    dibujo = <ExclusivoHolo kind={EXCLUSIVOS[logro]} size={tam} anio={escalon ?? undefined} ciudad={ciudadDada ?? nombreDeCiudadDeDestino(destino)} />
  } else if (logro === 'continentes') {
    alto = (tam * 154) / 140
    dibujo = <Continentes got={progreso != null ? String(progreso) : 'eu,na,sa'} size={tam} anim={animada} />
  } else if (logro === 'pequenos_gigantes') {
    alto = (tam * 154) / 140
    dibujo = <Microestados got={progreso != null ? Number(progreso) : 2} size={tam} anim={animada} />
  }

  if (igual) {
    return (
      <span className={animada ? 'dib-mov' : 'dib-quieto'} style={{ display: 'inline-block', width: tam, height: tam, flex: 'none', filter: bloqueado ? 'grayscale(1)' : undefined, opacity: bloqueado ? 0.5 : undefined }}>
        <CajaIgual tam={tam} fijo={EXCLUSIVOS[logro] ? 1 : undefined}>
          <span style={{ display: 'inline-block', width: tam, height: alto }}>
            <Suspense fallback={null}>{dibujo}</Suspense>
          </span>
        </CajaIgual>
      </span>
    )
  }
  return (
    <span
      className={animada ? 'dib-mov' : 'dib-quieto'}
      style={{ display: 'inline-block', width: tam, height: alto, flex: 'none', filter: bloqueado ? 'grayscale(1)' : undefined, opacity: bloqueado ? 0.5 : undefined }}
    >
      <Suspense fallback={null}>{dibujo}</Suspense>
    </span>
  )
}
