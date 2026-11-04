// La prueba de la Tanda 10S7c (agente Y, el cliente): el primer y el último día se adaptan a los vuelos con el modo nuevo del motor, el aviso de los imprescindibles con [Pasarlo a otro día], el Deshacer
// y el plan de llegada que solo dice lo que de verdad ha pasado.
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S7c_Y.mjs
// Un solo Chrome de prueba. Necesita el Vite estable y la API ya encendidos con el código nuevo (la API con `/api/adaptar-dia-vuelo` de X; el Vite, reiniciado si se arrancó antes).
// Casos: llegada 16:30 → alerta → [Sí, adaptarlos] → el día 1 sin nada antes de que llegues (mismas paradas entre lo que se queda y «Si te sobra tiempo»), el día 2 y el 3 sin tocar; el imprescindible que
// no cabe (el Vaticano) con su aviso y [Pasarlo a otro día] (que lo pone el primero del día elegido); Deshacer; la salida el último día sin día de vuelta (el Coliseo marcado, el día acaba con tiempo para
// el aeropuerto); y el texto del plan de llegada (nunca «pasa al día 2» si no ha pasado).
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
  const lib = leer('src/lib/adaptarVuelos.ts')
  debe(lib.includes('/api/adaptar-dia-vuelo'), 'adaptarVuelos.ts no usa el modo nuevo del motor (/api/adaptar-dia-vuelo)')
  debe(/adaptarDiaConElMotor\(route, day, \{ desde, hasta \}\)/.test(lib), 'adaptarUnDia no pide el día al motor')
  debe(lib.includes('recortarAlVuelo(day, { desde, hasta })'), 'ya no queda el recorte como respaldo si el motor no responde')
  debe(!/regenerateRouteForDates|rehacerDiasSinTocar\(null\)/.test(lib), 'adaptarVuelos.ts rehace la ruta entera')
  const aviso = leer('src/components/reorganizar/AvisoNoCabe.tsx')
  debe(aviso.includes('Pasarlo a otro día') && aviso.includes('no caben') && aviso.includes('no cabe'), 'el aviso no lleva «no cabe» y [Pasarlo a otro día]')
  debe(leer('src/components/reorganizar/ReorganizarHost.tsx').includes('<AvisoNoCabe />'), 'el aviso no está montado en ReorganizarHost')
  debe(leer('src/lib/resumenDeVuelo.ts').includes('planLlegadaVeraz(route)'), 'la hoja del resumen no usa el plan de llegada veraz')
}

const store = "import('/src/store/useRouteStore.ts').then((m) => m.useRouteStore)"
const s = (cuerpo) => `${store}.then(async (R) => { const st = () => R.getState(); ${cuerpo} })`
const antes = "try{localStorage.setItem('trazo:moneda-pase','EUR')}catch(x){}; try{sessionStorage.removeItem('trazo:version')}catch(x){}"
const minutos = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

async function abrir(version) {
  const a = await abrirApp(BASE, { ruta: `/?cuentas=off&logros=on&logrosDemo=1&version=${version}&apertura=0`, antes, ancho: 390, alto: 844 })
  for (let i = 0; i < 120 && !(await a.evaluar("typeof window.__rutaPrueba === 'function'")); i++) await a.esp(500)
  await a.evaluar('window.__rutaPrueba().then(() => true)')
  for (let i = 0; i < 90 && !(await a.evaluar(s('return Boolean(st().route)'))); i++) await a.esp(1000)
  await a.esp(3000)
  await a.evaluar(s("st().setMode('days'); st().setActiveDayId(st().route.days[0].id); return true"))
  await a.esp(2000)
  for (let i = 0; i < 6; i++) {
    const hecho = await a.evaluar("(() => { const h = Array.from(document.querySelectorAll('[role=\"dialog\"]')).find((x) => /HEMOS PREPARADO|Hemos preparado/.test(x.innerText || '')); if (!h) return true; const b = Array.from(h.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Ok|Genial)$/i.test((x.innerText || '').trim())); b?.click(); return false })()")
    if (hecho) break
    await a.esp(700)
  }
  await a.esp(1000)
  return a
}

