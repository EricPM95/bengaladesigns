// La prueba de la pantalla «Usuarios» del panel (V35A): el SERVIDOR con una base falsa (funciones puras + las rutas /api/admin/usuarios* detrás del guardián, con un Supabase de mentira) y la PANTALLA con la demo (?logrosDemo=1).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35A_usuarios.mjs
// Ninguna parte toca el Supabase de producción ni manda correos. Sin Vite, la parte de la pantalla se salta; sin la API encendida, solo se salta la comprobación del 401 contra ella.
import fs from 'node:fs'
import express from 'express'
import { abrirApp } from './_enLaApp.mjs'
import { AHORA, baseFalsa } from './_baseFalsaUsuarios.mjs'
import { servicioFalso } from './_ejecutarServicioUsuarios.mjs'
import { calendario, prepararUsuarios, indiceDeDestinos } from '../../server/panel/calculosUsuarios.js'
import { registrarRutasPanel } from '../../server/panel/index.js'
import { cargarDatos } from '../../server/logros/datos.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log(`  FALLO ${texto}`)
  }
}
const CAP = 'docs/dias/V35A_capturas'
fs.mkdirSync(CAP, { recursive: true })
const ids = (r) => r.usuarios.map((u) => u.id)

console.log('1. El servidor con una base falsa')
const s = servicioFalso()
const lista = await s.listar({ orden: 'viajes' })
const por = (l, id) => l.usuarios.find((u) => u.id === id)
{
  debe(lista.total === 60 && lista.usuarios.length === 50 && lista.por_pagina === 50, 'la lista es de 50 en 50 (60 personas: 50 en la primera página)')
  debe((await s.listar({ orden: 'viajes', pagina: 2 })).usuarios.length === 10, 'la segunda página trae las 10 que faltan')
  debe(lista.usuarios[0].id === 'u-eric', '«Más viajes»: Eric (2 viajes) va el primero')
  const alice = por(lista, 'u-alice')
  debe(alice && alice.viajes.creados === 1 && alice.viajes.hechos === 0, 'Alice cuenta el viaje COMPARTIDO al que se ha unido (1 · 0, no 0 · 0)')
  debe(alice.pase.destinos[0]?.etiqueta === 'Lanzarote · Dúo (de Eric)', 'el pase de Alice dice «Lanzarote · Dúo (de Eric)»')
  debe(alice.gastado_cent === 0, 'Alice no ha pagado nada (el pase compartido no es suyo)')
  const eric = por(lista, 'u-eric')
  debe(eric.pase.destinos.length === 1 && eric.pase.destinos[0].etiqueta === 'Lanzarote · Dúo', 'Eric tiene SOLO su pase de Lanzarote (el de Roma se borró)')
  debe(eric.gastado_cent === 1099, 'Eric ha gastado 10,99 € (no se le inventa el cobro de Roma)')
  const diana = por(lista, 'u-diana')
  debe(diana.pase.destinos[0]?.etiqueta === 'Barcelona · Regalado' && diana.gastado_cent === 0, 'el pase regalado dice «Barcelona · Regalado» y 0 €')
  debe(!JSON.stringify(lista).match(/"etiqueta":"[^"]*\b(duo|uno|eur)\b/i), 'ninguna etiqueta de pase dice «duo», «uno» ni «eur»')
  debe(!/pago_ref|recibo|token|tarjeta|password/i.test(JSON.stringify(lista) + JSON.stringify(await s.ficha('u-eric'))), 'ni la lista ni la ficha llevan datos de cobro, tarjeta ni claves')
}

console.log('2. El pase de Eric y los 6,99 € de Roma: no se inventa')
{
  const r = await s.totales({ periodo: 'todo' })
  debe(r.cobros_sin_pase.n === 1 && r.cobros_sin_pase.importe_cent === 699, 'hay 1 cobro de Roma de 6,99 € sin pase (el reembolsado no cuenta)')
  const ficha = await s.ficha('u-eric')
  debe(ficha.pases.length === 1 && !ficha.pases.some((p) => p.destino === 'Roma'), 'la ficha de Eric no tiene pase de Roma')
  const suma = ficha.pases.reduce((x, p) => x + p.importe_cent, 0)
  debe(ficha.usuario.gastado_cent === suma && suma === 1099, 'ficha: «Gastado» = la suma de «Sus pases» (10,99 €)')
  debe(ficha.pase_texto === 'Sí · 1 destino', 'ficha: «Pase» dice «Sí · 1 destino»')
  debe(por(lista, 'u-eric').gastado_cent === ficha.usuario.gastado_cent, 'la lista y la ficha dicen lo mismo de lo gastado')
  const migracion = fs.readFileSync('supabase/migrations/0086_empezar_de_cero_avisos_de_viajeros.sql', 'utf8')
  debe(/\('passes', 'comprador_id'\)/.test(migracion) && !/pagos_registro/.test(migracion), 'empezar_de_cero borra los pases de quien compra y NO toca el registro de cobros (por eso el cobro se queda sin dueño)')
  debe(/no se borran nunca/.test(fs.readFileSync('server/logros/reiniciar.js', 'utf8')), 'reiniciar.js lo dice: los registros de cobro no se borran nunca')
}

