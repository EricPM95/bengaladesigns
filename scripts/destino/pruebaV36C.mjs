// La prueba de la Tanda V36C: CADA TARJETA DEL ESTUDIO DE SONIDOS, SU ANIMACIÓN. Las 24 tarjetas de /admin/sonidos montan en el marco la pieza que le toca (comparada con la lista de la partitura y con el plan de pantallas de la propia app,
// no con nombres parecidos), ninguna repite la animación de otra y la duración de cada una es la de su animación. Deja la tabla de las 24 en docs/dias/V36C_tabla.json (la usa el REPASO).
//   APP_URL=http://localhost:5173 node scripts/destino/pruebaV36C.mjs      (con Vite en 5173)
// Ninguna parte toca el Supabase de producción: el administrador es de mentira y la app usa el servidor de mentira de la demo (?logrosDemo=1).
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
const J = async (a, js) => {
  const r = await a.evaluar(js)
  return typeof r === 'string' ? JSON.parse(r) : r
}
const esperar = async (a, js, n = 80) => {
  for (let i = 0; i < n; i++) {
    if (await a.evaluar(js).catch(() => false)) return true
    await a.esp(250)
  }
  return false
}
const toque = async (a, sel) => {
  const r = JSON.parse(await a.evaluar(`(() => { const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return JSON.stringify({ x: b.left + b.width / 2, y: b.top + b.height / 2 }) })()`))
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await a.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 })
}
const RUTA = '/?cuentas=off&logros=on&logrosDemo=1&admin=sonidos&apertura=0'
const MOCK = "const f = window.fetch.bind(window); window.fetch = (u, i) => String(u).includes('/api/admin/avisos-viajeros') ? Promise.resolve(new Response(JSON.stringify({ ok: true, nuevos: 0, avisos: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f(u, i);"

