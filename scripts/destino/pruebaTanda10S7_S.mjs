// Tanda 10S7 (agente S): las entradas y el Free Tour con su billete (apartado 3) y el botón del código en «Entradas y Free Tour» (apartado 4).
//   1 · la lectura de una entrada en el servidor (server/billete/lectura.js): solo campos con forma buena, sin nombres de personas.
//   2 · el billete de las entradas en el store (el MISMO documento privado de `billetes_personales`, 0070, sin tabla nueva): sube, otro móvil de la misma persona lo trae, otra cuenta no lo ve, sin conexión queda pendiente,
//       y lo del vuelo y lo de las entradas conviven.
//   3 · en la app (Chrome): [Añadir tu entrada] (E1) con un PDF de verdad (el QR se lee de verdad en el navegador), la hoja sale rellena (personas, localizador, código), E2 con «2 personas», «Localizador» y el código
//       pequeño con «Toca para ampliar», E3 a pantalla completa, el botón del código de L2 (solo con billete), sin internet, privado (el localizador NO va a la ruta compartida; lo de otra persona no se ve),
//       E4 «Tu entrada» en HOY solo con pase.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7_S.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'

const fallos = []
let comprobaciones = 0
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  ✗ [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')

// ═══ 1. El servidor lee una entrada ═══
console.log('1. La lectura de una entrada (servidor)')
{
  const { limpiarLecturaEntrada, LEER_ENTRADA_SISTEMA } = await import('../../server/billete/lectura.js')
  const buena = limpiarLecturaEntrada({ fecha: '2026-12-05', hora: '9:00', personas: 2, localizador: ' ABC123 ', codigo_caja: { pagina: 1, x0: 0.5, y0: 0.1, x1: 0.9, y1: 0.4 }, nombre: 'ANA PRUEBA' })
  debe(buena.fecha === '2026-12-05' && buena.hora === '09:00' && buena.personas === 2 && buena.localizador === 'ABC123', '1 limpia', `lo bueno se queda (${JSON.stringify(buena)})`)
  debe(buena.codigo_caja?.pagina === 1 && !('nombre' in buena), '1 limpia', 'la caja del código se queda y el nombre de la persona nunca sale')
  const mala = limpiarLecturaEntrada({ fecha: '5 de diciembre', hora: '25:99', personas: 'muchas', localizador: 12, codigo_caja: { x0: 2 } })
  debe(mala.fecha === null && mala.hora === null && mala.personas === null && mala.localizador === null && mala.codigo_caja === null, '1 limpia', `lo que no tiene forma buena es null (${JSON.stringify(mala)})`)
  debe(limpiarLecturaEntrada({ personas: '3' }).personas === 3 && limpiarLecturaEntrada({ personas: 0 }).personas === null && limpiarLecturaEntrada({ personas: 99 }).personas === null, '1 limpia', 'personas: «3» vale, 0 y 99 no')
  debe(limpiarLecturaEntrada(null).fecha === null, '1 limpia', 'una respuesta rota no tumba nada')
  debe(/No devuelvas el nombre/.test(LEER_ENTRADA_SISTEMA) && !/pasajero/i.test(LEER_ENTRADA_SISTEMA.replace(/No devuelvas el nombre[^.]*\./, '')), '1 privado', 'la IA no devuelve nombres de personas')
  const fuente = leer('server/billete/lectura.js')
  debe(/tipo === 'entrada'/.test(fuente) && /read-entry-ticket/.test(fuente), '1 endpoint', 'el mismo endpoint /api/read-ticket lee entradas con tipo «entrada» (y registra solo el coste)')
}

// ═══ 2. El billete de las entradas en el store ═══
console.log('2. El billete de las entradas (store + nube de mentira con RLS)')
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba10s7s-'))
  const falso = path.join(tmp, 'supabaseFalso.ts')
  fs.writeFileSync(falso, `
export const nube: any = ((globalThis as any).__nubeFalsa7 ??= { filas: new Map<string, any>(), uid: 'u1' as string | null, sinRed: false })
const clave = (t: string, u: string) => t + '|' + u
export const supabase: any = {
  auth: { getUser: async () => (nube.sinRed ? { data: { user: null } } : { data: { user: nube.uid ? { id: nube.uid } : null } }) },
  from: (_t: string) => ({
    select: () => {
      const f: any = {}
      const eq = (c: string, v: string) => { f[c] = v; return q }
      const q: any = { eq, maybeSingle: async () => {
        if (nube.sinRed) return { data: null, error: { message: 'Failed to fetch' } }
        return { data: nube.filas.get(clave(f.trip_id, nube.uid)) ?? null, error: null }
      } }
      return q
    },
    upsert: async (row: any) => {
      if (nube.sinRed) return { error: { message: 'Failed to fetch' } }
      if (row.user_id !== nube.uid) return { error: { message: 'new row violates row-level security policy' } }
      nube.filas.set(clave(row.trip_id, row.user_id), { datos: row.datos, actualizado_en: row.actualizado_en })
      return { error: null }
    },
  }),
}
`)
  const entrada = path.join(tmp, 'entrada.ts')
  fs.writeFileSync(entrada, `export * from '${path.resolve('src/store/useBilleteStore.ts').replace(/\\/g, '/')}'\nexport { nube } from '${falso.replace(/\\/g, '/')}'\n`)
  const salida = path.join(tmp, 'store.mjs')
  await build({
    entryPoints: [entrada], bundle: true, format: 'esm', platform: 'node', outfile: salida, logLevel: 'silent', define: { 'import.meta.env.DEV': 'true', 'import.meta.env.MODE': '"test"' },
    plugins: [{ name: 'falso', setup(b) { b.onResolve({ filter: /supabaseClient$/ }, () => ({ path: falso })) } }],
  })
  const memoria = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m } }
  globalThis.window = { addEventListener: () => {}, localStorage: null }
  const importar = (id) => import(`file://${salida.replace(/\\/g, '/')}?movil=${id}`)
  const A = await importar('A')
  const B = await importar('B')
  const D = await importar('D')
  const C = await importar('C')
  const movA = memoria(), movB = memoria()
  const en = (movil, m, f) => { globalThis.window.localStorage = movil; return f(m) }
  const nube = A.nube
  const T = 'viaje-1'
  const esperar = () => new Promise((r) => setTimeout(r, 30))
  const codigo = { texto: 'COLOSSEUM|ABC123', formato: 'qr', imagen: null, dibujo: 'data:image/svg+xml;utf8,<svg/>' }
  const entradaDe = (extra = {}) => ({ personas: 2, localizador: 'ABC123', codigo, dueno: null, ...extra })

  nube.uid = 'u1'
  await en(movA, A, async (m) => {
    m.useBilleteStore.getState().cargar(T)
    m.useBilleteStore.getState().poner(T, 'arrival', { horaRoma: '11:25', localizador: 'VUELO1', terminal: '1', asiento: '14C', coche: null, codigo: null, dueno: null })
    m.useBilleteStore.getState().ponerEntrada(T, 'Coliseo, Foro y Palatino', entradaDe())
    m.useBilleteStore.getState().ponerEntrada(T, 'Free Tour', entradaDe({ personas: 3, localizador: null, codigo: null }))
    await esperar()
  })
  const local = en(movA, A, (m) => m.useBilleteStore.getState().datos)
  debe(local.entradas?.['Coliseo, Foro y Palatino']?.codigo?.texto === 'COLOSSEUM|ABC123' && local.entradas?.['Free Tour']?.personas === 3, '2 guarda', 'la entrada y el Free Tour se guardan en el móvil con su clave (el nombre de la entrada o «Free Tour»)')
  debe(local.arrival?.asiento === '14C', '2 guarda', 'y el billete del vuelo sigue ahí: conviven en el mismo documento')
  debe(movA.getItem(`trazo:billete:v1:${T}`)?.includes('COLOSSEUM'), '2 sin internet', 'se guarda en el propio móvil (se ve sin internet)')
  const fila = nube.filas.get(`${T}|u1`)
  debe(fila?.datos.entradas?.['Coliseo, Foro y Palatino']?.dueno === 'u1' && fila?.datos.arrival?.asiento === '14C', '2 sube', 'sube a la fila PRIVADA de la persona (la misma tabla de la 0070, su JSON `datos`), con su dueño apuntado')
  debe(!/pdf|archivo/i.test(JSON.stringify(fila)), '2 sube', 'sin el PDF: solo los datos y el código')
  await en(movB, B, async (m) => { m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  const enB = en(movB, B, (m) => m.useBilleteStore.getState().datos)
  debe(enB.entradas?.['Coliseo, Foro y Palatino']?.codigo?.dibujo && enB.entradas?.['Free Tour']?.personas === 3, '2 otro móvil', 'el otro móvil de la misma persona recibe sus entradas y el código')
  nube.uid = 'u2'
  const movC = memoria()
  await en(movC, C, async (m) => { m.useBilleteStore.setState({ tripId: null, datos: {} }); m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  debe(Object.keys(en(movC, C, (m) => m.useBilleteStore.getState().datos)).length === 0, '2 privado', 'otra cuenta del MISMO viaje no recibe nada')
  const movD = memoria()
  movD.setItem(`trazo:billete:v1:${T}`, JSON.stringify({ entradas: { Panteón: { ...entradaDe({ localizador: 'AJENO99' }), dueno: 'u1' } } }))
  await en(movD, D, async (m) => { m.useBilleteStore.setState({ tripId: null, datos: {} }); m.useBilleteStore.getState().cargar(T); await m.useBilleteStore.getState().sincronizar(T) })
  debe(!nube.filas.has(`${T}|u2`) || !JSON.stringify(nube.filas.get(`${T}|u2`)).includes('AJENO99'), '2 privado', 'la entrada de otra persona que quedó en este móvil no se sube a la cuenta de quien lo usa ahora')
  nube.uid = 'u1'
  nube.sinRed = true
  await en(movA, A, async (m) => { m.useBilleteStore.getState().ponerEntrada(T, 'Panteón', entradaDe({ localizador: 'PAN456' })); await esperar() })
  debe(en(movA, A, (m) => m.useBilleteStore.getState().datos.entradas?.Panteón?.localizador === 'PAN456') && movA.getItem(`trazo:billete:v1:${T}:pend`) === '1', '2 sin conexión', 'sin conexión se guarda en el móvil y queda pendiente de subir')
  nube.sinRed = false
  await en(movA, A, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  debe(nube.filas.get(`${T}|u1`).datos.entradas?.Panteón?.localizador === 'PAN456', '2 sin conexión', 'al volver la conexión, sube')
  await esperar()
  await en(movA, A, async (m) => { m.useBilleteStore.getState().quitarEntrada(T, 'Free Tour'); await esperar() })
  await en(movB, B, async (m) => { await m.useBilleteStore.getState().sincronizar(T) })
  const trasQuitar = en(movB, B, (m) => m.useBilleteStore.getState().datos)
  debe(!trasQuitar.entradas?.['Free Tour'] && trasQuitar.entradas?.Panteón?.localizador === 'PAN456' && trasQuitar.entradas?.['Coliseo, Foro y Palatino'] && trasQuitar.arrival?.asiento === '14C', '2 quitar', 'lo que se quita en un móvil se quita en el otro, y lo demás (entradas y vuelo) sigue')
  const dueno = en(movA, A, (m) => m.entradaConCodigo(m.useBilleteStore.getState().datos.entradas['Coliseo, Foro y Palatino']))
  debe(dueno === true && en(movA, A, (m) => m.entradaConCodigo(null)) === false, '2 código', '`entradaConCodigo` distingue entradas con y sin código')
}

// ═══ 3. En la app ═══
console.log('3. En la app: añadir tu entrada, E2, E3, el botón del código de L2, sin internet, privado y HOY (E4)')
const { abrirApp } = await import('./_enLaApp.mjs')
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const PDF = path.resolve('scripts/destino/_ejemplos_billete/entrada_coliseo_ejemplo.pdf')
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&version=pago&apertura=0&pase=con&hoy2=on', ancho: 390, alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  for (let intento = 0; intento < 3; intento++) {
    for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
    try {
      await ev('window.__rutaPrueba().then(() => true)')
      break
    } catch (e) {
      if (intento === 2) throw e
      await ev('location.reload()').catch(() => undefined)
      await a.esp(5000)
    }
  }
  for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
  await ev("Promise.all([import('/src/store/useViajeCompartido.ts'), import('/src/store/useLoSuyo.ts'), import('/src/store/useMisReservas.ts'), import('/src/store/useBilleteStore.ts'), import('/src/lib/bookings.ts')]).then(() => true)")
  await a.esp(3000)
  for (let i = 0; i < 6; i++) {
    const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
    if (!h) break
    await a.esp(600)
  }
  await a.cdp('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => undefined)
  const R = (js) => ev(`(async () => { const R = await import('/src/store/useRouteStore.ts'); const B = await import('/src/lib/bookings.ts'); const st = () => R.useRouteStore.getState(); const route = () => st().route; ${js} })()`)
  // El día y el sitio de la entrada: la primera parada de verdad del día 2.
  const base = await R(`const r = route(); const d = r.days.filter((x) => !x.isReturnLeg && B.dateOfDay(r, x))[1] ?? r.days[0]; const s = d.stops.find((p) => !p.isFreeTour && !p.isNightExperience && !p.passThrough && !p.isBreak && p.name); return { dateIso: B.dateOfDay(r, d), dayId: d.id, nombre: s.name, antes: d.stops.slice(0, d.stops.indexOf(s)).map((p) => p.id) }`)
  const NOMBRE = base.nombre
  const LECTURA = { fecha: base.dateIso, hora: '09:00', personas: 2, localizador: 'ABC123', codigo_caja: null }
  // (Solo la lectura con IA se simula: el código QR se lee de verdad del PDF, en el navegador.)
  await ev(`(() => { const f0 = window.fetch.bind(window); window.fetch = async (u, o) => { if (String(u).includes('/api/read-ticket') && String(o?.body ?? '').includes('"tipo":"entrada"')) return new Response(JSON.stringify(${JSON.stringify(LECTURA)}), { status: 200, headers: { 'Content-Type': 'application/json' } }); return f0(u, o) } })(); true`)
  await R(`st().addReservation({ id: 'res-10s7-s', kind: 'entrada', refId: ${JSON.stringify(NOMBRE)}, name: ${JSON.stringify(NOMBRE)}, placeNames: [${JSON.stringify(NOMBRE)}], dateIso: ${JSON.stringify(base.dateIso)}, dayNumber: null, time: '09:15' }, null, null); return true`)
  await a.esp(1200)
  const cerrarAvisos = () => ev(`Array.from(document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button')).filter((b) => /^(cerrar|×|✕)$/i.test((b.getAttribute('aria-label') ?? b.textContent).trim())).forEach((b) => b.click()); true`)
  const abrirBloque = async () => {
    await R("st().setMode('bookings'); return true")
    await a.esp(1800)
    await cerrarAvisos()
    await ev(`(() => { const b = document.querySelector('[data-blk="entradas"]'); if (b && b.children.length < 2) b.firstElementChild?.click(); return true })()`)
    await a.esp(1200)
  }
  await abrirBloque()
  fs.mkdirSync(SALIDA, { recursive: true })
  const fila = () => ev(`(() => { const f = document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"]'); const t = f?.querySelector('[data-tarjeta-reservada]'); const b = f?.querySelector('[data-entrada-billete]'); return f ? { estado: b?.getAttribute('data-entrada-billete') ?? null, texto: (b?.innerText ?? '').replace(/\\s+/g, ' '), botonesTarjeta: Array.from(t?.querySelectorAll('button') ?? []).map((x) => x.getAttribute('data-entrada-codigo-boton') != null ? 'CODIGO' : x.textContent.trim()), codigoPequeno: Boolean(b?.querySelector('[data-entrada-codigo-pequeno] img')), anadir: b?.querySelector('[data-entrada-anadir]')?.textContent ?? null, ayuda: b?.querySelector('[data-entrada-ayuda]')?.textContent ?? null } : null })()`)

  // — E1: la entrada reservada sin billete —
  let f1 = await fila()
  debe(f1 && f1.estado === 'sin-billete' && f1.anadir === 'Añadir tu entrada' && /Desde el PDF, una foto o una captura\./.test(f1.ayuda ?? ''), 'E1', `la entrada sin billete lleva [Añadir tu entrada] con «Desde el PDF, una foto o una captura.» (${JSON.stringify(f1)})`)
  debe(f1 && f1.botonesTarjeta.length === 1 && f1.botonesTarjeta[0] === 'Cambiar', 'L2', `sin billete, la tarjeta reservada no lleva botón del código (${JSON.stringify(f1?.botonesTarjeta)})`)
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"]')?.scrollIntoView({ block: 'center' }); true`)
  await a.esp(500)
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_01_e1.jpg')).catch(() => {})

  // — Elegir el PDF: la hoja sale con lo leído y el código leído de verdad —
  await a.cdp('Page.setInterceptFileChooserDialog', { enabled: true }).catch(() => undefined)
  const doc = await a.cdp('DOM.getDocument', { depth: 1 })
  const nodo = await a.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: `[data-entrada-fila="${NOMBRE.replace(/"/g, '\\"')}"] [data-entrada-archivo]` })
  await a.cdp('DOM.setFileInputFiles', { nodeId: nodo.result.nodeId, files: [PDF] })
  await a.hasta("Boolean(document.querySelector('#add-reservation-heading'))", { segundos: 90 })
  await a.hasta("Boolean(document.querySelector('[data-entrada-codigo-leido] img'))", { segundos: 30 }).catch(() => {})
  const hoja = await ev(`(() => ({ personas: document.querySelector('[data-entrada-dato="personas"]')?.value, localizador: document.querySelector('[data-entrada-dato="localizador"]')?.value, codigo: Boolean(document.querySelector('[data-entrada-codigo-leido] img')), titulo: document.querySelector('#add-reservation-heading')?.innerText, boton: document.querySelector('[data-entrada-anadir="hoja"]')?.textContent }))()`)
  debe(hoja.personas === '2' && hoja.localizador === 'ABC123' && hoja.codigo === true, 'E1 lee', `la hoja sale rellena con lo leído: 2 personas, ABC123 y el código (${JSON.stringify(hoja)})`)
  debe(hoja.boton === 'Añadir tu entrada', 'E1 hoja', 'y la hoja de «Añádela»/«Cambiar» también lleva [Añadir tu entrada]')
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_02_hoja.jpg')).catch(() => {})
  // Se puede cambiar a mano: personas 2 → 3 y vuelve.
  await ev(`(() => { const i = document.querySelector('[data-entrada-dato="personas"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '3'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await a.esp(200)
  debe((await ev(`document.querySelector('[data-entrada-dato="personas"]')?.value`)) === '3', 'E1 a mano', 'cualquier dato se puede cambiar a mano (personas)')
  await ev(`(() => { const i = document.querySelector('[data-entrada-dato="personas"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '2'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await a.hasta("(() => { const b = document.querySelector('[data-guardar-reserva]'); return Boolean(b) && !b.disabled })()", { segundos: 30 })
  await ev(`document.querySelector('[data-guardar-reserva]')?.click(); true`)
  await a.hasta("!document.querySelector('#add-reservation-heading')", { segundos: 30 })
  await a.esp(800)
  await cerrarAvisos()

  // — E2: la entrada con su billete —
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"]')?.scrollIntoView({ block: 'center' }); true`)
  await a.esp(500)
  f1 = await fila()
  debe(f1 && f1.estado === 'con-billete' && /2 personas/.test(f1.texto) && /Localizador ABC123/.test(f1.texto) && /Toca para ampliar/.test(f1.texto) && f1.codigoPequeno, 'E2', `con billete: «2 personas», «Localizador ABC123» y el código pequeño con «Toca para ampliar» (${JSON.stringify(f1)})`)
  debe(f1 && f1.botonesTarjeta.includes('CODIGO') && f1.botonesTarjeta.includes('Cambiar'), 'L2', `la tarjeta reservada lleva el botón del código y «Cambiar» (${JSON.stringify(f1?.botonesTarjeta)})`)
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_03_e2.jpg')).catch(() => {})
  const guardado = await R(`const s = (await import('/src/store/useBilleteStore.ts')).useBilleteStore.getState(); const e = s.datos.entradas?.[${JSON.stringify(NOMBRE)}]; const res = st().reservations.find((x) => x.refId === ${JSON.stringify(NOMBRE)}); return { personas: e?.personas, localizador: e?.localizador, texto: e?.codigo?.texto ?? null, formato: e?.codigo?.formato ?? null, dibujo: Boolean(e?.codigo?.dibujo), hora: res?.time, fecha: res?.dateIso, rutaConLocalizador: JSON.stringify(route()).includes('ABC123'), locatorReserva: res?.locator ?? null, local: window.localStorage.getItem('trazo:billete:v1:' + (s.tripId ?? 'local')) ?? '' }`)
  debe(guardado.personas === 2 && guardado.localizador === 'ABC123', 'E2 guarda', `se guardan las personas y el localizador (${JSON.stringify(guardado).slice(0, 200)})`)
  debe(guardado.formato === 'qr' && /^COLOSSEUM\|ABC123/.test(guardado.texto ?? '') && guardado.dibujo, 'E2 código', `el QR se lee DE VERDAD del PDF y se redibuja (${guardado.formato} · ${guardado.texto})`)
  debe(guardado.hora === '09:00' && guardado.fecha === base.dateIso, 'E1 lee', `la reserva toma el día y la hora leídos (${guardado.fecha} ${guardado.hora})`)
  debe(guardado.rutaConLocalizador === false && !guardado.locatorReserva, 'privado', 'el localizador NO está en la ruta compartida ni en la reserva (solo en el móvil de esta persona)')
  debe(/COLOSSEUM/.test(guardado.local) || /dibujo/.test(guardado.local), 'privado', 'el billete está en el móvil (se ve sin internet)')

  // — E3: pantalla completa, desde el código pequeño y desde el botón de L2 —
  const grande = () => ev(`(() => { const d = document.querySelector('[data-billete-pantalla-completa]'); const i = d?.querySelector('img'); return d ? { w: Math.round(i?.getBoundingClientRect().width ?? 0), titulo: d.querySelector('[data-billete-grande-titulo]')?.textContent, cuando: d.querySelector('[data-billete-grande-cuando]')?.textContent, pie: d.querySelector('[data-billete-grande-pie]')?.textContent, fondo: getComputedStyle(d).backgroundColor } : null })()`)
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"] [data-entrada-codigo-boton]')?.click(); true`)
  await a.esp(600)
  let g = await grande()
  debe(g && g.w >= 250 && g.titulo === NOMBRE && /^\p{L}+ \d+ · 09:00$/u.test(g.cuando ?? '') && g.pie === 'Localizador ABC123' && /255, 255, 255/.test(g.fondo), 'E3 / L2', `el botón del código de L2 abre el código a pantalla completa: nombre, día y hora, «Localizador ABC123», fondo blanco (${JSON.stringify(g)})`)
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_04_e3.jpg')).catch(() => {})
  await ev(`document.querySelector('[data-billete-cerrar]')?.click(); true`)
  await a.esp(300)
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"] [data-entrada-codigo-pequeno]')?.click(); true`)
  await a.esp(600)
  g = await grande()
  debe(g && g.w >= 250 && g.pie === 'Localizador ABC123', 'E3', `el código pequeño «Toca para ampliar» también abre la pantalla completa (${JSON.stringify(g)})`)
  await ev(`document.querySelector('[data-billete-cerrar]')?.click(); true`)
  await a.esp(300)
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"]')?.scrollIntoView({ block: 'center' }); true`)
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_05_l2.jpg')).catch(() => {})

  // — Sin internet: el código se ve igual —
  await a.cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"] [data-entrada-codigo-boton]')?.click(); true`)
  await a.esp(600)
  g = await grande()
  debe(g && g.w >= 250 && g.pie === 'Localizador ABC123', 'sin internet', `sin conexión, el código se abre igual (${JSON.stringify(g)})`)
  await ev(`document.querySelector('[data-billete-cerrar]')?.click(); true`)
  await a.cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })

  // — Privado: la entrada que guardó OTRA persona en este móvil no sale —
  await ev(`(async () => {
    const G = [{ id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin', esYo: true }, { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' }]
    const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
    const tiendas = [window.__viaje]
    for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
    for (const st of new Set(tiendas.filter(Boolean))) { st.setState({ cargar: async () => {} }); st.getState().poner({ gente: G }) }
    return true
  })()`)
  const cambiarDueno = (d) => ev(`(async () => { const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useBilleteStore.ts')))]; const tiendas = [window.__billete]; for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useBilleteStore); for (const st of new Set(tiendas.filter(Boolean))) { const s = st.getState(); const e = s.datos.entradas?.[${JSON.stringify(NOMBRE)}]; if (e) st.setState({ datos: { ...s.datos, entradas: { ...s.datos.entradas, [${JSON.stringify(NOMBRE)}]: { ...e, dueno: ${JSON.stringify(d)} } } } }) } return true })()`)
  await cambiarDueno('p-ana')
  await a.esp(600)
  const ajena = await fila()
  debe(ajena && ajena.estado === 'sin-billete' && !ajena.codigoPequeno && !ajena.botonesTarjeta.includes('CODIGO') && !/ABC123/.test(ajena.texto), 'privado', `la entrada que guardó otra persona en este móvil NO se ve (${JSON.stringify(ajena)})`)
  await cambiarDueno('p-eric')
  await a.esp(600)
  debe((await fila())?.estado === 'con-billete', 'privado', 'y la propia vuelve a verse')

  // — Quitar el billete: «Quitar tu billete» —
  // (Se prueba al final del HOY, para no perder el código.)

  // — E4: HOY, la parada con «Tu entrada» (solo con pase) —
  await R(`for (const id of ${JSON.stringify(base.antes)}) st().setStopVisto(${JSON.stringify(base.dayId)}, id, true); st().setActiveDayId(null); R.useRouteStore.setState({ dev_simulated_today_iso: ${JSON.stringify(base.dateIso)} }); st().setMode('today'); return true`)
  await a.esp(3500)
  await cerrarAvisos()
  const hoy = () => ev(`(() => { const b = document.querySelector('[data-hoy-tu-entrada]'); return { hay: Boolean(b), texto: (b?.innerText ?? '').replace(/\\s+/g, ' '), img: Boolean(b?.querySelector('img')), v2: Boolean(document.querySelector('[data-hoy-v2]')) } })()`)
  let h = await hoy()
  debe(h.hay && /Tu entrada/.test(h.texto) && /Toca para ampliar/.test(h.texto) && h.img, 'E4', `con pase, HOY enseña «Tu entrada» con el código pequeño en la parada de ese sitio (${JSON.stringify(h)})`)
  await ev(`document.querySelector('[data-hoy-tu-entrada]')?.scrollIntoView({ block: 'center' }); true`)
  await a.esp(400)
  await a.captura(path.join(SALIDA, '10s7_entradas_billete_06_hoy.jpg')).catch(() => {})
  await ev(`document.querySelector('[data-hoy-tu-entrada]')?.click(); true`)
  await a.esp(600)
  g = await grande()
  debe(g && g.w >= 250 && g.titulo === NOMBRE, 'E4', `y se abre a pantalla completa (${JSON.stringify(g)})`)
  await ev(`document.querySelector('[data-billete-cerrar]')?.click(); true`)
  await a.esp(300)
  // Sin pase: nada.
  await ev(`window.__pruebaDelPase = { cobro: true, conPase: false, puede: true, pruebaGastada: false }; true`)
  await R("st().setMode('days'); return true")
  await a.esp(500)
  await R("st().setMode('today'); return true")
  await a.esp(2500)
  h = await hoy()
  debe(h.hay === false, 'E4 sin pase', `sin pase, HOY no enseña «Tu entrada» (${JSON.stringify(h)})`)
  await ev(`delete window.__pruebaDelPase; true`)
  await R(`R.useRouteStore.setState({ dev_simulated_today_iso: null }); st().setMode('bookings'); return true`)
  await a.esp(1500)
  await cerrarAvisos()

  // — Quitar el billete, y quitar la reserva se lleva su billete —
  await abrirBloque()
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"] [data-entrada-billete] [data-eliminar]')?.click(); true`)
  await a.esp(600)
  f1 = await fila()
  debe(f1 && f1.estado === 'sin-billete' && f1.botonesTarjeta.length === 1, 'quitar', `«Quitar tu billete» deja la entrada sin billete y sin botón del código (${JSON.stringify(f1)})`)
  const borrado = await R(`const s = (await import('/src/store/useBilleteStore.ts')).useBilleteStore.getState(); return Boolean(s.datos.entradas?.[${JSON.stringify(NOMBRE)}])`)
  debe(borrado === false, 'quitar', 'y se borra del móvil')
  // «Cambiar» trae su hoja con [Añadir tu entrada] (sin lectura previa).
  await ev(`document.querySelector('[data-entrada-fila="' + ${JSON.stringify(NOMBRE)} + '"] [data-tarjeta-reservada] button')?.click(); true`)
  await a.esp(1000)
  debe((await ev(`document.querySelector('[data-entrada-anadir="hoja"]')?.textContent ?? null`)) === 'Añadir tu entrada', 'hoja', '«Cambiar» abre la hoja con [Añadir tu entrada]')
  await ev(`document.querySelector('#add-reservation-heading')?.closest('[role="dialog"]')?.querySelector('button[aria-label*="errar"]')?.click(); true`)
  await a.esp(300)
  await R(`for (const x of st().reservations.filter((y) => y.refId === ${JSON.stringify(NOMBRE)})) st().removeReservation(x.id); return true`)
} finally {
  await a.cerrar()
}

console.log(`\n${comprobaciones} comprobaciones, ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
