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
import { lazy, Suspense } from 'react'
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

export function ChapaDibujo({
  logro, escalon, tam = 88, bloqueado = false, animada = false, progreso, ciudad,
}: { ciudad?: string; logro: string; escalon?: string | number | null; tam?: number; bloqueado?: boolean; animada?: boolean; progreso?: number | string }) {
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
    dibujo = <ExclusivoHolo kind={EXCLUSIVOS[logro]} size={tam} anio={escalon ?? undefined} ciudad={ciudad} />
  } else if (logro === 'continentes') {
    alto = (tam * 154) / 140
    dibujo = <Continentes got={progreso != null ? String(progreso) : 'eu,na,sa'} size={tam} anim={animada} />
  } else if (logro === 'pequenos_gigantes') {
    alto = (tam * 154) / 140
    dibujo = <Microestados got={progreso != null ? Number(progreso) : 2} size={tam} anim={animada} />
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