const foto = (a) => a.evaluar(s('return JSON.stringify(st().route.days.map((d) => ({ id: d.id, n: d.dayNumber, ret: Boolean(d.isReturnLeg), stops: d.stops.map((x) => ({ id: x.id, name: x.name, t: x.time, dur: x.durationMinutes, arr: Boolean(x.isArrival) })), spare: (d.spareStops || []).map((x) => x.id), meals: d.meals.map((m) => m.mealTime + "@" + m.time) })))')).then((t) => JSON.parse(t))
const hayAlerta = (a) => a.evaluar("Boolean(document.querySelector('[data-alerta-adaptar]'))")
const igual = (x, y) => JSON.stringify(x) === JSON.stringify(y)
const reiniciar = (a) => a.evaluar("import('/src/store/useReorganizarStore.ts').then((m) => { m.useReorganizarStore.getState().reiniciar(); return true })")
const cierraHoja = (a) => a.evaluar("(() => { const h = document.querySelector('[data-hoja=\"resumen-vuelo\"]'); if (!h) return false; const b = Array.from(h.parentElement.querySelectorAll('button')).find((x) => /De acuerdo/.test(x.innerText || '')); b?.click(); return true })()")
const ponerVuelo = (a, { llegada, vuelta, cambios }) =>
  a.evaluar(s(`${llegada !== undefined ? `st().setArrivalFlightTime(${JSON.stringify(llegada)});` : ''} ${vuelta !== undefined ? `st().setDepartureFlightTime(${JSON.stringify(vuelta)});` : ''} const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); for (const c of ${JSON.stringify(cambios)}) m.alCambiarElVuelo(c); return true`))
async function esperaAlerta(a, segundos = 70) {
  for (let i = 0; i < segundos * 2; i++) {
    if (await hayAlerta(a)) return true
    await cierraHoja(a)
    await a.esp(500)
  }
  return false
}
const noCaben = (a) => a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-no-cabe]')).map((e) => ({ id: e.getAttribute('data-no-cabe'), texto: e.querySelector('[data-no-cabe-texto]').innerText, boton: Boolean(e.querySelector('[data-pasar-otro-dia]')) })))").then(JSON.parse)
const franja = (a) => a.evaluar("(() => { const t = Array.from(document.querySelectorAll('p')).find((p) => /Hemos adaptado/.test(p.textContent || '')); return t ? t.parentElement.innerText : '' })()")
const pulsaDeshacer = (a) => a.evaluar("(Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Deshacer')).click(); true")

