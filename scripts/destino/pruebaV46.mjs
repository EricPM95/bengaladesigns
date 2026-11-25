// V46 (24-nov-2026): cinco arreglos tras la V45. Hace falta el Vite estable (5173) y la API (8787) YA encendidos; NO arranca ninguno.
//   APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaV46.mjs
// Un solo Chrome, que se cierra al acabar. Capturas 390x844 en docs/dias/V46_capturas/.
//  0. Lo escrito (sin navegador).
//  1. RESERVAS, viaje de CUATRO: la hoja de una entrada trae «¿Para quién es?» en «Casi lista»; quien la añade sale marcado pero se puede desmarcar; siempre queda uno; una entrada para dos
//     sale solo para esos dos y su gasto solo se reparte entre ellos; «¿Quién la ha pagado?» solo con la cuenta conjunta.
//  2. HOY: «Pasar a otro día» nunca ofrece un día pasado ni el de hoy y el recomendado va en su tarjeta; «Cerrado ese día».
//  3. HOY: la caja HORARIO sale en una plaza con «Abierto»; el recuadro de la ubicación va encima de [Cómo llegar].
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

let comprobaciones = 0
const fallos = []
const debe = (c, regla, texto) => {
  comprobaciones++
  if (!c) {
    fallos.push({ regla, texto })
    console.log(`  FALLO [${regla}] ${texto}`)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '')
const CAP = path.resolve('docs/dias/V46_capturas')
fs.mkdirSync(CAP, { recursive: true })
const png = (n) => path.join(CAP, `${n}.jpg`)
const APP = process.env.APP_URL ?? 'http://localhost:5173'
const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"

/* ───────────── 0. Lo escrito ───────────── */
console.log('0. Lo escrito (sin navegador)')
{
  const hoja = sinComentarios(leer('src/components/route/reservas/AddReservationSheet.tsx'))
  debe(/previous\.length > 1 \? previous\.filter/.test(hoja), 'para_quien', 'se puede desmarcar a quien la añade, pero siempre queda al menos una persona marcada')
  debe(!/sinParaQuien=\{/.test(hoja) && /quienSinPrecio=\{enDosPasos\}/.test(hoja), 'para_quien', '«Casi lista» ya no esconde «¿Para quién es?»')
  // vuelo, alojamiento y coche siguen con su «¿Para quién es…?» (el bloque del dinero de todas las hojas, sin esconder nada)
  const dinero = sinComentarios(leer('src/components/route/reservas/DineroDeReserva.tsx'))
  debe(/<BloqueDinero/.test(dinero) && !/sinParaQuien/.test(dinero), 'para_quien', 'vuelo, alojamiento y coche (DineroDeReserva) siguen con «¿Para quién es…?», sin esconderlo')
  for (const [f, quien] of [['src/components/route/reservas/LlegadaYVuelta.tsx', 'el vuelo'], ['src/components/route/alojamiento/HojaTuAlojamiento.tsx', 'el alojamiento']]) debe(/useDineroDeReserva\(/.test(sinComentarios(leer(f))), 'para_quien', `${quien} usa el bloque del dinero con «¿Para quién…?»`)
  const claude = leer('CLAUDE.md')
  debe(/V46/.test(claude) && /nunca se quita algo que funciona/i.test(claude), 'reglas', 'CLAUDE.md: nunca se quita algo que funciona porque no salga en un dibujo de Design')
  const lista = sinComentarios(leer('src/components/route/dayDetail/ListaDeDias.tsx'))
  debe(/data-dia-destacado/.test(lista) && /1\.5px solid (#B58A2E|\$\{ORO_BORDE\})/.test(lista) && /Cerrado ese día/.test(lista), 'pasar_dia', 'el día recomendado va en su propia tarjeta destacada (borde dorado) y los cerrados dicen «Cerrado ese día»')
  const cp = sinComentarios(leer('src/components/route/hoy/v2/CambiarPlan.tsx'))
  debe(/i > iHoy/.test(cp), 'pasar_dia', 'CambiarPlan solo ofrece días POSTERIORES a hoy')
  debe(/d\.dayNumber > day\.dayNumber/.test(sinComentarios(leer('src/components/route/hoy/v2/BloquesHoy.tsx'))) && /candidato\.dayNumber > day\.dayNumber/.test(sinComentarios(leer('src/components/route/hoy/HoyDurante.tsx'))), 'pasar_dia', 'las otras hojas de «Pasarla a otro día» tampoco ofrecen días pasados ni el de hoy')
  const pa = sinComentarios(leer('src/components/route/hoy/v2/ParadaHoy.tsx'))
  // (V47) La caja HORARIO sale de `estadoDelHorario` (lib/horarioDeLaCaja.ts): sin horario, «Abierto» en verde con «Sin horario» debajo.
  debe(/estadoDelHorario\(p\.horario/.test(pa) && /dato="horario"/.test(pa) && /grande: 'Abierto', tono: 'verde', sub: 'Sin horario'/.test(sinComentarios(leer('src/lib/horarioDeLaCaja.ts'))), 'horario', 'la caja HORARIO sale siempre; sin horario, «Abierto»')
  const iSin = pa.indexOf("zona === 'sin' && (")
  const iHist = pa.indexOf('data-hoy-escuchar-camino')
  const iBotones = pa.indexOf('Cómo llegar\n')
  debe(iSin > 0 && iHist > 0 && iSin < iHist, 'ubicacion', 'el recuadro «Sin tu ubicación…» va ANTES de «Escucha su historia»')
  debe(iBotones < 0 || iSin < iBotones, 'ubicacion', 'y antes de [Cómo llegar] y [Cambiar plan]')
  debe(/desdeDonde\(origenDelPlan, !p\.casa\)/.test(pa) && /p\.casa \?\? p\.centroDelDia/.test(pa), 'minutos', 'sin ubicación, «Desde el alojamiento» / «Desde {parada anterior}» y los minutos del plan (desde el centro de su zona si el viaje no tiene alojamiento)')
  debe(/'#2E7D4F'/.test(pa) && /'#B3321F'/.test(pa) && /#1C2230/.test(pa) && /grande: 'Cerrado', tono: 'rojo'/.test(sinComentarios(leer('src/lib/horarioDeLaCaja.ts'))), 'horario_color', 'HORARIO: el horario en negro, «Abierto» en verde, «Cerrado» en rojo')
  const U = sinComentarios(leer('src/lib/ubicacionHoy.ts'))
  debe(/Desde \$\{conArticulo\(origen\)\}/.test(U), 'minutos', '«Desde el Panteón» con su artículo')
  const pz = sinComentarios(leer('src/components/route/hoy/v2/usePedazosDeParada.ts'))
  debe(/const guardados = new Map/.test(pz) && /usePedazosDeParada\(tripId, siguiente, true\)/.test(pa), 'pedazo', '«Aquí ganas 1 pedazo»: se pregunta antes de llegar y se guarda, para salir a la vez que la tarjeta')
}

if (!(await fetch(APP).then((r) => r.ok).catch(() => false))) {
  console.log('(SIN VITE: la parte de la pantalla NO SE HA VERIFICADO)')
  console.log(`\nPrueba de la V46: ${comprobaciones} comprobaciones · ${fallos.length} fallos · PANTALLA SIN VERIFICAR`)
  process.exit(fallos.length ? 1 : 0)
}

const GENTE4 = [
  { id: 'p-eric', nombre: 'Eric', foto: null, esAdmin: true, permiso: 'admin' },
  { id: 'p-ana', nombre: 'Ana', foto: null, esAdmin: false, permiso: 'editar' },
  { id: 'p-luis', nombre: 'Luis', foto: null, esAdmin: false, permiso: 'editar' },
  { id: 'p-marta', nombre: 'Marta', foto: null, esAdmin: false, permiso: 'editar' },
]
const ANTES = leer('scripts/destino/pruebaV43.mjs').match(/const ANTES = `([\s\S]*?)`/)[1]

let nSec = 0
const sec = async (fn) => {
  nSec++
  try {
    await fn()
  } catch (e) {
    debe(false, 'error', `la prueba se ha parado en la parte ${nSec}: ${String(e?.message ?? e).slice(0, 400)}`)
  }
}

/* ───────────── 1. RESERVAS, viaje de cuatro ───────────── */
console.log('1. «¿Para quién es?» en un viaje de cuatro')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&version=pago', ancho: 390, alto: 844 })
  const ev = (js) => a.evaluar(js)
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const hojaTxt = () => ev("document.querySelector('[role=\"dialog\"]')?.innerText.replace(/\\s+/g, ' ') ?? ''")
  const NOMBRES = ['Eric', 'Ana', 'Luis', 'Marta']
  const nombreDe = (b) => NOMBRES.find((n) => (b.textContent || '').replace(/[^A-Za-zÁ-ú]/g, '').endsWith(n)) ?? null
  const pastillas = () => ev(`(() => { const N = ${JSON.stringify(NOMBRES)}; return Array.from(document.querySelectorAll('[role="dialog"] [data-para-quien] button')).map((b) => ({ b, n: N.find((x) => (b.textContent || '').replace(/[^A-Za-zÁ-ú]/g, '').endsWith(x)) ?? null })).filter((x) => x.n && !x.b.closest('[data-quien-lo-ha-pagado]') && !x.b.closest('[data-a-que-cuenta]')).map((x) => ({ n: x.n, on: x.b.getAttribute('aria-pressed') === 'true' || x.b.dataset.elegida === '1' || x.b.querySelector('svg') !== null })) })()`)
  const ponerGente = (gente) =>
    ev(`(async () => {
      const g = ${JSON.stringify(gente)}.map((p) => ({ ...p, esYo: p.id === 'p-eric' }))
      const urls = [...new Set(performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.includes('store/useViajeCompartido.ts')))]
      const tiendas = [window.__viaje]
      for (const u of urls) tiendas.push((await import(/* @vite-ignore */ u)).useViajeCompartido)
      for (const st of new Set(tiendas)) { if (!st) continue; st.setState({ cargar: async () => {} }); st.getState().poner({ gente: g }) }
      window.__modoCuentas?.poner('conjunta', g.length)
      return true })()`)
  try {
    await sec(async () => {
      for (let i = 0; i < 360 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await a.esp(500)
      await ev('window.__rutaPrueba().then(() => true)')
      for (let i = 0; i < 90 && !(await ev('window.__ruta?.getState().route != null').catch(() => false)); i++) await a.esp(1000)
      await a.esp(2500)
      for (let i = 0; i < 5; i++) {
        const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim()) && !x.closest('[role=\"dialog\"]')); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await a.esp(600)
      }
      await ponerGente(GENTE4)
      await ev("window.__ruta.getState().setMode('bookings'); true")
      await a.esp(1500)
      await ev("(() => { const b = document.querySelector('[data-blk=\"entradas\"]'); b?.querySelector('[data-cabecera-clara], [data-llegada-cabecera]')?.click(); return true })()")
      await a.esp(1200)
      const abre = await ev("(() => { const b = Array.from(document.querySelectorAll('[data-blk=\"entradas\"] button')).find((x) => /^Añádela$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      debe(abre, 'para_quien', 'hay una entrada pendiente con «Añádela» para abrir la hoja')
      await a.esp(1200)
      // paso 1
      const p1 = await hojaTxt()
      debe(/Siguiente/i.test(p1) && !/Casi lista/i.test(p1), 'para_quien', 'en grupo, paso 1: los días y la hora con [Siguiente]')
      // un día (la entrada es del primero que se pueda) y [Siguiente]
      await ev(`(async () => { const hoja = document.querySelector('[role="dialog"]'); const fichas = Array.from(hoja.querySelectorAll('[role="group"] button')).filter((b) => !b.disabled); (fichas[1] ?? fichas[0])?.click(); await new Promise((r) => setTimeout(r, 1500)); const c = hoja.querySelector('[data-campo-de-hora="anadir"]'); if (c && c.getAttribute('data-vacia') === '1') { c.click(); await new Promise((r) => setTimeout(r, 600)); /* (V49) el ✓ no inventa la hora: se elige una en la rueda */ (() => { const os = Array.from(document.querySelectorAll('[data-hoja-de-hora] [role="option"]')); (os.find((x) => /^10/.test(x.textContent.trim())) ?? os.at(-1))?.click() })(); await new Promise((r) => setTimeout(r, 300)); document.querySelector('[data-hoja-de-hora-guardar]')?.click(); await new Promise((r) => setTimeout(r, 500)) } for (let i = 0; i < 30 && hoja.querySelector('[data-siguiente-paso]')?.disabled; i++) await new Promise((r) => setTimeout(r, 300)); return true })()`)
      debe(await ev("(() => { const b = document.querySelector('[data-siguiente-paso]'); if (!b || b.disabled) return false; b.click(); return true })()"), 'para_quien', '[Siguiente] se puede pulsar')
      await a.esp(900)
      // paso 2: ¿Para quién es? junto a ¿A qué cuenta? y ¿Quién la ha pagado?
      const p2 = await hojaTxt()
      debe(/Casi lista/i.test(p2) && /¿A qué cuenta lo sumamos\?/i.test(p2) && /¿Para quién/i.test(p2), 'para_quien', `«Casi lista» trae «¿A qué cuenta?» y «¿Para quién es?» (${p2.slice(0, 220)})`)
      let ps = await pastillas()
      debe(ps.length === 4, 'para_quien', `cuatro pastillas, una por viajero (${JSON.stringify(ps)})`)
      debe(ps.find((p) => p.n.startsWith('Eric'))?.on === true && ps.filter((p) => p.on).length === 1, 'para_quien', 'quien la añade (Eric) sale marcado al abrir, y solo él')
      await a.captura(png('v46_casi_lista_cuatro'))
      // marcar Ana y desmarcar a Eric: se puede
      const tocar = (nombre) => ev(`(() => { const b = Array.from(document.querySelectorAll('[role="dialog"] [data-para-quien] button')).find((x) => !x.closest('[data-quien-lo-ha-pagado]') && !x.closest('[data-a-que-cuenta]') && (x.textContent || '').replace(/[^A-Za-zÁ-ú]/g, '').endsWith(${JSON.stringify(nombre)})); if (!b) return false; b.click(); return true })()`)
      await tocar('Ana')
      await a.esp(300)
      await tocar('Eric')
      await a.esp(300)
      ps = await pastillas()
      debe(ps.filter((p) => p.on).map((p) => p.n).join() === 'Ana', 'para_quien', `quien la añade SE PUEDE desmarcar (si la compra para otros): queda ${JSON.stringify(ps.filter((p) => p.on))}`)
      // siempre queda al menos uno: intentar desmarcar a Ana (la única)
      await tocar('Ana')
      await a.esp(300)
      ps = await pastillas()
      debe(ps.filter((p) => p.on).length === 1, 'para_quien', 'siempre queda al menos una persona marcada')
      // para dos: Eric y Ana
      await tocar('Eric')
      await a.esp(300)
      ps = await pastillas()
      debe(ps.filter((p) => p.on).map((p) => p.n).sort().join() === 'Ana,Eric', 'para_quien', `una entrada para dos: Eric y Ana (${JSON.stringify(ps.filter((p) => p.on).map((p) => p.n))})`)
      const t2 = await hojaTxt()
      debe(/¿Quién la ha pagado\?/i.test(t2), 'para_quien', '«¿Quién la ha pagado?» sale con la cuenta conjunta (más de una persona)')
      const pagan = await ev(`Array.from(document.querySelectorAll('[role="dialog"] [data-quien-lo-ha-pagado] button')).map((b) => (b.textContent || '').replace(/[^A-Za-zÁ-ú]/g, '')).map((s) => ['Eric','Ana','Luis','Marta'].find((n) => s.endsWith(n)) ?? s)`)
      debe(pagan.length === 2 && pagan.includes('Eric') && pagan.includes('Ana'), 'para_quien', `«¿Quién la ha pagado?» enseña solo a los marcados (${JSON.stringify(pagan)})`)
      // Mi cuenta: queda uno y desaparece «quién»
      await clic('[data-cuenta-opcion="mia"]')
      await a.esp(400)
      debe(!/¿Quién la ha pagado\?/i.test(await hojaTxt()), 'para_quien', 'con [Mi cuenta] no sale «¿Quién la ha pagado?»')
      // otra vez Eric + Ana, precio y guardar
      await tocar('Ana')
      await a.esp(300)
      await ev("(() => { const i = document.querySelector('[role=\"dialog\"] input[inputmode=\"decimal\"], [role=\"dialog\"] input[data-precio]'); if (!i) return false; const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '40'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()")
      await a.esp(500)
      await a.captura(png('v46_casi_lista_dos'))
      const antes = await ev("window.__ruta.getState().reservations?.length ?? 0")
      for (let i = 0; i < 40 && (await ev("document.querySelector('[data-guardar-reserva]')?.disabled !== false")); i++) await a.esp(300)
      debe(await clic('[data-guardar-reserva]') && !(await ev("document.querySelector('[data-guardar-reserva]')?.disabled === true")), 'para_quien', '[Guardar la entrada] se puede pulsar')
      // (el motor propone mover el día del Coliseo: «De acuerdo»)
      for (let i = 0; i < 20 && (await ev("window.__ruta.getState().reservations?.length ?? 0")) <= antes; i++) {
        await ev("(() => { const b = Array.from(document.querySelectorAll('[role=\"dialog\"] button')).find((x) => /^De acuerdo$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        await a.esp(400)
      }
      if ((await ev("window.__ruta.getState().reservations?.length ?? 0")) <= antes) console.log('   tras guardar, la hoja dice:', (await hojaTxt()).slice(-450))
      const res = await ev("(() => { const rs = window.__ruta.getState().reservations ?? []; const r = rs[rs.length - 1]; return r ? { n: rs.length, kind: r.kind, para: r.paraQuien ?? null, pago: r.pagadoPor ?? null, precio: r.precio ?? null } : null })()")
      debe(res && res.n === antes + 1 && Array.isArray(res.para) && res.para.slice().sort().join() === 'p-ana,p-eric', 'para_quien', `la entrada queda guardada solo para Eric y Ana (${JSON.stringify(res)})`)
      // su gasto solo se reparte entre ellos
      const ap = await ev(`(async () => { const C = await import('/src/lib/cuentasGrupo.ts'); const rs = window.__ruta.getState().reservations ?? []; const r = rs[rs.length - 1]; const out = C.aportacionesDelViaje({ gastos: [], reservas: [r], adminId: 'p-eric', todos: ${JSON.stringify(GENTE4.map((p) => p.id))}, moneda: 'EUR', cambio: null }); return out.filter((x) => x.id === 'reserva-' + r.id).map((x) => ({ entre: x.entre, pagan: x.pagan, centimos: x.centimos })) })()`)
      debe(ap.length === 1 && ap[0].entre.slice().sort().join() === 'p-ana,p-eric' && ap[0].centimos > 0 && !ap[0].entre.includes('p-luis') && !ap[0].entre.includes('p-marta'), 'para_quien', `su gasto solo se reparte entre Eric y Ana (${JSON.stringify(ap)})`)
      const noLuis = await ev(`(async () => { const E = await import('/src/lib/entradasDelGrupo.ts'); const rs = window.__ruta.getState().reservations ?? []; const r = rs[rs.length - 1]; return { luis: Array.isArray(r.paraQuien) && r.paraQuien.includes('p-luis'), ana: Array.isArray(r.paraQuien) && r.paraQuien.includes('p-ana'), existe: typeof E.cubreElSitio === 'function' } })()`)
      debe(noLuis.ana === true && noLuis.luis === false, 'para_quien', 'sale en la ruta de Ana y NO en la de Luis')
    })
  } finally {
    a.cerrar()
  }
}

/* ───────────── 2 y 3. HOY ───────────── */
console.log('2. HOY: «Pasar a otro día» y la tarjeta de la parada')
{
  const a = await abrirApp(APP, { ruta: '/?cuentas=off&logros=on&logrosDemo=1&apertura=0&hoy2=on&version=completa', antes: ANTES, ancho: 390, alto: 844 })
  const ev = (e) => a.evaluar('(async () => (' + e + '))()')
  const esp = (ms) => a.esp(ms)
  const hay = (sel) => ev(`Boolean(document.querySelector(${JSON.stringify(sel)}))`)
  const clic = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.click(); return true })()`)
  const montarHoy = async (min, hoyIso, mut = '') => {
    await ev(`(async () => {
      const st = ${R}; const r = JSON.parse(JSON.stringify(st.getState().route))
      r.days.forEach((d) => { d.stops.forEach((s) => { delete s.checkedInAt; delete s.saltada }) })
      ${mut}
      st.setState({ route: r, screen: 'route' })
      try { Object.keys(localStorage).filter((k) => k.startsWith('trazo:hoy:') || k.startsWith('jutrip:avisos-dichos:')).forEach((k) => localStorage.removeItem(k)); localStorage.setItem('trazo:logros:permisos-vistos', '1') } catch {}
      try { (await import('/src/lib/hoyCambiarPlanAplicar.ts')).useCambiarPlanStore.setState({ rutaId: null, fecha: null, historial: [], aviso: null }) } catch {}
      window.__horaFalsa = ${min}; window.__pos = null; window.__perm = 'denied'
      st.getState().setDevSimulatedTodayIso(${JSON.stringify(hoyIso)}); st.getState().setActiveDayId(null); st.getState().setMode('explore')
      return true })()`)
    await esp(700)
    await ev(`${R}.getState().setMode('today')`)
    await esp(2600)
  }
  const dias = () => ev("Array.from(document.querySelectorAll('[data-dia-de-la-lista]')).map((b) => ({ id: b.getAttribute('data-dia-de-la-lista'), texto: (b.textContent || '').replace(/\\s+/g, ' ').trim(), destacado: b.hasAttribute('data-dia-destacado'), cerrado: b.hasAttribute('data-dia-cerrado') }))")
  try {
    for (let i = 0; i < 80 && !(await ev("typeof window.__rutaPrueba === 'function'").catch(() => false)); i++) await esp(500)
    await ev('window.__rutaPrueba().then(() => true)')
    for (let i = 0; i < 240 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await esp(1000)
    await esp(2500)
    for (let i = 0; i < 4; i++) {
      const h = await ev("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Entendido|Vale|Cerrar|Siguiente)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
      if (!h) break
      await esp(600)
    }
    const fechas = await ev(`(async () => { const B = await import('/src/lib/bookings.ts'); const r = ${R}.getState().route; return r.days.map((d) => ({ id: d.id, n: d.dayNumber, f: B.dateOfDay(r, d), vuelta: Boolean(d.isReturnLeg) })) })()`)
    console.log('   días del viaje de pruebas:', fechas.map((d) => `${d.n}=${d.f}${d.vuelta ? '(vuelta)' : ''}`).join(' '))
    const medio = fechas.filter((d) => !d.vuelta)[2] ?? fechas[2]
    await sec(async () => {
      // HOY en el tercer día: lo anterior ya pasó
      await montarHoy(12 * 60, medio.f)
      debe(await hay('[data-hoy-cambiar-plan]'), 'pasar_dia', `HOY el ${medio.f} tiene [Cambiar plan]`)
      await clic('[data-hoy-cambiar-plan]')
      await esp(700)
      await clic('[data-cambiar-opcion="otro_dia"]')
      await esp(900)
      const lista = await dias()
      const ids = lista.map((d) => d.id)
      const pasadosOHoy = fechas.filter((d) => d.f && d.f <= medio.f).map((d) => d.id)
      debe(lista.length > 0 || fechas.filter((d) => d.f > medio.f && !d.vuelta).length === 0, 'pasar_dia', `la lista ofrece los días posteriores (${JSON.stringify(lista.map((d) => d.texto.slice(0, 22)))})`)
      debe(ids.every((id) => !pasadosOHoy.includes(id)), 'pasar_dia', `nunca sale un día pasado ni el de hoy (hoy es ${medio.f}; salen ${JSON.stringify(ids)}; pasados u hoy: ${JSON.stringify(pasadosOHoy)})`)
      await a.captura(png('v46_pasar_a_otro_dia_tercer_dia'))
    })
    await sec(async () => {
      // HOY en el primer día: lo siguiente sí sale; el recomendado en su tarjeta; un sitio cerrado ese día en gris
      const primero = fechas.filter((d) => !d.vuelta)[0]
      await montarHoy(10 * 60, primero.f)
      await clic('[data-hoy-cambiar-plan]')
      await esp(700)
      await clic('[data-cambiar-opcion="otro_dia"]')
      await esp(900)
      const lista = await dias()
      debe(lista.length >= 2 && lista.every((d) => d.id !== primero.id), 'pasar_dia', `el primer día ofrece los siguientes y no el de hoy (${lista.length})`)
      const dest = lista.filter((d) => d.destacado)
      debe(dest.length <= 1, 'pasar_dia', 'como mucho UNA tarjeta destacada')
      if (dest.length === 1) {
        debe(/Te lo recomendamos/.test(dest[0].texto), 'pasar_dia', `el recomendado lleva «Te lo recomendamos» encima del nombre (${dest[0].texto.slice(0, 60)})`)
        const geom = await ev(`(() => { const e = document.querySelector('[data-dia-destacado]'); const s = getComputedStyle(e); const et = e.querySelector('[data-dia-recomendado]').getBoundingClientRect(); const nom = e.querySelector('[data-dia-etiqueta]').getBoundingClientRect(); return { borde: s.borderTopColor, ancho: s.borderTopWidth, etiquetaArriba: et.bottom <= nom.top + 2, flecha: Boolean(e.querySelector('svg')), primero: document.querySelector('[data-lista-de-dias]').querySelector('[data-dia-de-la-lista]') === e } })()`)
        debe(/181, 138, 46/.test(geom.borde) && geom.etiquetaArriba && geom.flecha && geom.primero, 'pasar_dia', `tarjeta con borde dorado, la etiqueta encima del nombre, su flecha, y la primera (${JSON.stringify(geom)})`)
      } else {
        console.log('   (sin día recomendado en este montaje: la tarjeta destacada se mira con la prueba del código)')
      }
      await a.captura(png('v46_pasar_a_otro_dia_primer_dia'))
      // un sitio cerrado algún día: el Vaticano cierra los domingos; se busca el día cerrado en la lista
      const cerrados = lista.filter((d) => d.cerrado)
      debe(cerrados.every((d) => /Cerrado ese día/.test(d.texto)), 'pasar_dia', `los días cerrados dicen «Cerrado ese día» (${JSON.stringify(cerrados.map((d) => d.texto.slice(0, 40)))})`)
      console.log('   cerrados en la lista:', cerrados.length)
    })
    await sec(async () => {
      // La tarjeta de la parada: HORARIO en una plaza («Abierto») y el recuadro de la ubicación encima de los botones
      const primero = fechas.filter((d) => !d.vuelta)[0]
      await montarHoy(10 * 60, primero.f, "const d0 = r.days.find((d) => !d.isReturnLeg); const s0 = d0.stops.find((s) => !s.isBreak && !s.isArrival); s0.name = 'Plaza del Campidoglio'; s0.id = s0.id; delete s0.hours; delete s0.hours_data; delete s0.schedule; r.days.filter((d) => !d.isReturnLeg).slice(1).forEach((d) => { d.stops = d.stops.slice(0, 2) });")
      const t = await ev(`(() => { const h = document.querySelector('[data-hoy-horario]'); if (!h) return null; const r = document.querySelector('[data-hoy-trayecto]'); const hb = h.getBoundingClientRect(); const rb = r?.getBoundingClientRect(); return { modo: h.getAttribute('data-hoy-horario'), texto: h.querySelector('[data-caja-grande]')?.textContent, mismaFila: rb ? Math.abs(hb.top - rb.top) < 3 : false, anchoH: Math.round(hb.width), anchoA: rb ? Math.round(rb.width) : 0 } })()`)
      debe(t && t.texto === 'Abierto' && t.mismaFila && Math.abs(t.anchoH - t.anchoA) < 4, 'horario', `la caja HORARIO sale en una plaza con «Abierto» y A PIE no ocupa todo el ancho (${JSON.stringify(t)})`)
      const o = await ev(`(() => { const q = (s) => document.querySelector(s)?.getBoundingClientRect(); const caja = q('[data-hoy-trayecto]'); const rec = q('[data-hoy-sin-ubicacion]') ?? q('[data-hoy-lejos]'); const hist = q('[data-hoy-escuchar-camino]'); const llegar = Array.from(document.querySelectorAll('a,span')).find((x) => /^Cómo llegar$/.test((x.textContent || '').trim()))?.getBoundingClientRect(); return { caja: caja?.bottom ?? null, rec: rec ? [rec.top, rec.bottom] : null, hist: hist?.top ?? null, llegar: llegar?.top ?? null } })()`)
      debe(o.rec && o.caja != null && o.rec[0] >= o.caja - 1, 'ubicacion', `el recuadro va DEBAJO de las cajas (${JSON.stringify(o)})`)
      debe(o.rec && (o.hist == null || o.rec[1] <= o.hist + 1) && (o.llegar == null || o.rec[1] <= o.llegar + 1), 'ubicacion', `y ENCIMA de «Escucha su historia» y de [Cómo llegar] (${JSON.stringify(o)})`)
      await a.captura(png('v46_parada_plaza'))
      // (V46) La caja de minutos: sin ubicación van los minutos del plan («Desde el alojamiento»), nunca «—»; el horario en negro, «Abierto» en verde
      const caja = await ev(`(() => { const c = document.querySelector('[data-hoy-trayecto]'); return { min: c?.querySelector('[data-caja-grande]')?.textContent ?? null, sub: c?.querySelector('[data-caja-sub]')?.textContent ?? null, zona: c?.getAttribute('data-hoy-trayecto-zona') } })()`)
      debe(caja.zona === 'sin' && /^\d+ min$/.test(caja.min ?? '') && /^Desde el (alojamiento|centro)$/.test(caja.sub ?? ''), 'minutos', `sin ubicación: los minutos del plan y «Desde el alojamiento» (o «Desde el centro» sin alojamiento), no «—» ni «Del alojamiento a…» (${JSON.stringify(caja)})`)
      const colA = await ev("getComputedStyle(document.querySelector('[data-hoy-horario] [data-caja-grande]')).color")
      debe(/rgb\(46, 125, 79\)/.test(colA), 'horario_color', `«Abierto» en verde (${colA})`)
      // con un sitio abierto siempre (la plaza), «Pasar a otro día» recomienda un día: su propia tarjeta destacada
      await clic('[data-hoy-cambiar-plan]')
      await esp(700)
      await clic('[data-cambiar-opcion="otro_dia"]')
      await esp(900)
      const lista = await dias()
      const dest = lista.filter((d) => d.destacado)
      debe(dest.length === 1 && /Te lo recomendamos/.test(dest[0].texto), 'pasar_dia', `un sitio abierto siempre tiene su día recomendado, en su propia tarjeta (${JSON.stringify(lista.map((d) => [d.texto.slice(0, 28), d.destacado]))})`)
      if (dest.length === 1) {
        const geom = await ev(`(() => { const e = document.querySelector('[data-dia-destacado]'); const s = getComputedStyle(e); const et = e.querySelector('[data-dia-recomendado]').getBoundingClientRect(); const nom = e.querySelector('[data-dia-etiqueta]').getBoundingClientRect(); return { borde: s.borderTopColor, etiquetaArriba: et.bottom <= nom.top + 2, flecha: Boolean(e.querySelector('svg')), primero: document.querySelector('[data-lista-de-dias]').querySelector('[data-dia-de-la-lista]') === e } })()`)
        debe(/181, 138, 46/.test(geom.borde) && geom.etiquetaArriba && geom.flecha && geom.primero, 'pasar_dia', `borde dorado, «Te lo recomendamos» encima del nombre, su flecha y la primera de la lista (${JSON.stringify(geom)})`)
      }
      await a.captura(png('v46_pasar_a_otro_dia_recomendado'))
    })
  } finally {
    a.cerrar()
  }
}

console.log(`\nPrueba de la V46: ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`✗ [${f.regla}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
