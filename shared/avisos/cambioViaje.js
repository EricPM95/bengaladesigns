/**
 * (Tanda 10N5, apartados 2 y 2b) QUÉ HA PASADO EN EL VIAJE, dicho por la persona que lo cambió. Pura, sin React ni red: la usa el móvil de quien cambia el viaje (apunta el resumen en `route.ultimoCambio`,
 * que el disparador de la base de datos copia al aviso) y la prueba. El texto del aviso sale de `shared/avisos/textos.js`.
 *
 * Lo que cuenta es lo que ha decidido la persona («ha añadido el Free Tour al miércoles 11», «ha movido el Coliseo al jueves 12»), no lo que la app ha movido por detrás: las paradas se comparan por NOMBRE
 * (no por id: al rehacer un día, la app les pone otro id) y una parada que está antes y después pero en otro día es «movida», nunca «quitada» y «añadida».
 */

const quitarMarca = (s) => String(s ?? '').replace(/\s*\((noche|por fuera)\)\s*$/i, '').trim()
const norma = (s) => quitarMarca(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const sumarDias = (iso, n) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Las paradas de verdad de una ruta (sin paseos por barrio ni descansos), con su día. */
function paradasDe(ruta) {
  const salida = []
  for (const dia of ruta?.days ?? []) {
    if (dia.isReturnLeg) continue
    for (const s of dia.stops ?? []) {
      if (s.isZoneWalk || s.isBreak || !s.name) continue
      salida.push({ nombre: quitarMarca(s.name), clave: norma(s.name), dia_n: dia.dayNumber, dia_id: dia.id, fecha: sumarDias(ruta?.answers?.dateRange?.start, (dia.dayNumber ?? 1) - 1) })
    }
    // (10N8 §4) El restaurante que el viajero ha elegido para una comida o cena cuenta como un sitio más: «Eric ha añadido Da Enzo al jueves 12.»
    for (const m of dia.meals ?? []) {
      const r = m?.chosenRestaurant
      if (!r || !r.name) continue
      salida.push({ nombre: quitarMarca(r.name), clave: norma(r.name), dia_n: dia.dayNumber, dia_id: dia.id, fecha: sumarDias(ruta?.answers?.dateRange?.start, (dia.dayNumber ?? 1) - 1) })
    }
  }
  return salida
}

/** Una firma del contenido de un día (las paradas por nombre y en orden): dos días con la misma firma no han cambiado. */
const firmaDelDia = (dia) => (dia?.stops ?? []).filter((s) => !s.isZoneWalk && !s.isBreak && s.name).map((s) => norma(s.name)).join('|')

/**
 * Compara la ruta de antes y la de ahora. Devuelve lo que las personas entienden:
 *   · `movidas`: paradas que están en las dos pero en otro DÍA ({ nombre, dia_n, fecha });
 *   · `anadidas` / `quitadas`: paradas que solo están en una de las dos;
 *   · `reordenados`: días donde las mismas paradas cambian de orden (sin que ninguna cambie de día);
 *   · `dias_cambiados`: los números de día (de la ruta de AHORA) cuyo contenido es otro;
 *   · `dias_antes` / `dias_despues`, y `fechas` ({antes, despues}) solo si el inicio o el final de verdad cambian.
 */
export function resumirCambio(antes, despues) {
  const a = paradasDe(antes)
  const d = paradasDe(despues)
  const deAntes = new Map(a.map((p) => [p.clave, p]))
  const deAhora = new Map(d.map((p) => [p.clave, p]))
  const movidas = []
  const anadidas = []
  const quitadas = []
  for (const p of d) {
    const previa = deAntes.get(p.clave)
    if (!previa) anadidas.push({ nombre: p.nombre, dia_n: p.dia_n, fecha: p.fecha })
    else if (previa.dia_n !== p.dia_n) movidas.push({ nombre: p.nombre, dia_n: p.dia_n, fecha: p.fecha })
  }
  for (const p of a) if (!deAhora.has(p.clave)) quitadas.push({ nombre: p.nombre, dia_n: p.dia_n })
  const firmasAntes = new Map((antes?.days ?? []).filter((x) => !x.isReturnLeg).map((x) => [x.id, firmaDelDia(x)]))
  const diasCambiados = []
  let reordenados = 0
  for (const dia of despues?.days ?? []) {
    if (dia.isReturnLeg) continue
    const firma = firmaDelDia(dia)
    if (!firmasAntes.has(dia.id) || firmasAntes.get(dia.id) !== firma) {
      diasCambiados.push(dia.dayNumber)
      const previa = firmasAntes.get(dia.id)
      if (previa != null && previa.split('|').sort().join('|') === firma.split('|').sort().join('|')) reordenados += 1
    }
  }
  const ia = antes?.answers?.dateRange
  const id = despues?.answers?.dateRange
  // (10N8 §4) Los días que ya no están (con su fecha de ANTES: «el sábado 14») y si los mismos días han cambiado de orden.
  const diasA = (antes?.days ?? []).filter((x) => !x.isReturnLeg)
  const diasD = (despues?.days ?? []).filter((x) => !x.isReturnLeg)
  const idsD = new Set(diasD.map((x) => x.id))
  const diasQuitadosLista = diasA.filter((x) => !idsD.has(x.id)).map((x) => ({ dia_n: x.dayNumber, fecha: sumarDias(ia?.start, (x.dayNumber ?? 1) - 1) }))
  const ordenDias = diasA.length > 1 && diasA.length === diasD.length && diasA.every((x) => idsD.has(x.id)) && diasA.some((x, i) => x.id !== diasD[i].id)
  const mismoInicio = Boolean(ia && id && String(ia.start).slice(0, 10) === String(id.start).slice(0, 10))
  const mismosDias = diasA.length === diasD.length
  // (Al quitar o añadir un día el final del viaje cambia solo: eso no es «cambiar las fechas».)
  const fechasCambian = Boolean(ia && id && (!mismoInicio || (String(ia.end).slice(0, 10) !== String(id.end).slice(0, 10) && mismosDias)))
  return {
    movidas,
    anadidas,
    quitadas,
    reordenados,
    dias_cambiados: diasCambiados,
    dias_antes: (antes?.days ?? []).filter((x) => !x.isReturnLeg).length,
    dias_despues: (despues?.days ?? []).filter((x) => !x.isReturnLeg).length,
    dias_quitados_lista: diasQuitadosLista,
    orden_dias: ordenDias,
    ...(fechasCambian ? { fechas: { antes: { inicio: String(ia.start).slice(0, 10), fin: String(ia.end).slice(0, 10) }, despues: { inicio: String(id.start).slice(0, 10), fin: String(id.end).slice(0, 10) } } } : {}),
  }
}

/** ¿Es el mismo contenido? (nada que avisar). */
export const sinCambios = (r) => !r.orden_dias && !(r.dias_quitados_lista ?? []).length && !r.movidas.length && !r.anadidas.length && !r.quitadas.length && !r.reordenados && !r.fechas && r.dias_antes === r.dias_despues && !r.dias_cambiados.length

/**
 * El `ultimoCambio` que se apunta en la ruta antes de guardarla: el resumen y, si lo que ha pasado tiene nombre propio (añadir el Free Tour, cambiar un día a excursión, recuperar la ruta…), su `accion`.
 * `accion`: { tipo: 'free_tour'|'excursion'|'recuperar_ruta'|'recuperar_dia'|'fechas'|'rehacer', dia_n?, fecha?, a?: 'excursion'|'roma', excursion?, ciudad? }.
 */
export function ultimoCambioDe(antes, despues, accion = null) {
  const r = resumirCambio(antes, despues)
  const limite = (lista, n) => lista.slice(0, n)
  return {
    id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    ...(accion ? { accion } : {}),
    movidas: limite(r.movidas, 6),
    n_movidas: r.movidas.length,
    anadidas: limite(r.anadidas, 6),
    n_anadidas: r.anadidas.length,
    quitadas: limite(r.quitadas, 6),
    n_quitadas: r.quitadas.length,
    reordenados: r.reordenados,
    dias_cambiados: limite(r.dias_cambiados, 14),
    dias_antes: r.dias_antes,
    dias_despues: r.dias_despues,
    dias_quitados_lista: limite(r.dias_quitados_lista, 6),
    orden_dias: r.orden_dias,
    ...(r.fechas ? { fechas: r.fechas } : {}),
  }
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------ */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

/** «jueves 12» a partir de «2026-11-12»; vacío si no hay fecha. */
export function diaDeSemanaYNumero(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  if (!m) return ''
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return `${DIAS_SEMANA[d.getUTCDay()]} ${Number(m[3])}`
}

/** «del 11 al 15 de noviembre» / «del 28 de octubre al 2 de noviembre». */
export function rangoDelViaje(inicio, fin) {
  const a = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(inicio ?? ''))
  const b = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fin ?? ''))
  if (!a || !b) return ''
  if (a[2] === b[2]) return `del ${Number(a[3])} al ${Number(b[3])} de ${MESES[Number(a[2]) - 1]}`
  return `del ${Number(a[3])} de ${MESES[Number(a[2]) - 1]} al ${Number(b[3])} de ${MESES[Number(b[2]) - 1]}`
}