let a = await abrir('completa')
try {
  const inicio = await foto(a)
  const ciudad = inicio.filter((d) => !d.ret)
  debe(ciudad.length >= 3, `el viaje de prueba tiene pocos días de ciudad (${ciudad.length})`)
  const dia1 = ciudad[0]

  // ── 1. Llegada a las 16:30: alerta → Sí → el día 1 adaptado ───────────────────────────────────────────────────────────────────────────────────
  await ponerVuelo(a, { llegada: '16:30', cambios: [{ que: 'hora', mitad: 'arrival' }] })
  const salio = await esperaAlerta(a)
  debe(salio, 'con pase, al poner la llegada a las 16:30 no sale la alerta «¿Adaptamos tu primer y tu último día a tus vuelos?»')
  await a.captura(path.join(SALIDA, '10s7c_vuelos_1_alerta.jpg'))
  debe(igual(await foto(a), inicio), 'antes de contestar la alerta ya se ha movido alguna parada')
  if (salio) {
    await a.evaluar("document.querySelector('[data-adaptar-si]').click(); true")
    let f = ''
    for (let i = 0; i < 30 && !/Hemos adaptado/.test(f); i++) {
      await a.esp(400)
      f = await franja(a)
    }
    debe(/Hemos adaptado tus días a tus vuelos/.test(f) && /Deshacer/.test(f), `no sale la franja «Hemos adaptado tus días a tus vuelos» con [Deshacer]: «${f}»`)
    const despues = await foto(a)
    const d1 = despues.find((d) => d.n === dia1.n)
    // El día 1 empieza después de la llegada (16:30 + lo que tarda al centro): nada antes de las 17:00.
    const antesDeLlegar = d1.stops.filter((x) => !x.arr && minutos(x.t) !== null && minutos(x.t) < 17 * 60)
    debe(antesDeLlegar.length === 0, `el día 1 deja paradas antes de las 17:00 con la llegada a las 16:30: ${JSON.stringify(antesDeLlegar.map((x) => `${x.name}@${x.t}`))}`)
    debe(d1.stops.length >= 1, 'el día 1 se ha quedado sin ninguna parada')
    // Mismas paradas: lo que se queda + lo que pasa a «Si te sobra tiempo» = lo que había (nunca se pierde ni se añade una).
    const antes1 = new Set(dia1.stops.map((x) => x.id))
    const ahora1 = new Set([...d1.stops.map((x) => x.id), ...d1.spare])
    // LL parte 2 (Eric, 4-nov). Antes: «Sí, adaptarlos» recortaba el día 1 (mismas paradas, lo que no cabía a «Si te sobra tiempo»). Ahora: el motor monta el día de llegada de las franjas (paradas ligeras cerca del alojamiento) y la Roma antigua pasa al día 2; el día 1 no lleva ningún grande.
    debe(!d1.stops.some((x) => /Coliseo|Museos Vaticanos|Galer[ií]a Borghese/i.test(x.name)), 'con la llegada a las 16:30 el día 1 no debe llevar un imprescindible grande (Coliseo, Museos Vaticanos, Galería Borghese)')
    // Los demás días, sin tocar.
    // (Antes: los demás días, sin tocar. Ahora el reparto puede correr los días: el día grande pasa al día 2.)
    debe(despues.length === inicio.length, 'adaptar no debe quitar ni añadir días')
    // Horas a 5/10 min y ordenadas.
    const horas = d1.stops.map((x) => minutos(x.t)).filter((m) => m !== null)
    debe(horas.every((h, i) => i === 0 || h >= horas[i - 1]), `las horas del día 1 no van en orden: ${JSON.stringify(d1.stops.map((x) => x.t))}`)
    await a.captura(path.join(SALIDA, '10s7c_vuelos_3_dia1_adaptado.jpg'))

    // ── 2. El imprescindible que no cabe, con su aviso y [Pasarlo a otro día] ──────────────────────────────────────────────────────────────────
    const avisos = await noCaben(a)
    const vaticano = avisos.find((x) => /Vaticano/i.test(x.texto))
    // (Antes: «los Museos Vaticanos no caben el sábado» + [Pasarlo a otro día]. Ahora el grande pasa al día 2 en vez de recortarse: no hay aviso de «no cabe».)
    debe(!vaticano, `no debe salir el aviso de «no cabe» de los Museos Vaticanos (avisos: ${JSON.stringify(avisos)})`)
    if (vaticano) {
      debe(/no caben? el sábado\.$/.test(vaticano.texto), `el aviso no dice «… no cabe el sábado.»: «${vaticano.texto}»`)
      debe(vaticano.boton, 'el aviso no lleva el botón [Pasarlo a otro día]')
      debe(d1.spare.includes(vaticano.id), 'el imprescindible que no cabe no está en «Si te sobra tiempo» (se habría perdido)')
      await a.captura(path.join(SALIDA, '10s7c_vuelos_2_franja_aviso.jpg'))

      // [Pasarlo a otro día] → la hoja de siempre → el imprescindible va el PRIMERO del día elegido.
      await a.evaluar("document.querySelector('[data-pasar-otro-dia]').click(); true")
      await a.esp(900)
      const hoja = await a.evaluar("Boolean(document.querySelector('[data-hoja=\"pasar-imprescindible\"]'))")
      debe(hoja, '[Pasarlo a otro día] no abre la hoja de elegir día')
      if (hoja) {
        const filas = await a.evaluar("JSON.stringify(Array.from(document.querySelectorAll('[data-hoja=\"pasar-imprescindible\"] [data-dia-id]')).map((b) => ({ id: b.getAttribute('data-dia-id'), bloqueado: b.hasAttribute('data-bloqueado') })))").then(JSON.parse)
        debe(filas.find((x) => x.id === dia1.id)?.bloqueado === true, 'en la hoja, el día donde no cabe no sale apagado')
        const destino = ciudad[1]
        await a.evaluar(`document.querySelector('[data-hoja="pasar-imprescindible"] [data-dia-id="${destino.id}"]').click(); true`)
        await a.esp(300)
        await a.evaluar("(Array.from(document.querySelectorAll('[data-hoja=\"pasar-imprescindible\"] button')).find((b) => /^Pasar /.test(b.textContent.trim()))).click(); true")
        await a.esp(1200)
        const trasPasar = await foto(a)
        const dD = trasPasar.find((d) => d.n === destino.n)
        debe(dD.stops[0]?.id === vaticano.id, `el imprescindible no queda el primero del día elegido (primero: ${dD.stops[0]?.name})`)
        debe(!trasPasar.find((d) => d.n === dia1.n).spare.includes(vaticano.id), 'el imprescindible sigue en «Si te sobra tiempo» del día 1 tras pasarlo')
        debe((await noCaben(a)).every((x) => x.id !== vaticano.id), 'el aviso del imprescindible sigue tras pasarlo a otro día')
        // [Deshacer] de pasarlo: vuelve a «Si te sobra tiempo» y el aviso reaparece (no cambia el resto de la adaptación).
        await pulsaDeshacer(a)
        await a.esp(1200)
        debe(igual(await foto(a), despues), '[Deshacer] de pasarlo a otro día no deja el día como estaba tras adaptar')
      }
    }

    // ── 3. Deshacer la adaptación lo deja TODO como estaba ───────────────────────────────────────────────────────────────────────────────────
    await reiniciar(a)
    await a.evaluar(s('return true'))
    // (la franja pudo irse sola: se repite la adaptación para pulsar su [Deshacer])
    await a.evaluar(s("st().setMode('days'); return true"))
    await a.evaluar("import('/src/store/useAddFlowStore.ts').then((m) => { m.useAddFlowStore.getState().dismissToast(); return true })")
    const base = await foto(a)
    await a.evaluar(s("const m = await import('/src/lib/adaptarVuelos.ts'); m.olvidarRespuestasDelMotor(); const p = await m.propuestaDeVuelos(st().route, st().reservations); const r = await import('/src/store/useReorganizarStore.ts'); r.useReorganizarStore.getState().proponerVuelos(p); return true"))
    await esperaAlerta(a, 20)
    await a.evaluar("document.querySelector('[data-adaptar-si]')?.click(); true")
    await a.esp(1500)
    const f2 = await franja(a)
    if (/Hemos adaptado/.test(f2)) {
      await pulsaDeshacer(a)
      await a.esp(1200)
      debe(igual(await foto(a), inicio), '[Deshacer] de la franja no deja TODO como estaba antes de adaptar')
      debe((await noCaben(a)).length === 0, 'tras [Deshacer] sigue el aviso de «no cabe»')
    } else {
      debe(igual(await foto(a), base), 'la adaptación repetida cambia algo con los días ya adaptados')
    }
  }

  // ── 4. El plan de llegada dice lo que de verdad ha pasado ─────────────────────────────────────────────────────────────────────────────────────
  await reiniciar(a)
  const veraz = await a.evaluar(s(`
    const m = await import('/src/lib/planLlegadaVeraz.ts')
    const r = st().route
    const dos = r.days.find((d) => d.dayNumber === 2)
    const sobra = r.days.find((d) => d.dayNumber === 1)
    const plan = {
      pasa_al_dia_2: true,
      dia_caido: { id: 'D9', nombre: 'Otro', motivo: 'x' },
      resumen: [
        { tipo: 'llegada', dayNumber: 1, texto: 'El {dia:1} es tu llegada.' },
        { tipo: 'dia_corrido', dayNumber: 2, dia_id: 'D1xx', texto: 'Como llegas por la tarde, la Roma antigua pasa al {dia:2}.' },
        { tipo: 'dia_caido', dia_id: dos.curatedId, texto: 'La Roma antigua no cabe en tu viaje.' },
      ],
      avisos: [{ tipo: 'sitio_en_si_te_sobra', lugar: 'Nada', dayNumber: 1, texto: 'Nada lo tienes en «Si te sobra tiempo».' }],
      dejado_fuera: [{ lugar: 'Nada', dia: 1 }],
    }
    const falsa = m.planLlegadaVeraz({ ...r, planLlegada: plan })
    const real = m.planLlegadaVeraz({ ...r, planLlegada: { ...plan, resumen: [{ tipo: 'dia_corrido', dayNumber: 2, dia_id: dos.curatedId, texto: 'Como llegas por la tarde, X pasa al {dia:2}.' }, { tipo: 'dia_caido', dia_id: 'D9', texto: 'Algo no cabe en tu viaje.' }] } })
    const hoja = (await import('/src/lib/resumenDeVuelo.ts')).construirResumen({ route: { ...r, planLlegada: plan }, cambios: [{ que: 'hora', mitad: 'arrival' }], mantenidos: [] })
    return JSON.stringify({ falsa: { corrido: falsa.resumen.some((x) => x.tipo === 'dia_corrido'), caido: falsa.resumen.some((x) => x.tipo === 'dia_caido'), llegada: falsa.resumen.some((x) => x.tipo === 'llegada'), pasa: falsa.pasa_al_dia_2, dc: falsa.dia_caido, avisos: falsa.avisos.length },
      real: { corrido: real.resumen.some((x) => x.tipo === 'dia_corrido'), caido: real.resumen.some((x) => x.tipo === 'dia_caido'), pasa: real.pasa_al_dia_2, dc: Boolean(real.dia_caido) }, hoja: hoja.map((x) => x.texto) })
  `)).then(JSON.parse)
  debe(veraz.falsa.llegada === true, 'el plan veraz quita también la frase de la llegada (que es verdad)')
  debe(veraz.falsa.corrido === false, 'el plan dice «pasa al día 2» aunque el día 2 de la ruta no sea ese día')
  debe(veraz.falsa.caido === false, 'el plan dice «no cabe en tu viaje» de un día que sí está en la ruta')
  debe(veraz.falsa.pasa === false && veraz.falsa.dc === null, 'pasa_al_dia_2 o dia_caido se quedan puestos sin cumplirse')
  debe(veraz.falsa.avisos === 0, 'el aviso de «Si te sobra tiempo» sale sin estar el sitio ahí')
  debe(veraz.real.corrido === true && veraz.real.pasa === true, 'el plan quita «pasa al día 2» aunque el día 2 de la ruta SÍ es ese día')
  debe(veraz.real.caido === true && veraz.real.dc === true, 'el plan quita «no cabe en tu viaje» de un día que de verdad no está en la ruta')
  debe(!veraz.hoja.some((t) => /pasa al/.test(t)) && !veraz.hoja.some((t) => /no cabe en tu viaje/.test(t)), `la hoja del resumen dice algo que no ha pasado: ${JSON.stringify(veraz.hoja)}`)

  // El plan real que dio el motor con la llegada de ahora: lo que sale en la hoja es verdad.
  const real2 = await a.evaluar(s(`
    const r = st().route
    const hoja = (await import('/src/lib/resumenDeVuelo.ts')).construirResumen({ route: r, cambios: [{ que: 'hora', mitad: 'arrival' }], mantenidos: [] })
    const dos = r.days.find((d) => d.dayNumber === 2)
    const corridoDelMotor = (r.planLlegada?.resumen || []).filter((x) => x.tipo === 'dia_corrido')
    return JSON.stringify({ textos: hoja.map((x) => x.texto), corridoDelMotor: corridoDelMotor.length, dosCurado: dos.curatedId, ids: corridoDelMotor.map((x) => x.dia_id) })
  `)).then(JSON.parse)
  const dicePasa = real2.textos.some((t) => /pasa al/.test(t))
  debe(!dicePasa || real2.ids.includes(real2.dosCurado), `la hoja de verdad dice «pasa al día 2» y el día 2 no es ese día: ${JSON.stringify(real2)}`)
} finally {
  a.cerrar()
}

