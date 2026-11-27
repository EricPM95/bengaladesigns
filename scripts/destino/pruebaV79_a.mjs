// V79 (apartados 1 y 2) · «Cerrar mi viaje» y el «Resumen de tu viaje a …». PRUEBA DE LO QUE SE VE Y SE GUARDA.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV79_a.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, SIN navegador): `datosDelResumenViaje.ts` (lo ganado EN ESTE VIAJE, «Más medallas» solo con otra medalla ganada, secciones vacías, la medalla «que toca»), `cierreDelViaje.ts` (`hoyYaEsDespues`).
// Parte 2 (Roma) y parte 3 (Lanzarote): un Chrome de prueba cada una, por la cola. No toca el Supabase de producción (cuentas=off, sin sesión; el Chrome bloquea *.supabase.co).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { ABRIR } from './_montajeV79_a.mjs'
import { ROMA, LANZAROTE, VIAJERO, pocosLogros } from './_datosV79_a.mjs'

const QUE = process.argv[2] ?? 'todo'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 190))
  if (!cond) fallos.push({ regla, texto })
}
const clonar = (x) => JSON.parse(JSON.stringify(x))
const sinVaticano = (d) => {
  const c = clonar(d)
  c.resumen.ganado = c.resumen.ganado.filter((g) => g.escalon !== 'vaticano:plata')
  return c
}

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v79a-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/components/logros/momentos/datosDelResumenViaje.ts'; export * from './src/lib/nivelDelLogro.ts'; export { hoyYaEsDespues, MINUTOS_HASTA_EL_RESUMEN } from './src/lib/cierreDelViaje.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)

  // La medalla y «Más medallas».
  const roma = m.datosDelResumenViaje(ROMA.estado, ROMA.resumen, VIAJERO)
  debe(roma.medalla?.id === 'roma' && roma.medalla.grado === 'oro' && roma.medalla.ganadaEnElViaje, 'medalla-roma', `la medalla principal de Roma, en oro y ganada en este viaje: ${JSON.stringify(roma.medalla)}`)
  debe(roma.medalla.frase === 'Has conseguido el oro en este viaje.' && roma.medalla.frase2 === 'Te quedan 2 para el diamante.', 'frase-medalla', `«${roma.medalla.frase}» + «${roma.medalla.frase2}»`)
  debe(roma.masMedallas.length === 1 && roma.masMedallas[0].id === 'vaticano' && roma.masMedallas[0].grado === 'plata', 'mas-medallas-con-vaticano', 'Roma + Vaticano ganado en este viaje: «Más medallas» lleva la del Vaticano (plata)')
  const sinOtra = m.datosDelResumenViaje(sinVaticano(ROMA).estado, sinVaticano(ROMA).resumen, VIAJERO)
  debe(sinOtra.masMedallas.length === 0, 'sin-otra-medalla', 'sin ganar la otra medalla en este viaje (aunque la tenga de antes): NO hay «Más medallas»')
  const lanza = m.datosDelResumenViaje(LANZAROTE.estado, LANZAROTE.resumen, VIAJERO)
  debe(lanza.masMedallas.length === 0 && lanza.medalla?.id === 'lanzarote', 'lanzarote-nunca-mas-medallas', 'Lanzarote tiene una sola medalla: nunca «Más medallas»')
  const sinGanar = clonar(ROMA)
  sinGanar.resumen.ganado = sinGanar.resumen.ganado.filter((g) => g.logro !== 'sello')
  const sg = m.datosDelResumenViaje(sinGanar.estado, sinGanar.resumen, VIAJERO)
  debe(sg.medalla.ganadaEnElViaje === false && sg.medalla.frase === 'Te quedan 2 para el diamante.' && sg.medalla.frase2 === null, 'frase-sin-ganar', `sin medalla ganada en el viaje, solo «${sg.medalla.frase}»`)
  debe(m.articuloDelGrado('plata') === 'la plata' && m.articuloDelGrado('oro') === 'el oro' && m.articuloDelGrado('bronce') === 'el bronce', 'articulos-de-grado', 'el bronce, la plata, el oro')

  // Colecciones, emblemas y logros: solo lo de este viaje.
  debe(roma.colecciones.length === 3 && roma.colecciones.find((c) => c.id === 'imprescindibles')?.n === 4 && roma.colecciones.find((c) => c.id === 'imprescindibles')?.total === 8, 'colecciones-que-han-avanzado', `«4 de 8»: ${JSON.stringify(roma.colecciones.map((c) => `${c.n}/${c.total}`))}`)
  debe(roma.emblemas.length === 3 && roma.emblemas.every((e) => e.nombre), 'emblemas-descubiertos', `3 emblemas con su nombre: ${roma.emblemas.map((e) => e.nombre).join(', ')}`)
  const noEsteViaje = clonar(ROMA)
  noEsteViaje.estado.secretos.encontrados_lista.push({ id: 'catacumbas', nombre: 'La Roma de debajo', linea: '', en: '2025-01-01T00:00:00Z' })
  const ne = m.datosDelResumenViaje(noEsteViaje.estado, noEsteViaje.resumen, VIAJERO)
  debe(ne.emblemas.length === 3 && !ne.emblemas.some((e) => e.id === 'catacumbas'), 'emblema-de-otro-viaje-no-sale', 'un emblema encontrado en otro viaje NO sale en el resumen de este')
  const pais = roma.logros.find((l) => l.tipo === 'pais')
  debe(pais && pais.pais === 'Italia' && pais.nombre === 'Italia · país nuevo' && pais.logro === 'paises' && pais.escalon === 4, 'pais-nuevo', `«Italia · país nuevo», con el total 4: ${JSON.stringify(pais)}`)
  debe(m.gradoDeLaMedalla('paises', pais.escalon) === 2 && m.gradoDeLaMedalla('paises', 1) === 1 && m.gradoDeLaMedalla('paises', 2) === 1, 'medalla-que-toca', 'el 4.º país se dibuja con la medalla de nivel 2; el 1.º y el 2.º, de nivel 1')
  debe(roma.logros.some((l) => l.tipo === 'destino' && l.nombre === 'Roma · destino nuevo') && roma.logros.some((l) => l.tipo === 'viajero' && l.nombre === 'Trotamundos') && roma.logros.some((l) => l.nombre === 'Testigo de la historia'), 'logros-de-viajero', `logros: ${roma.logros.map((l) => l.nombre).join(' / ')}`)
  const dos = clonar(ROMA)
  dos.resumen.ganado.push({ clave: '*|viajero:paises|1', logro: 'viajero:paises', escalon: '1', destino: '*', en: '2026-10-14T10:00:00Z' })
  const dd = m.datosDelResumenViaje(dos.estado, dos.resumen, VIAJERO)
  debe(dd.logros.filter((l) => l.logro === 'paises' && l.tipo === 'viajero').length === 1 && dd.logros.find((l) => l.tipo === 'viajero' && l.logro === 'paises').escalon === '3', 'viajero-sin-repetir', 'dos escalones del mismo logro de viajero en un viaje: una sola tarjeta, la del más alto')

  // Con pocos logros no queda vacío: lo que no tiene nada, no sale.
  const pocos = m.datosDelResumenViaje(pocosLogros(LANZAROTE).estado, pocosLogros(LANZAROTE).resumen, VIAJERO)
  debe(pocos.medalla && pocos.colecciones.length === 1 && pocos.emblemas.length === 0 && pocos.logros.length === 0 && pocos.masMedallas.length === 0, 'pocos-logros-sin-secciones-vacias', `pocos logros: medalla, 1 colección, y NADA de emblemas, logros ni más medallas`)
  const nada = clonar(LANZAROTE)
  nada.resumen.ganado = []
  const n0 = m.datosDelResumenViaje(nada.estado, nada.resumen, VIAJERO)
  debe(n0.colecciones.length === 0 && n0.emblemas.length === 0 && n0.logros.length === 0 && n0.medalla && n0.medalla.frase === 'Te quedan 2 para la plata.', 'nada-ganado', `sin nada ganado: solo la medalla con «${n0.medalla?.frase}»`)

  // La línea de abajo.
  debe(m.lineaFinalDelViaje('Roma', 14, 5) === 'Roma aún esconde 9 secretos: vuelve cuando quieras', 'linea-final', 'Roma aún esconde 9 secretos: vuelve cuando quieras')
  debe(m.lineaFinalDelViaje('Roma', 14, 13) === 'Roma aún esconde 1 secreto: vuelve cuando quieras' && m.lineaFinalDelViaje('Roma', 14, 14) === 'Has encontrado todos los secretos de Roma.' && m.lineaFinalDelViaje('Roma', 0, 0) === null, 'linea-final-casos', 'singular, todos encontrados y sin secretos')

  // Cuándo HOY pasa a «después».
  const H = (x) => m.hoyYaEsDespues({ cerrado: false, ahoraMin: 0, enElSitioMin: null, vueloMin: null, ...x })
  debe(H({ cerrado: true, ahoraMin: 100 }) === true, 'despues-cerrado', 'con [Cerrar mi viaje] pulsado, HOY es el de después siempre')
  debe(H({ ahoraMin: 16 * 60 + 119, enElSitioMin: 16 * 60, vueloMin: 19 * 60 + 30 }) === false && H({ ahoraMin: 18 * 60, enElSitioMin: 16 * 60, vueloMin: 19 * 60 + 30 }) === true, 'despues-2h-del-aeropuerto', '2 h después de «Ya en el aeropuerto» (a las 16:00 → 18:00), no antes')
  debe(H({ ahoraMin: 21 * 60 + 29, vueloMin: 19 * 60 + 30 }) === false && H({ ahoraMin: 21 * 60 + 30, vueloMin: 19 * 60 + 30 }) === true, 'despues-2h-del-vuelo', 'sin pasar por el aeropuerto: 2 h después de la hora del vuelo (19:30 → 21:30)')
  debe(H({ ahoraMin: 23 * 60 }) === false, 'despues-sin-datos', 'sin hora de vuelo ni de aeropuerto, y sin cerrar: nunca')
}

