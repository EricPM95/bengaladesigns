// La prueba de la Tanda V30: LOS SONIDOS DE VERDAD (grabados, estilo juego), las escenas con partitura, las baldosas derechas, las animaciones a pantalla completa y fuera el aviso de instalar.
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV30.mjs      (con Vite en 5173 y la API en 8787; sin Vite solo la parte de archivos y de código)
// Los archivos se miran DE VERDAD: se descodifican con ffmpeg (códec, 44,1 kHz, silencio delante, saturación, volumen, dónde cae el golpe). Nadie puede oírlos aquí: lo que se prueba es lo medible.
// Ninguna parte toca el Supabase de producción.
import { execFileSync } from 'node:child_process'
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
const CAP = 'docs/dias/V30_capturas'
fs.mkdirSync(CAP, { recursive: true })
const FFMPEG = process.env.FFMPEG ?? 'C:/Users/ERIC/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.1-full_build/bin/ffmpeg.exe'
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/, 'ffprobe.exe')

/* ───────── 1. Los archivos ───────── */
console.log('1. Los sonidos grabados: códec, 44,1 kHz, silencio delante, saturación, volumen, peso y dónde cae el golpe')
const SR = 44100
const mf = JSON.parse(leer('public/sonidos/v30/manifiesto.json'))
const decodificar = (f) => {
  const b = execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 })
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)))
}
const PESO = { clic: 20, vuelo: 30, brillo: 40, redoble: 70, medalla_bronce: 80, medalla_plata: 80, medalla_oro: 80, medalla_diamante: 80, coleccion: 80, emblema: 80, maravilla: 80, pais: 80, apertura: 80 }
const DURACION = { clic: [0.05, 0.3], vuelo: [0.4, 0.8], redoble: [0.9, 3.0], brillo: [0.3, 1.2], medalla_bronce: [1, 2.5], medalla_plata: [1, 2.5], medalla_oro: [1, 2.5], medalla_diamante: [1, 2.5], coleccion: [1, 2.5], emblema: [1, 2.5], maravilla: [1, 2.5], pais: [1, 2.5], apertura: [1.5, 2.5] }
const rms = {}
const energia = {}
let total = 0
let candidatos = 0
for (const id of Object.keys(PESO)) {
  const letras = Object.keys(mf[id] ?? {})
  debe(letras.length >= 3, 'candidatos', `${id}: al menos 3 candidatos distintos (${letras.join(', ')})`)
  for (const v of letras) {
    const f = `public/sonidos/v30/${id}_${v}.m4a`
    debe(fs.existsSync(f), 'archivos', `existe ${id}_${v}.m4a`)
    if (!fs.existsSync(f)) continue
    candidatos++
    const bytes = fs.statSync(f).size
    total += bytes
    const d = mf[id][v]
    debe(bytes < PESO[id] * 1024, 'peso', `${id}_${v}: pesa ${(bytes / 1024).toFixed(1)} KB (menos de ${PESO[id]} KB)`)
    debe(Boolean(d.licencia) && Array.isArray(d.fuentes) && d.fuentes.length > 0, 'licencia', `${id}_${v}: dice de dónde viene y con qué licencia`)
    const info = JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate', '-show_entries', 'format=format_name', '-of', 'json', f]).toString())
    debe(info.streams[0].codec_name === 'aac' && info.streams[0].sample_rate === '44100' && /mp4/.test(info.format.format_name), 'formato', `${id}_${v}: AAC en m4a a 44,1 kHz`)
    const s = decodificar(f)
    let pico = 0
    let tPico = 0
    for (let i = 0; i < s.length; i++) {
      if (Math.abs(s[i]) > pico) {
        pico = Math.abs(s[i])
        tPico = i / SR
      }
    }
    let delante = 0
    while (delante < s.length && Math.abs(s[delante]) < 0.05 * pico) delante++
    debe(delante / SR < 0.06, 'silencio', `${id}_${v}: sin silencio delante (el sonido empieza a los ${((delante / SR) * 1000).toFixed(0)} ms)`)
    debe(pico > 0.2 && pico <= 0.99, 'volumen', `${id}_${v}: ni flojo ni saturado (pico ${pico.toFixed(2)})`)
    const dura = s.length / SR
    debe(dura >= DURACION[id][0] - 0.05 && dura <= DURACION[id][1] + 0.05 && Math.abs(dura - d.dura) < 0.08, 'duracion', `${id}_${v}: dura ${dura.toFixed(2)} s (entre ${DURACION[id][0]} y ${DURACION[id][1]} s)`)
    debe(Math.abs(tPico - d.golpe) < 0.03, 'golpe', `${id}_${v}: el golpe del manifiesto (${d.golpe.toFixed(2)} s) es el pico de verdad del archivo (${tPico.toFixed(3)} s): menos de 30 ms de diferencia`)
    let e = 0
    for (let i = 0; i < s.length; i++) e += s[i] * s[i]
    energia[`${id}_${v}`] = e / SR
    if (!/^(clic|vuelo|brillo)$/.test(id)) {
      const i0 = Math.max(0, Math.floor((d.golpe - 0.3) * SR))
      const i1 = Math.min(s.length, Math.floor((d.golpe + 0.5) * SR))
      let suma = 0
      for (let i = i0; i < i1; i++) suma += s[i] * s[i]
      rms[`${id}_${v}`] = 20 * Math.log10(Math.sqrt(suma / (i1 - i0)))
    }
  }
}
{
  const r = Object.values(rms)
  debe(Math.max(...r) - Math.min(...r) < 6, 'volumen', `todos los de premio suenan igual de fuerte (diferencia ${(Math.max(...r) - Math.min(...r)).toFixed(1)} dB, menos de 6)`)
  debe(total < 1024 * 1024, 'peso', `todos los candidatos juntos pesan ${(total / 1024).toFixed(0)} KB (menos de 1 MB): ${candidatos} archivos`)
  // bronce < plata < oro < diamante: de la misma familia (misma letra), cada nivel suena a más
  let familias = 0
  for (const v of ['A', 'B', 'C', 'D', 'E']) {
    const e = ['bronce', 'plata', 'oro', 'diamante'].map((g) => energia[`medalla_${g}_${v}`])
    if (e.some((x) => x === undefined)) continue
    familias++
    debe(e[0] < e[1] && e[1] < e[2] && e[2] < e[3], 'niveles', `familia ${v}: cada medalla suena a más que la anterior (bronce ${e[0].toFixed(3)} < plata ${e[1].toFixed(3)} < oro ${e[2].toFixed(3)} < diamante ${e[3].toFixed(3)})`)
  }
  debe(familias >= 3, 'niveles', `hay al menos 3 familias completas de las cuatro medallas (${familias})`)
  for (const v of Object.keys(mf.redoble)) debe(mf.redoble[v].dura - mf.redoble[v].golpe < 0.45, 'redoble', `redoble_${v}: acaba con su golpe (sin estirar): lo que queda tras el pico es ${(mf.redoble[v].dura - mf.redoble[v].golpe).toFixed(2)} s`)
  debe(!fs.existsSync('public/sonidos/premio'), 'archivos', 'los WAV sintetizados de la V29 ya no están')
  debe(fs.readdirSync('public/sonidos/v30').filter((x) => !/\.(m4a|json)$/.test(x)).length === 0, 'archivos', 'en v30 solo hay los candidatos (m4a) y su manifiesto, nunca los paquetes enteros')
}