/** «el sábado 14» (con fecha) o «el día 3». */
export function elDiaDicho(c) {
  const f = diaDeSemanaYNumero(c?.fecha)
  if (f) return `el ${f}`
  return Number.isInteger(c?.dia_n) ? `el día ${c.dia_n}` : 'ese día'
}

/**
 * Lo que de verdad ha pasado, ya limpio de lo que la app movió por detrás. Devuelve { movidas, anadidas, quitadas } después de juntar cambios seguidos (un sitio quitado y vuelto a añadir no cuenta,
 * uno añadido y luego quitado tampoco) y de no contar como «quitado» ni «añadido» lo que solo cambió de día.
 */
export function limpiarListas(c) {
  const norm = norma
  let anadidas = Array.isArray(c?.anadidas) ? c.anadidas : []
  let quitadas = Array.isArray(c?.quitadas) ? c.quitadas : []
  let movidas = Array.isArray(c?.movidas) ? c.movidas : Array.isArray(c?.movidas_lista) ? c.movidas_lista : []
  const nA = Number.isInteger(c?.n_anadidas) ? c.n_anadidas : anadidas.length
  const nQ = Number.isInteger(c?.n_quitadas) ? c.n_quitadas : quitadas.length
  const nM = Number.isInteger(c?.n_movidas) ? c.n_movidas : Number.isInteger(c?.movidas) ? c.movidas : movidas.length
  movidas = movidas.filter((x, i) => movidas.findIndex((y) => norm(y.nombre) === norm(x.nombre)) === i)
  const enAnadidas = new Set(anadidas.map((x) => norm(x.nombre)))
  const enQuitadas = new Set(quitadas.map((x) => norm(x.nombre)))
  // Lo que sale y entra a la vez con el mismo nombre es una parada que se movió (o que se quitó y se volvió a poner: nada).
  const mismas = [...enAnadidas].filter((n) => enQuitadas.has(n))
  if (mismas.length) {
    const nuevasMovidas = anadidas.filter((x) => mismas.includes(norm(x.nombre)))
    movidas = [...movidas, ...nuevasMovidas.filter((x) => !movidas.some((m) => norm(m.nombre) === norm(x.nombre)))]
    anadidas = anadidas.filter((x) => !mismas.includes(norm(x.nombre)))
    quitadas = quitadas.filter((x) => !mismas.includes(norm(x.nombre)))
  }
  const restoMovidas = Math.max(nM - movidas.length, 0)
  return {
    movidas,
    anadidas,
    quitadas,
    nMovidas: Math.max(movidas.length + restoMovidas, 0),
    nAnadidas: Math.max(nA - mismas.length, anadidas.length),
    nQuitadas: Math.max(nQ - mismas.length, quitadas.length),
  }
}

