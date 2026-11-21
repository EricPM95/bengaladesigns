// La prueba de la Tanda V35B (datos de las personas): «¿En qué país vives?» (4ª pregunta de la primera vez y Ajustes), el aviso de USO una vez al día (aparato e instalada, sin IP ni ubicación), el panel (dónde viven,
// activos al día/semana/mes, retención, aparato, dónde la usan, «Vive en» de la ficha), el aviso de «Empezar de cero» con pase pagado y que SIN la migración 0091 nada falla y sale «Pronto».
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV35B_personas.mjs     (con Vite en 5173; sin Vite solo la parte del servidor)
// Ninguna parte toca el Supabase de producción: el servidor se prueba con bases de mentira y la app con la demo (?logrosDemo=1). Un solo Chrome a la vez.
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'
import { AHORA, baseFalsa, baseFalsaConPersonas } from './_baseFalsaUsuarios.mjs'
import { servicioFalso } from './_ejecutarServicioUsuarios.mjs'
import { crearServicioPrimeraVez, limpiarPais, limpiarRespuestas } from '../../server/primeraVez.js'
import { APARATOS, crearServicioUso, limpiarUso } from '../../server/uso.js'
import { leerBase } from '../../server/panel/base.js'
import { calcularInicio } from '../../server/panel/calculos.js'
import { dondeViven, usoDeLaApp } from '../../server/panel/calculosPersonas.js'
import { rangoDePeriodo } from '../../server/panel/periodo.js'