console.log('3. La ficha')
{
  const alice = await s.ficha('u-alice')
  debe(alice.viajes.length === 1 && alice.viajes[0].suyo === false && alice.viajes[0].de === 'Eric', 'ficha de Alice: su viaje es «Compartido · se unió al de Eric»')
  debe(alice.pases[0].etiqueta === 'Lanzarote · Dúo (de Eric)' && alice.pases[0].importe_cent === 0, 'ficha de Alice: pase «Lanzarote · Dúo (de Eric)»')
  const eric = await s.ficha('u-eric')
  debe(eric.viajes.some((v) => v.destino === 'Lanzarote' && v.suyo && v.con_quien === 'En pareja'), 'ficha de Eric: viaje propio con «En pareja»')
  const diana = await s.ficha('u-diana')
  debe(diana.logros.medallas.length === 1 && diana.logros.medallas[0].texto === 'Medalla de oro · Roma', 'logros: «Medalla de oro · Roma» (la más alta de las dos que tiene)')
  debe(!/Sello/.test(JSON.stringify(diana.logros.medallas)), 'nunca «Sello» en las medallas')
  debe(diana.logros.colecciones[0]?.texto.endsWith('en Roma') && /^\d+ de \d+ en Roma$/.test(diana.logros.colecciones[0].texto), 'colecciones: «N de M en Roma»')
  debe(diana.logros.pasaporte.texto === '1 país · 2 sellos', 'pasaporte: «1 país · 2 sellos»')
  debe(diana.logros.emblemas.some((e) => e.texto === 'Primera medalla'), 'logros especiales: «Primera medalla»')
  debe((await s.ficha('no-existe')) === null && (await s.ficha('x y')) === null, 'una persona que no existe (o un id raro) da «no hay ficha»')
  debe(diana.vive_en === null, '«Vive en» sin dato (V35B)')
}

console.log('4. El periodo, el embudo y la actividad')
{
  const todo = await s.totales({ periodo: 'todo' })
  const sem = await s.totales({ periodo: '7d' })
  debe(todo.total === 60 && todo.nuevos === 60, 'periodo «Todo»: 60 registrados y 60 nuevos')
  debe(sem.nuevos < todo.nuevos && sem.activos < todo.activos, 'el periodo cambia «Nuevos» y «Activos»')
  const custom = await s.totales({ periodo: 'custom', desde: '2026-11-19', hasta: '2026-11-20' })
  debe(custom.activos === 2 && custom.periodo.etiqueta === '19 nov – 20 nov', 'periodo personalizado (19–20 nov): 2 personas abrieron la app (Eric y Alice)')
  debe(todo.embudo.map((f) => f.etiqueta).join('|') === 'Registrados|Con viaje creado|Con pase|Han hecho el viaje|Han ganado un logro', 'el embudo tiene los 5 pasos de Design, en su orden')
  debe(todo.embudo[2].n === 4 && todo.embudo[3].n === 1 && todo.embudo[4].n === 2, 'embudo: 4 con pase (Eric, Alice, Bruno y Diana), 1 ha hecho el viaje, 2 con logro')
  debe(todo.embudo.every((f, i) => i === 0 ? f.pasa_pct === null : f.pasa_pct >= 0 && f.pasa_pct <= 100), 'el «% que pasa al siguiente» siempre está entre 0 y 100')
  debe(todo.actividad.dia === 1 && todo.actividad.semana === 2 && todo.actividad.retencion_pct === null, 'actividad: 1 al día, 2 a la semana, y la retención «—» (no se inventa)')
  debe(todo.viajando.hoy === 2, 'viajando ahora: 2 (Eric y Alice, en el mismo viaje)')
  debe(todo.quienes.edad.every((e) => e.n > 0) && todo.quienes.compania.length === 3 && todo.quienes.frecuencia.length === 3, 'quiénes son: solo las opciones que alguien ha elegido')
  debe(todo.donde_viven === null, '«Dónde viven»: sin dato (V35B)')
  debe(todo.desde_donde.paises.some((p) => p.iso === 'es' && p.nombre === 'España') && todo.desde_donde.paises.some((p) => p.iso === 'mx'), 'desde dónde viajan: España y México con su código de país')
  debe(todo.niveles.length >= 6 && todo.niveles.reduce((x, n) => x + n.n, 0) === 60, 'niveles: todas las personas están en algún nivel')
  debe(todo.entran.correo + todo.entran.google + todo.entran.otros === 60 && todo.entran.correo_pct + todo.entran.google_pct + todo.entran.otros_pct >= 99, 'cómo entran: correo + Google = todos')
}

