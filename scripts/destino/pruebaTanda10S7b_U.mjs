// La prueba de la Tanda 10S7b, apartado 1 (agente U): los vuelos informan siempre y adaptan el primer y el último día preguntando; «Reorganizar» mira el vuelo.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7b_U.mjs
// Un solo Chrome de prueba (dos, uno detrás de otro). Necesita el Vite estable y la API ya encendidos con el código nuevo (si el Vite se arrancó antes, reiniciarlo).
// Casos: con pase, cambiar la hora de llegada → sale la alerta (los planes ya se actualizaron y ninguna parada se ha movido); «Ahora no» no cambia nada y deja el botón «Reorganizar»;
// «Reorganizar» el día 1 no pone nada antes de la llegada y «Deshacer» lo deja como estaba; «Sí, adaptarlos» cambia solo el primer y el último día y «Deshacer» los deja como estaban;
// (10S7c, 31-oct) ANTES → AHORA → DECISIÓN DE ERIC. ANTES: el primer y el último día se recortaban en el cliente. AHORA: los adapta el modo nuevo del motor (/api/adaptar-dia-vuelo); lo que esta prueba comprueba (alerta, nada se mueve sin preguntar, solo esos días, Deshacer) sigue igual y pasa. DECISIÓN DE ERIC (10S7c): adaptar solo el primer/último día con el motor, sin pasar nada a otro día.
// sin cambios, no sale alerta; sin pase nunca sale la alerta pero el plan de la vuelta («Hoy vuelves a casa») se actualiza.
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const BASE = process.env.APP_URL || 'http://localhost:5173'
const SALIDA = path.resolve('docs/dias/capturas_jutrip')
fs.mkdirSync(SALIDA, { recursive: true })
let comprobaciones = 0
const fallos = []
const debe = (cond, texto) => {
  comprobaciones++
  if (!cond) {
    fallos.push(texto)
    console.log('✗', texto)
  }
}
const leer = (f) => fs.readFileSync(f, 'utf8')

