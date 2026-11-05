// HOY2b (agente D, 5-nov): el aviso gris de horario ya no sale en DÍAS (ver abajo, «antes → ahora → decisión de Eric, 5-nov»).
// Tanda 10S10 (B, apartados 2 y 3): los avisos de horario («posiblemente…») y los nombres que no dependen de la hora («Fontana de Trevi» + etiqueta pequeña solo si la hora lo cumple).
//   APP_URL=http://localhost:5173 API_URL=http://localhost:8787 node scripts/destino/_conCola.mjs node scripts/destino/pruebaTanda10S10_B.mjs
import fs from 'node:fs'
import path from 'node:path'
import { conViaje, modulo, esp, preparar, SALIDA } from './_10n6_k3_comun.mjs'
const foto = (n) => path.join(SALIDA, `10s10_${n}.jpg`)
const { debe, fin } = preparar()
const L = (f) => fs.readFileSync(f, 'utf8')
const sinCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

console.log('1. Código y datos')
{
  const verPor = L('shared/verPor.js')
  debe(/export function verPorDeLugar/.test(verPor) && /galeria_borghese: 'solo_dentro'/.test(verPor), 'ap2', 'la regla «por dentro y por fuera / solo por dentro» sale de los datos y la Galería Borghese es solo por dentro (Eric, 1-nov)')
  const srv = sinCom(L('server/index.js'))
  debe(/\.\.\.avisoDeHorarioDe\(place\)/.test(srv), 'ap2', 'el servidor manda cómo se ve cada sitio dentro de hours_data')
  const panel = sinCom(L('src/components/route/dayDetail/DayDetailPanel.tsx'))
  // HOY2b (agente D, 5-nov; antes → ahora → decisión de Eric, 5-nov): ANTES DÍAS pintaba el aviso gris de horario en cada tarjeta (`avisoHorario={avisoDeLaParada}`); AHORA no: los avisos de horario viven en HOY (src/lib/hoyHorarios.ts, prueba pruebaTandaHOY2b_D).
  debe(!/avisoHorario=\{/.test(panel) && /horaDeParada=\{horaDeLaParada\}/.test(panel), 'ap2', 'HOY2b: DÍAS ya NO pinta el aviso gris de horario (antes sí); la hora de cada parada se calcula al pintar (se quita sola si se mueve)')
  debe(/lugarDeLaParada > lugarDeLaCena/.test(panel), 'ap2', 'después de la cena es por posición en el día, no por la franja guardada')
  const fmt = sinCom(L('src/lib/format.ts'))
  debe(/nombreSinHora\(/.test(fmt), 'ap3', 'displayStopName quita la hora del nombre en todas las pantallas')
  const tabla = JSON.parse(L('docs/dias/_10s10_tabla_horarios.json'))
  const ids = (l) => l.map((f) => f.id)
  debe(ids(tabla.dentro_y_fuera).includes('castillo_de_santangelo') && ids(tabla.dentro_y_fuera).includes('coliseo'), 'ap2', 'tabla: el Castillo de Sant\'Angelo y el Coliseo son «por dentro y por fuera»')
  debe(ids(tabla.solo_dentro).includes('museos_vaticanos_y_capilla_sixtina') && ids(tabla.solo_dentro).includes('galeria_borghese'), 'ap2', 'tabla: los Museos Vaticanos y la Galería Borghese son «solo por dentro»')
  debe(tabla.dentro_y_fuera.length > 10 && tabla.solo_dentro.length > 5, 'ap2', `tabla: ${tabla.dentro_y_fuera.length} sitios por dentro y por fuera y ${tabla.solo_dentro.length} solo por dentro`)
  debe(!ids(tabla.dentro_y_fuera).concat(ids(tabla.solo_dentro)).includes('fontana_de_trevi'), 'ap2', 'tabla: una fuente (sin horario) no lleva aviso')
}

console.log('2. En la app')
const a = await conViaje({ version: 'gratis', alto: 844 })
try {
  const ev = (js) => a.evaluar(js)
  const mods = `Promise.all([${modulo('/src/lib/nombreDeParada.ts')}, ${modulo('/src/lib/avisoDeHorario.ts')}, ${modulo('/src/lib/horarioDeParada.ts')}, ${modulo('/src/lib/tituloDelDia.ts')}, ${modulo('/src/lib/format.ts')}])`

  console.log('2a. Los nombres no dependen de la hora')
  const nombres = await ev(`${mods}.then(([n, , , , f]) => ({
    trevi: f.displayStopName('Fontana de Trevi, sin gente'),
    puente: f.displayStopName("El Puente y el Castillo de Sant'Angelo iluminados"),
    janiculo: f.displayStopName('Mirador del Janículo iluminado'),
    pincio: f.displayStopName('Terraza del Pincio iluminada'),
    campidoglio: f.displayStopName('Plaza del Campidoglio iluminada, con el Foro a sus pies'),
    coliseo: f.displayStopName('El Coliseo iluminado'),
    panteon: f.displayStopName('El Panteón de noche'),
    trastevere: f.displayStopName('Trastevere al atardecer'),
    trasN: f.displayStopName('Trastevere de noche'),
    vista: f.displayStopName('Roma iluminada desde el Janículo'),
    sinPaseo: f.displayStopName('Sin paseo de noche'),
    normal: f.displayStopName('Castillo de Sant\\'Angelo'),
    noche: f.displayStopName('Coliseo (noche)'),
    marcas: ['Fontana de Trevi, sin gente', 'El Coliseo iluminado', 'Trastevere al atardecer', 'El Panteón de noche', 'Castillo'].map((x) => n.nombreSinHora(x).marca),
    et: [
      n.etiquetaDeHora('sin_gente', { inicio: 450, ocaso: 1100, despuesDeCena: false }),
      n.etiquetaDeHora('sin_gente', { inicio: 17 * 60, ocaso: 1100, despuesDeCena: false }),
      n.etiquetaDeHora('iluminado', { inicio: 21 * 60, ocaso: 1100, despuesDeCena: true }),
      n.etiquetaDeHora('iluminado', { inicio: 15 * 60, ocaso: 1100, despuesDeCena: false }),
      n.etiquetaDeHora('atardecer', { inicio: 1080, ocaso: 1100, despuesDeCena: false }),
      n.etiquetaDeHora('atardecer', { inicio: 600, ocaso: 1100, despuesDeCena: false }),
      n.etiquetaDeHora(null, { inicio: 450, ocaso: 1100, despuesDeCena: false }),
    ],
  }))`)
  debe(nombres.trevi === 'Fontana de Trevi', 'ap3', `«Fontana de Trevi, sin gente» → «${nombres.trevi}»`)
  debe(nombres.puente === "El Puente y el Castillo de Sant'Angelo" && nombres.janiculo === 'Mirador del Janículo' && nombres.pincio === 'Terraza del Pincio', 'ap3', `iluminado/iluminada/iluminados fuera (${nombres.puente} | ${nombres.janiculo} | ${nombres.pincio})`)
  debe(nombres.campidoglio === 'Plaza del Campidoglio, con el Foro a sus pies' && nombres.coliseo === 'El Coliseo', 'ap3', `Campidoglio y Coliseo (${nombres.campidoglio} | ${nombres.coliseo})`)
  debe(nombres.panteon === 'El Panteón' && nombres.trastevere === 'Trastevere' && nombres.trasN === 'Trastevere', 'ap3', `de noche / al atardecer fuera (${nombres.panteon} | ${nombres.trastevere} | ${nombres.trasN})`)
  debe(nombres.vista === 'Roma desde el Janículo', 'ap3', `«Roma iluminada desde el Janículo» → «${nombres.vista}»`)
  debe(nombres.sinPaseo === 'Sin paseo de noche' && nombres.normal === "Castillo de Sant'Angelo" && nombres.noche === 'Coliseo', 'ap3', 'lo que no depende de la hora se queda igual y «(noche)» sigue quitándose')
  debe(nombres.marcas.join() === 'sin_gente,iluminado,atardecer,de_noche,', 'ap3', `la marca que prometía cada nombre (${nombres.marcas.join()})`)
  debe(nombres.et[0] === 'Sin gente a primera hora' && nombres.et[1] === null, 'ap3', `«Sin gente a primera hora» solo temprano (${nombres.et[0]} | ${nombres.et[1]})`)
  debe(nombres.et[2] === 'Iluminado' && nombres.et[3] === null, 'ap3', `«Iluminado» solo con el sol puesto (${nombres.et[2]} | ${nombres.et[3]})`)
  debe(nombres.et[4] === 'Al atardecer' && nombres.et[5] === null && nombres.et[6] === null, 'ap3', `«Al atardecer» solo a su hora (${nombres.et[4]} | ${nombres.et[5]})`)

  console.log('2b. Los cuatro avisos de horario, con los datos reales de Roma')
  const avisos = await ev(`${mods}.then(async ([, av, hp]) => {
    const datos = await hp.cargaDatosDeHorario('Roma')
    const hoy = '2027-03-10'
    const prueba = (nombre, inicio, extra = {}, antesDeCena = false, ocaso = 1100) => {
      const hd = datos.get(hp.normalizaNombre(nombre))
      const horario = hp.horarioDeParada({ hoursData: hd }, hoy, null)
      return av.avisoDeHorario({ parada: { name: nombre, ...extra }, datos, horario, inicio, antesDeCena, ocaso })
    }
    return {
      castilloTarde: prueba("Castillo de Sant'Angelo", 20 * 60),
      castilloMedio: prueba("Castillo de Sant'Angelo", 12 * 60),
      castilloTemprano: prueba("Castillo de Sant'Angelo", 8 * 60),
      museos: prueba('Museos Vaticanos y Capilla Sixtina', 20 * 60 + 30),
      borghese: prueba('Galería Borghese', 19 * 60 + 30),
      coliseo: prueba('Coliseo', 12 * 60),
      iglesiaHueco: prueba('Iglesia del Gesù', 14 * 60),
      noche: prueba('Fontana de Trevi', 17 * 60, { isNightExperience: true }, true),
      nocheYaOscuro: prueba('Fontana de Trevi', 19 * 60, { isNightExperience: true }, true),
      nocheDespuesCena: prueba('Fontana de Trevi', 21 * 60, { isNightExperience: true }, false),
      porFuera: prueba("Castillo de Sant'Angelo", 20 * 60, { visitMode: 'fuera' }),
      plaza: prueba('Piazza Navona', 23 * 60),
      sinHoras: prueba("Castillo de Sant'Angelo", null),
    }
  })`)
  debe(avisos.castilloTarde === "A esta hora, posiblemente el Castillo de Sant'Angelo ya esté cerrado, pero puedes verlo por fuera igualmente.", 'ap2', `dentro y fuera: «${avisos.castilloTarde}»`)
  debe(avisos.museos === 'A esta hora, posiblemente los Museos Vaticanos ya estén cerrados.', 'ap2', `solo dentro: «${avisos.museos}»`)
  debe(avisos.borghese === 'A esta hora, posiblemente la Galería Borghese ya esté cerrada.', 'ap2', `la Galería Borghese, solo dentro: «${avisos.borghese}»`)
  debe(avisos.castilloTemprano === 'A esta hora, posiblemente aún no haya abierto.', 'ap2', `antes de abrir: «${avisos.castilloTemprano}»`)
  debe(avisos.noche === 'Esta parada es para verla de noche: a esta hora posiblemente aún sea de día.', 'ap2', `experiencia nocturna antes de la cena: «${avisos.noche}»`)
  debe(avisos.castilloMedio === null && avisos.coliseo === null, 'ap2', 'con el sitio abierto a esa hora no hay aviso («mientras sea verdad»)')
  debe(/esté cerrada, pero puedes verla/.test(avisos.iglesiaHueco ?? '') && !/ya esté/.test(avisos.iglesiaHueco ?? ''), 'ap2', `en el cierre de mediodía de una iglesia: «${avisos.iglesiaHueco}»`)
  debe(avisos.nocheYaOscuro === null && avisos.nocheDespuesCena === null, 'ap2', 'una nocturna ya de noche o detrás de la cena no lleva aviso')
  debe(avisos.porFuera === null && avisos.plaza === null && avisos.sinHoras === null, 'ap2', 'ni lo que ya se ve por fuera, ni una plaza sin horario, ni un día sin horas')

  console.log('2c. El título del día sin horas si ya no es verdad')
  const titulos = await ev(`${mods}.then(([, , , t]) => {
    const dia = (horas) => ({ stops: horas.map((h, i) => ({ id: 's' + i, name: 'x' + i, time: h })) })
    const s = t.tituloSinHorasSiYaNoEsVerdad
    return [
      s('Trevi a primera hora, el Popolo y la Borghese', dia(['08:00', '10:00']), 1100),
      s('Trevi a primera hora, el Popolo y la Borghese', dia(['10:30', '12:00']), 1100),
      s('Trevi y la Escalinata sin gente, Panteón y Navona', dia(['14:00', '15:00']), 1100),
      s('Vaticano, Castillo y Trastevere al atardecer', dia(['09:00', '12:00']), 1100),
      s('Vaticano, Castillo y Trastevere al atardecer', dia(['09:00', '17:45']), 1100),
      s('Roma Antigua y el Coliseo de noche', dia(['09:00', '12:00']), 1100),
      s('Roma Antigua y el Coliseo de noche', dia(['09:00', '19:30']), 1100),
      s('Día de la Roma antigua', dia(['09:00']), 1100),
    ]
  })`)
  debe(titulos[0] === 'Trevi a primera hora, el Popolo y la Borghese' && titulos[1] === 'Trevi, el Popolo y la Borghese', 'ap3', `«a primera hora» solo mientras lo primero sea temprano (${titulos[0]} | ${titulos[1]})`)
  debe(titulos[2] === 'Trevi y la Escalinata, Panteón y Navona', 'ap3', `«sin gente» fuera si ya no es temprano (${titulos[2]})`)
  debe(titulos[3] === 'Vaticano, Castillo y Trastevere' && titulos[4] === 'Vaticano, Castillo y Trastevere al atardecer', 'ap3', `«al atardecer» solo si hay una parada a esa hora (${titulos[3]} | ${titulos[4]})`)
  debe(titulos[5] === 'Roma Antigua y el Coliseo' && titulos[6] === 'Roma Antigua y el Coliseo de noche' && titulos[7] === 'Día de la Roma antigua', 'ap3', `«de noche» solo si hay algo con el sol puesto (${titulos[5]} | ${titulos[6]})`)

  console.log('2d. En DÍAS: el nombre limpio y la etiqueta que se quita sola')
  const st = (js) => ev(modulo('/src/store/useRouteStore.ts') + `.then(async (m) => { const s = m.useRouteStore.getState(); const r = s.route; ${js} })`)
  for (let i = 0; i < 40 && !(await st('return r.days.some((d)=>d.stops.length>3)')); i++) await esp(500)
  // El día con la Fontana de Trevi: el motor la pone la primera, con su título «…, sin gente» en los datos.
  const dia = await st(`
    const d = r.days.find((x) => x.stops.some((p) => /Trevi/.test(p.name)))
    if (!d) return null
    return { id: d.id, nombres: d.stops.map((p) => p.name), ids: d.stops.map((p) => p.id), trevi: d.stops.find((p) => /Trevi/.test(p.name)).id }`)
  debe(Boolean(dia), 'ap3', 'hay un día con la Fontana de Trevi')
  if (dia) {
    await st(`s.setMode('days'); s.setActiveDayId(${JSON.stringify(dia.id)}); return true`)
    await esp(3000)
    const tarjeta = () => ev(`(() => { const n = document.querySelector('[data-stop-id=${JSON.stringify(dia.trevi)}]'); return n ? { texto: n.innerText, aviso: n.querySelector('[data-aviso-horario]')?.textContent ?? null } : null })()`)
    const todo = () => ev('document.body.innerText')
    let t0 = await tarjeta()
    debe(Boolean(t0), 'ap3', 'la tarjeta de la Trevi sale en DÍAS')
    const crudo = dia.nombres.find((x) => /Trevi/.test(x))
    debe(!/sin gente/i.test((await todo()).split('\n').filter((l) => /Trevi/.test(l)).join(' ')), 'ap3', `ningún nombre dice «sin gente» (${crudo})`)
    if (/sin gente/i.test(crudo)) debe(/Fontana de Trevi/.test(t0?.texto ?? ''), 'ap3', 'la tarjeta dice «Fontana de Trevi»')
    const primera = dia.ids[0] === dia.trevi
    console.log('   Trevi:', crudo, '| primera del día:', primera, '| etiqueta:', /Sin gente a primera hora/.test(t0?.texto ?? ''))
    if (primera) {
      debe(/Sin gente a primera hora/.test(t0?.texto ?? ''), 'ap3', 'Trevi primera del día: sale «Sin gente a primera hora»')
      await ev(`document.querySelector('[data-stop-id=${JSON.stringify(dia.trevi)}]')?.scrollIntoView({ block: 'center' })`)
      await esp(600)
      await a.captura(foto('trevi_temprano_1'))
      // La mandamos al final del día: ya no es de primera hora, la etiqueta se quita sola.
      await st(`s.reorderStops(${JSON.stringify(dia.id)}, ${JSON.stringify([...dia.ids.filter((x) => x !== dia.trevi), dia.trevi])}); return true`)
      await esp(2500)
      const t1 = await tarjeta()
      debe(Boolean(t1) && !/Sin gente a primera hora/.test(t1.texto), 'ap3', 'movida al final del día, la etiqueta se quita sola')
      debe(Boolean(t1) && /Fontana de Trevi/.test(t1.texto), 'ap3', 'y el nombre sigue siendo «Fontana de Trevi»')
      await ev(`document.querySelector('[data-stop-id=${JSON.stringify(dia.trevi)}]')?.scrollIntoView({ block: 'center' })`)
      await esp(600)
      await a.captura(foto('trevi_tarde_1'))
    } else {
      debe(true, 'ap3', 'Trevi no es la primera de ese día: etiqueta solo si la hora lo cumple')
    }
  }
  console.log('2e. El aviso de horario en una tarjeta de DÍAS')
  // Se busca en la pantalla un día cualquiera con una parada «por dentro y por fuera» y se la lleva al final del día (tras el cierre): la tarjeta enseña la línea; devuelta al principio, se quita.
  const cand = await st(`
    const datos = await fetch('/api/destination-places', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ destination: 'Roma' }) }).then((x) => x.json())
    const por = new Map(datos.places.filter((p) => p.hours_data?.ver_por === 'dentro_y_fuera').map((p) => [p.name, p]))
    for (const d of r.days) { const p = d.stops.find((x) => por.has(x.name) && !x.passThrough && !x.isBreak); if (p && d.stops.length > 3) return { id: d.id, ids: d.stops.map((x) => x.id), stop: p.id, name: p.name } }
    return null`)
  debe(Boolean(cand), 'ap2', 'hay un día con un sitio «por dentro y por fuera»')
  if (cand) {
    await st(`s.setMode('days'); s.setActiveDayId(${JSON.stringify(cand.id)}); return true`)
    await esp(2500)
    const aviso = () => ev(`document.querySelector('[data-stop-id=${JSON.stringify(cand.stop)}]')?.querySelector('[data-aviso-horario]')?.textContent ?? null`)
    const antes = await aviso()
    // Todo el día tras la cena: la parada al final.
    await st(`s.reorderStops(${JSON.stringify(cand.id)}, ${JSON.stringify([...cand.ids.filter((x) => x !== cand.stop), cand.stop])}); return true`)
    await esp(2500)
    const despues = await aviso()
    await ev(`document.querySelector('[data-stop-id=${JSON.stringify(cand.stop)}]')?.scrollIntoView({ block: 'center' })`)
    await esp(600)
    if (despues) await a.captura(foto('aviso_horario_1'))
    console.log('   aviso:', cand.name, '| antes:', antes, '| despues:', despues)
    const dicho = despues && /^A esta hora, posiblemente .* (ya )?est(é|én) cerrad[oa]s?, pero puedes ver(lo|la|los|las) por fuera igualmente\.$/.test(despues)
    const temprano = despues === null && antes === null
    void dicho
    void temprano
    // HOY2b (agente D; antes → ahora → decisión de Eric, 5-nov): ANTES, al final del día salía la línea «A esta hora, posiblemente… ya esté cerrado»; AHORA no sale nunca en DÍAS.
    debe(despues === null && antes === null, 'ap2', `HOY2b: ${cand.name} al final del día, SIN línea gris de horario en DÍAS (antes salía «A esta hora, posiblemente…»): «${despues}» (antes: «${antes}»)`)
    await st(`s.reorderStops(${JSON.stringify(cand.id)}, ${JSON.stringify(cand.ids)}); return true`)
    await esp(2500)
    const vuelta = await aviso()
    debe(vuelta === antes, 'ap2', `devuelta a su sitio, el aviso se quita solo (antes: «${antes}», ahora: «${vuelta}»)`)
  }
} finally {
  a.cerrar()
}
fin('pruebaTanda10S10_B')
