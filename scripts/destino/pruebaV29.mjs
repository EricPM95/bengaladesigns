// La prueba de la Tanda V29: LOS SONIDOS, que encajan con cada animación (partituras), los sonidos de premio hechos por código y la página de sonidos del administrador.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV29.mjs      (con Vite en 5173 y la API en 8787; sin Vite solo la parte de archivos)
// Ninguna parte toca el Supabase de producción. Los archivos de sonido se miran de verdad (cabecera WAV, tamaño, volumen); los instantes, renderizando la partitura con un OfflineAudioContext (sin altavoces).
import fs from 'node:fs'
import { abrirApp } from './_enLaApp.mjs'

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
const CAP = 'docs/dias/V29_capturas'
fs.mkdirSync(CAP, { recursive: true })

/* ───────── 1. Los archivos ───────── */
console.log('1. Los archivos de premio (desde la V30 son los grabados m4a; su tamaño, volumen y golpes los mira pruebaV30)')
{
  const mf = JSON.parse(leer('public/sonidos/v30/manifiesto.json'))
  for (const id of ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'maravilla', 'pais', 'apertura', 'clic', 'vuelo', 'brillo', 'redoble'])
    debe(Object.keys(mf[id] ?? {}).length >= 3, 'archivos', `${id}: tiene al menos 3 candidatos grabados (${Object.keys(mf[id] ?? {}).join(', ')})`)
  debe(!fs.existsSync('public/sonidos/premio'), 'archivos', 'los WAV sintetizados de la V29 ya no están')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const motor = leer('src/lib/sonidos/motor.ts')
  const adm = leer('src/components/logros/AdminSonidos.tsx')
  const son = leer('src/lib/sonidos.ts')
  // (sin los comentarios: lo que se mira es el código, no las frases que dicen «nunca desde Supabase»)
  const sinComentarios = (t) =>
    t
      .split('\n')
      .filter((l) => !/^\s*(\/\*|\*|\/\/)/.test(l))
      .map((l) => l.replace(/\s\/\/ .*$/, ''))
      .join('\n')
  const todo = sinComentarios(motor + adm + son + leer('src/lib/sonidos/partituras.ts') + leer('src/lib/sonidos/sintesis.ts'))
  debe(!/supabase/i.test(todo), 'supabase', 'ningún sonido se pide a Supabase (ni una mención en el código de sonidos)')
  debe([...motor.matchAll(/fetch\(([^)]*)\)/g)].every((m) => /\/sonidos\//.test(m[1])), 'supabase', 'los únicos fetch de sonidos van a /sonidos/ (Vercel)')
  const v = JSON.parse(leer('vercel.json'))
  debe(v.headers.some((h) => h.source === '/sonidos/(.*)' && /max-age=2592000/.test(h.headers[0].value)) && v.rewrites.some((r) => r.source === '/admin/sonidos'), 'cache', 'Vercel sirve /sonidos con caché larga y /admin/sonidos abre la app')
  debe(/cortarSonidos\(\)/.test(leer('src/components/logros/momentos/Reproductor.tsx')) && (leer('src/components/logros/momentos/Reproductor.tsx').match(/cortarSonidos\(\)/g) ?? []).length >= 2, 'saltar', 'al tocar para pasar y al [Saltar todo], el sonido se corta (con fundido)')
  debe(/TIEMPOS_DE_EMBLEMA/.test(leer('src/components/logros/momentos/EscenaDeEmblema.tsx')) && /TIEMPOS_FINAL_SIETE/.test(leer('src/components/logros/momentos/FinalSieteMaravillas.tsx')) && /TIEMPOS_DE_PEDAZO/.test(leer('src/components/logros/momentos/pantallas.tsx')), 'tiempos', 'las animaciones (emblema, final de las siete, pedazo) leen sus tiempos de lib/sonidos/tiempos.ts, el mismo sitio que sus partituras')
  debe(/ponerSonido\(!sonido\)/.test(leer('src/components/ajustes/AjustesScreen.tsx')), 'interruptor', 'el interruptor «Sonidos: sí / no» está en Ajustes (desde el Perfil)')
  const ap = leer('shared/marca/aperturaJutrip.js')
  debe(/export const DURACION/.test(ap) && /DURACION_APERTURA/.test(leer('src/lib/sonidos/partituras.ts')), 'apertura', 'la partitura de la apertura sale de la duración de la propia apertura (shared/marca)')
  debe(!/sonar\(['"]apertura/.test(leer('src/App.tsx') + leer('src/main.tsx') + leer('index.html')), 'apertura', 'en la web la apertura sigue en silencio (nadie la reproduce antes del primer toque)')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V29: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 3. En la app: las partituras ───────── */
console.log('3. Las partituras: cada animación, cada sonido en su instante')
const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844 })
const ev = (js) => a.evaluar(js)
try {
  for (let i = 0; i < 120 && !(await ev("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
  await a.esp(1500)
  const r = JSON.parse(await ev(`Promise.all([import('/src/lib/sonidos/partituras.ts'), import('/src/lib/sonidos/tiempos.ts'), import('/src/lib/sonidos/motor.ts'), import('/src/lib/sonidos/sintesis.ts')]).then(async ([P, T, M, S]) => {
    const salida = { sinPartitura: [], sintMalo: [], archivoMalo: [], fueraDeLaAnimacion: [], desajuste: [], movimiento: {}, sigue: null, reducidas: [], solapan: null, fundido: null, sinSonido: null }
    const mf = await M.manifiesto()
    for (const id of P.IDS_DE_PARTITURA) {
      const p = P.partituraDe(id)
      if (!p || p.notas.length === 0) { salida.sinPartitura.push(id); continue }
      for (const n of p.notas) {
        if (n.tipo === 'sint' && !S.SONIDOS_SINTETICOS.includes(n.sonido)) salida.sintMalo.push(id + ':' + n.sonido)
        if (n.tipo === 'archivo' && !(mf?.[n.archivo] && Object.keys(mf[n.archivo]).length)) salida.archivoMalo.push(id + ':' + n.archivo)
        const en = n.tipo === 'sint' ? n.en : n.golpe
        if (en < 0 || en > p.dura + 0.01) salida.fueraDelAnimacion = [...(salida.fueraDeLaAnimacion), id + ':' + en]
      }
    }
    // 1. si una animación dura más, el sonido se mueve con ella (los instantes salen de tiempos.ts)
    const antes = P.partituraDe('pedazo').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'clic').golpe
    const emb = P.partituraDe('emblema').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'estallido').golpe
    const fin7 = P.partituraDe('maravilla').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'maravilla').golpe
    const apert = P.partituraDe('apertura').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'apertura').golpe
    T.TIEMPOS_DE_PEDAZO.encaja += 0.5
    T.TIEMPOS_DE_EMBLEMA.estalla += 1
    T.TIEMPOS_FINAL_SIETE.giraDura += 0.8
    const despues = P.partituraDe('pedazo').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'clic').golpe
    const emb2 = P.partituraDe('emblema').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'estallido').golpe
    const fin72 = P.partituraDe('maravilla').notas.find((n) => n.tipo === 'archivo' && n.archivo === 'maravilla').golpe
    T.TIEMPOS_DE_PEDAZO.encaja -= 0.5
    T.TIEMPOS_DE_EMBLEMA.estalla -= 1
    T.TIEMPOS_FINAL_SIETE.giraDura -= 0.8
    salida.sigue = { pedazo: Math.round((despues - antes) * 100) / 100, emblema: Math.round((emb2 - emb) * 100) / 100, final7: Math.round((fin72 - fin7) * 100) / 100 }
    salida.exactos = { pedazoClic: antes, emblemaGolpe: emb, final7Golpe: fin7, aperturaEstrella: apert, aperturaDuracion: P.partituraDe('apertura').dura, esperadoClic: T.RETRASO_DEL_PEDAZO + T.TIEMPOS_DE_PEDAZO.encaja, esperadoEmblema: T.TIEMPOS_DE_EMBLEMA.estalla, esperadoFinal7: T.paraFinalSiete(), esperadoEstrella: 0.6 * P.partituraDe('apertura').dura }
    // 2. reducir movimiento: más cortas y el sonido las sigue
    for (const id of ['coleccion', 'emblema', 'pais', 'medalla_oro']) { const n = P.partituraDe(id), r = P.partituraDe(id, { reducido: true }); if (!(r.dura < n.dura)) salida.reducidas.push(id); const gn = n.notas.filter((x) => x.tipo === 'archivo').at(-1).golpe, gr = r.notas.filter((x) => x.tipo === 'archivo').at(-1).golpe; if (!(gr < gn)) salida.reducidas.push(id + ':golpe') }
    // 3. la partitura renderizada (sin altavoces): cada golpe cae donde dice la partitura (menos de 30 ms de diferencia)
    const medidas = []
    for (const id of ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'maravilla', 'pais', 'apertura']) {
      const p = P.partituraDe(id)
      const off = new OfflineAudioContext(1, Math.ceil(44100 * (p.dura + 1.5)), 44100)
      await M.precargar(off, id)
      M.reiniciarMotor()
      M.iniciarPartitura(off, id)
      const ag = (window.__sonidosAgendados ?? []).filter((x) => x.partitura === id)
      window.__sonidosAgendados = []
      const buf = await off.startRendering()
      const d = buf.getChannelData(0)
      const golpe = p.notas.filter((n) => n.tipo === 'archivo').at(-1).golpe + 0.04 // el motor empieza 40 ms después de «ahora»
      const archivoAgendado = ag.filter((x) => x.tipo === 'archivo').at(-1)
      let pico = 0, tPico = 0
      for (let i = Math.floor((golpe - 0.1) * 44100); i < Math.min(d.length, Math.floor((golpe + 0.35) * 44100)); i++) if (Math.abs(d[i]) > pico) { pico = Math.abs(d[i]); tPico = i / 44100 }
      medidas.push({ id, golpe: +golpe.toFixed(3), tPico: +tPico.toFixed(3), pico: +pico.toFixed(2), programado: archivoAgendado ? +(archivoAgendado.programado + 0.04).toFixed(3) : null, desajusteAgendado: archivoAgendado ? Math.abs(archivoAgendado.programado - archivoAgendado.en) : null })
    }
    salida.medidas = medidas
    // 4. dos premios seguidos: nunca dos a la vez; y al cortar, con fundido
    const ctx = new AudioContext()
    M.reiniciarMotor()
    window.__rampas = []
    const real = GainNode.prototype
    const rampa = AudioParam.prototype.linearRampToValueAtTime
    AudioParam.prototype.linearRampToValueAtTime = function (v, t) { window.__rampas.push({ v, dt: t - ctx.currentTime }); return rampa.call(this, v, t) }
    M.iniciarPartitura(ctx, 'medalla_oro')
    M.iniciarPartitura(ctx, 'coleccion')
    salida.solapan = M.cuantasSuenan()
    M.cortar(ctx, 140)
    salida.fundido = { quedan: M.cuantasSuenan().todas, rampas: window.__rampas.filter((x) => x.v === 0).map((x) => Math.round(x.dt * 1000)) }
    AudioParam.prototype.linearRampToValueAtTime = rampa
    void real
    await ctx.close()
    return JSON.stringify(salida)
  })`))
  debe(r.sinPartitura.length === 0, 'partituras', `cada animación tiene su partitura (sin: ${r.sinPartitura.join(', ') || 'ninguna'})`)
  debe(r.sintMalo.length === 0 && r.archivoMalo.length === 0, 'partituras', `todos los sonidos de las partituras existen (${[...r.sintMalo, ...r.archivoMalo].join(', ') || 'bien'})`)
  debe(!(r.fueraDeLaAnimacion ?? []).length, 'partituras', 'ningún sonido cae fuera de lo que dura su animación')
  debe(r.sigue.pedazo === 0.5 && r.sigue.emblema === 1 && r.sigue.final7 === 0.8, 'tiempos', `si una animación dura más, el sonido se mueve con ella (pedazo +${r.sigue.pedazo} s, emblema +${r.sigue.emblema} s, final de las siete +${r.sigue.final7} s)`)
  debe(Math.abs(r.exactos.pedazoClic - r.exactos.esperadoClic) < 1e-6 && Math.abs(r.exactos.emblemaGolpe - r.exactos.esperadoEmblema) < 1e-6 && Math.abs(r.exactos.final7Golpe - r.exactos.esperadoFinal7) < 1e-6 && Math.abs(r.exactos.aperturaEstrella - r.exactos.esperadoEstrella) < 1e-6, 'tiempos', 'el clic del pedazo, el golpe del emblema, el de las siete maravillas (al parar la medalla) y el de la apertura (cuando salta la estrella) caen EXACTAMENTE en el instante de su animación')
  debe(r.reducidas.length === 0, 'reducido', `con «reducir movimiento» las animaciones son más cortas y el sonido las sigue (${r.reducidas.join(', ') || 'las cuatro'})`)
  for (const m of r.medidas) debe(m.programado !== null && Math.abs(m.programado - m.golpe) < 0.03 && m.pico > 0.15 && m.tPico >= m.golpe - 0.03 && m.tPico <= m.golpe + 0.2, 'golpe', `${m.id}: el golpe final cae a ${Math.abs(Math.round((m.tPico - m.golpe) * 1000))} ms del momento de la animación (programado en ${m.programado} s para ${m.golpe} s; pico ${m.pico})`)
  debe(r.solapan.premios === 1, 'solapar', `dos premios seguidos no se solapan: suena ${r.solapan.premios} a la vez (el anterior se corta con fundido)`)
  debe(r.fundido.quedan === 0 && r.fundido.rampas.length >= 1 && r.fundido.rampas.every((ms) => ms >= 60 && ms <= 300), 'fundido', `al saltar la animación el sonido se corta con un fundido corto (${r.fundido.rampas.join(', ')} ms), nunca de golpe`)

  /* ───────── 4. Silencio: apagado y antes del primer toque ───────── */
  console.log('4. Con el sonido apagado no suena nada, y antes del primer toque tampoco')
  const s = JSON.parse(await ev(`import('/src/lib/sonidos.ts').then(async (m) => {
    window.__sonidosAgendados = []
    m.ponerSonido(false)
    await m.sonar('visto'); await m.sonar('coleccion'); m.reproducirMomentos(['sello'], [{ tipo: 'sello', grado: 'oro' }])
    await new Promise((r) => setTimeout(r, 500))
    const apagado = (window.__sonidosAgendados ?? []).length
    const pedidosApagado = (window.__sonidosPedidos ?? []).length
    m.ponerSonido(true)
    const sinTocar = !navigator.userActivation?.hasBeenActive
    window.__sonidosAgendados = []
    await m.sonar('visto')
    await new Promise((r) => setTimeout(r, 600))
    const ctx = m.contextoDeAudioDeLaApp()
    return JSON.stringify({ apagado, pedidosApagado, sinTocar, estado: ctx?.state ?? null, agendadosSinToque: (window.__sonidosAgendados ?? []).length })
  })`))
  debe(s.apagado === 0 && s.pedidosApagado === 0, 'apagado', 'con el sonido apagado no se programa ni un sonido')
  debe(s.estado !== 'suspended' || s.agendadosSinToque === 0, 'sin_toque', `antes del primer toque el audio está parado (${s.estado}) y no se programa nada (${s.agendadosSinToque})`)
} finally {
  a.cerrar()
}

/* ───────── 5. La página de sonidos ───────── */
console.log('5. La página de sonidos: solo administradores')
{
  const pagina = await abrirApp(APP, {
    ruta: '/?cuentas=off&logros=on&admin=sonidos&apertura=0',
    ancho: 390,
    alto: 844,
    sinEsperarRoot: true,
    esperaFija: 6,
    antes: "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: false }), { status: 403, headers: { 'Content-Type': 'application/json' } })) : f(u, i);",
  })
  try {
    await pagina.esp(6000)
    const texto = await pagina.evaluar("document.body.innerText.slice(0, 200)")
    const sinAdmin = await pagina.evaluar("Boolean(document.querySelector('[data-solo-administradores]')) && !document.querySelector('[data-admin-sonidos]')")
    debe(sinAdmin, 'admin', `quien no es administrador solo ve «Esta página es solo para administradores» (${String(texto).replace(/\n/g, ' ')})`)
  } finally {
    pagina.cerrar()
  }
  // Como administrador (el servidor dice ok): la página enseña cada animación con su ▶ y cada sonido con A, B y C.
  const adm = await abrirApp(APP, {
    ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0',
    ancho: 390,
    alto: 844,
    sinEsperarRoot: true,
    esperaFija: 6,
    antes: "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);",
  })
  try {
    await adm.esp(7000)
    // (V34C) La página es ahora el estudio de sonidos: una tarjeta por animación, el marco de iPhone y los candidatos de la animación abierta. Se mira lo mismo, con los datos nuevos.
    await adm.esp(3000)
    const m = JSON.parse(await adm.evaluar(`JSON.stringify({ animaciones: document.querySelectorAll('[data-animacion-tarjeta]').length, candidatos: document.querySelectorAll('[data-tarjeta-abierta] [data-candidato]').length, resumen: document.querySelector('[data-lo-elegido]')?.innerText ?? '', volumen: Boolean(document.querySelector('input[aria-label="Volumen general"]')) })`))
    debe(m.animaciones >= 18, 'admin', `cada animación (${m.animaciones}) con su tarjeta`)
    debe(m.candidatos >= 8, 'admin', `la animación abierta enseña los candidatos de cada sonido para oír y elegir (${m.candidatos})`)
    debe(m.volumen && /Medalla de bronce → .*candidato A/.test(m.resumen) && /volumen general/.test(m.resumen), 'admin', 'control de volumen general y un resumen con lo elegido para copiar')
    await adm.evaluar("document.querySelector('[data-animacion-tarjeta=\"medalla_oro\"]').click(); true")
    await adm.esp(800)
    await adm.evaluar("document.querySelector('[data-candidato=\"medalla_oro:B\"]').click(); true")
    await adm.esp(500)
    debe(/Medalla de oro → .*candidato B/.test(await adm.evaluar("document.querySelector('[data-lo-elegido]').innerText")), 'admin', 'elegir una versión se ve al momento en el resumen («Medalla de oro → candidato B»)')
    await adm.captura(`${CAP}/pagina_de_sonidos.jpg`)
  } finally {
    adm.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V29: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
