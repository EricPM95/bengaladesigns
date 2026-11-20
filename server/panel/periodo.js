/**
 * (V35A) EL PERIODO DEL PANEL: el mismo selector arriba en cada pantalla con fechas (Inicio, Ventas, Destinos pedidos, Usuarios): Últimos 7 días · Este mes · Últimos 30 días · Últimos 6 meses · Este año · Todo · Personalizado.
 * Todo se cuenta en la hora de Madrid (`ZONA`): un día es un día de Madrid, no de UTC. Pura: sin base de datos (la prueba la usa).
 */
export const ZONA = 'Europe/Madrid'
export const PERIODOS = ['7d', 'mes', '30d', '6m', 'anio', 'todo', 'custom']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** «2026-11-20» (día de Madrid) de una fecha o instante. */
export function diaDe(valor, zona = ZONA) {
  const d = valor instanceof Date ? valor : new Date(valor)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('sv-SE', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
const aFecha = (dia) => new Date(`${dia}T12:00:00Z`)
export const sumarDias = (dia, n) => {
  const d = aFecha(dia)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 86400000)
const sumarMeses = (dia, n) => {
  const d = aFecha(dia)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 10)
}
export const corto = (dia) => {
  const [, m, d] = String(dia).split('-')
  return `${Number(d)} ${MESES[Number(m) - 1]}`
}
const FECHA = /^\d{4}-\d{2}-\d{2}$/

/**
 * El rango de un periodo. `desde` null = desde siempre. Devuelve `{ periodo, desde, hasta, etiqueta, titulo, dias }`: `etiqueta` es el texto del selector y `titulo` lo que se pone tras el título de cada bloque
 * («este mes», «últimos 30 días», «3 nov – 18 nov»). Un periodo raro o un personalizado sin fechas válidas es «este mes».
 */
export function rangoDePeriodo({ periodo = 'mes', desde = '', hasta = '' } = {}, ahora = new Date(), zona = ZONA) {
  const hoy = diaDe(ahora, zona)
  const mes = `${hoy.slice(0, 7)}-01`
  let p = PERIODOS.includes(periodo) ? periodo : 'mes'
  let d
  let h = hoy
  if (p === '7d') d = sumarDias(hoy, -6)
  else if (p === '30d') d = sumarDias(hoy, -29)
  else if (p === '6m') d = sumarDias(sumarMeses(mes, -5), 0)
  else if (p === 'anio') d = `${hoy.slice(0, 4)}-01-01`
  else if (p === 'todo') d = null
  else if (p === 'custom') {
    if (FECHA.test(desde) && FECHA.test(hasta)) {
      d = desde <= hasta ? desde : hasta
      h = desde <= hasta ? hasta : desde
    } else {
      p = 'mes'
      d = mes
    }
  } else d = mes
  const etiquetas = { '7d': 'Últimos 7 días', mes: 'Este mes', '30d': 'Últimos 30 días', '6m': 'Últimos 6 meses', anio: 'Este año', todo: 'Todo' }
  const titulos = { '7d': 'últimos 7 días', mes: 'este mes', '30d': 'últimos 30 días', '6m': 'últimos 6 meses', anio: 'este año', todo: 'todo el tiempo' }
  const personal = d && h ? (d === h ? corto(d) : `${corto(d)} – ${corto(h)}`) : ''
  return {
    periodo: p,
    desde: d,
    hasta: h,
    etiqueta: p === 'custom' ? personal : etiquetas[p],
    titulo: p === 'custom' ? personal : titulos[p],
    dias: d ? diasEntre(d, h) + 1 : null,
  }
}

/** ¿Este instante (o día) cae dentro del rango? */
export function enRango(valor, rango, zona = ZONA) {
  const dia = FECHA.test(String(valor)) ? String(valor) : diaDe(valor, zona)
  if (!dia) return false
  return (rango.desde === null || dia >= rango.desde) && dia <= rango.hasta
}

/** Lee el periodo de la dirección (`?periodo=30d` o `?periodo=custom&desde=2026-11-03&hasta=2026-11-18`). */
export const leerPeriodo = (query = {}) => ({
  periodo: PERIODOS.includes(String(query.periodo)) ? String(query.periodo) : 'mes',
  desde: FECHA.test(String(query.desde ?? '')) ? String(query.desde) : '',
  hasta: FECHA.test(String(query.hasta ?? '')) ? String(query.hasta) : '',
})

/**
 * Los días (o semanas, o meses) para el gráfico de un rango: hasta 62 días, de uno en uno; hasta 2 años, por semana; más, por mes. `clave(dia)` dice en qué hueco cae un día. Con `desde` null (todo), desde `primero`.
 */
export function cubetasDeRango(rango, primero) {
  const desde = rango.desde ?? primero ?? rango.hasta
  const n = diasEntre(desde, rango.hasta) + 1
  if (n <= 62) {
    const dias = Array.from({ length: n }, (_, i) => sumarDias(desde, i))
    return { tipo: 'dia', cubetas: dias.map((d) => ({ clave: d, etiqueta: corto(d) })), clave: (d) => d }
  }
  if (n <= 750) {
    const lunes = (d) => sumarDias(d, -((aFecha(d).getUTCDay() + 6) % 7))
    const cubetas = []
    for (let l = lunes(desde); l <= rango.hasta; l = sumarDias(l, 7)) cubetas.push({ clave: l, etiqueta: corto(l) })
    return { tipo: 'semana', cubetas, clave: lunes }
  }
  const cubetas = []
  for (let m = `${desde.slice(0, 7)}-01`; m <= rango.hasta; m = sumarMeses(m, 1)) cubetas.push({ clave: m.slice(0, 7), etiqueta: `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}` })
  return { tipo: 'mes', cubetas, clave: (d) => d.slice(0, 7) }
}