let comprobaciones = 0
const fallos = []
const debe = (cond, regla, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')
const APP = process.env.APP_URL ?? 'http://localhost:5173'

/* ───────── 1. El servidor: el país donde vives ───────── */
console.log('1. El servidor guarda el país (2 letras, mayúsculas), lo ignora si no es válido y NO falla sin la columna de la 0091')
{
  debe(limpiarPais('es') === 'ES' && limpiarPais(' mx ') === 'MX' && limpiarPais('ESP') === null && limpiarPais('1.2.3.4') === null && limpiarPais('Madrid') === null && limpiarPais(null) === null && limpiarPais(34) === null, 'pais', 'solo vale un código de 2 letras (se guarda en mayúsculas); una IP, una ciudad o un número, no')
  const l = limpiarRespuestas({ frecuencia: 'dos_o_tres', pais_vive: 'es', ip: '1.2.3.4', ubicacion: { lat: 1, lng: 2 } }, 2026)
  debe(JSON.stringify(Object.keys(l).sort()) === '["anio_nacimiento","compania","frecuencia","pais_vive"]' && l.pais_vive === 'ES', 'pais', 'lo que se guarda lleva el país y nada de IP ni de ubicación')
  debe(limpiarRespuestas({}, 2026).pais_vive === null, 'pais', 'es opcional: sin país, queda vacío')

  // Una base de mentira CON la columna.
  const filas = new Map()
  const conColumna = {
    from: () => ({
      upsert: async (fila) => (filas.set(fila.user_id, { ...(filas.get(fila.user_id) ?? {}), ...fila }), { error: null }),
      update: (valores) => ({ eq: async (_c, id) => (filas.has(id) ? (filas.set(id, { ...filas.get(id), ...valores }), { error: null }) : { error: null }) }),
      select: () => ({ eq: (_c, id) => ({ maybeSingle: async () => ({ data: filas.get(id) ?? null, error: null }) }) }),
    }),
  }
  const s = crearServicioPrimeraVez({ admin: conColumna })
  await s.guardar({ id: 'u1' }, { frecuencia: 'cuatro_o_mas', pais_vive: 'fr' })
  const l1 = await s.leer({ id: 'u1' })
  debe(l1.cuerpo.pais_vive === 'FR' && l1.cuerpo.frecuencia === 'cuatro_o_mas', 'pais', 'guardar y leer: el país vuelve en mayúsculas junto a lo demás')
  const r = await s.guardarPais({ id: 'u1' }, { pais_vive: 'it' })
  const l2 = await s.leer({ id: 'u1' })
  debe(r.estado === 200 && r.cuerpo.guardado === true && l2.cuerpo.pais_vive === 'IT' && l2.cuerpo.frecuencia === 'cuatro_o_mas', 'ajustes', 'cambiar el país en Ajustes cambia SOLO el país (lo que contestó antes se queda)')
  await s.guardarPais({ id: 'u1' }, { pais_vive: null })
  debe((await s.leer({ id: 'u1' })).cuerpo.pais_vive === null, 'ajustes', 'se puede quitar (null)')
  const nuevo = await s.guardarPais({ id: 'u2' }, { pais_vive: 'pt' })
  debe(nuevo.estado === 200 && filas.get('u2')?.pais_vive === 'PT', 'ajustes', 'quien aún no tenía fila también puede ponerlo desde Ajustes')

  // Una base de mentira SIN la columna (la 0091 sin aplicar): PostgREST dice PGRST204 al tocar `pais_vive`.
  const sinCol = new Map()
  const errorColumna = { code: 'PGRST204', message: "Could not find the 'pais_vive' column of 'viajero_primera_vez' in the schema cache" }
  const sinColumna = {
    from: () => ({
      upsert: async (fila) => ('pais_vive' in fila ? { error: errorColumna } : (sinCol.set(fila.user_id, { ...fila }), { error: null })),
      update: () => ({ eq: async () => ({ error: errorColumna }) }),
      select: (cols) => ({ eq: (_c, id) => ({ maybeSingle: async () => (String(cols).includes('pais_vive') ? { data: null, error: errorColumna } : { data: sinCol.get(id) ?? null, error: null }) }) }),
    }),
  }
  const sc = crearServicioPrimeraVez({ admin: sinColumna })
  const g = await sc.guardar({ id: 'u1' }, { frecuencia: 'dos_o_tres', pais_vive: 'es' })
  debe(g.estado === 200 && sinCol.get('u1')?.frecuencia === 'dos_o_tres' && !('pais_vive' in sinCol.get('u1')), 'sin_0091', 'sin la columna, guardar reintenta SIN el país: lo demás se guarda y no falla')
  const le = await sc.leer({ id: 'u1' })
  debe(le.estado === 200 && le.cuerpo.hecho === true && le.cuerpo.pais_vive === null, 'sin_0091', 'sin la columna, leer sigue dando «hecho» (las preguntas no salen en bucle) y el país vacío')
  sinCol.set('u9', { user_id: 'u9' })
  const gp = await sc.guardarPais({ id: 'u9' }, { pais_vive: 'es' })
  debe(gp.estado === 200 && gp.cuerpo.ok === true && gp.cuerpo.guardado === false, 'sin_0091', 'sin la columna, cambiar el país desde Ajustes da «ok» sin guardar (no falla)')
  const src = leer('server/primeraVez.js')
  debe(src.includes("app.put('/api/primera-vez/pais'") && src.includes("app.get('/api/primera-vez/pais'"), 'servidor', 'las rutas del país (GET y PUT /api/primera-vez/pais) están montadas')
}

/* ───────── 2. El servidor: el aviso de uso ───────── */
console.log('2. El aviso de uso: SOLO aparato e instalada; sin IP ni ubicación; sin la función de la 0091 responde «ok» sin fallar')
{
  debe(JSON.stringify(APARATOS) === '["iphone","android","ordenador"]', 'uso', 'los aparatos son iPhone, Android y ordenador (sin modelos)')
  debe(JSON.stringify(limpiarUso({ aparato: 'iphone', instalada: true, ip: '1.2.3.4', lat: 1, modelo: 'iPhone 15', navegador: 'Safari 17' })) === '{"aparato":"iphone","instalada":true}', 'uso', 'del cuerpo solo pasan aparato e instalada (la IP, la ubicación, el modelo y el navegador se descartan)')
  debe(limpiarUso({ aparato: 'iPhone 15 Pro' }) === null && limpiarUso({}) === null && limpiarUso(null) === null, 'uso', 'un aparato que no es de la lista no vale')
  debe(limpiarUso({ aparato: 'android', instalada: 'si' }).instalada === false, 'uso', '«instalada» solo vale si es verdadero de verdad')

  const llamadas = []
  const admin = { rpc: async (nombre, args) => (llamadas.push({ nombre, args }), { error: null }) }
  const s = crearServicioUso({ admin })
  const r = await s.anotar({ id: 'u1', is_anonymous: false }, { aparato: 'ordenador', instalada: false, ip: '8.8.8.8' })
  debe(r.estado === 200 && r.cuerpo.guardado === true && llamadas.length === 1 && llamadas[0].nombre === 'uso_anotar' && JSON.stringify(Object.keys(llamadas[0].args).sort()) === '["p_aparato","p_instalada","p_uid"]', 'uso', 'llama a uso_anotar con la cuenta, el aparato y si está instalada: nada más')
  const an = await s.anotar({ id: 'u2', is_anonymous: true }, { aparato: 'android', instalada: true })
  debe(an.estado === 200 && an.cuerpo.guardado === false && llamadas.length === 1, 'uso', 'una cuenta anónima no cuenta: no se guarda nada')
  debe((await s.anotar({ id: 'u1' }, { aparato: 'tablet' })).estado === 400, 'uso', 'un cuerpo que no vale da 400')
  const sinFuncion = crearServicioUso({ admin: { rpc: async () => ({ error: { code: 'PGRST202', message: 'Could not find the function public.uso_anotar(p_aparato, p_instalada, p_uid) in the schema cache' } }) } })
  const sf = await sinFuncion.anotar({ id: 'u1', is_anonymous: false }, { aparato: 'iphone', instalada: false })
  debe(sf.estado === 200 && sf.cuerpo.ok === true && sf.cuerpo.guardado === false, 'sin_0091', 'sin la función uso_anotar (0091 sin aplicar) responde «ok» con «guardado: false»: no falla y la app no insiste')
  const malo = crearServicioUso({ admin: { rpc: async () => ({ error: { code: 'XX000', message: 'boom' } }) } })
  const consola = console.error
  console.error = () => {}
  const m = await malo.anotar({ id: 'u1', is_anonymous: false }, { aparato: 'iphone', instalada: false })
  console.error = consola
  debe(m.estado === 503, 'uso', 'un fallo de verdad da 503 (la app volverá a intentarlo en la próxima apertura)')
  const fuente = leer('server/uso.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  debe(!/req\.ip|x-forwarded|user-agent|remoteAddress|\.headers|geolocation/i.test(fuente.replace(/tokenDe\(req\)/g, '')), 'sin_ip', 'el servidor de uso ni mira la dirección IP, ni las cabeceras, ni la ubicación (solo el cuerpo ya limpio)')
  debe(leer('server/index.js').includes('registrarRutasUso(app, { admin: salesAdmin })') && leer('server/uso.js').includes("app.post('/api/uso'"), 'servidor', 'POST /api/uso está montado en el servidor')
  const cli = leer('src/lib/usoDiario.ts')
  debe(/aparato: aparatoDe\(/.test(cli) && !/geolocation|ipify|ipapi|ip-api|ipinfo|fetch\(/.test(cli), 'sin_ip', 'el cliente solo manda aparato e instalada: sin ubicación ni consultas de IP')
}

/* ───────── 3. El panel: datos de demo ───────── */
console.log('3. El panel: activos, retención, aparato, dónde la usan, dónde viven y «Vive en» (con datos de la 0091)')
const base = baseFalsaConPersonas()
const s35 = servicioFalso({ base })
{
  const r = await s35.totales({ periodo: 'mes' })
  debe(r.actividad.de_uso === true && r.actividad.dia === 1 && r.actividad.semana === 3 && r.actividad.mes === 4, 'actividad', `activos: 1 al día, 3 a la semana, 4 al mes (de uso_diario: ${r.actividad.dia}/${r.actividad.semana}/${r.actividad.mes})`)
  debe(r.actividad.retencion_pct === 75 && r.actividad.retencion_base === 4 && r.actividad.retencion_vuelven === 3, 'retencion', `retención: de los 4 activos la semana anterior, 3 vuelven (75 %) (${r.actividad.retencion_vuelven} de ${r.actividad.retencion_base}: ${r.actividad.retencion_pct} %)`)
  debe(r.activos === 4, 'actividad', `«Activos en el periodo» (este mes) sale de los días de uso: 4 (${r.activos})`)
  const ap = Object.fromEntries(r.uso.aparato.map((x) => [x.valor, x.pct]))
  debe(ap.iphone === 50 && ap.android === 25 && ap.ordenador === 25 && r.uso.aparato[0].nombre === 'iPhone', 'aparato', `aparato: iPhone 50 %, Android 25 %, Ordenador 25 % (${JSON.stringify(ap)})`)
  const dn = Object.fromEntries(r.uso.donde.map((x) => [x.valor, x.pct]))
  debe(dn.instalada === 25 && dn.navegador === 75 && r.uso.donde.find((x) => x.valor === 'instalada').nombre === 'App instalada', 'donde_la_usan', `dónde la usan: app instalada 25 %, navegador 75 % (${JSON.stringify(dn)})`)
  debe(r.entran.correo + r.entran.google === 60 && r.entran.google > 0 && r.entran.correo > 0, 'entran', 'cómo entran (correo/Google) sigue saliendo de la cuenta')
  const v = r.donde_viven
  debe(v && v.total === 3 && v.paises[0].iso === 'es' && v.paises[0].nombre === 'España' && v.paises[0].n === 2 && v.paises[1].iso === 'mx' && v.paises[1].nombre === 'México', 'donde_viven', 'dónde viven: España 2 y México 1 (con su código para la bandera)')
  const s7 = await s35.totales({ periodo: '7d' })
  debe(s7.activos === 3 && s7.uso.aparato.find((x) => x.valor === 'iphone').n === 1 && s7.uso.aparato.length === 3, 'periodo', `respeta el selector: en los últimos 7 días hay 3 personas activas y el reparto cambia (${s7.activos})`)
  const dia = await s35.totales({ periodo: 'custom', desde: '2026-11-01', hasta: '2026-11-12' })
  debe(dia.actividad.dia === 2 && dia.actividad.semana === 3, 'periodo', `con un periodo que acaba el 12 de nov, «al día» cuenta ese día (Eric y Alice) (${dia.actividad.dia}/${dia.actividad.semana})`)
  const ficha = await s35.ficha('u-eric')
  debe(ficha.vive_en?.iso === 'es' && ficha.vive_en.nombre === 'España', 'ficha', 'la ficha de Eric dice «Vive en: España» (con su código para la bandera)')
  debe((await s35.ficha('u-bruno')).vive_en?.nombre === 'México' && (await s35.ficha('u-alice')).vive_en === null, 'ficha', 'Bruno vive en México; Alice no lo ha dicho: sin dato')
  const inicio = calcularInicio(base, { nuevos: 0, fotos: 0, recientes: [] }, { periodo: {}, ahora: AHORA })
  debe(inicio.donde_viven?.paises[0].iso === 'es' && inicio.donde_viven.paises[0].n === 2, 'inicio', '«Dónde viven» de Inicio sale con los mismos datos')
  debe(!/"ip"|ubicaci|email|correo|@|"lat"|"lng"/i.test(JSON.stringify(r.uso)), 'sin_ip', 'lo que sale del uso no lleva IP, ubicación ni correos')
}

/* ───────── 4. Sin la 0091 nada falla y sale «Pronto» ───────── */
console.log('4. SIN la migración 0091: la base no falla, nada se inventa y el panel dice «Pronto»')
{
  // Un Supabase de mentira al que le faltan las tablas y la columna de la 0091.
  const falta = (t, cols) => ['uso_diario', 'afiliados_clics', 'cuentas_de_prueba', 'destinos_proximamente'].includes(t) || (t === 'viajero_primera_vez' && /pais_vive/.test(cols)) || (t === 'pagos_registro' && /comision_cent/.test(cols))
  const tablas = { travelers: base.travelers, trips: base.trips, trip_members: base.miembros, passes: base.pases, pass_members: base.miembros_pase, pagos_registro: base.pagos, achievements: base.logros, logro_perfil: base.perfiles, viajero_primera_vez: base.primera_vez.map(({ pais_vive: _p, ...resto }) => resto), avisos_destino: [] }
  const crudos = base.usuarios.map((u) => ({ id: u.id, email: u.email, created_at: u.alta, last_sign_in_at: u.ultimo_acceso, is_anonymous: false, app_metadata: { providers: [u.proveedor === 'google' ? 'google' : 'email'] } }))
  const admin = {
    from: (t) => ({
      select: (cols) => {
        const c = { order: () => c, range: () => c, then: (ok) => ok(falta(t, cols) ? { data: null, error: { code: '42P01', message: `relation "public.${t}" does not exist` } } : { data: tablas[t] ?? [], error: null }) }
        return c
      },
    }),
    auth: { admin: { listUsers: async ({ page }) => ({ data: { users: page === 1 ? crudos : [] }, error: null }) } },
  }
  let b
  let lanzo = false
  try {
    b = await leerBase(admin)
  } catch {
    lanzo = true
  }
  debe(!lanzo && b.hay.uso === false && b.hay.pais === false && b.hay.clics === false, 'sin_0091', 'leerBase no lanza y dice que no hay datos de país ni de uso (hay.pais, hay.uso = false)')
  debe(b.usuarios.length === 60 && b.primera_vez.length === base.primera_vez.length && b.uso_diario.length === 0, 'sin_0091', 'sigue leyendo todo lo de siempre (usuarios, primera vez) y el uso vacío')
  debe(dondeViven(b) === null && usoDeLaApp(b, rangoDePeriodo({ periodo: 'mes' }, AHORA)) === null, 'sin_0091', 'sin la 0091, «dónde viven» y «uso» dan null (el panel dice «Pronto»)')
  const sin = servicioFalso({ base: b })
  const r = await sin.totales({ periodo: 'mes' })
  debe(r.donde_viven === null && r.uso === null && r.actividad.retencion_pct === null && r.actividad.de_uso === false, 'sin_0091', 'el resumen sin la 0091: dónde viven = null, uso = null, retención = null')
  debe(typeof r.actividad.dia === 'number' && r.actividad.dia >= 1, 'sin_0091', 'la actividad sigue saliendo del último acceso (como antes de la V35B)')
  debe((await sin.ficha('u-eric')).vive_en === null, 'sin_0091', 'la ficha sin la 0091: «Vive en» sin dato')
  const i = calcularInicio(b, { nuevos: 0, fotos: 0, recientes: [] }, { periodo: {}, ahora: AHORA })
  debe(i.donde_viven === null, 'sin_0091', 'Inicio sin la 0091: dónde viven = null («Pronto»)')
  const viejo = servicioFalso({ base: baseFalsa() })
  debe((await viejo.totales({ periodo: 'mes' })).donde_viven === null && (await viejo.totales({ periodo: 'mes' })).uso === null, 'sin_0091', 'una base de la V35A (sin `hay`) también sale «Pronto»')
}

/* ───────── 5. El código y la política de privacidad ───────── */
console.log('5. El código, la privacidad y la nota de «Empezar de cero»')
{
  const p = leer('src/lib/privacidad.ts')
  debe(/AVISO_DE_PAIS_PRIVACIDAD/.test(p) && /AVISO_DE_USO_PRIVACIDAD/.test(p) && /escrito: \[AVISO_DE_DESTINOS_PRIVACIDAD, AVISO_DE_CUENTANOS_PRIVACIDAD, AVISO_DE_PAIS_PRIVACIDAD, AVISO_DE_USO_PRIVACIDAD\]/.test(p), 'privacidad', 'la página de privacidad lleva el texto del país y el del uso')
  debe(/sin el modelo/.test(p) && /no guardamos tu dirección IP ni tu ubicación/.test(p) && /nunca de tu ubicación ni de tu dirección IP/.test(p), 'privacidad', 'los textos dicen: sin modelo, sin IP, sin ubicación')
  const m = leer('src/lib/paisVive.ts')
  debe(!/geolocation|ipify|ipapi|ip-api|ipinfo|fetch\(/.test(m), 'sin_ip', 'el país del móvil sale solo del idioma: sin ubicación ni consultas de IP')
  const mig = leer('supabase/migrations/0089_viajero_primera_vez.sql') + leer('supabase/migrations/0091_panel_datos.sql')
  debe(/passes', 'comprador_id'/.test(mig) && !/pagos_registro/.test(leer('supabase/migrations/0091_panel_datos.sql').split('create or replace function public.empezar_de_cero')[1] ?? ''), 'empezar_de_cero', '«Empezar de cero» borra los pases donde la cuenta es la compradora y NO toca el registro de cobros')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba V35B Personas: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 6. En la app ───────── */
const RUTA = '/?cuentas=on&logros=on&logrosDemo=1&apertura=0'
const NUEVA = "try{localStorage.setItem('trazo:demo:primera_vez_nueva','si');localStorage.removeItem('trazo:demo:primera_vez_hecha');localStorage.removeItem('trazo:primera_vez:avisados')}catch(e){}"
const CURADOS = "window.__destinosCurados = [{ clave: 'roma', nombre: 'Roma', pais: 'Italia', iso: 'it', lat: 41.9028, lng: 12.4964, linea: 'La ciudad eterna', portada: '/fotos/roma/dia_coliseo.jpg', portada_pequena: '/fotos/roma/dia_coliseo_p.jpg' }];"
// El idioma del móvil (y un contador de ubicaciones pedidas: no debe subir de 0).
const IDIOMA = (langs) => `try{const L=${JSON.stringify(langs)};Object.defineProperty(Navigator.prototype,'languages',{get(){return L},configurable:true});Object.defineProperty(Navigator.prototype,'language',{get(){return L[0]},configurable:true});window.__geo=0;if(navigator.geolocation){const g=navigator.geolocation;g.getCurrentPosition=function(){window.__geo++};g.watchPosition=function(){window.__geo++;return 0}}}catch(e){}`
const esperar = async (a, js, n = 60) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(500)
  }
  return false
}
const clic = (a, sel) => a.evaluar(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true })()`)
const J = async (a, js) => JSON.parse(await a.evaluar(js))
const texto = (a) => a.evaluar('document.body.innerText.replace(/\\s+/g, " ")')
const pasarBienvenida = async (a) => {
  await esperar(a, "Boolean(document.querySelector('[data-bienvenida-primera-vez]'))")
  await a.evaluar("document.querySelector('[data-empezar]')?.click(); true")
}
// Hasta la quinta pantalla (país): [Continuar] en las cuatro primeras sin marcar nada.
const hastaElPais = async (a) => {
  await pasarBienvenida(a)
  await esperar(a, "Boolean(document.querySelector('[data-pregunta=\"1\"]'))")
  for (let i = 0; i < 4; i++) {
    await clic(a, '[data-continuar]')
    await a.esp(250)
  }
  return esperar(a, "Boolean(document.querySelector('[data-pregunta=\"5\"]'))", 20)
}
const hayPeticionDeIp = (a) => a.peticiones.some((u) => /ipify|ipapi|ip-api|ipinfo|geoip|ifconfig|checkip|icanhazip|freegeoip|ipwho/i.test(u))

console.log('6. La pregunta del país en la primera vez: sale ya marcada con el idioma del móvil, sin ubicación ni IP')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS + IDIOMA(['es-ES', 'es']) })
  try {
    const llega = await hastaElPais(a)
    debe(llega, 'pais', 'la quinta pantalla (la cuarta pregunta guardada, tras el año) existe')
    const q = await J(a, "JSON.stringify({ texto: document.body.innerText.replace(/\\s+/g, ' '), marcado: [...document.querySelectorAll('[data-pais][aria-pressed=\"true\"]')].map((e) => e.getAttribute('data-pais')), primero: document.querySelector('[data-pais]')?.getAttribute('data-pais'), n: document.querySelectorAll('[data-pais]').length, banderas: document.querySelectorAll('[data-pais] .fi').length, saltar: Boolean(document.querySelector('[data-saltar]')), progreso: document.querySelector('[aria-label^=\"Pregunta \"]')?.getAttribute('aria-label'), geo: window.__geo })")
    debe(/En qué país vives/.test(q.texto) && /Opcional/.test(q.texto) && /Ajustes/.test(q.texto), 'pais', `título «¿En qué país vives?» y la nota «Opcional… lo puedes cambiar en Ajustes» (${q.texto.slice(0, 160)})`)
    debe(q.marcado.join() === 'ES' && q.primero === 'ES', 'idioma', `con el idioma del móvil «es-ES» sale marcado España, arriba del todo (${q.marcado})`)
    debe(q.n > 150 && q.banderas === q.n && /España/.test(q.texto) && /México/.test(q.texto), 'pais', `lista de países en español con su bandera cada uno (${q.n} países, ${q.banderas} banderas)`)
    debe(q.saltar && q.progreso === 'Pregunta 5 de 5', 'pais', `lleva «Saltar» y la barra dice «${q.progreso}»`)
    debe(q.geo === 0 && !hayPeticionDeIp(a), 'sin_ip', `no se pide la ubicación (${q.geo} veces) ni se consulta ninguna IP`)
    await clic(a, '[data-continuar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.guardados === 1 && g.pais_vive === 'ES' && g.ultimo.pais_vive === 'ES', 'pais', 'con [Continuar] se guarda el país: ES')
    debe(JSON.stringify(Object.keys(g.ultimo).sort()) === '["anio_nacimiento","compania","frecuencia","pais_vive"]', 'sin_ip', `lo enviado lleva solo esas cuatro claves: ${Object.keys(g.ultimo)}`)
  } finally {
    a.cerrar()
  }
}
{
  // Sin región en el idioma («en», «es»): no sale ninguno marcado. Se elige uno a mano.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS + IDIOMA(['es', 'en']) })
  try {
    await hastaElPais(a)
    const q = await J(a, "JSON.stringify({ marcado: document.querySelectorAll('[data-pais][aria-pressed=\"true\"]').length, primero: document.querySelector('[data-pais]')?.getAttribute('data-pais') })")
    debe(q.marcado === 0, 'idioma', 'idioma sin región («es»): ninguno sale marcado')
    await clic(a, '[data-pais="MX"]')
    await a.esp(200)
    debe((await a.evaluar("document.querySelector('[data-pais=\"MX\"]').getAttribute('aria-pressed')")) === 'true', 'pais', 'se puede marcar un país a mano')
    await clic(a, '[data-continuar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.pais_vive === 'MX', 'pais', 'se guarda el que eligió: MX')
  } finally {
    a.cerrar()
  }
}
{
  // Opcional: [Saltar] con uno ya marcado NO lo guarda.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: NUEVA + CURADOS + IDIOMA(['es-ES']) })
  try {
    await hastaElPais(a)
    await clic(a, '[data-saltar]')
    await esperar(a, "Boolean(document.querySelector('[data-mapa-primera-vez]'))")
    const g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(g.guardados === 1 && g.pais_vive === null && g.ultimo.pais_vive === null, 'saltar', '«Saltar» en la pregunta del país no guarda nada (aunque saliera marcado): queda «hecho» y no vuelve')
    const salen = await a.evaluar("Boolean(document.querySelector('[data-preguntas-primera-vez]'))")
    debe(!salen, 'saltar', 'las preguntas se cierran (sin bucle)')
  } finally {
    a.cerrar()
  }
}
{
  // Pura: el idioma → país.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844 })
  try {
    const r = await J(a, "import('/src/lib/paisVive.ts').then((m) => JSON.stringify({ a: m.paisDeLosIdiomas(['es-ES']), b: m.paisDeLosIdiomas(['es']), c: m.paisDeLosIdiomas(['es', 'pt-BR']), d: m.paisDeLosIdiomas(['es-419', 'en-GB']), e: m.paisDeLosIdiomas([]), f: m.paisDeLosIdiomas(['es-Latn-MX']), g: m.paisDeLosIdiomas(['basura!!']), h: m.paisesOrdenados('MX')[0], n: m.PAISES.length, nom: m.nombreDelPais('ES') }))")
    debe(r.a === 'ES' && r.b === null && r.c === 'BR' && r.d === 'GB' && r.e === null && r.f === 'MX' && r.g === null, 'idioma', `del idioma al país: es-ES→${r.a}, es→${r.b}, [es, pt-BR]→${r.c}, [es-419, en-GB]→${r.d}, []→${r.e}, es-Latn-MX→${r.f}`)
    debe(r.h === 'MX' && r.nom === 'España' && r.n > 150, 'pais', 'el país del móvil va el primero y los nombres salen en español')
    const ap = await J(a, "import('/src/lib/usoDiario.ts').then((m) => JSON.stringify({ i: m.aparatoDe('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone', 5), ip: m.aparatoDe('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 'iPad', 5), mac: m.aparatoDe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 5), a: m.aparatoDe('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120 Mobile', 'Linux armv8l', 5), w: m.aparatoDe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', 'Win32', 0), m: m.aparatoDe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'MacIntel', 0), t1: m.tocaAvisar('2026-11-20', '2026-11-20'), t2: m.tocaAvisar('2026-11-19', '2026-11-20'), t3: m.tocaAvisar(null, '2026-11-20') }))")
    debe(ap.i === 'iphone' && ap.ip === 'iphone' && ap.mac === 'iphone' && ap.a === 'android' && ap.w === 'ordenador' && ap.m === 'ordenador', 'aparato', `del navegador al aparato: iPhone→${ap.i}, iPad→${ap.ip}, iPad como Mac→${ap.mac}, Android→${ap.a}, Windows→${ap.w}, Mac→${ap.m}`)
    debe(ap.t1 === false && ap.t2 === true && ap.t3 === true, 'uso', 'se avisa una vez al día: el mismo día no, otro día sí, sin aviso previo sí')
  } finally {
    a.cerrar()
  }
}

console.log('7. El aviso de uso en la app: una vez al día, con aparato e instalada y nada más')
{
  const antes = "window.__geo=0;try{if(navigator.geolocation){navigator.geolocation.getCurrentPosition=function(){window.__geo++};}}catch(e){}"
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: `${antes}try{if(!sessionStorage.getItem('v35b-vez')){sessionStorage.setItem('v35b-vez','1');localStorage.removeItem('trazo:uso:ultimo-aviso')}}catch(e){}` })
  try {
    const manda = await esperar(a, 'window.__demoPrimeraVez && window.__demoPrimeraVez.usos.length >= 1', 40)
    debe(manda, 'uso', 'una cuenta de verdad avisa de su uso al abrir la app')
    const u = await J(a, 'JSON.stringify({ usos: window.__demoPrimeraVez.usos, guardado: localStorage.getItem("trazo:uso:ultimo-aviso"), geo: window.__geo })')
    debe(u.usos.length === 1 && JSON.stringify(Object.keys(u.usos[0]).sort()) === '["aparato","instalada"]', 'uso', `el aviso lleva SOLO aparato e instalada (${JSON.stringify(u.usos[0])})`)
    debe(u.usos[0].aparato === 'ordenador' && u.usos[0].instalada === false, 'uso', 'en el Chrome de prueba (ordenador, en el navegador): «ordenador» y no instalada')
    debe(/^\d{4}-\d{2}-\d{2}$/.test(u.guardado ?? ''), 'uso', 'guarda en el móvil la fecha del último aviso (solo el día)')
    debe(u.geo === 0 && !hayPeticionDeIp(a), 'sin_ip', 'no se pide la ubicación ni se consulta ninguna IP')
    // Otra apertura el mismo día (la fecha ya guardada): no vuelve a avisar.
    await a.evaluar('location.reload()')
    await a.esp(4500)
    await esperar(a, 'Boolean(window.__demoPrimeraVez)', 40)
    await a.esp(1500)
    debe((await a.evaluar('window.__demoPrimeraVez.usos.length')) === 0, 'uso', 'la segunda apertura del mismo día no avisa otra vez')
    // Otro día: avisa.
    await a.evaluar('localStorage.setItem("trazo:uso:ultimo-aviso", "2020-01-01")')
    await a.evaluar('location.reload()')
    await esperar(a, 'window.__demoPrimeraVez && window.__demoPrimeraVez.usos.length >= 1', 40)
    debe((await a.evaluar('window.__demoPrimeraVez.usos.length')) === 1, 'uso', 'al día siguiente (otra fecha guardada) vuelve a avisar, una sola vez')
  } finally {
    a.cerrar()
  }
}
{
  // Instalada: navigator.standalone (iPhone) y un user agent de Android.
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: "try{Object.defineProperty(Navigator.prototype,'standalone',{get(){return true},configurable:true});localStorage.removeItem('trazo:uso:ultimo-aviso')}catch(e){}" })
  try {
    await esperar(a, 'window.__demoPrimeraVez && window.__demoPrimeraVez.usos.length >= 1', 40)
    const u = await J(a, 'JSON.stringify(window.__demoPrimeraVez.usos)')
    debe(u.length === 1 && u[0].instalada === true && JSON.stringify(Object.keys(u[0]).sort()) === '["aparato","instalada"]', 'uso', `abierta desde la pantalla de inicio: instalada = true (${JSON.stringify(u)})`)
  } finally {
    a.cerrar()
  }
}

console.log('8. Ajustes: el país donde vives se puede cambiar y quitar')
{
  const a = await abrirApp(APP, { ruta: RUTA, ancho: 390, alto: 844, antes: IDIOMA(['es-ES']) })
  try {
    await a.evaluar("import('/src/store/useAjustesUi.ts').then((m) => m.useAjustesUi.getState().abrir('ajustes')).then(() => true)")
    debe(await esperar(a, "Boolean(document.querySelector('[data-ajuste=\"pais-vive\"]'))", 40), 'ajustes', 'Ajustes tiene la fila «País donde vives»')
    let fila = await a.evaluar("document.querySelector('[data-ajuste=\"pais-vive\"]').innerText.replace(/\\s+/g, ' ')")
    debe(/País donde vives/.test(fila) && /Sin decirlo/.test(fila), 'ajustes', `sin país guardado dice «Sin decirlo» (${fila})`)
    await clic(a, '[data-ajuste="pais-vive"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-opcion-hoja=\"pais-ES\"]'))", 40), 'ajustes', 'abre la lista de países en español con banderas')
    const n = await a.evaluar("[...document.querySelectorAll('[data-opcion-hoja^=\"pais-\"]')].length")
    debe(n > 150 && (await a.evaluar("Boolean(document.querySelector('[data-opcion-hoja=\"pais-ninguno\"]'))")), 'ajustes', `${n} países y la opción «Prefiero no decirlo»`)
    await clic(a, '[data-opcion-hoja="pais-FR"]')
    await a.esp(600)
    fila = await a.evaluar("document.querySelector('[data-ajuste=\"pais-vive\"]').innerText.replace(/\\s+/g, ' ')")
    let g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    debe(/Francia/.test(fila) && g.pais_vive === 'FR' && g.paises.length === 1 && g.paises[0] === 'FR', 'ajustes', `elegir Francia: la fila lo dice y se guarda SOLO el país (${fila}; ${JSON.stringify(g.paises)})`)
    await clic(a, '[data-ajuste="pais-vive"]')
    await esperar(a, "Boolean(document.querySelector('[data-opcion-hoja=\"pais-ninguno\"]'))", 20)
    await clic(a, '[data-opcion-hoja="pais-ninguno"]')
    await a.esp(600)
    g = await J(a, 'JSON.stringify(window.__demoPrimeraVez)')
    fila = await a.evaluar("document.querySelector('[data-ajuste=\"pais-vive\"]').innerText.replace(/\\s+/g, ' ')")
    debe(g.pais_vive === null && /Sin decirlo/.test(fila), 'ajustes', '«Prefiero no decirlo» lo quita')
  } finally {
    a.cerrar()
  }
}

console.log('9. El panel en la pantalla: dónde viven con banderas, actividad, retención, aparato, dónde la usan y «Vive en»')
const RUTA_PANEL = (ruta, extra = '') => `${ruta}?cuentas=on&logros=on&logrosDemo=1&apertura=0${extra}`
{
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/usuarios'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"actividad\"]')) && Boolean(document.querySelector('[data-bloque=\"aparato\"]'))", 80), 'panel', 'Usuarios carga')
    await a.esp(600)
    const u = await J(a, `JSON.stringify({
      dia: document.querySelector('[data-actividad="dia"]').innerText.replace(/\\s+/g, ' '), semana: document.querySelector('[data-actividad="semana"]').innerText.replace(/\\s+/g, ' '), mes: document.querySelector('[data-actividad="mes"]').innerText.replace(/\\s+/g, ' '),
      ret: document.querySelector('[data-retencion]').innerText.replace(/\\s+/g, ' '),
      aparato: document.querySelector('[data-bloque="aparato"]').innerText.replace(/\\s+/g, ' '), donde: document.querySelector('[data-bloque="donde-la-usan"]').innerText.replace(/\\s+/g, ' '),
      viven: document.querySelector('[data-bloque="donde-viven"]').innerText.replace(/\\s+/g, ' '), banderasViven: [...document.querySelectorAll('[data-bloque="donde-viven"] [data-bandera]')].map((b) => b.getAttribute('data-bandera')),
      entran: document.querySelector('[data-bloque="como-entran"]').innerText.replace(/\\s+/g, ' '), pronto: document.querySelectorAll('[data-pronto]').length, activos: document.querySelector('[data-cifra="activos"]').innerText.replace(/\\s+/g, ' ') })`)
    debe(/^1 /.test(u.dia) && /^3 /.test(u.semana) && /^4 /.test(u.mes), 'actividad', `Actividad: ${u.dia} · ${u.semana} · ${u.mes}`)
    debe(/75 %/.test(u.ret) && /3 de 4/.test(u.ret) && !/Pronto/.test(u.ret), 'retencion', `la retención sale de verdad (${u.ret})`)
    debe(/iPhone 50 %/.test(u.aparato) && /Android 25 %/.test(u.aparato) && /Ordenador 25 %/.test(u.aparato) && !/Pronto/.test(u.aparato), 'aparato', `Aparato: ${u.aparato}`)
    debe(/App instalada 25 %/.test(u.donde) && /Navegador 75 %/.test(u.donde), 'donde_la_usan', `Dónde la usan: ${u.donde}`)
    debe(/España/.test(u.viven) && /México/.test(u.viven) && !/Pronto/.test(u.viven) && u.banderasViven.join() === 'es,mx', 'donde_viven', `Dónde viven con banderas (${u.banderasViven}): ${u.viven}`)
    debe(/Con correo/.test(u.entran) && /Con Google/.test(u.entran), 'entran', 'Cómo entran sigue ahí')
    debe(u.pronto === 0 && /^4$|ACTIVOS EN EL PERIODO\s*4|4/.test(u.activos), 'panel', `con la 0091 no queda ningún «Pronto» en el resumen (${u.pronto}); activos en el periodo: ${u.activos}`)
    await clic(a, '[data-periodo="7d"]')
    await esperar(a, "/Últimos 7 días/.test(document.querySelector('[data-cifra=\"nuevos\"]')?.innerText ?? '')", 20)
    await a.esp(500)
    const sem = await a.evaluar("document.querySelector('[data-bloque=\"aparato\"]').innerText.replace(/\\s+/g, ' ')")
    debe(/iPhone 33 %/.test(sem) && /Android 33 %/.test(sem), 'periodo', `con «Últimos 7 días» el reparto del aparato cambia (${sem})`)
    await clic(a, '[data-periodo="mes"]')
  } finally {
    a.cerrar()
  }
}
{
  // La ficha: «Vive en» con bandera.
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/usuarios', '&ficha=u-eric'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-ficha-dato=\"vive\"]'))", 80), 'ficha', 'la ficha de Eric carga')
    const f = await J(a, "JSON.stringify({ texto: document.querySelector('[data-ficha-dato=\"vive\"]')?.innerText ?? '', bandera: document.querySelector('[data-ficha-dato=\"vive\"] [data-bandera]')?.getAttribute('data-bandera') ?? null })")
    debe(f.texto === 'España' && f.bandera === 'es', 'ficha', `la ficha de Eric: «Vive en» España con su bandera (${f.texto} / ${f.bandera})`)
  } finally {
    a.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"donde-viven\"]'))", 80), 'inicio', 'Inicio carga')
    await a.esp(500)
    const v = await J(a, "JSON.stringify({ filas: [...document.querySelectorAll('[data-bloque=\"donde-viven\"] [data-origen]')].map((e) => e.getAttribute('data-origen')), banderas: [...document.querySelectorAll('[data-bloque=\"donde-viven\"] [data-bandera]')].map((b) => b.getAttribute('data-bandera')), pronto: document.querySelectorAll('[data-bloque=\"donde-viven\"] [data-pronto]').length })")
    debe(v.filas.join() === 'España,México' && v.banderas.join() === 'es,mx' && v.pronto === 0, 'inicio', `Inicio · Dónde viven: España y México con bandera, sin «Pronto» (${v.filas})`)
  } finally {
    a.cerrar()
  }
}

console.log('10. SIN la 0091 en la pantalla: «Pronto» y nada falla')
{
  const SIN = "try{sessionStorage.setItem('trazo:demo-sin-0091','1')}catch(e){}"
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/usuarios'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: SIN })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"actividad\"]')) && Boolean(document.querySelector('[data-bloque=\"aparato\"]'))", 80), 'sin_0091', 'Usuarios carga sin la 0091')
    await a.esp(500)
    const u = await J(a, `JSON.stringify({ ret: document.querySelector('[data-retencion]').innerText.replace(/\\s+/g, ' '), aparato: document.querySelector('[data-bloque="aparato"]').innerText, donde: document.querySelector('[data-bloque="donde-la-usan"]').innerText, viven: document.querySelector('[data-bloque="donde-viven"]').innerText, dia: document.querySelector('[data-actividad="dia"]').innerText })`)
    debe(/Pronto/.test(u.ret) && /^—|^\s*—/.test(u.ret), 'sin_0091', `la retención sale «—» con «Pronto» (${u.ret})`)
    debe(/Pronto/.test(u.aparato) && /Pronto/.test(u.donde) && /Pronto/.test(u.viven), 'sin_0091', '«Aparato», «Dónde la usan» y «Dónde viven» salen «Pronto»')
    debe(!/NaN|undefined/.test(JSON.stringify(u)), 'sin_0091', 'ni «NaN» ni «undefined»')
    const errores = await a.evaluar('(window.__errores ?? []).length').catch(() => 0)
    debe(!errores, 'sin_0091', 'sin errores en la pantalla')
  } finally {
    a.cerrar()
  }
}
{
  const SIN = "try{sessionStorage.setItem('trazo:demo-sin-0091','1')}catch(e){}"
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5, antes: SIN })
  try {
    debe(await esperar(a, "Boolean(document.querySelector('[data-bloque=\"donde-viven\"]'))", 80), 'sin_0091', 'Inicio carga sin la 0091')
    debe(await a.evaluar("Boolean(document.querySelector('[data-bloque=\"donde-viven\"] [data-pronto]'))"), 'sin_0091', 'Inicio · «Dónde viven» sale «Pronto»')
  } finally {
    a.cerrar()
  }
}

console.log('11. «Empezar de cero»: avisa de los pases pagados ANTES de borrar')
{
  const a = await abrirApp(APP, { ruta: RUTA_PANEL('/admin/logros'), ancho: 1280, alto: 900, sinEsperarRoot: true, esperaFija: 5 })
  try {
    await esperar(a, "Boolean(document.querySelector('[data-pestana=\"herramientas\"]'))", 80)
    await clic(a, '[data-pestana="herramientas"]')
    debe(await esperar(a, "Boolean(document.querySelector('[data-empezar-de-cero-boton]'))", 60), 'cero', 'la pestaña Herramientas tiene [Empezar de cero]')
    const pase = (extra = {}) => ({ id: 'p1', destino: 'Roma', tipo: 'uno', estado: 'activo', creado_en: '2026-11-01T10:00:00Z', usos_max: 1, usos_usados: 0, es_mio: true, importe_cent: 699, moneda: 'eur', tiene_recibo: true, viaje: null, miembros: [{ nombre: 'Eric', es_yo: true, es_comprador: true }], invitacion: null, ...extra })
    const abrirDialogo = async () => {
      await clic(a, '[data-empezar-de-cero-no]')
      await a.esp(200)
      await clic(a, '[data-empezar-de-cero-boton]')
      await esperar(a, "Boolean(document.querySelector('[data-empezar-de-cero-dialogo]'))", 20)
      await a.esp(900)
      return a.evaluar("(document.querySelector('[data-empezar-de-cero-dialogo]')?.innerText ?? '').replace(/\\s+/g, ' ')")
    }
    // Sin pases: sin aviso.
    await a.evaluar('window.__demoCuentas.pases = []')
    let t = await abrirDialogo()
    debe(/Se borrará todo lo de tu cuenta/.test(t) && !/pagado/.test(t), 'cero', `sin pases: la confirmación de siempre, sin aviso (${t.slice(0, 80)})`)
    // Un pase regalado (sin cobro): sin aviso.
    await a.evaluar(`window.__demoCuentas.pases = [${JSON.stringify(pase({ tiene_recibo: false, importe_cent: 0 }))}]`)
    t = await abrirDialogo()
    debe(!/pagado/.test(t), 'cero', 'un pase regalado o de prueba (sin cobro) no dispara el aviso')
    // Un pase pagado.
    await a.evaluar(`window.__demoCuentas.pases = [${JSON.stringify(pase())}]`)
    t = await abrirDialogo()
    debe(/Tienes 1 pase pagado: se borrará con todo lo demás y no se devuelve el dinero\./.test(t) && /¿Seguro\?/.test(t), 'cero', `con un pase pagado: «Tienes 1 pase pagado: se borrará con todo lo demás y no se devuelve el dinero.» (${t})`)
    const orden = await a.evaluar("(() => { const d = document.querySelector('[data-empezar-de-cero-dialogo]'); return d.querySelector('[data-aviso-pases-pagados]') && d.querySelector('[data-empezar-de-cero-si]') && Boolean(d.querySelector('[data-aviso-pases-pagados]').compareDocumentPosition(d.querySelector('[data-empezar-de-cero-si]')) & Node.DOCUMENT_POSITION_FOLLOWING) })()")
    debe(orden === true, 'cero', 'el aviso sale ANTES del botón de confirmar')
    // Dos pagados (y uno compartido con otra persona, que pasa a ella y no se pierde).
    await a.evaluar(`window.__demoCuentas.pases = [${JSON.stringify(pase())}, ${JSON.stringify(pase({ id: 'p2', destino: 'Lanzarote' }))}, ${JSON.stringify(pase({ id: 'p3', miembros: [{ nombre: 'Eric', es_yo: true, es_comprador: true }, { nombre: 'Ana', es_yo: false, es_comprador: false }] }))}]`)
    t = await abrirDialogo()
    debe(/Tienes 2 pases pagados: se borrarán con todo lo demás y no se devuelve el dinero\./.test(t), 'cero', `con dos pagados (el compartido no cuenta: pasa a la otra persona): «Tienes 2 pases pagados…» (${t.slice(0, 200)})`)
    // La nota fija debajo del botón sigue diciendo qué se queda.
    const nota = await a.evaluar("document.querySelector('[data-que-borra=\"cero\"]').innerText")
    debe(/registros de cobros/.test(nota), 'cero', 'la línea de debajo del botón dice que el registro de cobros se queda')
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba V35B Personas: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(` - [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