/* ───────── 2. El código ───────── */
console.log('2. El código')
{
  const P = leer('src/lib/sonidos/partituras.ts')
  const motor = leer('src/lib/sonidos/motor.ts')
  const sinComentarios = (t) =>
    t
      .split('\n')
      .filter((l) => !/^\s*(\/\*|\*|\/\/)/.test(l))
      .map((l) => l.replace(/\s\/\/ .*$/, ''))
      .join('\n')
  const todo = sinComentarios(motor + leer('src/components/logros/AdminSonidos.tsx') + leer('src/lib/sonidos.ts') + P + leer('src/lib/sonidos/sintesis.ts'))
  debe(!/supabase/i.test(todo), 'supabase', 'ningún sonido se pide a Supabase')
  debe([...motor.matchAll(/fetch\(([^)]*)\)/g)].every((m) => /\/sonidos\//.test(m[1])), 'supabase', 'los únicos fetch de sonidos van a /sonidos/ (Vercel)')
  debe(/\.m4a/.test(motor) && !/\.wav/.test(sinComentarios(motor)), 'archivos', 'el motor pide m4a (Safari y Android)')
  // Visto, la campanita y el tic: iguales que antes (hechos por código, versión A)
  debe(P.includes("notas: [sint('toque', 0), sint('brillo', 0.06, { vol: 0.5 })]"), 'fijos', 'Visto: su toque y su brillo pequeño, como antes')
  debe(/case 'aviso':[\s\S]{0,300}sint\('campanita'/.test(P), 'fijos', 'el aviso: su campanita, como antes')
  debe(P.includes("sint('tic', ") && P.includes('const tics = '), 'fijos', 'los números que suben: su tic, como antes')
  debe(motor.includes("versionSint = (_id: string): Version => 'A'"), 'fijos', 'los sonidos hechos por código se quedan en la versión A que eligió Eric')
  debe(motor.includes('leerJson<number>(CLAVE_VOLUMEN, 0.8)'), 'volumen', 'el volumen general está fijado en 0,80')
  // las escenas tienen partitura propia y la usan
  for (const f of ['cine', 'cineLanza', 'coliseo']) debe(leer(`src/components/logros/momentos/escenas/${f}.tsx`).includes("sonar('escena'"), 'escenas', `la escena «${f}» suena con su partitura propia`)
  const tiempos = leer('src/lib/sonidos/tiempos.ts')
  debe(tiempos.includes('tiemposDeEscena') && tiempos.includes('export const TIEMPOS_SELLADO'), 'escenas', 'los tiempos de las escenas, el sello, la colección y el sellado salen a tiempos.ts')
  for (const k of ['TIEMPOS_SELLO', 'TIEMPOS_SELLADO', 'TIEMPOS_DE_COLECCION_PANTALLA']) debe(leer('src/components/logros/momentos/pantallas.tsx').includes(k), 'tiempos', `la pantalla lee ${k} (el mismo número que su sonido)`)
  // el aviso de instalar: apagado con un interruptor, el código sigue
  const ins = leer('src/lib/instalar.ts')
  debe(ins.includes("VITE_AVISO_INSTALAR_VISIBLE === 'true'") && ins.includes('pasosParaInstalar') && fs.existsSync('src/components/logros/AvisoInstalar.tsx'), 'instalar', 'el aviso de instalar tiene su interruptor (apagado) y no se ha borrado el código')
  debe(leer('src/components/logros/AvisoInstalar.tsx').includes('avisoInstalarVisible()') && leer('src/components/route/hoy/v2/TarjetaInstalarAvisos.tsx').includes('avisoInstalarVisible()'), 'instalar', 'los dos sitios que invitaban a instalar (el recuadro y la tarjeta de HOY) miran el interruptor')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la app se salta)')
  console.log(`\nPrueba de la Tanda V30: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

/* ───────── 3. Las partituras y los golpes contra las animaciones de verdad ───────── */
console.log('3. Cada golpe cae a menos de 30 ms del final de su animación (leído de las animaciones de la pantalla)')
const MOCK_ADMIN = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"
{
  const adm = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho: 390, alto: 844, sinEsperarRoot: true, esperaFija: 6, antes: MOCK_ADMIN })
  try {
    await adm.esp(7000)
    const pag = JSON.parse(
      await adm.evaluar(
        "JSON.stringify({ fijos: document.querySelectorAll('[data-fijo]').length, candidatos: document.querySelectorAll('[data-candidato]').length, conAnimacion: document.querySelectorAll('[data-con-animacion]').length, fuentes: [...document.querySelectorAll('[data-candidato]')].every((c) => /Sonniss/.test(c.innerText)), duraciones: [...document.querySelectorAll('[data-candidato]')].every((c) => /[0-9][.][0-9][0-9] s · [0-9]+ KB/.test(c.innerText)), animaciones: document.querySelectorAll('[data-animacion]').length, resumen: document.querySelector('[data-resumen-elegido]')?.innerText ?? '' })",
      ),
    )
    debe(pag.fijos === 4, 'admin', `la página marca como «fijo» lo que se queda: toque y brillo de Visto, campanita y tic (${pag.fijos})`)
    debe(pag.candidatos === candidatos, 'admin', `la página enseña cada candidato (${pag.candidatos} de ${candidatos}) con su fuente, su duración y su peso`)
    debe(pag.fuentes && pag.duraciones, 'admin', 'cada candidato lleva su nombre/fuente, licencia, duración y peso')
    debe(pag.conAnimacion >= 20, 'admin', `«Con su animación» en los candidatos de medalla, colección, emblema, apertura y país (${pag.conAnimacion})`)
    debe(/fijos \(no se cambian\)/.test(pag.resumen) && /volumen general: 0\.80/.test(pag.resumen), 'admin', '«Lo elegido» con los fijos y el volumen 0,80')
    // La animación DE VERDAD con su sonido: se lee el final de la animación de la pantalla y se compara con el golpe de su partitura.
    const casos = [
      ['medalla_oro:A', 'evoNew', 'medalla_oro'],
      ['pais:A', 'moStamp', 'pais'],
    ]
    for (const [boton, anim, id] of casos) {
      await adm.evaluar(`document.querySelector('[data-con-animacion="${boton}"]').click(); true`)
      let fin = null
      for (let i = 0; i < 20 && fin === null; i++) {
        await adm.esp(500)
        fin = await adm.evaluar(`(() => { const x = document.getAnimations().find((a) => a.animationName === '${anim}'); return x ? x.effect.getComputedTiming().endTime / 1000 : null })()`)
      }
      const golpe = JSON.parse(await adm.evaluar(`import('/src/lib/sonidos/partituras.ts').then((P) => JSON.stringify(P.partituraDe('${id}').notas.filter((n) => n.tipo === 'archivo').at(-1).golpe))`))
      debe(fin !== null && Math.abs(fin - golpe) < 0.03, 'golpe', `${id}: la animación «${anim}» acaba a los ${fin} s y su golpe cae a los ${golpe.toFixed(3)} s (menos de 30 ms de diferencia)`)
      await adm.evaluar("(() => { const c = [...document.querySelectorAll('button')].find((b) => /Seguir|Saltar/.test(b.textContent || '')); c?.click(); return true })()")
      await adm.esp(400)
    }
  } finally {
    adm.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844 })
  try {
    for (let i = 0; i < 120 && !(await a.evaluar("Boolean(document.querySelector('[data-primera-pantalla]'))").catch(() => false)); i++) await a.esp(500)
    await a.esp(1200)
    const r = JSON.parse(
      await a.evaluar(`Promise.all([import('/src/lib/sonidos/partituras.ts'), import('/src/lib/sonidos/tiempos.ts'), import('/src/lib/sonidos/motor.ts')]).then(async ([P, T, M]) => {
      const salida = { sinPartitura: [], golpes: [], medidas: [] }
      for (const id of P.IDS_DE_PARTITURA) { const p = P.partituraDe(id); if (!p || !p.notas.length) salida.sinPartitura.push(id) }
      const e = T.tiemposDeEscena({})
      const principal = { escena: 'emblema' }
      const ultimo = (id, o) => P.partituraDe(id, o).notas.filter((n) => n.tipo === 'archivo' && n.archivo === (principal[id] ?? id)).at(-1).golpe
      salida.golpes = [
        ['medalla_oro', ultimo('medalla_oro'), T.TIEMPOS_SELLO.evolucion.nuevo + T.TIEMPOS_SELLO.evolucion.nuevoDura],
        ['pais', ultimo('pais'), T.TIEMPOS_SELLADO.empieza + T.TIEMPOS_SELLADO.dura],
        ['coleccion', ultimo('coleccion'), T.TIEMPOS_DE_COLECCION_PANTALLA.retraso + T.TIEMPOS_DE_PEDAZO.fin],
        ['emblema', ultimo('emblema'), T.TIEMPOS_DE_EMBLEMA.estalla],
        ['maravilla', ultimo('maravilla'), T.paraFinalSiete()],
        ['escena', ultimo('escena'), e.fl],
        ['escena con sus tiempos', ultimo('escena', { escena: { fl: 11, dim: 10, x: [12, 12.5, 13, 14] } }), 11],
      ]
      for (const id of ['medalla_bronce', 'medalla_plata', 'medalla_oro', 'medalla_diamante', 'coleccion', 'emblema', 'maravilla', 'pais', 'apertura', 'escena']) {
        const p = P.partituraDe(id)
        const off = new OfflineAudioContext(1, Math.ceil(44100 * (p.dura + 1.5)), 44100)
        await M.precargar(off, id)
        M.reiniciarMotor()
        M.iniciarPartitura(off, id)
        const ag = (window.__sonidosAgendados ?? []).filter((x) => x.partitura === id && x.tipo === 'archivo' && x.id === (principal[id] ?? id)).at(-1)
        window.__sonidosAgendados = []
        const buf = await off.startRendering()
        const d = buf.getChannelData(0)
        const golpe = ultimo(id) + 0.04
        let pico = 0, tPico = 0
        for (let i = Math.floor((golpe - 0.1) * 44100); i < Math.min(d.length, Math.floor((golpe + 0.35) * 44100)); i++) if (Math.abs(d[i]) > pico) { pico = Math.abs(d[i]); tPico = i / 44100 }
        salida.medidas.push({ id, golpe: +golpe.toFixed(3), tPico: +tPico.toFixed(3), pico: +pico.toFixed(2), programado: ag ? +(ag.programado + 0.04).toFixed(3) : null })
      }
      return JSON.stringify(salida)
    })`),
    )
    debe(r.sinPartitura.length === 0, 'partituras', `cada animación tiene su partitura, también las escenas y los fuegos (sin: ${r.sinPartitura.join(', ') || 'ninguna'})`)
    for (const [id, golpe, esperado] of r.golpes) debe(Math.abs(golpe - esperado) < 0.03, 'golpe', `${id}: el golpe de la partitura (${golpe.toFixed(3)} s) cae donde acaba su animación (${esperado.toFixed(3)} s)`)
    for (const m of r.medidas) debe(m.programado !== null && Math.abs(m.programado - m.golpe) < 0.03 && m.pico > 0.15 && m.tPico >= m.golpe - 0.03 && m.tPico <= m.golpe + 0.2, 'golpe', `${m.id}: renderizado sin altavoces, el golpe cae a ${Math.abs(Math.round((m.tPico - m.golpe) * 1000))} ms del instante de la animación (programado en ${m.programado} s, esperado ${m.golpe} s, pico ${m.pico})`)
  } finally {
    a.cerrar()
  }
}

/* ───────── 4. Pantalla completa ───────── */
console.log('4. Las animaciones llenan la pantalla de borde a borde (iPhone con barra de Safari, iPhone a pantalla completa, Android)')
for (const [nombre, ancho, alto] of [
  ['iphone_safari', 390, 664],
  ['iphone_completo', 390, 844],
  ['iphone_se', 375, 667],
  ['android', 360, 740],
]) {
  const adm = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0', ancho, alto, sinEsperarRoot: true, esperaFija: 6, antes: MOCK_ADMIN })
  try {
    await adm.esp(7000)
    await adm.evaluar("document.querySelector('[data-con-animacion=\"emblema:B\"]').click(); true")
    let k = null
    for (let i = 0; i < 40 && k === null; i++) {
      await adm.esp(500)
      k = await adm.evaluar("document.querySelector('[data-lienzo-k]')?.getAttribute('data-lienzo-k') ?? null")
    }
    await adm.esp(9000)
    const m = JSON.parse(
      await adm.evaluar("JSON.stringify((() => { const l = document.querySelector('[data-lienzo-k]'); if (!l) return null; const c = l.firstElementChild.getBoundingClientRect(); return { izq: c.left, der: c.right, arr: c.top, abajo: c.bottom, w: innerWidth, h: innerHeight, k: l.getAttribute('data-lienzo-k') } })())"),
    )
    debe(m !== null && m.izq <= 0.5 && m.der >= m.w - 0.5 && m.arr <= 0.5 && m.abajo >= m.h - 0.5, 'pantalla_completa', `${nombre} (${ancho}×${alto}): la escena cubre toda la pantalla (de ${m?.izq?.toFixed(0)} a ${m?.der?.toFixed(0)} y de ${m?.arr?.toFixed(0)} a ${m?.abajo?.toFixed(0)}, ampliada ×${m?.k})`)
    await adm.captura(`${CAP}/despues_${nombre}.jpg`)
    // «Antes»: lo que hacía el ajuste de la V29 (la escena entera dentro de la pantalla, con franjas)
    await adm.evaluar("(() => { const l = document.querySelector('[data-lienzo-k]'); const e = l.firstElementChild; e.style.transform = 'scale(' + Math.min(innerWidth / 390, innerHeight / 844) + ')'; return true })()")
    await adm.esp(300)
    await adm.captura(`${CAP}/antes_${nombre}.jpg`)
  } finally {
    adm.cerrar()
  }
}
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 664 })
  try {
    const r = JSON.parse(await a.evaluar("import('/src/components/logros/momentos/escenas/cine.tsx').then((C) => JSON.stringify({ movil: C.ajusteDeLienzo(390, 664), alto: C.ajusteDeLienzo(390, 844), android: C.ajusteDeLienzo(360, 740), escritorio: C.ajusteDeLienzo(1280, 720) }))"))
    debe(Math.abs(r.movil.k - 1) < 0.001 && r.movil.desplazamientoY < 0, 'pantalla_completa', `en un iPhone con barra el lienzo se agranda a ×${r.movil.k.toFixed(2)} (llena el ancho) y recorta más por arriba (el cielo) que por abajo`)
    debe(Math.abs(r.alto.k - 1) < 0.001 && r.alto.desplazamientoY === 0, 'pantalla_completa', 'en un iPhone a pantalla completa (390×844) queda tal cual')
    debe(r.android.k >= 0.9 && r.android.k <= 0.95, 'pantalla_completa', `en Android (360×740) el lienzo se agranda a ×${r.android.k.toFixed(2)}`)
    debe(r.escritorio.desplazamientoY === 0 && r.escritorio.k < 1, 'pantalla_completa', 'en una pantalla muy ancha (ordenador) se ajusta como antes: nunca se corta lo importante')
  } finally {
    a.cerrar()
  }
}

/* ───────── 5. El aviso de instalar no sale ───────── */
console.log('5. El aviso «Añádela a tu pantalla de inicio» no sale (y con el interruptor encendido, sí)')
{
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  const UA = `Object.defineProperty(navigator,'userAgent',{get:()=>${JSON.stringify(IPHONE)},configurable:true});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5,configurable:true});`
  for (const [conInterruptor, esperado] of [
    [false, false],
    [true, true],
  ]) {
    const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0', ancho: 390, alto: 844, antes: `${UA}try{localStorage.removeItem('trazo:aviso_instalar')}catch(e){}${conInterruptor ? "try{localStorage.setItem('trazo:aviso_instalar_visible','si')}catch(e){}" : ''}` })
    try {
      await a.esp(7000)
      const sale = await a.evaluar("Boolean(document.querySelector('[data-aviso-instalar]')) || /Añádela a tu pantalla de inicio/.test(document.body.innerText)")
      debe(sale === esperado, 'instalar', conInterruptor ? `con el interruptor encendido (solo para pruebas) el recuadro sale (${sale})` : `en iPhone, sin instalar y entrando por primera vez, el recuadro NO sale (${sale})`)
    } finally {
      a.cerrar()
    }
  }
}

/* ───────── 6. Las baldosas, derechas ───────── */
console.log('6. Las baldosas de las 18 insignias, derechas y llenando el círculo')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&dibujos=1&baldosas=1&apertura=0', ancho: 480, alto: 900 })
  try {
    for (let i = 0; i < 60 && !(await a.evaluar("Boolean(document.querySelector('[data-baldosas-hoja]'))").catch(() => false)); i++) await a.esp(500)
    await a.esp(1500)
    const n = await a.evaluar("document.querySelectorAll('[data-baldosas-de]').length")
    debe(n === 18, 'baldosas', `la hoja trae las 18 insignias (${n})`)
    const g = JSON.parse(
      await a.evaluar(`Promise.all([import('/src/components/logros/pantallas/destino/baldosa.tsx'), import('/src/components/logros/dibujos/partes.ts')]).then(([B, Pt]) => {
      const malas = []
      let vistas = 0
      for (const c of Object.keys(Pt.COLECCIONES_POR_PARTES)) {
        const total = Pt.COLECCIONES_POR_PARTES[c].sitios.length
        for (let k = 0; k < total; k++) {
          const g = B.geometriaDeBaldosa(c, total, k)
          if (!g || g.familia !== 'partes') continue
          vistas++
          const xs = g.girados.map((p) => p[0]), ys = g.girados.map((p) => p[1])
          const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys)
          const arriba = (Math.min(...ys) + Math.max(...ys)) / 2 < g.centro[1] - 0.02
          const e = B.encajeDeBaldosa(g, 100)
          const dentro = Math.max(...g.girados.map(([x, y]) => Math.hypot(x * e.lado + e.dx - 50, y * e.lado + e.dy - 50)))
          if (!arriba || dentro > 50.5 || (total === 4 && w / h > 1.45) || (total === 3 && w / h > 2.6)) malas.push(c + ' ' + k + ' (' + total + ') arriba=' + arriba + ' ancho/alto=' + (w / h).toFixed(2) + ' radio=' + dentro.toFixed(1))
        }
      }
      return JSON.stringify({ vistas, malas })
    })`),
    )
    debe(g.vistas >= 60 && g.malas.length === 0, 'baldosas', `todas las baldosas (${g.vistas}) tienen su lado de fuera arriba y caben en su círculo (mal: ${g.malas.join('; ') || 'ninguna'})`)
    await a.evaluar("document.querySelector('[data-baldosas-hoja]').scrollIntoView(); true")
    await a.esp(400)
    await a.captura(`${CAP}/baldosas_18.jpg`)
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la Tanda V30: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
