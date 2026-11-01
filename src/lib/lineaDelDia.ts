/**
 * (Tanda 10S10, apartado 1) LA LÍNEA DEL DÍA: las paradas y, entre ellas, la comida y la cena, en el orden en que se ven.
 * Una parada es de la franja donde CAE (antes de la comida, MAÑANA; entre la comida y la cena, TARDE; después de la cena, NOCHE): ninguna franja se guarda en la parada.
 * La comida y la cena son elementos de la línea como las paradas: se mueven igual (botones y arrastrar) y «Mover antes / después» cambia un elemento por el de al lado y nada más.
 *
 * Dónde está cada comida se guarda en `DayPlan.mealAfter` (detrás de qué parada va: -1 = antes de la primera). Todo lo de aquí es puro (sin store ni React) para que lo use el panel, el menú y el store.
 */

export type NombreComida = 'lunch' | 'dinner'
export type ItemLinea = { tipo: 'stop'; id: string } | { tipo: 'meal'; comida: NombreComida }
export type PosicionComidas = { lunch?: number | null; dinner?: number | null }
export type ComidasGuardadas = { lunch?: number; dinner?: number }

const esNumero = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

/** La línea del día: cada parada y, tras la parada `m`, las comidas cuyo `m` es ese (la comida antes que la cena; -1 = delante de todo). */
export function lineaDelDia(stopIds: string[], comidas: PosicionComidas): ItemLinea[] {
  const salida: ItemLinea[] = []
  const poner = (m: number) => {
    if (esNumero(comidas.lunch) && comidas.lunch === m) salida.push({ tipo: 'meal', comida: 'lunch' })
    if (esNumero(comidas.dinner) && comidas.dinner === m) salida.push({ tipo: 'meal', comida: 'dinner' })
  }
  poner(-1)
  stopIds.forEach((id, index) => {
    salida.push({ tipo: 'stop', id })
    poner(index)
  })
  return salida
}

/** Lo contrario: el orden de las paradas y detrás de qué parada va cada comida (las que están en la línea). */
export function ordenYComidas(linea: ItemLinea[]): { stopIds: string[]; comidas: ComidasGuardadas } {
  const stopIds: string[] = []
  const comidas: ComidasGuardadas = {}
  for (const item of linea) {
    if (item.tipo === 'stop') stopIds.push(item.id)
    else comidas[item.comida] = stopIds.length - 1
  }
  return { stopIds, comidas }
}

export const mismoItem = (a: ItemLinea, b: ItemLinea): boolean => (a.tipo === 'stop' ? b.tipo === 'stop' && b.id === a.id : b.tipo === 'meal' && b.comida === a.comida)
export const idDeItem = (item: ItemLinea): string => (item.tipo === 'stop' ? item.id : `meal:${item.comida}`)

/** «Mover antes / después»: el elemento cambia su sitio por el del vecino y nada más se mueve. null si no hay vecino. */
export function cambiarConElVecino(linea: ItemLinea[], item: ItemLinea, direccion: 'antes' | 'despues'): ItemLinea[] | null {
  const desde = linea.findIndex((otro) => mismoItem(otro, item))
  const hasta = direccion === 'antes' ? desde - 1 : desde + 1
  if (desde < 0 || hasta < 0 || hasta >= linea.length) return null
  const nueva = [...linea]
  ;[nueva[desde], nueva[hasta]] = [nueva[hasta], nueva[desde]]
  return nueva
}

/** Arrastrar: el elemento ocupa el sitio del elemento sobre el que se suelta (como `arrayMove`). null si no cambia nada. */
export function arrastrarAlSitioDe(linea: ItemLinea[], item: ItemLinea, sobre: ItemLinea): ItemLinea[] | null {
  const desde = linea.findIndex((otro) => mismoItem(otro, item))
  const hasta = linea.findIndex((otro) => mismoItem(otro, sobre))
  if (desde < 0 || hasta < 0 || desde === hasta) return null
  const nueva = [...linea]
  nueva.splice(hasta, 0, nueva.splice(desde, 1)[0])
  return nueva
}

/** La franja de cada parada de la línea, por dónde cae: antes de la comida MAÑANA, después TARDE, después de la cena NOCHE (nunca vuelve atrás). */
export function franjasDeLaLinea(linea: ItemLinea[]): Map<string, 'manana' | 'tarde' | 'noche'> {
  const mapa = new Map<string, 'manana' | 'tarde' | 'noche'>()
  let fase: 'manana' | 'tarde' | 'noche' = 'manana'
  for (const item of linea) {
    if (item.tipo === 'meal') fase = item.comida === 'dinner' ? 'noche' : fase === 'noche' ? 'noche' : 'tarde'
    else mapa.set(item.id, fase)
  }
  return mapa
}

/**
 * Las comidas tras añadir una parada en el puesto `index` (la que estaba ahí y las de detrás pasan a `index + 1`): cada comida sigue detrás de SU parada.
 * `antesDe`: la parada entra justo ANTES de esa comida (desde el hueco de encima de su tarjeta); `alPrincipio`: entra la primera del día, delante de todo (también de una comida que estuviera delante de la primera parada).
 */
export function comidasTrasInsertar(comidas: PosicionComidas, index: number, opciones: { antesDe?: NombreComida | null; alPrincipio?: boolean } = {}): ComidasGuardadas {
  const salida: ComidasGuardadas = {}
  const moverAntes = opciones.antesDe ?? null
  const hayLunch = esNumero(comidas.lunch)
  const hayDinner = esNumero(comidas.dinner)
  for (const comida of ['lunch', 'dinner'] as const) {
    const m = comidas[comida]
    if (!esNumero(m)) continue
    let nueva = m
    if (opciones.alPrincipio) nueva = m + 1
    else if (moverAntes) {
      // La parada entra delante de la comida señalada (y de la cena, si va detrás de ella en el mismo hueco).
      const mismoHueco = m === index - 1
      const detras = comida === moverAntes || (moverAntes === 'lunch' && comida === 'dinner' && hayLunch && hayDinner && comidas.lunch === m)
      nueva = mismoHueco && detras ? index : m >= index ? m + 1 : m
    } else if (m >= index) nueva = m + 1
    salida[comida] = nueva
  }
  return salida
}

/** Las comidas tras quitar la parada del puesto `index`: la comida que iba detrás de ella pasa a ir detrás de la anterior. */
export function comidasTrasQuitar(comidas: PosicionComidas, index: number): ComidasGuardadas {
  const salida: ComidasGuardadas = {}
  for (const comida of ['lunch', 'dinner'] as const) {
    const m = comidas[comida]
    if (!esNumero(m)) continue
    salida[comida] = m >= index ? Math.max(-1, m - 1) : m
  }
  return salida
}