/**
 * (10N5) Lo que se marca al abrir el aviso: { marcas: { nombre: 'nueva' | 'movida' }, dias: [números de día que han cambiado] }. Un cambio con nombre propio marca lo suyo (el Free Tour, «Nueva»; los sitios
 * del día de excursión, ninguno); uno suelto marca cada sitio añadido («Nueva») y movido («Movida») del aviso.
 */
export function marcasDelAviso(p) {
  const c = p?.cambio && typeof p.cambio === 'object' ? p.cambio : null
  const a = c?.accion
  const marcas = {}
  const dias = []
  const sumaDia = (n) => { if (Number.isInteger(n) && !dias.includes(n)) dias.push(n) }
  if (a && typeof a === 'object') {
    if (a.tipo === 'free_tour') { marcas[norma('Free Tour')] = 'nueva'; sumaDia(a.dia_n) }
    if (a.tipo === 'excursion' || a.tipo === 'recuperar_dia' || a.tipo === 'reorganizar') sumaDia(a.dia_n)
    return { marcas, dias }
  }
  const L = limpiarListas(c ?? p ?? {})
  for (const x of L.anadidas) { marcas[norma(x.nombre)] = 'nueva'; sumaDia(x.dia_n) }
  for (const x of L.movidas) { marcas[norma(x.nombre)] = 'movida'; sumaDia(x.dia_n) }
  return { marcas, dias }
}