/* ═══ Un viaje en el navegador (Roma o Lanzarote) ═══ */
async function parteNavegador(lanza) {
  const nombre = lanza ? 'Lanzarote' : 'Roma'
  const D = lanza ? LANZAROTE : ROMA
  console.log(`${lanza ? '3' : '2'}. En el navegador (${nombre})`)
  const { a, ev, montar, clic, R } = await ABRIR(lanza)
  const CICAR = lanza ? { provider: 'Cicar', startDate: '2026-11-08', endDate: '2026-11-13', precio: null, codigo: 'CK-48213' } : null
  const API = "(await import('/src/components/logros/momentos/api.ts'))"
  const UI = "(await import('/src/components/logros/momentos/useMomentosUI.ts')).useMomentosUI"
  const poner = async (d) => {
    await ev(`(${API}).datosDePrueba.estado = ${JSON.stringify(d.estado)}`)
    await ev(`(${API}).datosDePrueba.resumen = ${JSON.stringify(d.resumen)}`)
    await ev(`(${API}).datosDePruebaViajero.v = ${JSON.stringify(VIAJERO)}`)
    await ev("(await import('/src/store/useSyncStore.ts')).useSyncStore.getState().setActiveTripId('demo-viaje')")
  }
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const texto = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '')`)
  const cerrarResumen = async () => {
    await ev("(() => { document.querySelector('[data-resumen-del-viaje] [aria-label=Cerrar]')?.click(); return true })()")
    await a.esp(900)
  }
  const flag = (k) => ev(`localStorage.getItem(${JSON.stringify(k)})`)
  const rid = await ev(`${R}.getState().route.id`)
  const dias0 = await ev(`${R}.getState().route.days.length`)
  const salio = 15 * 60 + 30 // «Salgo hacia…» a las 15:30 → ya en el aeropuerto a las 16:00 (trayecto por defecto de 30 min)
  const base = { hora: lanza ? '19:40' : '19:30', coche: CICAR, salio }
  try {
    await poner(D)

    // §1 La tarjeta solo sale ya en el aeropuerto.
    await montar({ ...base, min: 10 * 60, salio: null })
    debe(!(await hay('[data-hoy-cerrar-viaje]')), 'cerrar-no-antes', 'por la mañana, antes de salir, NO sale «Cerrar mi viaje»')
    await montar({ ...base, min: 16 * 60 + 50 })
    debe(await hay('[data-hoy-cerrar-viaje]'), 'cerrar-en-el-aeropuerto', 'ya en el aeropuerto: sale la tarjeta «Tu viaje a … termina aquí»')
    const t = await texto('[data-hoy-cerrar-viaje]')
    debe(t.includes(`Tu viaje a ${nombre} termina aquí`) && t.includes('Cerrar mi viaje'), 'cerrar-texto', t.replace(/\s+/g, ' '))
    const debajo = await ev("(() => { const c = document.querySelector('[data-hoy-vuelta-tarjeta]'); const k = document.querySelector('[data-hoy-cerrar-viaje]'); return Boolean(c && k && (c.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)) })()")
    debe(debajo, 'cerrar-debajo-del-vuelo', 'la tarjeta va DEBAJO de la tarjeta del vuelo')
    const oro = await ev("getComputedStyle(document.querySelector('[data-hoy-cerrar-viaje-boton]')).backgroundImage")
    debe(/243, 226, 176|F3E2B0/i.test(oro), 'cerrar-boton-dorado', 'el botón es el dorado de siempre (BOTON_ORO)')

    // Al pulsarlo: resumen + HOY «después»; no se borra nada.
    await clic('Cerrar mi viaje')
    await a.esp(3500)
    debe(await hay('[data-resumen-del-viaje]'), 'cerrar-abre-resumen', 'al pulsar [Cerrar mi viaje] se abre el resumen del viaje')
    debe((await flag(`trazo:hoy:viaje-cerrado:${rid}`)) === 'si' && (await flag(`trazo:hoy:resumen-salio:${rid}`)) === 'si', 'cerrar-se-apunta', 'se apunta en el móvil que el viaje está cerrado y que el resumen ya salió')
    await cerrarResumen()
    const hoy = await ev('document.body.innerText.replace(/\\s+/g, " ")')
    debe(hoy.includes('Ver el resumen de mi viaje') && !hoy.includes('Hoy vuelves a casa'), 'cerrar-hoy-despues', 'HOY pasa a «después» (HoyDespuesV2: [Ver el resumen de mi viaje]); ya no sale «Hoy vuelves a casa»')
    debe((await ev(`${R}.getState().route.id`)) === rid && (await ev(`${R}.getState().route.days.length`)) === dias0, 'cerrar-no-borra', 'no se borra nada del viaje (mismo viaje, mismos días)')
    debe(!(await hay('[data-resumen-del-viaje]')), 'resumen-no-se-repite', 'tras cerrar el resumen, no vuelve a abrirse solo')
    await ev(`${R}.getState().setMode('explore')`)
    await a.esp(800)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(2500)
    debe(!(await hay('[data-resumen-del-viaje]')), 'resumen-una-sola-vez-al-volver', 'al salir de HOY y volver, el resumen NO sale otra vez')
    await clic('Ver el resumen de mi viaje')
    await a.esp(2500)
    debe(await hay('[data-resumen-del-viaje]'), 'resumen-a-mano', 'con [Ver el resumen de mi viaje] se vuelve a abrir cuando se quiere')

    // §2 El contenido del resumen (los datos del servidor de prueba).
    const t2 = await texto('[data-resumen-del-viaje]')
    debe(t2.includes(`Resumen de tu viaje a ${nombre}`) && new RegExp(`TU VIAJE A ${nombre.toUpperCase()} · \\d+ DÍAS`).test(t2), 'resumen-cabecera', t2.split('\n').slice(0, 3).join(' | '))
    debe(t2.includes('Has conseguido') && t2.includes('en este viaje'), 'resumen-medalla-frase', 'la tarjeta de la medalla dice «Has conseguido … en este viaje»')
    debe(t2.includes('Colecciones que han avanzado') && t2.includes('Emblemas ocultos descubiertos') && t2.includes('Logros de viajero'), 'resumen-secciones', 'colecciones, emblemas y logros de viajero')
    debe(/aún esconde \d+ secretos?: vuelve cuando quieras/.test(t2), 'resumen-secretos', 'la línea «… aún esconde N secretos: vuelve cuando quieras»')
    debe(!t2.includes('Estampar mi sello') && t2.includes('Ver mi pasaporte'), 'resumen-pasaporte', 'el botón dice [Ver mi pasaporte]')
    const fondo = await ev("getComputedStyle(document.querySelector('[data-ver-pasaporte]')).backgroundImage")
    debe(/106, 26, 44/.test(fondo), 'pasaporte-granate', `el botón del pasaporte va en GRANATE: ${fondo.slice(0, 80)}`)
    if (lanza) {
      debe(!t2.includes('Más medallas') && !(await hay('[data-resumen-mas-medallas]')), 'lanzarote-sin-mas-medallas', 'Lanzarote: nunca «Más medallas»')
    } else {
      debe(t2.includes('Más medallas') && (await hay('[data-resumen-mas-medalla="vaticano"]')), 'roma-mas-medallas', 'Roma, con el Vaticano ganado en este viaje: «Más medallas» con la medalla del Vaticano')
      debe((await ev("document.querySelectorAll('[data-resumen-viajero] [data-bandera-redonda]').length")) === 1, 'pais-con-bandera', 'el país nuevo lleva su bandera redonda')
      // Un 4.º país: su chapa es la del nivel 2, la misma que «Trotamundos» (el 3.er país).
      const chapas = await ev("(() => { const g = [...document.querySelectorAll('[data-resumen-viajero] > div > *')].slice(0, 3).map((c) => c.querySelector('svg, img, canvas, [class*=chapa]') ? c.innerHTML.length : 0); return g })()")
      debe(chapas.every((n) => n > 0), 'chapas-dibujadas', `las tarjetas de logros dibujan su chapa: ${JSON.stringify(chapas)}`)
    }
    // Tocar una medalla o una colección sube la ficha en grande.
    for (let i = 0; i < 40 && !(await a.evaluar("typeof window.__demoGanados === 'object'").catch(() => false)); i++) await a.esp(500)
    await ev("(() => { document.querySelector('[data-resumen-medalla]')?.click(); return true })()")
    let ficha = false
    for (let i = 0; i < 16 && !ficha; i++) {
      await a.esp(500)
      ficha = await hay('[data-ficha-del-resumen] [data-ficha-grande]')
    }
    debe(ficha, 'medalla-abre-ficha', 'al tocar la medalla sube la ficha en grande (V72)')
    await ev("(() => { document.querySelector('[data-ficha-del-resumen] [data-cruz-de-hoja]')?.click(); return true })()")
    await a.esp(900)
    await ev("(() => { document.querySelector('[data-coleccion-del-resumen]')?.click(); return true })()")
    ficha = false
    for (let i = 0; i < 16 && !ficha; i++) {
      await a.esp(500)
      ficha = await hay('[data-ficha-del-resumen] [data-ficha-grande]')
    }
    debe(ficha, 'coleccion-abre-ficha', 'al tocar una colección sube la ficha en grande (V72)')
    await ev("(() => { document.querySelector('[data-ficha-del-resumen] [data-cruz-de-hoja]')?.click(); return true })()")
    await a.esp(600)

    // Pocos logros: las secciones sin nada no salen.
    await cerrarResumen()
    await poner(sinVaticano(pocosLogros(D)))
    await ev(`${UI}.getState().abrirResumenViaje()`)
    await a.esp(2500)
    const t3 = await texto('[data-resumen-del-viaje]')
    debe(t3.includes('Colecciones que han avanzado') && !t3.includes('Emblemas ocultos descubiertos') && !t3.includes('Logros de viajero') && !t3.includes('Más medallas'), 'pocos-logros-en-pantalla', 'con pocos logros: colección sí; emblemas, logros de viajero y más medallas NO salen')
    debe(t3.includes('Ver mi pasaporte') && /vuelve cuando quieras/.test(t3), 'pocos-logros-no-vacio', 'con pocos logros no queda vacío: medalla, colección, línea de secretos y [Ver mi pasaporte]')
    await cerrarResumen()
    await poner(D)

    // Sin pulsar nada: el resumen sale SOLO, una vez, 2 h después de «Ya en el aeropuerto».
    await montar({ ...base, min: 17 * 60 + 59 })
    await a.esp(1500)
    debe(!(await hay('[data-resumen-del-viaje]')) && (await hay('[data-hoy-vuelta-tarjeta]')), 'solo-no-antes-de-2h', 'a las 17:59 (1 h 59 min después de llegar al aeropuerto) NO sale el resumen y sigue la tarjeta de la vuelta')
    await montar({ ...base, min: 18 * 60 + 5 })
    await a.esp(3500)
    debe(await hay('[data-resumen-del-viaje]'), 'solo-a-las-2h', 'a las 18:05 (más de 2 h después) el resumen sale solo')
    debe((await flag(`trazo:hoy:resumen-salio:${rid}`)) === 'si' && (await flag(`trazo:hoy:viaje-cerrado:${rid}`)) === null, 'solo-se-apunta', 'se apunta que el resumen ya salió (sin marcar el viaje como cerrado a mano)')
    await cerrarResumen()
    await ev(`${R}.getState().setMode('explore')`)
    await a.esp(800)
    await ev(`${R}.getState().setMode('today')`)
    await a.esp(3000)
    debe(!(await hay('[data-resumen-del-viaje]')), 'solo-una-sola-vez', 'al volver a HOY el resumen NO sale otra vez: una sola vez por viaje')
    // Sin pasar por el aeropuerto: 2 h después de la hora del vuelo.
    await montar({ ...base, min: (lanza ? 19 * 60 + 40 : 19 * 60 + 30) + 130, salio: null })
    await a.esp(3500)
    debe(await hay('[data-resumen-del-viaje]'), 'solo-a-las-2h-del-vuelo', 'sin pasar por el aeropuerto, 2 h después de la hora del vuelo el resumen sale solo')
    await cerrarResumen()
  } finally {
    a.cerrar()
  }
}

if (QUE === 'todo' || QUE === 'pura') await partePura()
if (QUE === 'todo' || QUE === 'roma') await parteNavegador(false)
if (QUE === 'todo' || QUE === 'lanza') await parteNavegador(true)
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