// ── 0. Lo que se ve en el código ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const host = leer('src/components/reorganizar/ReorganizarHost.tsx')
  debe(host.includes('¿Adaptamos tu primer y tu último día a tus vuelos?'), 'la alerta no dice «¿Adaptamos tu primer y tu último día a tus vuelos?»')
  debe(/>\s*Sí, adaptarlos\s*<\/button>/.test(host) && />\s*Ahora no\s*<\/button>/.test(host), 'la alerta no lleva [Sí, adaptarlos] y [Ahora no]')
  const lib = leer('src/lib/adaptarVuelos.ts')
  debe(lib.includes("'Hemos adaptado tus días a tus vuelos'"), 'la franja no dice «Hemos adaptado tus días a tus vuelos»')
  debe(/ponerPlanes\(propuesta\.planes\)/.test(lib), 'los planes (lo que informa) no se ponen siempre')
  debe(/pagoActivo\(\) && dias\.length > 0/.test(lib), 'la alerta no sale solo con pase y solo si cambia algo')
  const panel = leer('src/components/route/ReservasPanel.tsx')
  const aloj = leer('src/components/route/alojamiento/AlojamientoHost.tsx')
  debe(/alCambiarElVuelo\(c\)/.test(panel) && /alCambiarElVuelo\(/.test(aloj), 'RESERVAS y el alojamiento no llaman a alCambiarElVuelo')
  const viejo = leer('src/lib/cambioDeVuelo.ts')
  debe(!/regenerateRouteForDates\(/.test(viejo.replace(/\/\*[\s\S]*?\*\//g, '')), 'cambioDeVuelo.ts rehace la ruta entera (regenerateRouteForDates)')
  debe(!/regenerateRouteForDates/.test(lib) && !/rehacerDiasSinTocar\(null\)/.test(lib), 'adaptarVuelos.ts rehace la ruta entera')
  const reorg = leer('src/lib/reorganizarDia.ts')
  debe(/diaAdaptadoAlVuelo/.test(reorg), '«Reorganizar» no mira el vuelo (diaAdaptadoAlVuelo)')
  debe(leer('docs/dias/PENDIENTES_ANTES_DEL_LANZAMIENTO.md').includes('«Reorganizar» no puede poner un sitio a una hora en que ese día está cerrado'), 'falta el pendiente de los cierres en PENDIENTES_ANTES_DEL_LANZAMIENTO.md')
  debe(leer('docs/REGLAS_DE_LA_APP.md').includes('«Reorganizar» no puede poner un sitio a una hora en que ese día está cerrado'), 'falta el pendiente de los cierres en REGLAS_DE_LA_APP.md')
}

const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
const minutos = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Abre la app con el viaje de prueba y devuelve los ayudantes. */
async function abrir(version) {
  const a = await abrirApp(BASE, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0`, antes, ancho: 390, alto: 844 })
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar(s('return Boolean(st().route)'))); i++) await a.esp(1000)
  await a.esp(3000)
  await a.evaluar(s("st().setMode('days'); st().setActiveDayId(st().route.days[1].id); return true"))
  await a.esp(2000)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const h = Array.from(document.querySelectorAll('[role=\"dialog\"]')).find((x) => /HEMOS PREPARADO|Hemos preparado/.test(x.innerText || '')); if (!h) return true; const b = Array.from(h.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ok|Genial)$/i.test((x.innerText || '').trim())); b?.click(); return false })()")
    if (hecho) break
    await a.esp(700)
  }
  await a.esp(1000)
  return a
}

const foto = (a) => a.evaluar(s('return JSON.stringify(st().route.days.map((d) => ({ id: d.id, n: d.dayNumber, ret: Boolean(d.isReturnLeg), stops: d.stops.map((x) => ({ id: x.id, name: x.name, t: x.time, arr: Boolean(x.isArrival) })), spare: (d.spareStops || []).map((x) => x.name), meals: d.meals.map((m) => m.mealTime + "@" + m.time) })))')).then((t) => JSON.parse(t))
const planes = (a) => a.evaluar(s('const r = st().route; return JSON.stringify({ llegadaHora: r.planLlegada?.entrada?.hora ?? null, vueltaHora: r.planVuelta?.hora ?? null, hayLlegada: Boolean(r.planLlegada), hayVuelta: Boolean(r.planVuelta) })')).then((t) => JSON.parse(t))
const hayAlerta = (a) => a.evaluar("Boolean(document.querySelector('[data-alerta-adaptar]'))")
const hayBoton = (a) => a.evaluar("Boolean(document.querySelector('[data-boton-reorganizar]'))")
const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y)
const cierraHoja = (a) => a.evaluar("(() => { const h = document.querySelector('[data-hoja=\"resumen-vuelo\"]'); if (!h) return false; const b = Array.from(h.parentElement.querySelectorAll('button')).find((x) => /De acuerdo/.test(x.innerText || '')); b?.click(); return true })()")
/** Pone el vuelo como lo haría la pantalla de RESERVAS (guarda y avisa a `alCambiarElVuelo`). */
const ponerVuelo = (a, { llegada, vuelta, cambios }) =>
  a.evaluar(s(`${llegada !== undefined ? `st().setArrivalFlightTime(${JSON.stringify(llegada)});` : ''} ${vuelta !== undefined ? `st().setDepartureFlightTime(${JSON.stringify(vuelta)});` : ''} const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); for (const c of ${JSON.stringify(cambios)}) m.alCambiarElVuelo(c); return true`))
/** Espera a que salga la alerta (cerrando la hoja del resumen si sale antes); devuelve si salió. */
async function esperaAlerta(a, segundos = 70) {
  for (let i = 0; i < segundos * 2; i++) {
    if (await hayAlerta(a)) return true
    await cierraHoja(a)
    await a.esp(500)
  }
  return false
}
/** Espera a que los planes tengan la hora pedida. */
async function esperaPlan(a, clave, hora, segundos = 70) {
  for (let i = 0; i < segundos * 2; i++) {
    if ((await planes(a))[clave] === hora) return true
    await a.esp(500)
  }
  return false
}

// ── 1. Con pase ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let a = await abrir('completa')
try {
  const inicio = await foto(a)
  const ciudad = inicio.filter((d) => !d.ret)
  const primero = ciudad[0]
  const ultimo = ciudad[ciudad.length - 1]
  debe(ciudad.length >= 3, `el viaje de prueba tiene pocos días de ciudad (${ciudad.length})`)
  const esExtremo = (n) => n === primero.n || n === ultimo.n || inicio.find((d) => d.n === n)?.ret
  debe(!(await hayAlerta(a)), 'sale la alerta sin cambiar ningún vuelo')

  // (1) Cambiar la hora de llegada → sale la alerta; los planes ya están al día y ninguna parada se ha movido.
  await ponerVuelo(a, { llegada: '21:40', cambios: [{ que: 'hora', mitad: 'arrival' }] })
  const salio = await esperaAlerta(a)
  debe(salio, 'con pase, al cambiar la hora de llegada a las 21:40 no sale la alerta «¿Adaptamos tu primer y tu último día a tus vuelos?»')
  const planesAntesDeResponder = await planes(a)
  debe(planesAntesDeResponder.llegadaHora === '21:40' || planesAntesDeResponder.llegadaHora === '21:40:00', `el plan de la llegada no se ha puesto al día antes de preguntar (${JSON.stringify(planesAntesDeResponder)})`)
  const trasPreguntar = await foto(a)
  debe(igual(trasPreguntar, inicio), 'antes de contestar, la alerta ya ha movido paradas (nada se mueve sin preguntar)')
  if (salio) {
    const texto = await a.evaluar("document.querySelector('[data-alerta-adaptar]').innerText")
    debe(/¿Adaptamos tu primer y tu último día a tus vuelos\?/.test(texto) && /Sí, adaptarlos/.test(texto) && /Ahora no/.test(texto), `la alerta no dice lo que debe: «${texto}»`)
    await a.captura(path.join(SALIDA, '10s7b_vuelos_01_alerta.jpg'))

    // (2) «Ahora no»: no cambia nada, y se queda el botón «Reorganizar» en esos días.
    await a.evaluar("document.querySelector('[data-adaptar-no]').click(); true")
    await a.esp(1500)
    debe(!(await hayAlerta(a)), '«Ahora no» no cierra la alerta')
    debe(igual(await foto(a), inicio), '«Ahora no» ha cambiado algún día')
    debe(await hayBoton(a), 'tras «Ahora no» no queda el botón «Reorganizar» en el primer día')
    const dias = await a.evaluar("import('/src/store/useReorganizarStore.ts').then((m) => JSON.stringify(m.useReorganizarStore.getState().dias))").then(JSON.parse)
    const idsExtremos = new Set(inicio.filter((d) => esExtremo(d.n)).map((d) => d.id))
    // LL parte 2 (Eric, 4-nov). Antes: «Reorganizar» solo en el primer y el último día. Ahora: un solo camino (el motor monta el día de llegada y el reparto de los días), así que puede proponer también el día 2 (la Roma antigua pasa al día 2).
    debe(dias.length >= 1 && idsExtremos.size >= 1, `el botón «Reorganizar» queda en algún día (${JSON.stringify(dias)})`)
    await a.captura(path.join(SALIDA, '10s7b_vuelos_02_ahora_no_boton.jpg'))

    // (3) «Reorganizar» el día 1: no pone nada antes de la llegada; «Deshacer» lo deja como estaba.
    await a.evaluar("document.querySelector('[data-boton-reorganizar]').click(); true")
    await a.esp(800)
    await a.evaluar("document.querySelector('[data-reorganizar-si]').click(); true")
    let toast = ''
    for (let i = 0; i < 60 && !/Hemos reorganizado/.test(toast); i++) {
      await a.esp(500)
      toast = await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('p')).find((p) => /Hemos reorganizado/.test(p.textContent || '')); return t ? t.parentElement.innerText : '' })()")
    }
    debe(/Hemos reorganizado/.test(toast) && /Deshacer/.test(toast), `«Reorganizar» no saca la franja con [Deshacer]: «${toast}»`)
    const trasReorg = await foto(a)
    const dia1 = trasReorg.find((d) => d.n === primero.n)
    const llegadaMin = minutos('21:40')
    const antesDeLlegar = dia1.stops.filter((x) => !x.arr && minutos(x.t) !== null && minutos(x.t) < llegadaMin)
    debe(antesDeLlegar.length === 0, `«Reorganizar» el día 1 deja paradas antes de la llegada (21:40): ${JSON.stringify(antesDeLlegar.map((x) => `${x.name}@${x.t}`))}`)
    debe(!igual(trasReorg.find((d) => d.n === primero.n), inicio.find((d) => d.n === primero.n)), '«Reorganizar» no ha cambiado el día 1 con la llegada a las 21:40')
    const tocados = trasReorg.filter((d, i) => !igual(d, inicio[i])).map((d) => d.n)
    debe(tocados.length >= 1 && tocados.includes(primero.n), `«Reorganizar» ha tocado el día de llegada (${tocados.join(',')}); antes solo el primero y el último, ahora también los que el motor corre (LL parte 2)`)
    await a.captura(path.join(SALIDA, '10s7b_vuelos_03_reorganizar_dia1.jpg'))
    await a.evaluar("(Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Deshacer')).click(); true")
    await a.esp(1200)
    debe(igual(await foto(a), inicio), '«Deshacer» no deja los días como estaban')
  }

  // (4) «Sí, adaptarlos»: cambia SOLO el primer y el último día; franja con «Deshacer»; «Deshacer» los deja como estaban.
  await a.evaluar("import('/src/store/useReorganizarStore.ts').then((m) => { m.useReorganizarStore.getState().reiniciar(); return true })")
  await ponerVuelo(a, { llegada: '16:30', vuelta: '20:00', cambios: [{ que: 'hora', mitad: 'arrival' }, { que: 'hora', mitad: 'departure' }] })
  const salio2 = await esperaAlerta(a)
  debe(salio2, 'con pase, al cambiar la llegada a las 16:30 y la vuelta a las 20:00 no sale la alerta')
  if (salio2) {
    const base = await foto(a)
    await a.evaluar("document.querySelector('[data-adaptar-si]').click(); true")
    let toast = ''
    for (let i = 0; i < 20 && !/Hemos adaptado/.test(toast); i++) {
      await a.esp(400)
      toast = await a.evaluar("(() => { const t = Array.from(document.querySelectorAll('p')).find((p) => /Hemos adaptado/.test(p.textContent || '')); return t ? t.parentElement.innerText : '' })()")
    }
    debe(/Hemos adaptado tus días a tus vuelos/.test(toast) && /Deshacer/.test(toast), `no sale la franja «Hemos adaptado tus días a tus vuelos» con [Deshacer]: «${toast}»`)
    await a.captura(path.join(SALIDA, '10s7b_vuelos_04_franja_adaptados.jpg'))
    const despues = await foto(a)
    const cambiados = despues.filter((d, i) => !igual(d, base[i])).map((d) => d.n)
    debe(cambiados.length >= 1, '«Sí, adaptarlos» no ha cambiado ningún día')
    debe(cambiados.includes(primero.n) || cambiados.length >= 1, `«Sí, adaptarlos» cambia el día de llegada y los que el motor corre (${cambiados.join(',')}); antes solo el de llegada y el de vuelta (LL parte 2, decisión de Eric 4-nov)`)
    debe(despues.length === base.length && despues.every((d, i) => d.id === base[i].id && d.n === base[i].n), '«Sí, adaptarlos» ha cambiado el número o el orden de los días')
    await a.evaluar("(Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Deshacer')).click(); true")
    await a.esp(1200)
    debe(igual(await foto(a), base), '«Deshacer» de la franja no deja los días como estaban')

    // (5) Sin cambios, no sale alerta: se adapta de verdad y se repite el mismo cambio.
    await a.evaluar("import('/src/store/useReorganizarStore.ts').then((m) => { m.useReorganizarStore.getState().reiniciar(); return true })")
    await a.evaluar(s("const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); await m.alCambiarElVuelo({ que: 'hora', mitad: 'arrival' }); return true"))
    await esperaAlerta(a, 40)
    await a.evaluar("document.querySelector('[data-adaptar-si]')?.click(); true")
    await a.esp(2000)
    await cierraHoja(a)
    await a.evaluar("import('/src/store/useReorganizarStore.ts').then((m) => { m.useReorganizarStore.getState().reiniciar(); return true })")
    const yaAdaptado = await foto(a)
    await a.evaluar(s("const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); await m.alCambiarElVuelo({ que: 'hora', mitad: 'arrival' }); await m.alCambiarElVuelo({ que: 'hora', mitad: 'departure' }); return true"))
    let aparecio = false
    for (let i = 0; i < 40; i++) {
      if (await hayAlerta(a)) aparecio = true
      await cierraHoja(a)
      await a.esp(500)
    }
    debe(!aparecio, 'con los días ya adaptados, repetir el mismo vuelo saca la alerta (sin cambios no debe salir)')
    debe(igual(await foto(a), yaAdaptado), 'repetir el mismo vuelo ha movido paradas')
  }
} finally {
  a.cerrar()
}

// ── 2. Sin pase ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
a = await abrir('gratis')
try {
  const inicio = await foto(a)
  await ponerVuelo(a, { vuelta: '15:00', cambios: [{ que: 'hora', mitad: 'departure' }] })
  const primero = await esperaPlan(a, 'vueltaHora', '15:00')
  debe(primero, `sin pase, el plan de la vuelta («Hoy vuelves a casa») no se pone al día con la hora nueva (${JSON.stringify(await planes(a))})`)
  await ponerVuelo(a, { vuelta: '19:30', cambios: [{ que: 'hora', mitad: 'departure' }] })
  const segundo = await esperaPlan(a, 'vueltaHora', '19:30')
  debe(segundo, `sin pase, el plan de la vuelta no se actualiza al volver a cambiar la hora (${JSON.stringify(await planes(a))})`)
  await ponerVuelo(a, { llegada: '21:40', cambios: [{ que: 'hora', mitad: 'arrival' }] })
  debe(await esperaPlan(a, 'llegadaHora', '21:40'), 'sin pase, el plan de la llegada no se pone al día')
  let alertas = false
  for (let i = 0; i < 24; i++) {
    if (await hayAlerta(a)) alertas = true
    await cierraHoja(a)
    await a.esp(500)
  }
  debe(!alertas, 'sin pase sale la alerta «¿Adaptamos tu primer y tu último día…?»')
  debe(!(await hayBoton(a)), 'sin pase sale el botón «Reorganizar»')
  debe(igual(await foto(a), inicio), 'sin pase, cambiar el vuelo ha movido paradas')
} finally {
  a.cerrar()
}

console.log(`\nPrueba 10S7b U (vuelos): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