console.log('5. El calendario')
{
  const r = await s.totales({ periodo: 'mes' })
  const c = r.calendario
  debe(c.meses.length === 6 && c.meses[0].clave === '2026-11' && c.meses[5].clave === '2027-04', 'el calendario enseña los 6 meses desde noviembre hasta abril')
  debe(c.semanas.length === 26, 'y 26 semanas')
  debe(c.leyenda.filter((l) => l.clave !== 'otros').length === 5 && c.leyenda.at(-1).clave === 'otros' && c.leyenda.at(-1).color === '#C9BFA8', '5 destinos con su color + «Otros» en gris')
  debe(new Set(c.leyenda.map((l) => l.color)).size === c.leyenda.length, 'cada destino tiene un color distinto')
  debe([...c.meses, ...c.semanas].every((h) => h.total === h.segmentos.reduce((x, y) => x + y.n, 0)), 'el total de cada barra es la suma de sus trozos')
  const fuerte = [...c.meses].sort((a, b) => b.total - a.total)[0]
  debe(c.mes_fuerte === fuerte.clave && c.frase.includes('es la temporada fuerte') && c.frase.includes(`${fuerte.total} personas`), 'la frase dice el mes con más gente y cuántas personas (con los datos reales)')
  const base = baseFalsa()
  base.trips = []
  base.miembros = []
  const datos = cargarDatos()
  const vacio = calendario(prepararUsuarios(base, { hoy: '2026-11-20', datos, conocidos: indiceDeDestinos([]) }).registros, '2026-11-20')
  debe(vacio.frase === 'Todavía no hay viajes en los próximos 6 meses.' && vacio.mes_fuerte === null, 'sin viajes: «Todavía no hay viajes en los próximos 6 meses.»')
}

console.log('6. Los filtros, «Viajan entre…» y el próximo viaje')
{
  const base = baseFalsa()
  const esperado = (desde, hasta, destino) => new Set(base.usuarios.filter((u) => {
    const mios = base.trips.filter((t) => t.traveler_id === u.id || base.miembros.some((m) => m.trip_id === t.id && m.user_id === u.id))
    return mios.some((t) => t.inicio <= hasta && t.fin >= desde && (!destino || t.destino.toLowerCase() === destino.toLowerCase()))
  }).map((u) => u.id))
  const entre = await s.listar({ entre_desde: '2026-12-01', entre_hasta: '2026-12-04', entre_destino: 'Roma' })
  const esp = esperado('2026-12-01', '2026-12-04', 'roma')
  debe(entre.total === esp.size && ids(entre).every((i) => esp.has(i)) && entre.total >= 1, `«Viajan entre 1 y 4 dic a Roma»: salen SOLO quienes cumplen (${entre.total} de ${esp.size})`)
  debe(entre.usuarios.every((u) => u.proximo_viaje?.destino === 'Roma' && u.proximo_viaje.inicio <= '2026-12-04' && u.proximo_viaje.fin >= '2026-12-01'), 'con ese filtro, «Próximo viaje» es el viaje que cae en esas fechas')
  const sinFiltro = await s.listar({ q: 'eric' })
  debe(sinFiltro.usuarios[0].proximo_viaje.destino === 'Lanzarote', 'sin filtro, el próximo viaje de Eric es el que tiene en curso (Lanzarote)')
  const conFiltro = await s.listar({ q: 'eric', entre_desde: '2026-12-05', entre_hasta: '2026-12-09' })
  debe(conFiltro.total === 1 && conFiltro.usuarios[0].proximo_viaje.destino === 'Roma', 'con «Viajan entre 5 y 9 dic», el próximo viaje de Eric pasa a ser Roma')
  const sinNadie = await s.listar({ entre_desde: '2030-01-01', entre_hasta: '2030-01-05' })
  debe(sinNadie.total === 0, 'unas fechas sin viajes no dejan a nadie')
  debe((await s.listar({ entre_desde: '2026-11-19', entre_hasta: '2026-11-19' })).total === esperado('2026-11-19', '2026-11-19').size, 'un solo día también filtra (Eric y Alice viajan el 19 de nov)')
  debe((await s.listar({ pase: 'si' })).total === 4 && (await s.listar({ pase: 'no' })).total === 56, 'Con pase: 4 · Sin pase: 56')
  debe((await s.listar({ q: 'ALICE' })).total === 1 && (await s.listar({ q: 'diana@demo' })).total === 1, 'el buscador encuentra por nombre y por correo (sin mirar mayúsculas)')
  debe((await s.listar({ frecuencia: 'dos_o_tres' })).total === 1 && (await s.listar({ compania: 'amigos' })).total === 1, 'filtros de «Cada cuánto viaja» y «Con quién viaja»')
  const dest = await s.listar({ destino: 'Lanzarote' })
  debe(ids(dest).includes('u-eric') && ids(dest).includes('u-alice'), 'filtro «Destino: Lanzarote» incluye a Eric y a Alice (pase o viaje)')
  debe(lista.destinos.includes('Roma') && lista.destinos.includes('Lanzarote'), 'el desplegable de destinos trae los destinos de la app')
  debe((await s.listar({ orden: 'gastado' })).usuarios[0].id === 'u-eric' && (await s.listar({ orden: 'acceso' })).usuarios[0].id === 'u-eric', 'se ordena por gastado y por último acceso')
}

