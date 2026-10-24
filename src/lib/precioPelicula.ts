import { limitesDelGrupo, type PlanDePrecios, type PlanId } from './pagoPase'

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
}

export function hojaCuantosSois(planes: PlanDePrecios[], n: number): HojaCuantosSois {
  const { desde, hasta } = limitesDelGrupo(planes)
  const personas = Math.min(Math.max(n, 1), hasta)
  const uno = planes.find((p) => p.id === 'uno')
  const duo = planes.find((p) => p.id === 'duo')
  const grupo = planes.find((p) => p.id === 'grupo')
  const elegida = personas === 1 ? 0 : personas === 2 ? 1 : 2
  const filas: FilaDeLaPelicula[] = []
  if (uno) filas.push({ plan: 'uno', t: 'Pase de 1 persona', sub: 'Solo para ti', p: eu(uno.precio_total ?? 0), old: '', save: '' })
  if (duo) {
    const tachado = duo.precio_tachado ?? (uno?.precio_total ?? 0) * 2
    filas.push({ plan: 'duo', t: 'Pase Dúo · 2 personas', sub: duo.precio_por_persona != null ? `${eu(duo.precio_por_persona)} cada uno` : '', p: eu(duo.precio_total ?? 0), old: eu(tachado), save: `Ahorras ${eu(tachado - (duo.precio_total ?? 0))}` })
  }
  if (grupo) {
    const cuantos = Math.max(personas, desde)
    const total = (grupo.precio_por_persona ?? 0) * cuantos
    const sinPase = (uno?.precio_total ?? 0) * cuantos
    filas.push({ plan: 'grupo', t: `Pase Grupo · ${desde} o más`, sub: grupo.precio_por_persona != null ? `${eu(grupo.precio_por_persona)} cada uno` : '', p: eu(total), old: eu(sinPase), save: `Ahorras ${eu(sinPase - total)}` })
  }
  const fila = filas[elegida]
  return { filas, elegida, personasTxt: `${personas} ${personas === 1 ? 'persona' : 'personas'}`, comprarTxt: fila ? `Comprar · ${fila.p}` : 'Comprar', plan: fila?.plan ?? 'uno', personas: fila?.plan === 'duo' ? 2 : fila?.plan === 'grupo' ? Math.max(personas, desde) : 1, desde, hasta }
}