// ── 5. La salida el último día, sin día de vuelta ────────────────────────────────────────────────────────────────────────────────────────────────
a = await abrir('completa')
try {
  await a.evaluar(s("const vuelta = st().route.days.find((d) => d.isReturnLeg); if (vuelta) st().deleteDay(vuelta.id); return true"))
  await a.esp(1200)
  const inicio = await foto(a)
  debe(!inicio.some((d) => d.ret), 'no se ha podido quitar el día de vuelta para la prueba')
  const ciudad = inicio.filter((d) => !d.ret)
  const ultimo = ciudad[ciudad.length - 1]
  await ponerVuelo(a, { vuelta: '15:00', cambios: [{ que: 'hora', mitad: 'departure' }] })
  const salio = await esperaAlerta(a)
  debe(salio, 'con la salida a las 15:00 el último día no sale la alerta')
  if (salio) {
    await a.evaluar("document.querySelector('[data-adaptar-si]').click(); true")
    await a.esp(2500)
    const despues = await foto(a)
    const du = despues.find((d) => d.n === ultimo.n)
    const finDelDia = Math.max(...du.stops.map((x) => (minutos(x.t) ?? 0) + (x.dur || 0)))
    // A las 15:00 sale el vuelo: al aeropuerto hay que llegar con tiempo (al menos una hora antes de salir de la ciudad).
    debe(finDelDia <= 15 * 60 - 60, `el último día acaba a las ${Math.floor(finDelDia / 60)}:${String(finDelDia % 60).padStart(2, '0')}: no deja tiempo para el aeropuerto (salida 15:00)`)
    const antesU = new Set(ultimo.stops.map((x) => x.id))
    const ahoraU = new Set([...du.stops.map((x) => x.id), ...du.spare])
    debe(antesU.size === ahoraU.size && [...antesU].every((id) => ahoraU.has(id)), 'el último día ha perdido o añadido paradas')
    debe(despues.filter((d) => d.n !== ultimo.n).every((d) => igual(d, inicio.find((o) => o.n === d.n))), 'la salida ha tocado otro día que el último')
    // Con una salida muy temprana, el Coliseo (imprescindible del último día) no cabe: su aviso con [Pasarlo a otro día].
    await pulsaDeshacer(a).catch(() => {})
    await a.esp(1000)
    await reiniciar(a)
    await ponerVuelo(a, { vuelta: '10:30', cambios: [{ que: 'hora', mitad: 'departure' }] })
    if (await esperaAlerta(a)) {
      await a.evaluar("document.querySelector('[data-adaptar-si]').click(); true")
      await a.esp(2500)
      const avisos = await noCaben(a)
      const coliseo = avisos.find((x) => /Coliseo/i.test(x.texto))
      debe(Boolean(coliseo), `con la salida a las 10:30 no sale el aviso «El Coliseo no cabe…» (avisos: ${JSON.stringify(avisos)})`)
      if (coliseo) {
        debe(/^El Coliseo no cabe el lunes\.$/.test(coliseo.texto) && coliseo.boton, `el aviso del Coliseo no dice «El Coliseo no cabe el lunes.» con [Pasarlo a otro día]: «${coliseo.texto}»`)
        await a.captura(path.join(SALIDA, '10s7c_vuelos_4_coliseo_aviso.jpg'))
      }
    } else debe(false, 'con la salida a las 10:30 no sale la alerta')
  }
} finally {
  a.cerrar()
}

console.log(`\nPrueba 10S7c Y (el cliente): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
process.exit(fallos.length ? 1 : 0)