console.log('7. Las rutas detrás del guardián (Supabase de mentira)')
{
  const base = baseFalsa()
  const tablas = { travelers: base.travelers, trips: base.trips, trip_members: base.miembros, passes: base.pases, pass_members: base.miembros_pase, pagos_registro: base.pagos, achievements: base.logros, logro_perfil: base.perfiles, viajero_primera_vez: base.primera_vez, avisos_destino: [], avisos_de_viajeros: [] }
  const cadena = (filas) => {
    const c = { select: () => c, order: () => c, eq: () => c, limit: () => c, range: (a, b) => ({ ...c, then: (ok) => ok({ data: filas.slice(a, b + 1), error: null }) }), then: (ok) => ok({ data: filas, error: null }) }
    return c
  }
  const crudos = base.usuarios.map((u) => ({ id: u.id, email: u.email, created_at: u.alta, last_sign_in_at: u.ultimo_acceso, is_anonymous: false, app_metadata: { providers: [u.proveedor === 'google' ? 'google' : 'email'] } }))
  const admin = {
    from: (t) => cadena(tablas[t] ?? []),
    auth: {
      getUser: async (token) => (token === 'admin' ? { data: { user: { id: 'u-eric', email: 'eric@demo.test' } }, error: null } : token === 'normal' ? { data: { user: { id: 'u-alice', email: 'alice@demo.test' } }, error: null } : { data: null, error: new Error('no') }),
      admin: { listUsers: async ({ page }) => ({ data: { users: page === 1 ? crudos : [] }, error: null }) },
    },
  }
  const app = express()
  const datos = cargarDatos()
  registrarRutasPanel(app, { admin, env: { LOGROS_ADMIN_EMAILS: 'eric@demo.test' }, ahora: () => AHORA, datos, consola: { error() {} } })
  const servidor = await new Promise((ok) => {
    const x = app.listen(0, () => ok(x))
  })
  const url = `http://127.0.0.1:${servidor.address().port}`
  const pedir = (ruta, token) => fetch(url + ruta, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  try {
    for (const ruta of ['/api/admin/usuarios', '/api/admin/usuarios/totales', '/api/admin/usuarios/u-eric']) {
      debe((await pedir(ruta)).status === 401, `${ruta}: sin sesión da 401`)
      debe((await pedir(ruta, 'normal')).status === 403, `${ruta}: una cuenta que no es administradora da 403`)
    }
    const l = await (await pedir('/api/admin/usuarios?orden=viajes', 'admin')).json()
    debe(l.ok && l.total === 60 && l.usuarios[0].nombre === 'Eric', 'el administrador recibe la lista (60 personas, Eric primero)')
    const t = await (await pedir('/api/admin/usuarios/totales?periodo=30d', 'admin')).json()
    debe(t.ok && t.periodo.periodo === '30d' && t.total === 59 && t.sin_pruebas === true, 'el administrador recibe el resumen con su periodo (30d); (V35B) la cuenta de administrador (Eric) no cuenta nunca en las cifras: 59 de 60')
    const f = await (await pedir('/api/admin/usuarios/u-alice', 'admin')).json()
    debe(f.ok && f.pases[0].etiqueta === 'Lanzarote · Dúo (de Eric)', 'el administrador recibe la ficha de Alice')
    debe((await pedir('/api/admin/usuarios/no-existe', 'admin')).status === 404, 'una ficha que no existe da 404')
  } finally {
    servidor.close()
  }
  const viva = await fetch('http://localhost:8787/api/admin/usuarios').then((r) => r.status).catch(() => null)
  if (viva !== null) debe(viva === 401 || viva === 403, `la API encendida (8787) no deja entrar sin sesión (dio ${viva})`)
  else console.log('  (la API del 8787 no está encendida: se salta ese 401)')
}

console.log('8. El código')
{
  const cuerpo = ['src/components/panel/Usuarios.tsx', ...fs.readdirSync('src/components/panel/usuarios').map((f) => `src/components/panel/usuarios/${f}`)].map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  debe(!/Exportar|\.csv|Blob\(|download=/.test(cuerpo), 'la pantalla no tiene exportar ni descargas')
  debe(/Bandera/.test(cuerpo) && !/linear-gradient\(#C8323C/.test(cuerpo), 'las banderas son la pieza compartida (nada dibujado a mano)')
  debe(/SelectorDePeriodo/.test(cuerpo) && /parametrosDePeriodo/.test(cuerpo), 'usa el selector de periodo compartido')
  debe(!/panel_usuarios|panel_ficha|\.rpc\(/.test(fs.readFileSync('server/panel/usuarios.js', 'utf8') + fs.readFileSync('server/panel/calculosUsuarios.js', 'utf8')), 'el servidor de usuarios ya no usa funciones SQL')
  debe(!/api\/admin\/usuarios/.test(fs.readFileSync('src/lib/logrosDemo_panel.ts', 'utf8')), 'no queda una segunda versión de las respuestas de usuarios en la demo vieja')
  debe(/enlaceAFicha/.test(fs.readFileSync('src/components/panel/api.ts', 'utf8')) && /get\('ficha'\)/.test(fs.readFileSync('src/components/panel/Usuarios.tsx', 'utf8')), '«/admin/usuarios?ficha=<id>» abre la ficha (y existe enlaceAFicha)')
}

const APP = process.env.APP_URL ?? 'http://localhost:5173'
if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba V35A Usuarios: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const RUTA = (extra = '') => `/admin/usuarios?cuentas=on&logros=on&logrosDemo=1&apertura=0${extra}`
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const texto = (a) => a.evaluar('document.body.innerText.replace(/\\s+/g, " ")')
const poner = (a, sel, valor, clase = 'HTMLInputElement', evento = 'input') => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; Object.getOwnPropertyDescriptor(${clase}.prototype, 'value').set.call(e, ${JSON.stringify(valor)}); e.dispatchEvent(new Event('${evento}', { bubbles: true })); return true })()`)
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector('${sel}'); if (!e) return false; e.click(); return true })()`)
const entera = async (a, archivo, ancho) => {
  // Se estira la ventana a la altura de toda la página (así la captura sale entera) y se deja como estaba.
  const alto = await a.evaluar('Math.ceil(Math.max(document.documentElement.scrollHeight, document.getElementById("root").scrollHeight))')
  const movil = ancho < 700
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil })
  await a.esp(700)
  const alto2 = await a.evaluar('Math.ceil(Math.max(document.documentElement.scrollHeight, document.getElementById("root").scrollHeight))')
  const r = await a.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: 0, y: 0, width: ancho, height: Math.max(alto, alto2), scale: 1 } })
  fs.writeFileSync(archivo, Buffer.from(r.result.data, 'base64'))
  await a.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: movil ? 844 : 900, deviceScaleFactor: 1, mobile: movil })
}
const abajoDe = (a, sel) => a.evaluar(`Math.round(document.querySelector('${sel}').getBoundingClientRect().top + scrollY)`)

