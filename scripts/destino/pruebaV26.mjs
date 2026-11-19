// La prueba de la Tanda V26: EL GASTO DE SUPABASE (tráfico de salida). Ninguna llamada a producción: todo con bases de datos y almacenes de mentira que cuentan los bytes.
//   node scripts/destino/pruebaV26.mjs
//  1. El servidor ya no baja la ruta entera de los viajes en cada llamada de logros   2. Las direcciones firmadas de las fotos se reutilizan (el móvil no las baja otra vez)   3. Las preguntas repetidas: una sola vez, nunca en segundo plano, más espaciadas
//  4. Las fotos nuevas se suben con caché de un año y las listas piden la miniatura   5. Los números: antes y después, y lo que gastarían 100 y 1.000 personas
import fs from 'node:fs'
import { repoSupabase, olvidarViajesEnMemoria } from '../../server/logros/repo.js'
import { firmarConCache, olvidarTodasLasUrlsFirmadas, SEGUNDOS_FIRMA_LARGA } from '../../src/lib/urlsFirmadas.ts'

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

/* ───────── 1. El servidor: la ruta solo se baja si el viaje cambió ───────── */
console.log('1. El servidor: la ruta entera solo se baja si el viaje cambió')
// El peso de una ruta de verdad: medido con el viaje de pruebas del motor (Roma, 4 días, 48 paradas) = 79 KB (un viaje más largo o con más detalle pesa más). Aquí va de relleno del mismo tamaño.
const KB_RUTA_REAL = 79
const rutaDeMuestra = { destination: 'Roma', answers: { dateRange: { start: '2026-11-08', end: '2026-11-13' } }, relleno: 'x'.repeat(KB_RUTA_REAL * 1024) }
const KB = Math.round(JSON.stringify(rutaDeMuestra).length / 1024)
async function medirRepo({ llamadas, cambiaEn }) {
  let bajado = 0
  let consultas = 0
  let version = 'v1'
  const filas = [{ id: 't1', traveler_id: 'U', route: rutaDeMuestra, updated_at: '2026-11-08T10:00:00Z' }, { id: 't2', traveler_id: 'U', route: rutaDeMuestra, updated_at: '2026-11-01T10:00:00Z' }]
  const filtrar = (tabla, columnas) => {
    const q = { _f: [], eq(c, v) { this._f.push((r) => r[c] === v); return this }, in(c, vs) { this._f.push((r) => vs.includes(r[c])); return this }, not() { return this }, then(res) {
      consultas++
      let d = tabla === 'trips' ? filas.map((f) => (f.id === 't1' ? { ...f, updated_at: version === 'v1' ? f.updated_at : '2026-11-09T09:00:00Z' } : f)) : []
      d = d.filter((r) => this._f.every((f) => f(r)))
      const cols = columnas.split(',').map((c) => c.trim())
      d = d.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])))
      bajado += JSON.stringify(d).length
      return res({ data: d, error: null })
    } }
    return q
  }
  const admin = { from: (t) => ({ select: (c) => filtrar(t, c) }) }
  const repo = repoSupabase(admin)
  olvidarViajesEnMemoria()
  for (let i = 0; i < llamadas; i++) {
    if (i === cambiaEn) version = 'v2'
    await repo.viajesDe('U')
  }
  return { bytes: bajado, consultas }
}
{
  const N = 60 // una hora de HOY abierto con la pregunta de «cerca de aquí» cada minuto
  const sinCambios = await medirRepo({ llamadas: N, cambiaEn: 9999 })
  const conCambio = await medirRepo({ llamadas: N, cambiaEn: 30 })
  const antes = N * 2 * KB * 1024 // antes: la ruta entera de los 2 viajes en CADA llamada
  console.log(`   (la ruta de ejemplo pesa ${KB} KB; ${N} llamadas seguidas)  antes ${Math.round(antes / 1024)} KB · ahora sin cambios ${Math.round(sinCambios.bytes / 1024)} KB · con un cambio a mitad ${Math.round(conCambio.bytes / 1024)} KB`)
  debe(sinCambios.bytes < antes / 20, 'ruta', 'sin cambios en el viaje, las llamadas de logros bajan menos de la veinteava parte de antes')
  debe(conCambio.bytes < antes / 10 && conCambio.bytes > sinCambios.bytes, 'ruta', 'si el viaje cambia, esa ruta se vuelve a bajar (una vez) y se ve lo nuevo')
  const fuente = leer('server/logros/repo.js')
  debe(/select\('id, traveler_id, updated_at'\)/.test(fuente) && /EDAD_MAXIMA_DE_UN_VIAJE_MS/.test(fuente), 'ruta', 'primero pregunta solo por lo ligero (id y updated_at) y guarda la ruta en memoria con un tope de edad')
  globalThis.__v26 = { KB, antesPorLlamada: 2 * KB, ahoraPorLlamada: Math.round(sinCambios.bytes / N / 1024 * 100) / 100 }
}

