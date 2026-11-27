// V76 (apartados 2 y 4) · Un tren o autobús UNIDO a la llegada o a la vuelta, y las ESCALAS del vuelo. PRUEBA DE LO QUE SE GUARDA Y SE VE.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV76_b.mjs [pura|roma|lanza]      (sin argumento: las tres partes)
// Parte 1 (pura, SIN navegador): `src/lib/escalasYUnion.ts` y `reservasExtra.ts`, empaquetados con esbuild.
// Parte 2 (Roma) y parte 3 (Lanzarote; exige la API con DESTINOS_OCULTOS='-'): un Chrome de prueba cada una, por la cola. No toca el Supabase de producción (cuentas=off, sin sesión).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { abrir, R, QR_AZUL, QR_NEGRO, QR_ROJO } from './_montajeV76_b.mjs'

const QUE = process.argv[2] ?? 'todo'
const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  console.log(cond ? '  ok' : '  MAL', regla, String(texto).slice(0, 190))
  if (!cond) fallos.push({ regla, texto })
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* ═══ 1. La parte pura ═══ */
async function partePura() {
  console.log('1. Funciones puras (sin navegador)')
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'v76pura-')), 'puras.mjs')
  const r = await build({
    stdin: { contents: "export * from './src/lib/escalasYUnion.ts'; export * from './src/lib/reservasExtra.ts'", resolveDir: process.cwd(), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'error', define: { 'import.meta.env': '{}' },
  })
  fs.writeFileSync(salida, r.outputFiles[0].text)
  const m = await import(pathToFileURL(salida).href)
  const E = { compania: 'Iberia', codigo: 'IB 3921', salida: '08:30', llegada: '09:45', de: 'Barcelona (El Prat)', a: 'Madrid (MAD)' }
  // Las escalas guardadas.
  debe(igual(m.escalasDe({}, 'arrival'), []) && igual(m.escalasDe(null, 'departure'), []), 'escalas-sin', 'un viaje de antes (sin escalas) no tiene ninguna')
  debe(m.escalasDe({ arrivalEscalas: [E] }, 'arrival').length === 1 && m.escalasDe({ arrivalEscalas: [E] }, 'departure').length === 0, 'escalas-por-mitad', 'cada mitad lee las suyas')
  debe(m.escalasDe({ arrivalEscalas: [E, E, E, E, E] }, 'arrival').length === m.MAX_ESCALAS, 'escalas-tope', `como mucho ${m.MAX_ESCALAS} escalas`)
  const sucia = m.limpiarEscala({ compania: '  Iberia   Express ', codigo: ' IB  1 ', salida: '8:30', llegada: '25:99x', de: ' Madrid ', a: '' })
  debe(sucia.compania === 'Iberia Express' && sucia.salida === '08:30' && sucia.llegada === null && sucia.de === 'Madrid', 'escala-limpia', `limpia espacios y horas: ${JSON.stringify(sucia)}`)
  debe(m.escalaCompleta(E) && !m.escalaCompleta(m.escalaVacia()) && !m.escalaCompleta({ ...E, llegada: null }) && !m.escalaCompleta({ ...E, a: '' }), 'escala-completa', 'completa = de, a y las dos horas')
  // El orden de los tramos: la ida acaba en el de siempre; la vuelta empieza por él.
  const princIda = { salida: '11:00', llegada: '13:15', compania: 'Vueling', codigo: 'VY 6102', desde: 'Madrid (MAD)', hasta: 'Roma (Fiumicino)' }
  const ida = m.tramosDeLaMitad({ arrivalEscalas: [E] }, 'arrival', princIda)
  debe(ida.length === 2 && ida[0].principal === false && ida[1].principal === true && ida[0].n === 1 && ida[1].n === 2 && ida[1].de === 2 && ida[0].clave === 'escala:arrival:0' && ida[1].clave === 'principal', 'tramos-ida', 'IDA: la escala es el 1 de 2 y el de siempre el 2 de 2')
  debe(igual(ida.map((t) => m.etiquetaDeTramo('arrival', t.n, t.de)), ['IDA · 1 DE 2', 'IDA · 2 DE 2']), 'etiqueta-ida', 'IDA · 1 DE 2 / IDA · 2 DE 2')
  const vta = m.tramosDeLaMitad({ departureEscalas: [{ ...E, de: 'Madrid (MAD)', a: 'Barcelona (El Prat)', salida: '21:00', llegada: '22:15' }] }, 'departure', { salida: '19:30', llegada: '20:40', compania: 'Vueling', codigo: 'VY 6105', desde: 'Roma', hasta: 'Madrid (MAD)' })
  debe(vta.length === 2 && vta[0].principal === true && vta[1].principal === false && vta[1].n === 2 && vta[1].clave === 'escala:departure:0', 'tramos-vuelta', 'VUELTA: el de siempre es el 1 de 2 y la escala el 2 de 2')
  debe(igual(m.tramosDeLaMitad({}, 'arrival', princIda).map((t) => t.principal), [true]) && m.tramosDeLaMitad({}, 'arrival', princIda)[0].de === 1, 'tramos-sin-escalas', 'sin escalas hay un solo tramo (el de siempre)')
  // El tramo que toca a cada hora (para el QR de HOY).
  const min = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
  debe(m.tramoQueToca(ida, min('07:30')).n === 1 && m.tramoQueToca(ida, min('09:44')).n === 1, 'toca-ida-antes', 'ida: antes de que acabe la escala, toca la escala')
  debe(m.tramoQueToca(ida, min('09:50')).n === 2 && m.tramoQueToca(ida, min('12:00')).n === 2 && m.tramoQueToca(ida, min('15:00')).n === 2, 'toca-ida-despues', 'ida: acabada la escala (y pasada la llegada), toca el último')
  debe(m.tramoQueToca(vta, min('10:00')).principal === true && m.tramoQueToca(vta, min('19:00')).principal === true, 'toca-vuelta-primero', 'vuelta: hasta que sale el primero, toca el primero')
  debe(m.tramoQueToca(vta, min('20:50')).n === 2 && m.tramoQueToca(vta, min('21:30')).n === 2, 'toca-vuelta-segundo', 'vuelta: ya en el primero, toca el siguiente')
  debe(m.tramoQueToca([], 600) === null, 'toca-nada', 'sin tramos, ninguno')
  // Un tren o autobús unido.
  const ruta = { days: [{ dayNumber: 1 }, { dayNumber: 2 }, { dayNumber: 3, isReturnLeg: true }], answers: { dateRange: { start: '2026-10-17', end: '2026-10-20' } } }
  const rutaSinFechas = { days: [{ dayNumber: 1 }, { dayNumber: 2 }, { dayNumber: 3 }], answers: {} }
  const tren = (dia, kind = 'tren') => ({ kind, dateIso: dia, dayNumber: null })
  debe(m.mitadDeLaReserva(ruta, tren('2026-10-17')) === 'arrival' && m.mitadDeLaReserva(ruta, tren('2026-10-20')) === 'departure' && m.mitadDeLaReserva(ruta, tren('2026-10-18')) === null, 'mitad-fechas', 'con fechas: el día de llegada es la llegada, el de vuelta la vuelta, el de en medio ninguna')
  debe(m.mitadDeLaReserva(rutaSinFechas, { kind: 'bus', dateIso: null, dayNumber: 1 }) === 'arrival' && m.mitadDeLaReserva(rutaSinFechas, { kind: 'bus', dateIso: null, dayNumber: 3 }) === 'departure' && m.mitadDeLaReserva(rutaSinFechas, { kind: 'bus', dateIso: null, dayNumber: 2 }) === null, 'mitad-dias', 'sin fechas: el día 1 es la llegada y el último la vuelta')
  debe(m.mitadDeLaReserva(ruta, tren('2026-10-17', 'ferry')) === null && m.mitadDeLaReserva(ruta, tren('2026-10-17', 'otra')) === null && m.mitadDeLaReserva(null, tren('2026-10-17')) === null, 'mitad-solo-tren-y-bus', 'un ferry o «otra» no se unen a la llegada; sin ruta, nada')
  debe(m.preguntaDeUnion('arrival', 'aeropuerto') === '¿Es para ir del aeropuerto a tu alojamiento?' && m.preguntaDeUnion('departure', 'aeropuerto') === '¿Es para ir al aeropuerto?', 'pregunta', 'las dos preguntas, con el aeropuerto')
  debe(m.preguntaDeUnion('arrival', 'puerto') === '¿Es para ir del puerto a tu alojamiento?' && m.preguntaDeUnion('departure', 'estación') === '¿Es para ir a la estación?' && m.preguntaDeUnion('arrival', 'estación') === '¿Es para ir de la estación a tu alojamiento?', 'pregunta-sitios', 'puerto y estación: sin «de el»')
  debe(m.etiquetaDeUnion('tren', 'arrival') === 'TREN AL CENTRO' && m.etiquetaDeUnion('tren', 'departure') === 'TREN AL AEROPUERTO' && m.etiquetaDeUnion('bus', 'arrival') === 'AUTOBÚS AL CENTRO' && m.etiquetaDeUnion('bus', 'departure', 'estación') === 'AUTOBÚS A LA ESTACIÓN', 'etiqueta-union', 'TREN AL CENTRO / TREN AL AEROPUERTO / AUTOBÚS…')
  const LE = { kind: 'tren', name: 'Tren a Roma Termini', compania: 'Leonardo Express', time: '14:35', returnTime: '15:10', origen: 'Fiumicino', destinoDeViaje: 'Roma Termini' }
  debe(m.filaDeUnion(LE) === 'Leonardo Express · 14:35 · Fiumicino → Roma Termini', 'fila-union', m.filaDeUnion(LE))
  debe(m.filaDeUnion({ ...LE, compania: null }) === 'Tren a Roma Termini · 14:35 · Fiumicino → Roma Termini', 'fila-union-sin-compania', 'sin compañía sale el nombre de la reserva')
  const reservas = [{ ...LE, id: 'a', refId: 'a', unidaALlegada: 'arrival' }, { ...LE, id: 'b', refId: 'b', time: '09:00', unidaALlegada: 'arrival' }, { ...LE, id: 'c', refId: 'c', unidaALlegada: 'departure' }, { ...LE, id: 'd', refId: 'd' }, { kind: 'entrada', id: 'e', refId: 'e', time: '08:00' }]
  debe(igual(m.unidasA(reservas, 'arrival').map((r) => r.id), ['b', 'a']) && igual(m.unidasA(reservas, 'departure').map((r) => r.id), ['c']), 'unidas-a', 'las unidas a cada mitad, por hora; las sueltas y las entradas no')
  // Los bloques de RESERVAS no repiten el tren unido.
  debe(igual(m.bloquesExtra(reservas.slice(0, 3)).map((b) => b.tipo), []) && igual(m.bloquesExtra(reservas).map((b) => [b.tipo, b.reservas.map((r) => r.id)]), [['tren', ['d']]]), 'bloques-sin-unidas', 'el tren unido no sale en el bloque «Tren»; el suelto sí')
  // La estación del tren: la que se llama como su «De».
  const medio = { puntos: [{ id: 'termini', nombre: 'Roma Termini', corto: 'Termini' }, { id: 'tiburtina', nombre: 'Roma Tiburtina', corto: 'Tiburtina' }] }
  debe(m.puntoDeEstacion(medio, 'Roma Tiburtina')?.id === 'tiburtina' && m.puntoDeEstacion(medio, 'Termini')?.id === 'termini' && m.puntoDeEstacion(medio, 'ROMA TERMINI ')?.id === 'termini', 'estacion-del-tren', 'la estación sale del «De» de la reserva')
  debe(m.puntoDeEstacion({ puntos: [] }, 'Termini') === null && m.puntoDeEstacion(null, null) === null, 'estacion-vacia', 'sin puntos, ninguna')
  // (cierre V76) «Revisa las horas» también con [Sí, unirlo]: tren antes de aterrizar / después de salir el vuelo.
  const rv = { days: [{}], transportContext: { transport_option: { id: 'flight' } }, arrivalFlightTime: '11:15', departureFlightTime: '19:30' }
  const rA = m.revisionDeUnaUnion(rv, { ...LE, time: '08:30' }, 'arrival')
  debe(rA?.caso === 'vuelo' && /aterriza a las 11:15/.test(rA.texto) && /8:30/.test(rA.texto) && rA.otro.tipo === 'vuelo' && rA.otro.mitad === 'arrival', 'union-revisa-llegada', rA?.texto ?? 'null')
  debe(m.revisionDeUnaUnion(rv, { ...LE, time: '14:35' }, 'arrival') === null && m.revisionDeUnaUnion({ ...rv, arrivalFlightTime: null }, { ...LE, time: '08:30' }, 'arrival') === null, 'union-revisa-llegada-bien', 'un tren después de aterrizar, o sin hora de vuelo, no avisa')
  const rD = m.revisionDeUnaUnion(rv, { ...LE, time: '20:15' }, 'departure')
  debe(rD?.caso === 'vuelo' && /sale a las 19:30/.test(rD.texto) && m.revisionDeUnaUnion(rv, { ...LE, time: '16:00' }, 'departure') === null, 'union-revisa-vuelta', rD?.texto ?? 'null')
}

