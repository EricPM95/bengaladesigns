/**
 * Las chapas de los 43 logros de viajero (data/logros/viajero.json › logros), agrupadas por familias de forma como en «Logros · Modelos» (sección 4):
 *  · con escalones que crecen (países, destinos, capitales, viajes, con quién, cazador, coleccionista, conocedor) → «Logro Viajero»: la misma chapa en 7 materiales
 *    (papel, cuero, barro, mayólica, mosaico, marquetería, mármol) que crece con cada escalón;
 *  · patrimonios → «Chapa Viajero» (el templo que se completa); maravillas → la medalla de las 7;
 *  · los de un solo paso con dibujo propio → «Logro Único» (navidad, nochevieja, sol a sol, ecuador, día/viaje perfecto, imparable, escapada, gran viaje, fotógrafo),
 *    «Dos países», «Continentes», «Pequeños gigantes», «Cuatro estaciones»;
 *  · el resto de un paso → chapa sencilla con su icono, de color de su grupo (mundo, tiempo, cómo viajas, coleccionista);
 *  · los exclusivos (fundador, pionero, edición del año, probador) → «Exclusivo Holo».
 * Cada pieza se carga solo cuando se usa.
 */
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { IC } from './iconos'
import './dibujos.css'

const LogroViajero = lazy(() => import('./piezas/LogroViajero'))
const ChapaViajero = lazy(() => import('./piezas/ChapaViajero'))
const LogroUnico = lazy(() => import('./piezas/LogroUnico'))
const CuatroEstaciones = lazy(() => import('./piezas/CuatroEstaciones'))
const DosPaises = lazy(() => import('./piezas/DosPaises'))
const Continentes = lazy(() => import('./piezas/Continentes'))
const Microestados = lazy(() => import('./piezas/Microestados'))
const ExclusivoHolo = lazy(() => import('./piezas/ExclusivoHolo'))
const MedallaDibujo = lazy(() => import('./Medalla').then((m) => ({ default: m.MedallaDibujo })))

type Grupo = 'mundo' | 'tiempo' | 'como' | 'col'
const GRUPO: Record<Grupo, { hue: number; color: string; tinta: string }> = {
  mundo: { hue: 40, color: 'oklch(0.58 0.14 38)', tinta: '#FFF5E1' },
  tiempo: { hue: 80, color: 'oklch(0.76 0.12 82)', tinta: '#4A2E10' },
  como: { hue: 118, color: 'oklch(0.58 0.1 118)', tinta: '#FFF5E1' },
  col: { hue: 330, color: 'oklch(0.46 0.1 340)', tinta: '#FFF5E1' },
}

/** Familias con escalones: icono, grupo y los números de sus escalones (los mismos que `escalones[].n` de viajero.json). */
const ESCALONADOS: Record<string, { icono: string; grupo: Grupo; pasos: number[]; mundo?: boolean }> = {
  paises: { icono: 'globo', grupo: 'mundo', pasos: [1, 3, 5, 8, 10, 15, 20, 25, 30], mundo: true },
  destinos: { icono: 'pin', grupo: 'mundo', pasos: [1, 3, 5, 10, 15, 20] },
  capitales: { icono: 'capital', grupo: 'mundo', pasos: [5, 10, 15, 25] },
  viajes: { icono: 'maleta', grupo: 'tiempo', pasos: [1, 5, 10] },
  con_quien_solo: { icono: 'solo', grupo: 'como', pasos: [1, 3, 5, 10] },
  con_quien_pareja: { icono: 'pareja', grupo: 'como', pasos: [1, 3, 5, 10] },
  con_quien_amigos: { icono: 'amigos', grupo: 'como', pasos: [1, 3, 5, 10] },
  con_quien_familia: { icono: 'familia', grupo: 'como', pasos: [1, 3, 5, 10] },
  cazador_emblemas: { icono: 'lupa', grupo: 'col', pasos: [5, 10, 15] },
  coleccionista: { icono: 'grid', grupo: 'col', pasos: [5, 10, 15] },
  conocedor: { icono: 'ciudad', grupo: 'col', pasos: [25, 50] },
}
/** Escalón de los países: [material 1..7, crecimiento 0..5] (idéntico al diseño). */
const PT_PAISES: [number, number][] = [[1, 0], [2, 1], [3, 2], [4, 2], [4, 3], [5, 3], [6, 3], [6, 4], [7, 5]]
const MATERIAL = [1, 2, 3, 4, 5, 7]

