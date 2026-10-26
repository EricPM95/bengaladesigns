import { limitesDelGrupo, type PlanDePrecios, type PlanId } from './pagoPase'
import { ahorroEnMoneda, textoEnMoneda, type MonedaDelPase } from './precioMoneda'

/** «8,00 €»: siempre con dos decimales, como en Design (el importe suelto de la app quita los ceros). */
export const eu = (v: number): string => `${(Math.round(v * 100) / 100).toFixed(2).replace('.', ',')} €`

/**
 * LAS FILAS DE «¿CUÁNTOS SOIS?» (la hoja de compra de la película, Tanda 10I). Los textos son los de Design («Pase de 1 persona», «Solo para ti», «Ahorras…»); los PRECIOS salen de donde ya los tiene la app
 * (data/pase/precios.json, que el servidor da en /api/pase/config): ninguno está escrito dos veces. El tachado del Grupo es lo que costarían tantos pases de 1 persona; «Ahorras» es la diferencia.
 */
export interface FilaDeLaPelicula {
  plan: PlanId
  t: string
  sub: string
  p: string
  old: string
  save: string
  /** Los euros pequeños de debajo (solo con otra moneda): precio y tachado. */
  pe: string
  olde: string
}
export interface HojaCuantosSois {
  filas: FilaDeLaPelicula[]
  /** La fila marcada: 1 persona → 0, 2 → 1, 3 o más → 2. */
  elegida: number
  /** «4 personas» */
  personasTxt: string
  /** «Comprar · 19,96 €» (sin precios, «Comprar»). */
  comprarTxt: string
  /** Lo que se manda al crear el pago. */
  plan: PlanId
  personas: number
  desde: number
  hasta: number
  /** Con otra moneda: el precio del pase de 1 persona, grande en su moneda y pequeño en euros (el final de la película). */
  finalGrande: string
  finalEuros: string
}

export function hojaCuantosSois(planes: PlanDePrecios[], n: number, moneda: MonedaDelPase | null = null): HojaCuantosSois {
  const en = (v: number) => textoEnMoneda(v, moneda)
  const eur = (v: number) => textoEnMoneda(v, null)
  const { desde, hasta } = limitesDelGrupo(planes)
  const personas = Math.min(Math.max(n, 1), hasta)
  const uno = planes.find((p) => p.id === 'uno')
  const duo = planes.find((p) => p.id === 'duo')
  const grupo = planes.find((p) => p.id === 'grupo')
  const elegida = personas === 1 ? 0 : personas === 2 ? 1 : 2
  const filas: FilaDeLaPelicula[] = []
  const uTotal = uno?.precio_total ?? 0
  if (uno) filas.push({ plan: 'uno', t: 'Pase de 1 persona', sub: 'Solo para ti', p: en(uTotal), old: '', save: '', pe: eur(uTotal), olde: '' })
  if (duo) {
    const total = duo.precio_total ?? 0
    const tachado = duo.precio_tachado ?? uTotal * 2
    filas.push({ plan: 'duo', t: 'Pase Dúo · 2 personas', sub: duo.precio_por_persona != null ? `${en(duo.precio_por_persona)} cada uno` : '', p: en(total), old: en(tachado), save: ahorroEnMoneda(tachado, total, moneda), pe: eur(total), olde: eur(tachado) })
  }
  if (grupo) {
    const cuantos = Math.max(personas, desde)
    const total = (grupo.precio_por_persona ?? 0) * cuantos
    const sinPase = uTotal * cuantos
    filas.push({ plan: 'grupo', t: `Pase Grupo · ${desde} o más`, sub: grupo.precio_por_persona != null ? `${en(grupo.precio_por_persona)} cada uno` : '', p: en(total), old: en(sinPase), save: ahorroEnMoneda(sinPase, total, moneda), pe: eur(total), olde: eur(sinPase) })
  }
  const fila = filas[elegida]
  return { filas, elegida, personasTxt: `${personas} ${personas === 1 ? 'persona' : 'personas'}`, comprarTxt: fila ? `Comprar · ${fila.p}` : 'Comprar', plan: fila?.plan ?? 'uno', personas: fila?.plan === 'duo' ? 2 : fila?.plan === 'grupo' ? Math.max(personas, desde) : 1, desde, hasta, finalGrande: en(uTotal), finalEuros: eur(uTotal) }
}