console.log('9. La pantalla en el ordenador (1280)')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    const ok = await esperar(a, "Boolean(document.querySelector('[data-bloque=\"embudo\"]')) && Boolean(document.querySelector('[data-usuario]'))")
    debe(ok, 'la pantalla carga con el resumen y la lista')
    // Los bloques de Design, en su orden de arriba abajo.
    const orden = ['[data-cifra="total"]', '[data-cifra="nuevos"]', '[data-cifra="activos"]', '[data-bloque="embudo"]', '[data-bloque="actividad"]', '[data-bloque="viajando"]', '[data-bloque="calendario"]', '[data-bloque="quienes"]', '[data-bloque="donde-viven"]', '[data-bloque="desde-donde"]', '[data-bloque="niveles"]', '[data-bloque="como-entran"]', '[data-bloque="aparato"]', '[data-bloque="donde-la-usan"]', '[data-buscar]', '[data-tabla]']
    const tops = []
    for (const sel of orden) tops.push(await abajoDe(a, sel).catch(() => -1))
    // (las tres tarjetas, actividad/viajando, viven/desde, y las 3 últimas van en la misma fila: el orden es no decreciente)
    debe(tops.every((t, i) => t >= 0 && (i === 0 || t >= tops[i - 1])), `los bloques salen en el orden de Design (${tops.join(',')})`)
    const t0 = await texto(a)
    for (const frase of ['USUARIOS EN TOTAL', 'NUEVOS EN EL PERIODO', 'ACTIVOS EN EL PERIODO', 'El embudo · dónde se pierde la gente', 'pasa al siguiente', 'Actividad', 'Al día', 'A la semana', 'Al mes', 'De los que entraron una semana, volvieron la siguiente.', 'Viajando ahora', 'Viajan en los próximos 30 días', 'Calendario de viajes · próximos 6 meses', 'Por mes', 'Por semana', 'Quiénes son · lo que contestaron en la primera vez', '¿Cada cuánto viajas?', '¿Con quién viajas?', 'Edad por tramos', 'Dónde viven', 'Desde dónde viajan', 'PAÍSES', 'CIUDADES', 'Niveles · cuántos usuarios hay en cada uno', 'Cómo entran', 'Con correo', 'Con Google', 'Aparato', 'Dónde la usan', 'LA LISTA, UNO A UNO', 'Ordenar:', 'Todos', 'Con pase', 'Sin pase', 'Viajan entre…', 'USUARIO', 'ALTA · ÚLTIMO ACCESO', 'NIVEL', 'PRÓXIMO VIAJE', 'GASTADO', 'PRIMERA VEZ', 'creados · hechos', 'Las cifras son totales; la lista es solo para administradores.'])
      debe(t0.includes(frase), `texto de Design: «${frase}»`)
    debe(!/undefined/.test(t0) && /Dónde viven/.test(t0) && (await a.evaluar("document.querySelectorAll('[data-vive]').length")) >= 2, '(V35B) con la demo con datos nuevos, «Dónde viven», aparato y dónde la usan salen con datos (sin «Pronto»); sin la 0091 salen «Pronto» (pruebaV35B_personas)')
    debe(!/\b(eur|duo|uno)\b/i.test(t0.replace('LA LISTA, UNO A UNO', '').replace('hay en cada uno', '')), `nunca sale «eur», «duo» ni «uno» (${t0.replace('LA LISTA, UNO A UNO', '').replace('hay en cada uno', '').match(/.{25}\b(eur|duo|uno)\b.{10}/i)?.[0]})`)
    debe(!/undefined|NaN|\[object/.test(t0), 'nada de «undefined» ni «NaN»')
    const banderas = await a.evaluar("({ total: document.querySelectorAll('[data-bandera]').length, sin: document.querySelectorAll('[data-bandera=\"sin\"]').length })")
    debe(banderas.total >= 4 && banderas.sin === 0, `banderas: ${banderas.total} y ninguna en blanco`)
    debe((await a.evaluar("[...document.querySelectorAll('[data-viajando-destino]')].length")) === 3, '«Viajando ahora» enseña los 3 primeros destinos')
    // El selector de periodo cambia las cifras.
    const nuevos = () => a.evaluar("document.querySelector('[data-cifra=\"nuevos\"]').innerText.replace(/\\s+/g, ' ')")
    const antes = await nuevos()
    await clic(a, '[data-periodo="todo"]')
    await esperar(a, `document.querySelector('[data-cifra="nuevos"]').innerText.replace(/\\s+/g, ' ') !== ${JSON.stringify(antes)}`, 20)
    const despues = await nuevos()
    debe(antes !== despues && /60/.test(despues), `el selector de periodo cambia «Nuevos» (${antes} → ${despues})`)
    const pedidos = await a.evaluar('window.__demoPanel.pedidos.filter((p) => p.includes("totales")).join(" | ")')
    debe(/periodo=todo/.test(pedidos) && /periodo=mes/.test(pedidos), 'el periodo viaja al servidor (?periodo=…)')
    await clic(a, '[data-periodo="mes"]')
    await esperar(a, "document.querySelectorAll('[data-hueco]').length === 6", 20)
    // El calendario.
    debe((await a.evaluar("document.querySelectorAll('[data-hueco]').length")) === 6, 'calendario por mes: 6 barras')
    debe((await a.evaluar("document.querySelectorAll('[data-leyenda]').length")) === 6 && (await a.evaluar("Boolean(document.querySelector('[data-leyenda=\"Otros\"]'))")), 'calendario: 5 destinos + Otros en la leyenda')
    await clic(a, '[data-calendario-modo="semana"]')
    debe((await a.evaluar("document.querySelectorAll('[data-hueco]').length")) === 26, 'calendario por semana: 26 barras')
    await clic(a, '[data-calendario-modo="mes"]')
    debe(/temporada fuerte/.test(await a.evaluar("document.querySelector('[data-calendario-frase]').innerText")), 'calendario: la frase de la temporada fuerte')
    // Alice en la lista: su viaje compartido y su pase.
    await a.escribir('[data-buscar]', 'alice')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 1", 20)
    const fila = await a.evaluar("(() => { const e = document.querySelector('[data-usuario]'); return e ? { viajes: e.querySelector('[data-viajes]').innerText, pase: e.querySelector('[data-pase-texto]').innerText, gastado: e.querySelector('[data-gastado]').innerText } : null })()")
    debe(fila && fila.viajes === '1 · 0' && fila.pase === 'Lanzarote · Dúo (de Eric)' && fila.gastado === '0,00 €', `Alice en la lista: viajes ${fila?.viajes}, pase «${fila?.pase}», ${fila?.gastado}`)
    // Eric: pase y gastado (en la lista y en la ficha).
    await poner(a, '[data-buscar]', 'eric')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 1 && document.querySelector('[data-usuario]').dataset.usuario === 'u-eric'", 20)
    const eLista = await a.evaluar("(() => { const e = document.querySelector('[data-usuario]'); return { pase: e.querySelector('[data-pase-texto]').innerText, gastado: e.querySelector('[data-gastado]').innerText, proximo: e.querySelector('[data-proximo]').innerText } })()")
    debe(eLista.pase === 'Lanzarote · Dúo' && eLista.gastado === '10,99 €', `Eric en la lista: «${eLista.pase}» y ${eLista.gastado} (sin los 6,99 € de Roma)`)
    // «Viajan entre…» de verdad.
    await poner(a, '[data-buscar]', '')
    await clic(a, '[data-filtro="entre"]')
    await esperar(a, "Boolean(document.querySelector('[data-entre-fila]'))", 10)
    await poner(a, '[data-entre="desde"]', '2026-12-01')
    await poner(a, '[data-entre="hasta"]', '2026-12-04')
    await poner(a, '[data-entre="destino"]', 'Roma', 'HTMLSelectElement', 'change')
    await esperar(a, "[...document.querySelectorAll('[data-usuario] [data-proximo]')].length > 0 && [...document.querySelectorAll('[data-usuario] [data-proximo]')].every((e) => /^Roma · 1–4 dic$/.test(e.innerText))", 20)
    const filas = await a.evaluar("[...document.querySelectorAll('[data-usuario]')].map((e) => e.querySelector('[data-proximo]').innerText)")
    const total = await a.evaluar("document.querySelector('[data-entre-fila] [data-total]').innerText")
    debe(filas.length >= 1 && filas.every((p) => /^Roma · 1–4 dic$/.test(p)), `«Viajan entre 1 y 4 dic · Roma»: solo quien viaja y «Próximo viaje» enseña ese viaje (${filas.join(' / ')})`)
    debe(new RegExp(`^${filas.length} usuarios? con estos filtros$`).test(total), `el texto dice «${total}»`)
    await a.captura(`${CAP}/usuarios_P6_filtro.jpg`)
    // Abrir la ficha y volver: se conservan los filtros.
    await a.evaluar("document.querySelector('[data-usuario]').click()")
    await esperar(a, "Boolean(document.querySelector('[data-ficha]'))", 20)
    debe(/ficha=/.test(await a.evaluar('location.search')), 'la ficha pone ?ficha=<id> en la dirección')
    await clic(a, '[data-volver]')
    await esperar(a, "Boolean(document.querySelector('[data-entre-fila]'))", 20)
    const conservado = await a.evaluar("({ desde: document.querySelector('[data-entre=\"desde\"]')?.value, hasta: document.querySelector('[data-entre=\"hasta\"]')?.value, destino: document.querySelector('[data-entre=\"destino\"]')?.value, periodo: document.querySelector('[data-periodo=\"mes\"]')?.getAttribute('aria-selected') })")
    debe(conservado.desde === '2026-12-01' && conservado.hasta === '2026-12-04' && conservado.destino === 'Roma' && conservado.periodo === 'true', '«Volver a la lista» conserva los filtros y el periodo')
    debe(!/ficha=/.test(await a.evaluar('location.search')), 'al volver, la dirección ya no lleva ?ficha')
    // Quitamos el filtro de fechas y comprobamos paginación.
    await clic(a, '[data-filtro="entre"]')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 50", 20)
    debe((await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 50 && (await a.evaluar("Boolean(document.querySelector('[data-pagina-siguiente]:not([disabled])'))")), 'lista de 50 en 50 con «Siguiente»')
    await clic(a, '[data-pagina-siguiente]')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 10", 20)
    debe((await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 10, 'la segunda página trae 10')
    await clic(a, '[data-pagina-anterior]')
    await esperar(a, "document.querySelectorAll('[data-usuario]').length === 50", 20)
    await a.evaluar('window.scrollTo(0, 0)')
    await entera(a, `${CAP}/usuarios_P6.jpg`, 1280)
  } finally {
    a.cerrar()
  }
}

console.log('10. La ficha por dirección (ordenador)')
{
  const a = await abrirApp(APP, { ruta: RUTA('&ficha=u-eric'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-ficha=\"u-eric\"]'))"), '/admin/usuarios?ficha=<id> abre la ficha')
    const t = await texto(a)
    for (const frase of ['‹ Volver a la lista', 'Eric', 'Alta', 'Último acceso', 'Viajes', 'Gastado', 'Pase', 'Vive en', 'Sus viajes', 'PRÓXIMOS', 'Sus pases · solo fecha y precio', 'Logros', 'Reportes que ha mandado', 'Sin datos de tarjeta, nunca.', 'Primera vez: viaja 2 o 3 veces al año · en pareja · 35-44 años'])
      debe(t.includes(frase), `ficha: «${frase}»`)
    const d = await a.evaluar("(() => { const g = (n) => document.querySelector('[data-ficha-dato=\"' + n + '\"]').innerText; return { pase: g('pase'), gastado: g('gastado'), vive: g('vive'), viajes: g('viajes'), importes: [...document.querySelectorAll('[data-ficha-pase]')].map((e) => Number(e.dataset.importe)), nombres: [...document.querySelectorAll('[data-pase-nombre]')].map((e) => e.innerText) } })()")
    debe(d.pase === 'Sí · 1 destino' && d.gastado === '10,99 €' && d.vive === 'España' && d.viajes === '2 · 0 hechos', `ficha de Eric: pase «${d.pase}», gastado ${d.gastado}, vive «${d.vive}», viajes «${d.viajes}»`)
    debe(d.importes.reduce((x, y) => x + y, 0) === 1099 && d.nombres.length === 1, 'el gastado de la ficha es la suma EXACTA de «Sus pases»')
    debe((await a.evaluar("document.querySelectorAll('[data-ficha-viaje]').length")) === 2 && (await a.evaluar("document.querySelector('[data-destacado=\"1\"]')?.innerText.includes('Lanzarote')")), 'el siguiente viaje (Lanzarote) va destacado')
    debe(!/\b(eur|duo|uno)\b/i.test(t), 'la ficha tampoco dice «eur», «duo» ni «uno»')
    await a.captura(`${CAP}/usuarios_P6c.jpg`)
    // Diana: los logros agrupados.
    await a.evaluar("history.pushState(null, '', '/admin/usuarios?ficha=u-diana'); window.dispatchEvent(new PopStateEvent('popstate'))")
    await esperar(a, "Boolean(document.querySelector('[data-ficha=\"u-diana\"]'))", 20)
    const td = await texto(a)
    debe(['MEDALLAS', 'Medalla de oro · Roma', 'COLECCIONES', 'EMBLEMAS Y LOGROS ESPECIALES', 'PASAPORTE', '1 país · 2 sellos', 'Barcelona · Regalado', 'Nivel 3 · Soñador', 'Un dato está mal: Coliseo'].every((x) => td.includes(x)), 'ficha de Diana: logros agrupados, pase regalado, nivel y reportes')
    debe(!/Sello de|Sello ·/.test(td), 'ninguna «Sello» (son medallas)')
    await a.captura(`${CAP}/usuarios_P6c_logros.jpg`)
    await a.evaluar("history.pushState(null, '', '/admin/usuarios?ficha=u-alice'); window.dispatchEvent(new PopStateEvent('popstate'))")
    await esperar(a, "Boolean(document.querySelector('[data-ficha=\"u-alice\"]'))", 20)
    const ta = await texto(a)
    debe(ta.includes('Compartido · se unió al de Eric') && ta.includes('Lanzarote (de Eric)') && ta.includes('Sí · 1 destino'), 'ficha de Alice: «Compartido · se unió al de Eric» y su pase «(de Eric)»')
    await a.evaluar("history.pushState(null, '', '/admin/usuarios?ficha=nadie'); window.dispatchEvent(new PopStateEvent('popstate'))")
    debe(await esperar(a, "Boolean(document.querySelector('[data-sin-ficha]'))", 20), 'una ficha que no existe lo dice y deja volver')
  } finally {
    a.cerrar()
  }
}

console.log('11. El móvil (390)')
{
  const a = await abrirApp(APP, { ruta: RUTA(), ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"embudo\"]')) && Boolean(document.querySelector('[data-usuario]'))"), 'carga en el móvil')
    const medidas = await a.evaluar('({ ancho: document.documentElement.scrollWidth, ventana: innerWidth })')
    debe(medidas.ancho <= medidas.ventana, `sin desplazamiento lateral (${medidas.ancho} ≤ ${medidas.ventana})`)
    debe(await a.evaluar("Boolean(document.querySelector('[data-periodo-desplegable]'))"), 'el periodo es un desplegable')
    debe(!(await a.evaluar("Boolean(document.querySelector('[data-tabla]'))")) && (await a.evaluar("document.querySelectorAll('[data-usuario]').length")) === 50, 'la lista son tarjetas (una por persona)')
    const filtros = await a.evaluar("[...document.querySelectorAll('[data-filtro]')].map((e) => e.dataset.filtro).join(',')")
    debe(filtros === 'todos,con-pase,sin-pase,entre', `filtros del móvil como en Design: ${filtros}`)
    const pequenos = await a.evaluar("[...document.querySelectorAll('[data-usuario],[data-filtro],button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 30 && !e.closest('[data-bloque=\"calendario\"]') && !e.closest('[data-selector-periodo]') }).length")
    debe(pequenos <= 6, `casi todos los botones son fáciles de tocar (${pequenos} pequeños)`)
    await a.evaluar('window.scrollTo(0, 0)')
    await entera(a, `${CAP}/usuarios_M3.jpg`, 390)
    await a.evaluar("document.querySelector('[data-usuario]').click()")
    debe(await esperar(a, "Boolean(document.querySelector('[data-ficha]'))", 20), 'la ficha abre en el móvil')
    const m2 = await a.evaluar('({ ancho: document.documentElement.scrollWidth, ventana: innerWidth })')
    debe(m2.ancho <= m2.ventana, `ficha sin desplazamiento lateral (${m2.ancho} ≤ ${m2.ventana})`)
    await entera(a, `${CAP}/usuarios_M8.jpg`, 390)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba V35A Usuarios: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` - ${f}`)
process.exit(fallos.length ? 1 : 0)