/** Los de un paso con dibujo propio. */
const UNICOS: Record<string, string> = {
  navidad_fuera: 'navidad', nochevieja_fuera: 'nochevieja', de_sol_a_sol: 'solasol', otro_lado_ecuador: 'ecuador',
  dia_perfecto: 'diaok', viaje_perfecto: 'viajeok', imparable: 'imparable', escapada: 'escapada', gran_viaje: 'granviaje', el_fotografo: 'fotografo',
}
const EXCLUSIVOS: Record<string, string> = { fundador: 'fundador', pionero: 'pionero', edicion_anio: 'roma', probador: 'probador' }
/** Los de un paso con chapa sencilla: icono y grupo. */
const SENCILLOS: Record<string, { icono: string; grupo: Grupo }> = {
  viajero_nacional: { icono: 'pin', grupo: 'mundo' },
  destino_cuatro_estaciones: { icono: 'estacion', grupo: 'tiempo' },
  doce_meses: { icono: 'meses', grupo: 'tiempo' },
  tres_viajes_ano: { icono: 'tres', grupo: 'tiempo' },
  nunca_ultima_vez: { icono: 'fiel', grupo: 'tiempo' },
  alondra: { icono: 'alondra', grupo: 'tiempo' },
  buho: { icono: 'buho', grupo: 'tiempo' },
  ciudad_completa: { icono: 'ciudad', grupo: 'col' },
  todos_secretos: { icono: 'candado', grupo: 'col' },
  diamante_primera: { icono: 'diam1', grupo: 'col' },
  tres_oro: { icono: 'corona', grupo: 'col' },
  tres_diamante: { icono: 'gema', grupo: 'col' },
}

/** Ids de todos los logros que sabe dibujar (para la página de prueba). */
export const LOGROS_CON_CHAPA: string[] = [
  ...Object.keys(ESCALONADOS), 'patrimonios', 'maravillas', ...Object.keys(UNICOS), ...Object.keys(EXCLUSIVOS), ...Object.keys(SENCILLOS),
  'continentes', 'dos_paises_en_un_dia', 'pequenos_gigantes', 'cuatro_estaciones',
]
/** Escalones de cada familia con escalones (para la página de prueba). */
export const ESCALONES_DE: Record<string, (string | number)[]> = { ...Object.fromEntries(Object.entries(ESCALONADOS).map(([k, v]) => [k, v.pasos])), patrimonios: [1, 10, 15], maravillas: [1, 2, 3, 4, 5, 6, 7] }

export function ChapaDibujo({
  logro, escalon, tam = 88, bloqueado = false, animada = false, progreso,
}: { logro: string; escalon?: string | number | null; tam?: number; bloqueado?: boolean; animada?: boolean; progreso?: number | string }) {
  const n = escalon == null ? null : Number(escalon)
  let dibujo: ReactNode = null
  let alto = tam

  const esc = ESCALONADOS[logro]
  if (esc) {
    const ix = Math.max(0, n == null ? 0 : esc.pasos.indexOf(n))
    const L = esc.pasos.length
    const g = GRUPO[esc.grupo]
    let material: number, crece: number
    if (esc.mundo) [material, crece] = PT_PAISES[ix] ?? PT_PAISES[0]
    else {
      crece = L === 1 ? 5 : Math.round((ix * 5) / (L - 1))
      material = MATERIAL[crece]
    }
    dibujo = <LogroViajero tier={material} grow={crece} world={!!esc.mundo} hue={g.hue} size={tam} num={String(esc.pasos[ix])} icon={IC[esc.icono]} />
  } else if (logro === 'patrimonios') {
    const ix = Math.max(0, n == null ? 0 : [1, 10, 15].indexOf(n))
    alto = (tam * 140) / 120
    dibujo = <ChapaViajero kind="patrimonio" lv={[0, 2, 3][ix]} max={4} color={GRUPO.mundo.color} num={String([1, 10, 15][ix])} anim={animada} size={tam} locked={bloqueado} />
  } else if (logro === 'maravillas') {
    const ORD = ['coliseo', 'chichen_itza', 'cristo_redentor', 'gran_muralla', 'machu_picchu', 'petra', 'taj_mahal']
    alto = (tam * 601) / 516
    dibujo = <MedallaDibujo encendidas={ORD.slice(0, n ?? 1)} tam={tam} animada={animada} />
  } else if (UNICOS[logro]) {
    alto = (tam * 154) / 140
    dibujo = <LogroUnico kind={UNICOS[logro]} size={tam} anim={animada} />
  } else if (EXCLUSIVOS[logro]) {
    dibujo = <ExclusivoHolo kind={EXCLUSIVOS[logro]} size={tam} />
  } else if (logro === 'dos_paises_en_un_dia') {
    alto = (tam * 154) / 140
    dibujo = <DosPaises size={tam} anim={animada} />
  } else if (logro === 'continentes') {
    alto = (tam * 154) / 140
    dibujo = <Continentes got={progreso != null ? String(progreso) : 'eu,na,sa'} size={tam} anim={animada} />
  } else if (logro === 'pequenos_gigantes') {
    alto = (tam * 154) / 140
    dibujo = <Microestados got={progreso != null ? Number(progreso) : 2} size={tam} anim={animada} />
  } else if (logro === 'cuatro_estaciones') {
    dibujo = <CuatroEstaciones got={progreso != null ? Number(progreso) : 4} size={tam} />
  } else if (SENCILLOS[logro]) {
    const s = SENCILLOS[logro]
    const g = GRUPO[s.grupo]
    alto = (tam * 140) / 120
    dibujo = <ChapaViajero kind="gen" lv={0} max={1} color={g.color} ink={g.tinta} icon={IC[s.icono]} anim={animada} size={tam} locked={bloqueado} />
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