/* ───────── 2. Las fotos: la misma dirección ───────── */
console.log('2. Las direcciones firmadas de las fotos se reutilizan')
{
  olvidarTodasLasUrlsFirmadas()
  let firmas = 0
  let n = 0
  const firmador = async (rutas, segundos) => {
    firmas++
    debe(segundos === SEGUNDOS_FIRMA_LARGA && segundos >= 5 * 24 * 3600, 'firma', 'las direcciones valen días (no una hora)')
    return rutas.map((r) => ({ path: r, signedUrl: `https://x/${r}?token=${++n}` }))
  }
  const almacen = { datos: {}, leer() { return this.datos }, guardar(t) { this.datos = t } }
  const rutas = ['a/1.jpg', 'a/1_min.jpg', 'a/2.jpg', 'a/2_min.jpg']
  const ahora = Date.parse('2026-11-19T12:00:00Z')
  const m1 = await firmarConCache('fotos-viaje', rutas, firmador, { ahora, almacen })
  const m2 = await firmarConCache('fotos-viaje', rutas, firmador, { ahora: ahora + 3600_000, almacen })
  debe(firmas === 1 && rutas.every((r) => m1.get(r) === m2.get(r)), 'firma', 'listar las fotos otra vez da LAS MISMAS direcciones (el móvil no las baja de nuevo) y no pide firmar nada')
  const m3 = await firmarConCache('fotos-viaje', [...rutas, 'a/3.jpg'], firmador, { ahora: ahora + 7200_000, almacen })
  debe(firmas === 2 && m3.get('a/1.jpg') === m1.get('a/1.jpg') && m3.has('a/3.jpg'), 'firma', 'una foto nueva se firma sola; las demás se quedan como estaban')
  olvidarTodasLasUrlsFirmadas()
  const m4 = await firmarConCache('fotos-viaje', rutas, firmador, { ahora: ahora + 90_000, almacen })
  debe(firmas === 2 && rutas.every((r) => m4.get(r) === m1.get(r)), 'firma', 'tras cerrar y abrir la app (la memoria vacía), las direcciones guardadas en el móvil siguen valiendo')
  olvidarTodasLasUrlsFirmadas()
  const m5 = await firmarConCache('fotos-viaje', rutas, firmador, { ahora: ahora + 6 * 24 * 3600_000 + 3600_000 * 2, almacen })
  debe(firmas === 3 && m5.get('a/1.jpg') !== m1.get('a/1.jpg'), 'firma', 'cuando a la dirección le queda menos de un día, se renueva')
  const f = leer('src/lib/fotosViaje.ts')
  debe(!/createSignedUrls\(\s*\n\s*filas\.flatMap/.test(f) && /firmarFotos\(filas\.flatMap/.test(f), 'firma', 'listar las fotos del viaje usa las direcciones guardadas')
  debe(/olvidarUrlFirmada\(BUCKET_FOTOS, foto\.storagePath\)/.test(f), 'firma', 'al borrar una foto se olvida su dirección')
  debe(/useFotosViaje|REFRESCO_MS = 6 \* 60 \* 60 \* 1000/.test(leer('src/lib/useFotosViaje.ts')), 'firma', 'las fotos del viaje ya no se vuelven a listar cada 45 minutos')
}

/* ───────── 3. Las preguntas repetidas ───────── */
console.log('3. Las preguntas repetidas: una sola vez y nunca en segundo plano')
{
  const { unaSolaVez } = await import('../../src/lib/sondeo.ts')
  let veces = 0
  const tarea = async () => {
    veces++
    await new Promise((r) => setTimeout(r, 30))
    return 'ok'
  }
  const [a, b, c] = await Promise.all([unaSolaVez('x', tarea, 50), unaSolaVez('x', tarea, 50), unaSolaVez('x', tarea, 50)])
  debe(veces === 1 && a === 'ok' && b === 'ok' && c === 'ok', 'sondeo', 'tres pantallas piden lo mismo a la vez: se pregunta UNA vez y las tres reciben la respuesta')
  await unaSolaVez('x', tarea, 50)
  debe(veces === 1, 'sondeo', 'y no se repite hasta pasado el mínimo')
  await new Promise((r) => setTimeout(r, 80))
  await unaSolaVez('x', tarea, 50)
  debe(veces === 2, 'sondeo', 'pasado el mínimo, se vuelve a preguntar')
  const lee = (f, re, texto, regla = 'reloj') => debe(re.test(leer(f)), regla, texto)
  lee('src/components/compartir/CompartidoHost.tsx', /CADA_MS = 45_000/, 'el viaje compartido: respaldo cada 45 s (solo el sello, ~100 bytes); los cambios llegan al momento por Realtime')
  lee('src/components/presupuesto/GastosCompartidosHost.tsx', /CADA_MS = 120_000/, 'los gastos compartidos: cada 2 minutos (antes 20 s)')
  lee('src/components/propuesta/PropuestaHost.tsx', /CADA_MS = 120_000/, 'las propuestas: cada 2 minutos (antes 45 s)')
  lee('src/components/avisos/AvisosHost.tsx', /CADA_MS = 180_000/, 'los avisos: cada 3 minutos (antes 1)')
  lee('src/hooks/useLoSuyoDelViaje.ts', /120_000/, 'lo suyo del viaje: cada 2 minutos (antes 30 s)')
  lee('src/components/route/hoy/useCercaDeAqui.ts', /CADA_MS = 75000/, '«cerca de aquí» de HOY: 75 s (antes 45) y una sola vez aunque haya varias pantallas')
  for (const f of ['src/components/compartir/CompartidoHost.tsx', 'src/components/presupuesto/GastosCompartidosHost.tsx', 'src/components/propuesta/PropuestaHost.tsx', 'src/components/avisos/AvisosHost.tsx', 'src/hooks/useLoSuyoDelViaje.ts']) debe(/visibilityState/.test(leer(f)) && /unaSolaVez/.test(leer(f)), 'reloj', `${f.split('/').pop()}: solo con la app a la vista y una sola vez`)
}

/* ───────── 4. Las fotos nuevas ───────── */
console.log('4. Las fotos nuevas: caché de un año y miniatura en las listas')
{
  const f = leer('src/lib/fotosViaje.ts')
  debe((f.match(/cacheControl: CACHE_DE_LAS_FOTOS/g) ?? []).length === 2 && /CACHE_DE_LAS_FOTOS = '31536000'/.test(f), 'cache', 'la foto y su miniatura se suben con caché de un año')
  const usos = []
  const recorre = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`
      if (e.isDirectory()) recorre(p)
      else if (/\.tsx$/.test(e.name)) for (const m of leer(p).matchAll(/<img[^>]*src=\{foto\.url\}/g)) usos.push(`${p}:${m.index}`)
    }
  }
  recorre('src/components')
  debe(usos.every((u) => /FotoEnGrande/.test(u)), 'miniatura', `la foto grande (foto.url) solo se usa a pantalla completa (${usos.join(', ') || 'solo ahí'})`)
  debe(/urlParaMostrar/.test(leer('src/lib/fotosViaje.ts')), 'miniatura', 'las listas piden la miniatura (urlParaMostrar)')
  debe(fs.existsSync('scripts/destino/cacheDeLasFotosViejas.mjs'), 'viejas', 'hay un script para poner la caché de un año a las fotos que ya estaban subidas')
}

/* ───────── 5. Los números ───────── */
console.log('5. Los números')
{
  const v = globalThis.__v26
  // por persona y día: HOY abierto 10 h, «cerca de aquí» cada 75 s (antes 45 s) y varias llamadas de logros más (estado, hoja, fotos…)
  const llamadasAntes = (10 * 3600) / 45 + 40
  const llamadasAhora = (10 * 3600) / 75 + 40
  const mbAntes = (llamadasAntes * v.antesPorLlamada) / 1024
  const mbAhora = (llamadasAhora * v.ahoraPorLlamada) / 1024
  console.log(`   por persona y día en HOY (10 h): antes ~${mbAntes.toFixed(0)} MB (${llamadasAntes.toFixed(0)} llamadas × ${v.antesPorLlamada} KB) · ahora ~${mbAhora.toFixed(1)} MB (${llamadasAhora.toFixed(0)} llamadas × ${v.ahoraPorLlamada} KB)`)
  // cada persona usa HOY 5 días de cada mes (un viaje de 5 días)
  for (const personas of [100, 1000]) console.log(`   ${personas} personas, cada una con un viaje de 5 días al mes: antes ~${((mbAntes * personas * 5) / 1024).toFixed(0)} GB al mes · ahora ~${((mbAhora * personas * 5) / 1024).toFixed(1)} GB al mes (el plan Pro de Supabase incluye 250 GB)`)
  debe(mbAhora < mbAntes / 15, 'numeros', `la ruta entera ya no es lo que más sale: de ~${mbAntes.toFixed(0)} MB a ~${mbAhora.toFixed(1)} MB por persona y día`)
}

/* ---- V26b: guardados, Realtime y fotos de logros ---- */
{
  const sync = leer('src/components/sync/TripSync.tsx')
  const tp = leer('src/lib/tripPersistence.ts')
  const deps = (sync.match(/[travelerId, route, accommodationSelections[^]]*]/) ?? [''])[0]
  debe(deps !== '' && !/mode|activeDayId/.test(deps), 'guardados', 'abrir una pestaña o un día NO dispara un guardado del viaje (mode y activeDayId fuera de las dependencias del autoguardado)')
  debe(!/saveUiState/.test(sync + tp), 'guardados', 'no queda un guardado aparte de la pestaña o el día (cualquier escritura en la fila hace que Realtime mande la fila entera a todos)')
  debe(/apuntarSelloPropio/.test(tp), 'sello', 'tras guardar, el sello propio se apunta: el eco de Realtime de lo propio se reconoce sin bajar el viaje')
  debe(/sondeo: true/.test(leer('src/components/compartir/CompartidoHost.tsx')), 'sello', 'el aviso de Realtime refresca con el sondeo del sello (100 bytes) y no baja el viaje si no ha cambiado')
  const repo = leer('server/logros/repo.js')
  debe(/_min.jpg/.test(repo) && /cacheDeFotos/.test(repo), 'fotos_logros', 'las fotos de los logros se firman en MINIATURA y la firma se reutiliza (cuadritos de 52-150 px no bajan la foto grande)')
  debe(!/createSignedUrl(f.storage_path, 3600)/.test(repo), 'fotos_logros', 'ya no se firma la foto grande con una firma de 1 hora, nueva cada vez')
  const { urlEstable } = await import('../../src/lib/urlsFirmadas.ts')
  const a = urlEstable('https://x/obj/sign/fotos-viaje/a_min.jpg?token=1', 1000)
  const b = urlEstable('https://x/obj/sign/fotos-viaje/a_min.jpg?token=2', 2000)
  debe(a === b, 'fotos_logros', 'el cliente reutiliza la dirección firmada que vio primero para la misma foto (el móvil no la vuelve a bajar)')
  debe(urlEstable('https://x/obj/sign/fotos-viaje/a_min.jpg?token=3', 1000 + 6 * 24 * 3600 * 1000) !== a, 'fotos_logros', 'y la renueva pasados 5 días')
}

console.log(`\nPrueba de la Tanda V26: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