/* ───────── 1. El código ───────── */
console.log('1. El código')
const estudio = leer('src/lib/sonidos/estudio.ts')
const visorSrc = leer('src/components/logros/sonidos/VisorDeAnimacion.tsx')
debe(/id: 'sello', nombre: 'Sello del pasaporte', grupo: 'Logros', visor: 'pasaporte'/.test(estudio) && !/id: 'sello'[^\n]*momentos: 'sello'/.test(estudio), 'sello', 'la tarjeta «Sello del pasaporte» ya no monta la medalla (momento «sello»): monta la hoja del pasaporte')
debe(/PasaporteScreen/.test(visorSrc) && /a\.visor === 'pasaporte'/.test(visorSrc), 'sello', 'el visor monta la PasaporteScreen de la app (la misma pieza), no una copia')
const prepararCandidatos = leer('scripts/destino/sonidos/prepararCandidatos.mjs')
debe(/clic: \{[^\n]*candidatos: \{[^\n]*D: \[C\('dclick'\)\]/.test(prepararCandidatos), 'candidatos', 'el candidato D del clic existía en el script de candidatos («dclick»: doble clic de interfaz)')

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(sin Vite: la parte de la pantalla se salta)')
  console.log(`\nPrueba de la Tanda V36C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
  process.exit(fallos.length ? 1 : 0)
}

const adm = await abrirApp(APP, { ruta: RUTA, ancho: 1280, alto: 1000, sinEsperarRoot: true, esperaFija: 5, antes: MOCK })
try {
  debe(await esperar(adm, "document.querySelectorAll('[data-animacion-tarjeta]').length >= 20"), 'pagina', 'la página sale con su lista')
  debe(await esperar(adm, "Boolean(document.querySelector('[data-visor-iframe]')?.contentWindow?.__estudioVisor?.listo)", 160), 'marco', 'el marco carga y queda listo')

  /* ───────── 2. Las 24, comparadas con el plan de pantallas y las partituras de la app ───────── */
  console.log('2. Las 24 tarjetas, una a una (contra el plan de pantallas y la partitura de la app)')
  const datos = await J(adm, `Promise.all([import('/src/lib/sonidos/estudio.ts'), import('/src/lib/sonidos/partituras.ts'), import('/src/components/logros/momentos/plan.ts'), import('/src/lib/sonidos/motor.ts'), import('/src/lib/sonidos/tiempos.ts')]).then(async ([E, P, Plan, M, T]) => {
    const mf = await M.manifiesto()
    const filas = E.ANIMACIONES.map((a) => {
      const momentos = a.visor === 'momentos' || a.visor === 'resumen_dia' ? (E.MOMENTOS_DEL_ESTUDIO[a.momentos ?? a.id]?.() ?? []) : []
      const plan = momentos.length ? Plan.planificar(Plan.ordenarComoElServidor(momentos)) : []
      const primera = plan[0]
      const grado = primera?.tipo === 'sello' ? String(primera.momentos[0]?.grado ?? '') : ''
      const sonidoApp = primera ? (['bronce', 'plata', 'oro', 'diamante'].includes(grado) ? 'medalla_' + grado : Plan.sonidoDePantalla(primera.tipo)) : null
      const archivos = E.archivosDeLaAnimacion(a)
      return {
        id: a.id, nombre: a.nombre, grupo: a.grupo, visor: a.visor, momentos: a.momentos ?? null, suena: a.suena, partituras: a.partituras,
        tipos: plan.map((p) => p.tipo), grado, sonidoApp, dura: E.duracionDe(a), golpe: E.golpeDe(a),
        duraPartituras: a.suena.map((s) => [s, P.partituraDe(s)?.dura ?? null]),
        notas: a.suena.flatMap((s) => (P.partituraDe(s)?.notas ?? []).map((n) => (n.tipo === 'archivo' ? n.archivo + '@' + n.golpe.toFixed(2) : n.sonido + '@' + n.en.toFixed(2)))),
        candidatos: Object.fromEntries(archivos.map((id) => [id, Object.keys(mf[id] ?? {}).join('')])),
      }
    })
    return JSON.stringify({ filas, estampado: T.TIEMPOS_ESTAMPADO })
  })`)
  const filas = datos.filas
  debe(filas.length === 27 && new Set(filas.map((f) => f.id)).size === 27, 'lista', `las de la V36C, la V37C (los imprescindibles y dos colecciones a la vez) y la V38B (tres colecciones; un emblema por destino): 27 tarjetas, cada una con su id (${filas.length})`)
  const ESPERADO = {
    medalla_bronce: ['sello'], medalla_plata: ['sello'], medalla_oro: ['sello'], medalla_diamante: ['sello'], coleccion: ['coleccion'], coleccion_imprescindibles: ['coleccion'], pedazo_dos: ['pedazos'], pedazo_tres: ['pedazos'], emblema: ['emblema'], emblema_lanzarote: ['emblema'], emblema_maravilla: ['emblema'], maravilla: ['final7'], pais: ['pais'],
    pedazo: ['pedazos'], patrimonio: ['patrimonio'], viajero: ['viajero'], resumen_dia: ['ademas'],
  }
  for (const f of filas) {
    if (f.visor === 'momentos') {
      debe(JSON.stringify(f.tipos) === JSON.stringify(ESPERADO[f.id]), 'pantalla', `${f.id}: el plan de la app la pone como ${JSON.stringify(f.tipos)} (esperado ${JSON.stringify(ESPERADO[f.id])})`)
      debe(f.suena[0] === f.sonidoApp, 'sonido', `${f.id}: suena «${f.suena[0]}» = lo que suena en la app para esa pantalla («${f.sonidoApp}»)`)
    }
    const maxP = Math.max(...f.duraPartituras.map((d) => d[1] ?? 0))
    debe(f.duraPartituras.every((d) => d[1] !== null) && Math.abs(f.dura - maxP) < 1e-9 && f.dura > 0, 'duracion', `${f.id}: la duración de la tarjeta (${f.dura.toFixed(2)} s) es la de su partitura más larga (${maxP.toFixed(2)} s)`)
  }
  const sello = filas.find((f) => f.id === 'sello')
  debe(sello.visor === 'pasaporte' && sello.suena.join() === 'sello_pasaporte' && !sello.tipos.length, 'sello', 'la tarjeta del sello monta el pasaporte y suena su partitura (no la de la medalla)')
  debe(Math.abs(sello.dura - datos.estampado.fin) < 1e-9 && sello.notas.includes('clic@' + datos.estampado.golpe.toFixed(2)), 'sello', `dura lo que el sello (${sello.dura.toFixed(2)} s, hasta el último anillo) y su clic cae al tocar la hoja (a los ${datos.estampado.golpe.toFixed(2)} s)`)
  debe(!filas.some((f) => f.id !== 'sello' && f.suena.includes('sello_pasaporte')), 'sello', 'ninguna otra tarjeta usa la partitura del sello del pasaporte')
  // Ninguna repite la animación de otra: pieza (visor) y momento distintos.
  const huellas = filas.map((f) => `${f.visor}|${f.momentos ?? f.id}`)
  debe(new Set(huellas).size === huellas.length, 'repetidas', 'ninguna tarjeta monta la misma pieza con los mismos datos que otra')
  const gradosMedallas = filas.filter((f) => /^medalla_/.test(f.id)).map((f) => f.grado)
  debe(gradosMedallas.join() === 'bronce,plata,oro,diamante', 'medallas', `cada medalla muestra su grado (${gradosMedallas.join(', ')})`)
  // Candidatos: los que hay en el manifiesto; si falta una letra, no es un error de la pantalla (se descartó al prepararlos).
  const letras = (f) => Object.values(f.candidatos)
  debe(filas.find((f) => f.id === 'sello').candidatos.clic === 'ABCE', 'candidatos', 'el «clic» tiene los candidatos A, B, C y E: la D se descartó al prepararlos (no se perdió)')

  /* ───────── 3. En el marco: cada tarjeta enseña lo suyo ───────── */
  console.log('3. En el marco de iPhone: cada tarjeta enseña lo suyo')
  const textos = {}
  const MARCAS = {
    medalla_bronce: ['Primeros pasos en Roma', 'bronce'], medalla_plata: ['Roma te atrapa'], medalla_oro: ['Roma es casi tuya'], medalla_diamante: ['Roma es tuya'], coleccion: ['Las 4 joyas de Roma'], pais: ['Italia'],
    pedazo: ['Los miradores'], patrimonio: ['Centro histórico de Roma'], viajero: ['Trotamundos'], maravilla: ['Taj Mahal'],
  }
  for (const f of filas) {
    await toque(adm, `[data-animacion-tarjeta="${f.id}"]`)
    await esperar(adm, `document.querySelector('[data-visor-iframe]').contentDocument.querySelector('[data-visor-de-animacion]')?.getAttribute('data-animacion-actual') === '${f.id}'`, 60)
    await adm.esp(f.id === 'sello' ? 3200 : 1700)
    const r = await J(adm, `JSON.stringify((() => { const d = document.querySelector('[data-visor-iframe]').contentDocument; const raiz = d.querySelector('[data-visor-de-animacion]'); return { texto: (raiz?.innerText ?? '').replace(/\\s+/g, ' ').trim(), golpe: Boolean(d.querySelector('[data-golpe-del-sello]')), contenido: (d.body.textContent ?? '').replace(/s+/g, ' ').trim(), pasaporte: Boolean(d.querySelector('[data-visor-pasaporte]')), hijos: raiz ? raiz.children.length : 0 } })())`)
    textos[f.id] = r.texto
    debe(r.hijos > 0, 'marco', `${f.id}: se ve algo en el marco`)
    for (const m of MARCAS[f.id] ?? []) debe(new RegExp(m, 'i').test(r.texto), 'marco', `${f.id}: el marco enseña «${m}»`)
    if (f.id === 'sello') {
      debe(r.pasaporte && r.golpe, 'sello', 'el marco enseña la hoja del pasaporte y el sello se estampa (el golpe de tinta está en pantalla)')
      debe(!/Tu sello de Roma|Primeros pasos en Roma|Tu sello Roma/.test(r.texto), 'sello', 'y NO es la medalla de bronce («Tu sello de Roma · Bronce · Primeros pasos en Roma»)')
      debe(/Italia/i.test(r.contenido) && /Roma/i.test(r.contenido), 'sello', `la hoja es la de Italia, con el sello de Roma (${r.contenido.slice(0, 120)})`)
      await adm.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true")
      await adm.esp(300)
      await adm.captura('docs/dias/V36C_capturas/sello_corregido.jpg')
    }
    if (f.id === 'medalla_bronce') await adm.evaluar("document.querySelector('[data-marco-iphone]').scrollIntoView({ block: 'center' }); true").then(() => adm.captura('docs/dias/V36C_capturas/medalla_bronce.jpg'))
  }
  // Ninguna enseña lo mismo que otra (las dos de «solo sonido» llevan su título).
  const iguales = []
  const ids = Object.keys(textos)
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (textos[ids[i]] && textos[ids[i]] === textos[ids[j]]) iguales.push(`${ids[i]} = ${ids[j]}`)
  debe(iguales.length === 0, 'repetidas', `ninguna tarjeta enseña en el marco lo mismo que otra (${iguales.join(', ') || 'ninguna igual'})`)
  debe(textos.sello !== textos.medalla_bronce, 'sello', 'el sello del pasaporte y la medalla de bronce ya no enseñan lo mismo')

  fs.mkdirSync('docs/dias/V36C_capturas', { recursive: true })
  fs.writeFileSync('docs/dias/V36C_tabla.json', JSON.stringify({ filas, estampado: datos.estampado, textos }, null, 1))
} finally {
  adm.cerrar()
}

console.log(`\nPrueba de la Tanda V36C: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