/* ═══ 2 y 3. El navegador ═══ */
async function parteNavegador(lanza) {
  const NOM = lanza ? 'Lanzarote' : 'Roma'
  console.log(`${lanza ? '3' : '2'}. En la app (${NOM}, iPhone 390x844)`)
  const { a, ev, clic, clicSel, poner, hora, montar, abrirLlegadaYVuelta, IDA, VUELTA } = await abrir(lanza)
  const ESC_IDA = { compania: 'Iberia', codigo: 'IB 3921', salida: lanza ? '07:50' : '08:30', llegada: lanza ? '09:15' : '09:45', de: 'Barcelona (El Prat)', a: 'Madrid (MAD)' }
  const RUTA_ESC = lanza
    ? { arrivalOtroPunto: 'Madrid (MAD)', arrivalOtraHora: '10:35', arrivalFlightTime: '13:05' }
    : { arrivalOtroPunto: 'Madrid (MAD)', arrivalOtraHora: '11:00', arrivalFlightTime: '13:15' }
  const LLEGA = RUTA_ESC.arrivalFlightTime
  const route = (campo) => ev(`${R}.getState().route.${campo}`)
  const texto = (sel) => ev(`(document.querySelector(${JSON.stringify(sel)})?.innerText ?? '').replace(/\\s+/g, ' ')`)
  const existe = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}) !== null`)
  const izq = (sel, dentro) => ev(`(() => { const e = ${dentro ? `document.querySelector(${JSON.stringify(dentro)})?.querySelector(${JSON.stringify(sel)})` : `document.querySelector(${JSON.stringify(sel)})`}; return e ? Math.round(e.getBoundingClientRect().left) : null })()`)
  const top = (sel, dentro) => ev(`(() => { const e = ${dentro ? `document.querySelector(${JSON.stringify(dentro)})?.querySelector(${JSON.stringify(sel)})` : `document.querySelector(${JSON.stringify(sel)})`}; return e ? Math.round(e.getBoundingClientRect().top) : null })()`)
  const minSimple = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
  try {
    /* — A. Un viaje sin escalas no cambia nada — */
    await montar({ modo: 'bookings' })
    await abrirLlegadaYVuelta()
    debe(!(await existe('[data-tramo]')) && (await existe('[data-mitad="arrival"]')) && (await existe('[data-mitad="departure"]')), `${NOM}·sin-escalas`, 'sin escalas: la ida y la vuelta son sus dos tarjetas de siempre, sin «1 DE 2»')
    debe((await route('arrivalEscalas')) == null && (await route('departureEscalas')) == null, `${NOM}·sin-escalas-datos`, 'sin escalas, la ruta no guarda ningún campo de escalas')
    debe(!/ DE \d/.test(await texto('[data-mitad="arrival"]')), `${NOM}·sin-escalas-rotulo`, 'la ida dice «IDA», no «IDA · 1 DE 1»')

    /* — B. La hoja «Tu vuelo»: + Añadir escala — */
    await montar({ modo: 'bookings', ruta: RUTA_ESC })
    await a.evaluar("(async () => { (await import('/src/store/useReservasFocusStore.ts')).useReservasFocusStore.getState().pedir('llegada', 'arrival'); return true })()")
    await a.esp(2200)
    debe(await existe('[data-escalas="ida"]'), `${NOM}·hoja-escalas`, 'la hoja «Tu vuelo» tiene «Añadir escala» en la ida')
    await clicSel('[data-anadir-escala="ida"]')
    await a.esp(500)
    debe((await existe('[data-escala="0"]')) && (await texto('[data-escala-titulo]')) === 'IDA · 1 DE 2', `${NOM}·hoja-escala-titulo`, `se añade un tramo: «${await texto('[data-escala-titulo]')}»`)
    debe(await ev("document.querySelector('[data-mi-vuelo-guardar]')?.disabled === true"), `${NOM}·hoja-escala-incompleta`, 'con la escala a medias, [Guardar el vuelo] está desactivado')
    debe((await texto('[data-vuelo-falta-escala]')).startsWith('Completa la escala'), `${NOM}·hoja-escala-aviso`, 'sale «Completa la escala: de dónde, a dónde y las dos horas»')
    await poner('[data-escala-compania]', ESC_IDA.compania)
    await poner('[data-escala-codigo]', ESC_IDA.codigo)
    await poner('[data-escala-de]', ESC_IDA.de)
    await poner('[data-escala-a]', ESC_IDA.a)
    await hora('[data-campo-de-hora="escala-0-salida"]')
    await hora('[data-campo-de-hora="escala-0-llegada"]')
    debe(!(await ev("document.querySelector('[data-mi-vuelo-guardar]')?.disabled ?? true")), `${NOM}·hoja-escala-lista`, 'con la escala completa, [Guardar el vuelo] se activa')
    // Con la rueda: el ✓ guarda la hora que se ve (08:30 y 10:45 por defecto).
    await clicSel('[data-mi-vuelo-guardar]')
    await a.esp(1500)
    const guardadas = await route('arrivalEscalas')
    debe(Array.isArray(guardadas) && guardadas.length === 1 && guardadas[0].compania === 'Iberia' && guardadas[0].codigo === 'IB 3921' && guardadas[0].de === ESC_IDA.de && guardadas[0].a === ESC_IDA.a && /^\d\d:\d\d$/.test(guardadas[0].salida) && /^\d\d:\d\d$/.test(guardadas[0].llegada), `${NOM}·hoja-guarda`, `la escala se guarda en la ruta: ${JSON.stringify(guardadas)}`)
    debe((await route('arrivalFlightTime')) === LLEGA && (await route('arrivalOtraHora')) === RUTA_ESC.arrivalOtraHora, `${NOM}·hoja-no-toca-el-tramo`, 'el tramo de siempre (el último) no cambia al añadir la escala')
    debe((await route('departureEscalas')) == null, `${NOM}·hoja-solo-ida`, 'la vuelta sigue sin escalas')

    /* — C. En RESERVAS, cada tramo es su tarjeta, con su QR, su lápiz y su papelera — */
    await montar({ modo: 'bookings', ruta: { ...RUTA_ESC, arrivalEscalas: [ESC_IDA] } })
    await abrirLlegadaYVuelta()
    const t1 = '[data-tramo="IDA · 1 DE 2"]'
    const t2 = '[data-tramo="IDA · 2 DE 2"]'
    debe((await existe(t1)) && (await existe(t2)), `${NOM}·tramos`, 'la ida son dos tarjetas: «IDA · 1 DE 2» e «IDA · 2 DE 2»')
    debe((await top(t1)) < (await top(t2)), `${NOM}·tramos-orden`, 'la escala (1 de 2) va encima del tramo que llega al destino (2 de 2)')
    debe((await texto(t1)).includes(ESC_IDA.salida) && (await texto(t1)).includes(ESC_IDA.llegada) && (await texto(t1)).includes('Barcelona (El Prat) → Madrid (MAD)') && (await texto(t1)).includes('IB 3921'), `${NOM}·tramo1-datos`, `el tramo 1 enseña horas, trayecto y vuelo: ${(await texto(t1)).slice(0, 120)}`)
    debe((await texto(t2)).includes(RUTA_ESC.arrivalOtraHora) && (await texto(t2)).includes(LLEGA) && (await texto(t2)).includes('Madrid (MAD) →') && (await texto(t2)).includes('VY 6102'), `${NOM}·tramo2-datos`, `el tramo 2 (el de siempre) enseña lo suyo: ${(await texto(t2)).slice(0, 120)}`)
    for (const [t, nombre] of [[t1, 'tramo 1'], [t2, 'tramo 2']]) {
      const q = await izq('[data-icono-documento]', t)
      const l = await izq('[data-lapiz]', t)
      const p = await izq('[data-papelera]', t)
      debe(q != null && l != null && p != null && q < l && l < p, `${NOM}·${nombre}-iconos`, `${nombre}: QR, lápiz y papelera, de izquierda a derecha (${q} < ${l} < ${p})`)
    }
    debe((await ev(`document.querySelector('${t1} [data-icono-documento]')?.getAttribute('data-icono-documento')`)) === 'falta' && (await ev(`document.querySelector('${t2} [data-icono-documento]')?.getAttribute('data-icono-documento')`)) === 'falta', `${NOM}·tramos-qr-gris`, 'sin billete, los dos QR están grises con «+»')
    debe((await existe(`${t1} [data-billete-hora-izq]`)) && (await texto(`${t1} [data-billete-hora-izq]`)) === ESC_IDA.salida && (await texto(`${t1} [data-billete-hora-der]`)) === ESC_IDA.llegada, `${NOM}·tramo1-horas`, 'el tramo 1: sale y llega a sus horas')
    debe((await existe('[data-mitad="departure"]')) && !(await existe('[data-tramo^="VUELTA"]')), `${NOM}·vuelta-sin-escala`, 'la vuelta (sin escalas) sigue siendo una tarjeta «VUELTA»')
    // Cada tramo con SU billete: el QR dorado y el que se ve es el suyo.
    await montar({ modo: 'bookings', ruta: { ...RUTA_ESC, arrivalEscalas: [ESC_IDA] }, billetes: [{ clave: 'escala:arrival:0', qr: QR_AZUL }, { clave: 'arrival', qr: QR_ROJO }] })
    await abrirLlegadaYVuelta()
    debe((await ev(`document.querySelector('${t1} [data-icono-documento]')?.getAttribute('data-icono-documento')`)) === 'si' && (await ev(`document.querySelector('${t2} [data-icono-documento]')?.getAttribute('data-icono-documento')`)) === 'si', `${NOM}·tramos-qr-dorado`, 'con billete en cada tramo, los dos QR están dorados')
    await clicSel(`${t1} [data-icono-documento]`)
    await a.esp(700)
    debe((await ev("document.querySelector('[data-codigo-imagen=\"grande\"]')?.getAttribute('src') ?? ''")).includes('1144cc'), `${NOM}·tramo1-su-qr`, 'el QR del tramo 1 abre SU código (el azul)')
    await clicSel('[data-billete-cerrar]')
    await a.esp(500)
    await clicSel(`${t2} [data-icono-documento]`)
    await a.esp(700)
    debe((await ev("document.querySelector('[data-codigo-imagen=\"grande\"]')?.getAttribute('src') ?? ''")).includes('cc1122'), `${NOM}·tramo2-su-qr`, 'el QR del tramo 2 abre SU código (el rojo)')
    await clicSel('[data-billete-cerrar]')
    await a.esp(500)
    // La papelera de la escala: la hoja de confirmar; solo [Sí, eliminar] la quita (y su billete).
    await clicSel(`${t1} [data-papelera]`)
    await a.esp(600)
    debe((await ev("document.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? ''")).includes('eliminar tu escala'), `${NOM}·papelera-escala-hoja`, `la hoja de confirmar: «${await ev("document.querySelector('[role=dialog]')?.getAttribute('aria-label') ?? ''")}»`)
    await clicSel('[data-eliminar-confirmar]')
    await a.esp(1100)
    debe((await route('arrivalEscalas')) == null && !(await existe('[data-tramo]')), `${NOM}·papelera-escala`, 'borrar la escala la quita de la ruta y la ida vuelve a ser una sola tarjeta')
    debe((await route('arrivalFlightTime')) === LLEGA, `${NOM}·papelera-escala-respeta`, 'el tramo de siempre se queda donde estaba')

    /* — D. La vuelta con escala: el de siempre es el 1 de 2 y la escala el 2 de 2 — */
    const ESC_VUELTA = { compania: 'Iberia', codigo: 'IB 3922', salida: '21:30', llegada: '22:40', de: 'Madrid (MAD)', a: 'Barcelona (El Prat)' }
    await montar({ modo: 'bookings', ruta: { departureOtroPunto: 'Madrid (MAD)', departureOtraHora: '21:45', departureEscalas: [ESC_VUELTA] } })
    await abrirLlegadaYVuelta()
    debe((await existe('[data-tramo="VUELTA · 2 DE 2"]')) && (await existe('[data-tramo="VUELTA · 1 DE 2"]')), `${NOM}·vuelta-tramos`, 'la vuelta son «VUELTA · 1 DE 2» y «VUELTA · 2 DE 2»')
    debe((await top('[data-tramo="VUELTA · 1 DE 2"]')) < (await top('[data-tramo="VUELTA · 2 DE 2"]')), `${NOM}·vuelta-orden`, 'el que sale del destino (el de siempre) va primero y la escala debajo')
    debe((await texto('[data-tramo="VUELTA · 2 DE 2"]')).includes('Madrid (MAD) → Barcelona (El Prat)') && (await texto('[data-tramo="VUELTA · 1 DE 2"]')).includes('19:30'), `${NOM}·vuelta-datos`, 'cada tramo de la vuelta enseña lo suyo')
    debe((await existe('[data-tramo="VUELTA · 2 DE 2"] [data-icono-documento]')) && (await existe('[data-tramo="VUELTA · 2 DE 2"] [data-lapiz]')) && (await existe('[data-tramo="VUELTA · 2 DE 2"] [data-papelera]')), `${NOM}·vuelta-iconos`, 'la escala de la vuelta lleva sus tres iconos')

    /* — E. El motor y HOY usan la llegada del ÚLTIMO tramo y la salida del PRIMERO — */
    const motor = await ev(`(async () => {
      const L = await import('/src/lib/llegadaVuelta.ts')
      const AR = await import('/src/lib/arrivalReturn.ts')
      const AV = await import('/src/lib/adaptarVuelos.ts')
      const st = ${R}.getState()
      const base = JSON.parse(window.__base)
      const mk = (extra) => ({ ...base, ...${JSON.stringify({ arrivalFlightTime: lanza ? '08:25' : '11:15', arrivalCodigo: 'VY 6102', arrivalOtraHora: lanza ? '06:30' : '08:35', departureFlightTime: '19:30', departureCodigo: 'VY 6105', departureOtraHora: lanza ? '22:05' : '21:45', arrivalPointId: lanza ? 'ace' : 'fco', departurePointId: lanza ? 'ace' : 'fco' })}, ...extra })
      const info = await AR.fetchArrivalInfo(base.destination).catch(() => null)
      const sin = mk({ ...${JSON.stringify(RUTA_ESC)} })
      const con = mk({ ...${JSON.stringify(RUTA_ESC)}, arrivalEscalas: [${JSON.stringify(ESC_IDA)}], departureEscalas: [${JSON.stringify(ESC_VUELTA)}] })
      const dSin = L.datosParaMotor(sin, [], info)
      const dCon = L.datosParaMotor(con, [], info)
      const hoy = ${JSON.stringify(lanza ? '2026-11-01' : '2026-10-01')}
      const pSin = await AV.propuestaDeVuelos(sin, [], { pase: true, hoy })
      const pCon = await AV.propuestaDeVuelos(con, [], { pase: true, hoy })
      const primera = (p) => { const d = p?.dias?.find((x) => x.dayNumber === 1); return d ? d.next.stops[0]?.time ?? null : null }
      return JSON.stringify({ lSin: dSin.llegada?.hora, lCon: dCon.llegada?.hora, vSin: dSin.vuelta?.hora, vCon: dCon.vuelta?.hora, igualesLlegada: JSON.stringify(dSin.llegada) === JSON.stringify(dCon.llegada), igualesVuelta: JSON.stringify(dSin.vuelta) === JSON.stringify(dCon.vuelta), planSin: pSin?.planes?.llegada?.entrada?.hora ?? null, planCon: pCon?.planes?.llegada?.entrada?.hora ?? null, primeraSin: primera(pSin), primeraCon: primera(pCon), hayDias: Boolean(pCon?.dias?.length) })
    })()`)
    const M = JSON.parse(motor)
    debe(M.lCon === LLEGA && M.vCon === '19:30', `${NOM}·motor-horas`, `el motor recibe la llegada del ÚLTIMO tramo (${M.lCon}) y la salida del PRIMERO (${M.vCon})`)
    debe(M.igualesLlegada && M.igualesVuelta, `${NOM}·motor-igual`, 'lo que se manda al motor con escalas es EXACTAMENTE lo mismo que sin ellas (cambian los vuelos no la ruta)')
    // (En Lanzarote el motor de coche no devuelve `arrival_plan`: la llegada se comprueba con la primera parada del día 1.)
    if (!lanza) debe(M.planCon === LLEGA && M.planCon === M.planSin, `${NOM}·motor-plan`, `el plan de la llegada del motor cuenta desde las ${M.planCon}`)
    debe(M.hayDias && M.primeraCon != null && M.primeraCon === M.primeraSin, `${NOM}·motor-ruta-empieza`, `la primera parada del día 1 es la misma con y sin escala (${M.primeraCon} · ${M.primeraSin}); empieza tras la llegada del último tramo`)
    if (M.primeraCon) debe(minSimple(M.primeraCon) >= minSimple(LLEGA), `${NOM}·motor-tras-el-ultimo`, `la ruta empieza (${M.primeraCon}) después de que llegue el último tramo (${LLEGA})`)
    // Quitar la llegada con escalas también quita sus escalas (no se queda ninguna huérfana).
    await ev(`(async () => { ${R}.getState().removeFlightLeg('arrival'); return true })()`)
    debe((await route('arrivalEscalas')) == null, `${NOM}·quitar-ida-quita-escalas`, 'quitar la ida quita también sus escalas')

    /* — F. HOY: la tarjeta enseña el último tramo y el QR es el del tramo que toca a esa hora — */
    const qrDeHoy = async (min) => {
      await montar({ modo: 'today', dia: 'ida', min, ruta: { ...RUTA_ESC, arrivalEscalas: [ESC_IDA] }, billetes: [{ clave: 'escala:arrival:0', qr: QR_AZUL }, { clave: 'arrival', qr: QR_ROJO }] })
      const hecho = await texto('[data-hoy-llegada-tarjeta]')
      await clicSel('[data-hoy-llegada-tarjeta] [data-icono-documento]')
      await a.esp(800)
      const src = await ev("document.querySelector('[data-codigo-imagen=\"grande\"]')?.getAttribute('src') ?? ''")
      await clicSel('[data-billete-cerrar]')
      await a.esp(400)
      return { hecho, src }
    }
    const antes = await qrDeHoy(7 * 60 + 30)
    debe(antes.src.includes('1144cc'), `${NOM}·hoy-qr-escala`, 'HOY a las 7:30 (aún en la escala): el QR es el de la escala (el azul)')
    const despues = await qrDeHoy(10 * 60 + 30)
    debe(despues.src.includes('cc1122'), `${NOM}·hoy-qr-ultimo`, 'HOY a las 10:30 (ya en el último tramo): el QR es el del último tramo (el rojo)')
    debe((await texto('[data-hoy-llegada-hora]')) === LLEGA && (await texto('[data-hoy-llegada-salida]')) === RUTA_ESC.arrivalOtraHora, `${NOM}·hoy-ultimo-tramo`, `la tarjeta de llegada enseña el ÚLTIMO tramo (${RUTA_ESC.arrivalOtraHora} → ${LLEGA})`)
    debe(!despues.hecho.includes(ESC_IDA.codigo) && !despues.hecho.includes('Iberia'), `${NOM}·hoy-solo-ultimo`, 'la tarjeta de HOY no enseña la escala (solo el último tramo)')
    // El QR gris del tramo que toca lleva a RESERVAS (regla V62).
    await montar({ modo: 'today', dia: 'ida', min: 7 * 60 + 30, ruta: { ...RUTA_ESC, arrivalEscalas: [ESC_IDA] }, billetes: [{ clave: 'arrival', qr: QR_ROJO }] })
    debe((await ev("document.querySelector('[data-hoy-llegada-tarjeta] [data-icono-documento]')?.getAttribute('data-icono-documento')")) === 'falta', `${NOM}·hoy-qr-gris`, 'si falta el billete del tramo que toca, el QR de HOY está gris con «+» (aunque el último sí lo tenga)')
    await clicSel('[data-hoy-llegada-tarjeta] [data-icono-documento]')
    await a.esp(1200)
    debe((await ev(`${R}.getState().mode`)) === 'bookings', `${NOM}·hoy-qr-gris-reservas`, 'al tocar el QR gris de HOY, abre RESERVAS')

    if (!lanza) await parteTren({ a, ev, clic, clicSel, poner, hora, montar, abrirLlegadaYVuelta, IDA, VUELTA, NOM, texto, existe, izq, top, route })
  } finally {
    a.cerrar()
  }
}

/* ═══ El tren unido (solo Roma: Lanzarote va en coche) ═══ */
async function parteTren({ a, ev, clic, clicSel, poner, hora, montar, abrirLlegadaYVuelta, IDA, VUELTA, NOM, texto, existe, izq, top, route }) {
  const TREN = (id, dateIso, time, llegada, desde, hasta, extra = {}) => ({ id, kind: 'tren', refId: id, name: `Tren a ${hasta}`, placeNames: [], dateIso, dayNumber: null, time, returnTime: llegada, meetingPoint: null, locator: null, precio: null, noMueve: true, compania: 'Leonardo Express', origen: desde, destinoDeViaje: hasta, coche: null, asiento: null, lugar: null, ...extra })
  const guardarTren = async (diaId, { origen, destino }) => {
    await a.evaluar("(async () => { (await import('/src/store/useAnadirReservaStore.ts')).useAnadirReservaStore.getState().abrirFormulario('tren'); return true })()")
    await a.esp(1300)
    await poner('[data-extra-campo="compania"]', 'Leonardo Express')
    await poner('[data-extra-campo="origen"]', origen)
    await poner('[data-extra-campo="destino"]', destino)
    await clicSel(`[data-dia-cuadrado="${diaId}"]`)
    await a.esp(250)
    await hora('[data-campo-de-hora="extra-tren-hora"]')
    await clicSel('[data-guardar-extra="tren"]')
    await a.esp(1300)
  }
  const diaId = (que) => ev(`${R}.getState().route.days.at(${que === 'primero' ? '0' : que === 'ultimo' ? '-1' : '1'}).id`)
  const reservas = () => ev(`${R}.getState().reservations.map((r) => ({ id: r.id, kind: r.kind, unidaALlegada: r.unidaALlegada ?? null, unidaA: r.unidaA ?? null }))`)
  const casilla = async (sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); return e ? Math.round(e.getBoundingClientRect().top) : null })()`)

  /* — G. La llegada: «¿Es para ir del aeropuerto a tu alojamiento?» — */
  const TEMPRANO = { arrivalFlightTime: '05:30', arrivalOtraHora: '03:40' } // el tren de las 8:30 cae DESPUÉS de aterrizar (si no, sale antes «Revisa las horas», de la R10)
  await montar({ modo: 'bookings', ruta: TEMPRANO })
  await guardarTren(await diaId('primero'), { origen: 'Fiumicino', destino: 'Roma Termini' })
  debe((await texto('[data-hoja="unir-llegada"]')).includes('¿Es para ir del aeropuerto a tu alojamiento?'), `${NOM}·g-pregunta`, `la pregunta de la llegada: «${(await texto('[data-hoja="unir-llegada"]')).slice(0, 80)}»`)
  debe((await texto('[data-hoja="unir-llegada"]')).includes('Tren') && (await texto('[data-hoja="unir-llegada"]')).includes('Fiumicino → Roma Termini'), `${NOM}·g-billete`, 'la hoja enseña el billete debajo (tren, trayecto)')
  debe((await texto('[data-boton-hoja="unir-si"]')) === 'Sí, unirlo a mi llegada' && (await texto('[data-boton-hoja="unir-no"]')) === 'No, guardarlo aparte', `${NOM}·g-botones`, 'los botones: [Sí, unirlo a mi llegada] y [No, guardarlo aparte]')
  debe((await top('[data-boton-hoja="unir-si"]')) === (await top('[data-boton-hoja="unir-no"]')) && (await izq('[data-boton-hoja="unir-si"]')) < (await izq('[data-boton-hoja="unir-no"]')), `${NOM}·g-lado-a-lado`, 'los dos botones van lado a lado (el dorado a la izquierda)')
  debe((await reservas()).length === 0, `${NOM}·g-no-guarda-antes`, 'hasta contestar, no se guarda nada')
  // [No]: se guarda aparte, en el bloque «Tren».
  await clicSel('[data-boton-hoja="unir-no"]')
  await a.esp(1500)
  // (Si el tren de las 8:30 choca con una parada del día, sale «Revisa las horas» de la R10: se guarda igualmente.)
  if (await clic('Guardarla igualmente')) await a.esp(1300)
  let rs = await reservas()
  debe(rs.length === 1 && rs[0].kind === 'tren' && rs[0].unidaALlegada === null, `${NOM}·g-no`, '[No, guardarlo aparte]: se guarda como un tren suelto (sin unirse)')
  debe((await existe('[data-blk="extra-tren"]')), `${NOM}·g-no-bloque`, 'el tren suelto sale en su bloque «Tren»')
  // [Sí]: se une a la llegada.
  await montar({ modo: 'bookings', ruta: TEMPRANO })
  await guardarTren(await diaId('primero'), { origen: 'Fiumicino', destino: 'Roma Termini' })
  await clicSel('[data-boton-hoja="unir-si"]')
  await a.esp(1500)
  rs = await reservas()
  debe(rs.length === 1 && rs[0].unidaALlegada === 'arrival', `${NOM}·g-si`, '[Sí, unirlo a mi llegada]: la reserva lleva unidaALlegada = arrival')
  debe(!(await existe('[data-blk="extra-tren"]')) && !(await existe('[data-otras-reservas]')), `${NOM}·g-si-sin-bloque`, 'unido a la llegada, NO sale el bloque «Tren» aparte')
  await abrirLlegadaYVuelta()
  const u = '[data-unida-a="arrival"]'
  debe(await existe(u), `${NOM}·g-union-en-llegada`, 'el tren sale dentro de «Llegada y vuelta»')
  debe((await texto(u)).startsWith('TREN AL CENTRO'), `${NOM}·g-etiqueta`, `la etiqueta de la tarjeta: «${(await texto(u)).slice(0, 40)}»`)
  debe((await top('[data-mitad="arrival"]')) < (await top(u)) && (await top(u)) < (await top('[data-mitad="departure"]')), `${NOM}·g-debajo-de-su-vuelo`, 'va debajo de su vuelo (la ida) y encima de la vuelta')
  const qi = await izq('[data-icono-documento]', u)
  const li = await izq('[data-lapiz]', u)
  const pi = await izq('[data-papelera]', u)
  debe(qi != null && li != null && pi != null && qi < li && li < pi, `${NOM}·g-tres-iconos`, `sus tres iconos: QR, lápiz y papelera (${qi} < ${li} < ${pi})`)
  // La cuenta «X de N reservas listas» no cambia por un tren unido.
  const contador = (t) => (t.match(/(\d+) de (\d+) reservas listas/) || [''])[0]
  await ev("(async () => { window.scrollTo(0, 0); return true })()")
  const conTren = contador(await ev("document.body.innerText"))
  await montar({ modo: 'bookings' })
  debe(conTren === contador(await ev("document.body.innerText")), `${NOM}·g-contador`, `el contador «X de N reservas listas» no cambia por el tren unido («${conTren}»)`)

  // (cierre V76) [Sí, unirlo] con el tren ANTES de aterrizar (el viaje de siempre aterriza más tarde que las 8:30): también sale «Revisa las horas»; «Guardarla igualmente» la guarda unida.
  await montar({ modo: 'bookings' })
  await guardarTren(await diaId('primero'), { origen: 'Fiumicino', destino: 'Roma Termini' })
  if (await existe('[data-hoja="unir-llegada"]')) {
    await clicSel('[data-boton-hoja="unir-si"]')
    await a.esp(1500)
    debe(await existe('[data-hoja-revisa-las-horas="vuelo"]'), `${NOM}·g-si-revisa`, 'unido a la llegada con el tren antes de aterrizar: sale «Revisa las horas» también con [Sí]')
    await a.esp(600)
    debe(await a.evaluar("(() => { const b = document.querySelector('[data-revisa-otro]'); if (!b) return false; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return Boolean(e && e.closest('[data-hoja-revisa-las-horas]')) })()"), `${NOM}·g-si-revisa-encima`, '«Revisa las horas» se VE encima de la hoja del formulario (no queda tapada por ella)')
    debe((await reservas()).length === 0, `${NOM}·g-si-revisa-no-guarda`, 'hasta contestar, no se guarda')
    if (await clic('Guardarla igualmente')) await a.esp(1300)
    rs = await reservas()
    debe(rs.length === 1 && rs[0].unidaALlegada === 'arrival', `${NOM}·g-si-revisa-guarda`, '«Guardarla igualmente»: se guarda unida a la llegada')
  } else debe(false, `${NOM}·g-si-revisa-pregunta`, 'con la ruta de siempre sale la pregunta de unir')

  /* — HOY, el día de llegada: solo se añade la fila del tren con su QR — */
  const LE_IDA = TREN('res-tren-ida', IDA, '14:35', '15:10', 'Fiumicino', 'Roma Termini', { unidaALlegada: 'arrival' })
  await montar({ modo: 'today', dia: 'ida', min: 12 * 60, reservas: [LE_IDA] })
  const fila = '[data-hoy-union="arrival"]'
  debe((await texto(fila)).replace(/[ +]+$/, '') ==='Leonardo Express · 14:35 · Fiumicino → Roma Termini', `${NOM}·g-hoy-fila`, `HOY, la llegada: «${await texto(fila)}»`)
  debe((await ev("document.querySelector('[data-hoy-union=\"arrival\"] [data-icono-documento]')?.getAttribute('data-icono-documento')")) === 'falta', `${NOM}·g-hoy-qr-gris`, 'sin billete, el QR de la fila está gris con «+»')
  debe((await existe('[data-hoy-llegada-tarjeta]')) && (await existe('[data-hoy-cajas]')) && (await existe('[data-hoy-he-aterrizado]')), `${NOM}·g-hoy-tarjeta-intacta`, 'la tarjeta de llegada (V62) sigue igual: sus cajas y [He aterrizado]')
  await clicSel(`${fila} [data-icono-documento]`)
  await a.esp(1200)
  debe((await ev(`${R}.getState().mode`)) === 'bookings', `${NOM}·g-hoy-qr-gris-reservas`, 'el QR gris de la fila abre RESERVAS (regla V62)')
  await montar({ modo: 'today', dia: 'ida', min: 12 * 60, reservas: [LE_IDA], billetes: [{ clave: 'res-tren-ida', qr: QR_AZUL }] })
  debe((await ev("document.querySelector('[data-hoy-union=\"arrival\"] [data-icono-documento]')?.getAttribute('data-icono-documento')")) === 'si', `${NOM}·g-hoy-qr-dorado`, 'con billete guardado en RESERVAS, el QR de la fila de HOY está dorado (el mismo dato)')
  await clicSel(`${fila} [data-icono-documento]`)
  await a.esp(800)
  debe((await ev("document.querySelector('[data-codigo-imagen=\"grande\"]')?.getAttribute('src') ?? ''")).includes('1144cc'), `${NOM}·g-hoy-qr-abre`, 'el QR de la fila abre el código del tren')
  await clicSel('[data-billete-cerrar]')
  await a.esp(400)
  // Lo que se cambia en RESERVAS se cambia en HOY: otra hora de tren.
  await ev(`(async () => { const st = ${R}; st.setState({ reservations: st.getState().reservations.map((r) => ({ ...r, time: '15:05' })) }); return true })()`)
  await a.esp(900)
  debe((await texto(fila)).includes('15:05'), `${NOM}·g-hoy-mismos-datos`, 'si cambia la hora en la reserva, cambia en HOY (nada se copia)')

  /* — H. La vuelta: «¿Es para ir al aeropuerto?»; SALIR sale de la hora del tren — */
  await montar({ modo: 'bookings', dia: 'vuelta' })
  await guardarTren(await diaId('ultimo'), { origen: 'Roma Termini', destino: 'Fiumicino' })
  debe((await texto('[data-hoja="unir-llegada"]')).includes('¿Es para ir al aeropuerto?') && (await texto('[data-boton-hoja="unir-si"]')) === 'Sí, unirlo a mi vuelta', `${NOM}·h-pregunta`, `la pregunta de la vuelta: «${(await texto('[data-hoja="unir-llegada"]')).slice(0, 60)}»`)
  await clicSel('[data-boton-hoja="unir-si"]')
  await a.esp(1500)
  rs = await reservas()
  debe(rs.length === 1 && rs[0].unidaALlegada === 'departure', `${NOM}·h-si`, 'la reserva lleva unidaALlegada = departure')
  await abrirLlegadaYVuelta()
  debe((await texto('[data-unida-a="departure"]')).startsWith('TREN AL AEROPUERTO') && (await top('[data-mitad="departure"]')) < (await top('[data-unida-a="departure"]')), `${NOM}·h-etiqueta`, 'en RESERVAS: «TREN AL AEROPUERTO», debajo de su vuelo (la vuelta)')
  const LE_VTA = TREN('res-tren-vuelta', VUELTA, '14:35', '15:10', 'Roma Termini', 'Fiumicino', { unidaALlegada: 'departure' })
  const salir = async (reservasHoy) => {
    await montar({ modo: 'today', dia: 'vuelta', min: 10 * 60, reservas: reservasHoy })
    return ev(`(() => { const t = document.querySelector('[data-hoy-vuelta-tarjeta]'); const c = (d) => t?.querySelector('[data-caja-parada="' + d + '"]')?.innerText?.replace(/\\s+/g, ' ') ?? null; return JSON.stringify({ union: document.querySelector('[data-hoy-union]') !== null, salir: c('salir'), aeropuerto: c('aeropuerto'), todo: t?.innerText?.replace(/\\s+/g, ' ').slice(0, 500) ?? '' }) })()`).then((x) => JSON.parse(x))
  }
  const sinTren = await salir([])
  const conTren2 = await salir([LE_VTA])
  const horaDe = (t) => (/(\d{1,2}:\d{2})/.exec(t ?? '') || [])[1] ?? null
  debe(conTren2.todo.includes('AEROPUERTO') && conTren2.todo.includes('14:35') && conTren2.todo.includes('Leonardo Express'), `${NOM}·h-caja-aeropuerto`, `la caja AEROPUERTO dice la hora y el nombre del tren: «${conTren2.aeropuerto ?? conTren2.todo.slice(0, 120)}»`)
  debe(await existe('[data-hoy-union="departure"]') && (await texto('[data-hoy-union="departure"]')).replace(/[ +]+$/, '') ==='Leonardo Express · 14:35 · Roma Termini → Fiumicino', `${NOM}·h-fila`, `debajo, la fila con su QR: «${await texto('[data-hoy-union="departure"]')}»`)
  debe(!sinTren.todo.includes('14:35') && sinTren.union === false, `${NOM}·h-sin-tren-igual`, 'sin tren unido, la tarjeta de la vuelta no cambia (sigue la de siempre)')
  const verSalir = await ev(`(async () => {
    const V = await import('/src/components/route/hoy/v2/VueltaH14.tsx')
    const AR = await import('/src/lib/arrivalReturn.ts')
    const route = ${R}.getState().route
    const info = await AR.fetchArrivalInfo(route.destination)
    const modes = AR.tripModes(route)
    const point = AR.puntoDeLaMitad(AR.medioOf(info, modes.departure), route.departurePointId, true).point
    const mitad = { mode: modes.departure, point, billete: null, hora: route.departureFlightTime, origen: '', destino: '' }
    const day = route.days.at(-1)
    const sin = V.datosDeLaSalida({ route, day, mitad, info })
    const con = V.datosDeLaSalida({ route, day, mitad, info, tren: { kind: 'tren', time: '14:35', origen: 'Roma Termini' } })
    const tarde = V.datosDeLaSalida({ route, day, mitad, info, tren: { kind: 'tren', time: '17:05', origen: 'Roma Termini' } })
    return JSON.stringify({ sin, con, tarde })
  })()`)
  const S = JSON.parse(verSalir)
  const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3))
  debe(S.con.viaEstacion === true && !S.sin.viaEstacion, `${NOM}·h-via-estacion`, 'con tren unido, la cuenta es hasta la ESTACIÓN (viaEstacion)')
  debe(S.con.hasta && S.sin.hasta && aMin(S.con.hasta) < aMin('14:35') && aMin(S.con.hasta) < aMin(S.sin.hasta), `${NOM}·h-salir-del-tren`, `SALIR sale de la hora del tren (14:35 → salir ${S.con.hasta}), no de la del vuelo (19:30 → ${S.sin.hasta})`)
  debe(S.con.trayectoMin != null && S.con.trayectoMin !== S.sin.trayectoMin, `${NOM}·h-trayecto-a-la-estacion`, `el trayecto es del alojamiento a la estación (${S.con.trayectoMin} min), no al aeropuerto (${S.sin.trayectoMin} min)`)
  debe(S.tarde.hasta && aMin(S.tarde.hasta) > aMin(S.con.hasta), `${NOM}·h-sigue-la-hora`, `con un tren más tarde (17:05), SALIR sale más tarde (${S.tarde.hasta} > ${S.con.hasta})`)
  debe(S.con.hora === '19:30', `${NOM}·h-hora-del-vuelo`, 'la hora del vuelo no cambia (19:30): solo cambia cuándo salir')
  debe(horaDe(conTren2.salir) === S.con.hasta.replace(/^0/, '') || horaDe(conTren2.salir) === S.con.hasta, `${NOM}·h-caja-salir`, `la caja SALIR de la tarjeta dice ${horaDe(conTren2.salir)} (la cuenta: ${S.con.hasta})`)
  debe(horaDe(sinTren.salir) === S.sin.hasta, `${NOM}·h-caja-salir-sin`, `sin tren, SALIR sigue en ${horaDe(sinTren.salir)} (${S.sin.hasta})`)
  debe(!(await texto('[data-hoy-vuelta-tarjeta]')).includes('undefined') && !(await texto('[data-hoy-vuelta-tarjeta]')).includes('null'), `${NOM}·h-sin-null`, 'la tarjeta no dice «undefined» ni «null»')

  /* — I. Lo que NO se pregunta — */
  await montar({ modo: 'bookings' })
  await guardarTren(await diaId('medio'), { origen: 'Roma Termini', destino: 'Florencia' })
  debe(!(await existe('[data-hoja="unir-llegada"]')) && (await reservas()).every((r) => r.unidaALlegada === null), `${NOM}·i-dia-de-en-medio`, 'un tren un día de en medio no pregunta «¿Es para…?» (no se une a nada)')
  await montar({ modo: 'bookings', ruta: { arrivalFlightTime: null, arrivalCodigo: null, arrivalOtraHora: null } })
  await guardarTren(await diaId('primero'), { origen: 'Fiumicino', destino: 'Roma Termini' })
  debe(!(await existe('[data-hoja="unir-llegada"]')) && (await reservas()).every((r) => r.unidaALlegada === null), `${NOM}·i-sin-vuelo`, 'sin vuelo de llegada puesto, no hay a qué unirlo y no pregunta')
  // Cambiar uno ya guardado y unido no vuelve a preguntar y sigue unido.
  await montar({ modo: 'bookings', reservas: [LE_IDA] })
  await a.evaluar("(async () => { (await import('/src/store/useAnadirReservaStore.ts')).useAnadirReservaStore.getState().abrirFormulario('tren', 'res-tren-ida'); return true })()")
  await a.esp(1300)
  await poner('[data-extra-campo="asiento"]', '12A')
  await clicSel('[data-guardar-extra="tren"]')
  await a.esp(1300)
  const tras = await ev(`${R}.getState().reservations.map((r) => ({ a: r.asiento, u: r.unidaALlegada ?? null }))`)
  debe(!(await existe('[data-hoja="unir-llegada"]')) && tras.length === 1 && tras[0].a === '12A' && tras[0].u === 'arrival', `${NOM}·i-editar-sigue-unido`, 'cambiar un tren ya unido (el lápiz) no vuelve a preguntar y sigue unido')
  // Borrarlo desde la tarjeta de «Llegada y vuelta».
  await abrirLlegadaYVuelta()
  await clicSel('[data-unida-a="arrival"] [data-papelera]')
  await a.esp(600)
  await clicSel('[data-eliminar-confirmar]')
  await a.esp(1100)
  debe((await reservas()).length === 0 && !(await existe('[data-unida-a]')), `${NOM}·i-borrar`, 'la papelera de la tarjeta unida quita la reserva')
}

try {
  if (QUE === 'todo' || QUE === 'pura') await partePura()
  if (QUE === 'todo' || QUE === 'roma') await parteNavegador(false)
  if (QUE === 'todo' || QUE === 'lanza') await parteNavegador(true)
} catch (e) {
  fallos.push({ regla: 'excepción', texto: String(e?.stack ?? e).slice(0, 600) })
  console.log('EXCEPCIÓN', e?.stack ?? e)
}
console.log(`\n${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(' ✗', f.regla, '·', String(f.texto).slice(0, 220))
process.exit(fallos.length ? 1 : 0)
