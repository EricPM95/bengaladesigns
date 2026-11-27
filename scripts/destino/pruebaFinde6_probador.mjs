// FINDE paso 6. Dos modos, un solo Chrome cada vez, por la cola (BelowNormal). Ninguna petición a Supabase: solo la API del motor y datos en memoria.
//   MODO «probador» (por defecto): /admin/reorganizar con el ÚLTIMO día (vuelta) a 9:00, 15:30 y 17:30, en Roma y en Lanzarote (coche), ANTES y DESPUÉS de Reorganizar.
//     APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaFinde6_probador.mjs [Roma|Lanzarote] [sinCapturas]
//   MODO «dias»: (c) el billete (dentro de la tarjeta del día) y el alojamiento (V24: encima del primer día de la estancia) en DÍAS, con los mismos datos que RESERVAS (V62).
//     APP_URL=http://localhost:5173 node scripts/destino/_conCola.mjs node scripts/destino/pruebaFinde6_probador.mjs dias [Roma|Lanzarote] [sinCapturas]
// Capturas: docs/dias/FINDE_capturas/paso6_*.jpg
import fs from 'node:fs'
import path from 'node:path'
import { abrirApp } from './_enLaApp.mjs'

const CAP = path.resolve('docs/dias/FINDE_capturas')
fs.mkdirSync(CAP, { recursive: true })
const args = process.argv.slice(2)
const MODO = args[0] === 'dias' ? 'dias' : 'probador'
const resto = args.filter((x) => x !== 'dias')
const destinos = resto.find((x) => x === 'Roma' || x === 'Lanzarote') ? [resto.find((x) => x === 'Roma' || x === 'Lanzarote')] : ['Roma', 'Lanzarote']
const conCapturas = !args.includes('sinCapturas')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const SALIDAS = ['09:00', '15:30', '17:30']

const fallos = []
let comprobaciones = 0
const debe = (cond, caso, texto) => {
  comprobaciones++
  if (!cond) fallos.push({ caso, texto })
  console.log(`  ${cond ? 'ok ' : 'MAL'} ${texto}`)
}
const resumen = []

/* ───────────────────────── MODO probador ───────────────────────── */
async function modoProbador() {
  const a = await abrirApp(BASE, {
    ruta: '/admin/reorganizar?logrosDemo=1',
    ancho: 1280,
    alto: 1600,
    sinEsperarRuta: true,
    antes: `const f0 = window.fetch.bind(window); window.fetch = (u, o) => (String(u && u.url ? u.url : u).includes('/api/admin/inicio') ? Promise.resolve(new Response(JSON.stringify({ ok: true, reportes_nuevos: 0, fotos_por_aprobar: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })) : f0(u, o))`,
  })
  try {
    for (const destino of destinos) {
      for (const salida of SALIDAS) {
        const caso = `${destino} salida ${salida}`
        console.log(`\n${caso}`)
        await a.cdp('Page.navigate', { url: `${BASE}/admin/reorganizar?logrosDemo=1&destino=${destino}&dias=4&llegada=14:00&salida=${salida}&probar=1` })
        let linea = ''
        let error = ''
        for (let i = 0; i < 300; i++) {
          await a.esp(1000)
          linea = await a.evaluar("document.querySelector('[data-probador=\"linea-del-motor\"]')?.innerText ?? ''").catch(() => '')
          error = await a.evaluar("document.querySelector('[data-probador=\"error\"]')?.innerText ?? ''").catch(() => '')
          if (error || linea.length > 10) break
        }
        await a.esp(2500)
        debe(!error, caso, `el probador no da error ${error}`)
        debe(linea.length > 10, caso, `la línea del motor sale: «${linea.slice(0, 160)}»`)
        debe(new RegExp(`Vuelta a las ${salida}`).test(linea), caso, `la línea dice la hora de la vuelta («Vuelta a las ${salida}»)`)
        const info = await a.evaluar(`(() => {
          const fila = document.querySelector('[data-probador-fila="ultimo"]')
          if (!fila) return null
          const t = (s) => fila.querySelector('[data-probador="' + s + '"]')
          const txt = (e) => (e ? e.innerText.replace(/\\s+/g, ' ').trim() : '')
          return { antes: txt(t('antes')), despues: txt(t('despues')), nAntes: t('antes') ? t('antes').querySelectorAll('[data-probador-dia]').length : 0, nDespues: t('despues') ? t('despues').querySelectorAll('[data-probador-dia]').length : 0, aviso: document.body.innerText.includes('Algo ha ido mal'), billete: Boolean(t('despues') && t('despues').querySelector('[data-billete="vuelta"]')) }
        })()`)
        debe(Boolean(info) && info.nAntes === 1 && info.nDespues === 1, caso, 'el último día sale ANTES y DESPUÉS (una tarjeta cada uno)')
        if (info) {
          debe(!info.aviso, caso, 'ninguna pieza cae en «Algo ha ido mal»')
          const d = info.despues
          debe(new RegExp(salida.replace(':', '[:.]')).test(d), caso, `DESPUÉS: la tarjeta del último día dice la hora del vuelo (${salida})`)
          debe(d.length > 80, caso, 'DESPUÉS: el último día no sale vacío')
          debe(info.billete, caso, 'DESPUÉS: el billete de la vuelta está DENTRO de la tarjeta del último día (data-billete=vuelta)')
          debe(/Hoy vuelves a casa|Sal de casa|Sales del|Fin del viaje/i.test(d), caso, 'DESPUÉS: sale «Hoy vuelves a casa» o el cierre del viaje')
          debe(/Aún no sabemos a qué hora sale tu vuelo/.test(info.antes), caso, 'ANTES (sin vuelos): pide el vuelo («Aún no sabemos a qué hora sale tu vuelo»)')
          // El día de vuelta con vuelo no puede pedir el vuelo ni sacar «Cena» después del vuelo.
          debe(!/Aún no sabemos a qué hora sale tu vuelo/.test(d), caso, 'DESPUÉS: ya no pide el vuelo')
          debe(!/Hora de cenar/.test(d), caso, 'DESPUÉS: el día de vuelta no lleva «Hora de cenar» (el vuelo sale antes de las 21:00)')
          if (/sin comida/.test(linea)) debe(!/Hora de comer/.test(d), caso, 'DESPUÉS: si el motor dice «mañana sin comida», el día no lleva «Hora de comer»')
          resumen.push({ caso, linea, antes: info.antes.slice(0, 700), despues: info.despues.slice(0, 1100) })
        }
        if (conCapturas) {
          await a.evaluar("(() => { const f = document.querySelector('[data-probador-fila=\"ultimo\"]'); if (f) f.scrollIntoView({ block: 'start' }); return true })()")
          await a.esp(1200)
          await a.captura(path.join(CAP, `paso6_${destino.toLowerCase()}_ultimo_${salida.replace(':', '')}.jpg`))
        }
      }
    }
  } finally {
    a.cerrar()
  }
}

/* ───────────────────────── MODO dias ───────────────────────── */
async function modoDias() {
  const R = "(await import('/src/store/useRouteStore.ts')).useRouteStore"
  const B = "(await import('/src/store/useBilleteStore.ts')).useBilleteStore"
  const ANTES = fs.readFileSync('scripts/destino/pruebaV43.mjs', 'utf8').match(/const ANTES = `([\s\S]*?)`/)[1]
  const QR = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="#fff"/><path fill="#111" d="M1 1h7v7H1zM13 1h7v7h-7zM1 13h7v7H1z"/></svg>')}`
  const DATOS = {
    Roma: { llegada: { arrivalFlightTime: '11:15', arrivalCodigo: 'VY6102', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '08:35', arrivalPointId: 'fco' }, vuelta: { departureFlightTime: '17:30', departureCodigo: 'VY6103', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '19:50', departurePointId: 'fco' }, hotel: 'Hotel Quirinale', dir: 'Via del Quirinale 7, Roma', billeteIda: 'M1ROMA' },
    Lanzarote: { llegada: { arrivalFlightTime: '09:30', arrivalCodigo: 'VY3920', arrivalCompania: 'Vueling', arrivalOtroPunto: 'Barcelona (El Prat)', arrivalOtraHora: '07:30', arrivalPointId: 'ace' }, vuelta: { departureFlightTime: '15:30', departureCodigo: 'VY3921', departureCompania: 'Vueling', departureOtroPunto: 'Barcelona (El Prat)', departureOtraHora: '19:00', departurePointId: 'ace' }, hotel: 'The Colors House', dir: 'Calle Las Palmeras 4, Costa Teguise', billeteIda: 'M1ACE' },
  }
  for (const destino of destinos) {
    const lanza = destino === 'Lanzarote'
    const D = DATOS[destino]
    console.log(`\n${destino}: billete y alojamiento en DÍAS y RESERVAS`)
    const a = await abrirApp(BASE, { ruta: '/?cuentas=off&logros=off&apertura=0&hoy2=on&version=pago', antes: ANTES, ancho: 390, alto: 900 })
    const ev = (e) => a.evaluar('(async () => (' + e + '))()')
    try {
      for (let i = 0; i < 80 && !(await a.evaluar(`typeof window.${lanza ? '__rutaLanzarote' : '__rutaPrueba'} === 'function'`).catch(() => false)); i++) await a.esp(500)
      await a.evaluar(lanza ? "window.__rutaLanzarote({ zona: 'costa_teguise', coche: 'alquiler', hoy: '2026-11-08' }).then(() => true)" : 'window.__rutaPrueba().then(() => true)')
      for (let i = 0; i < 300 && !(await ev(`${R}.getState().route ? true : false`).catch(() => false)); i++) await a.esp(1000)
      await a.esp(2500)
      for (let i = 0; i < 4; i++) {
        const h = await a.evaluar("(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(Siguiente|Entendido|Vale|Cerrar)$/.test((x.textContent || '').trim())); if (!b) return false; b.click(); return true })()")
        if (!h) break
        await a.esp(600)
      }
      const ids = await a.evaluar(`(async () => {
        const st = ${R}
        try { sessionStorage.clear() } catch {}
        const r = JSON.parse(JSON.stringify(st.getState().route))
        Object.assign(r, ${JSON.stringify({ ...D.llegada, ...D.vuelta, accommodationAddress: D.dir })})
        const seg = (await import('/src/lib/tuAlojamiento.ts')).estanciasDelViaje(r)[0]
        st.setState({ route: r, reservations: [], screen: 'route', accommodationSelections: seg ? { [seg.segmentDayId]: { name: ${JSON.stringify(D.hotel)}, precio: null } } : {} })
        const tid = (await import('/src/store/useSyncStore.ts')).useSyncStore.getState().activeTripId
        try { localStorage.removeItem('trazo:billete:v1:' + (tid ?? 'local')) } catch {}
        const b = ${B}
        b.setState({ datos: {}, tripId: tid ?? null })
        const qr = { texto: 'M1', formato: 'qr', imagen: null, dibujo: ${JSON.stringify(QR)} }
        b.getState().poner(tid ?? null, 'arrival', { horaRoma: r.arrivalFlightTime, localizador: 'K7M2QX', terminal: 'T1', asiento: '14C', coche: null, codigo: qr, dueno: null })
        b.getState().poner(tid ?? null, 'departure', { horaRoma: r.departureFlightTime, localizador: 'Q9L4ZP', terminal: 'T3', asiento: '22F', coche: null, codigo: qr, dueno: null })
        const dias = r.days
        return { primero: dias[0].id, ultimo: dias[dias.length - 1].id, nDias: dias.length, ultimoEsVuelta: Boolean(dias[dias.length - 1].isReturnLeg), seg: seg ? seg.segmentDayId : null }
      })()`)
      debe(Boolean(ids && ids.primero), destino, `el viaje de prueba está montado (${ids?.nDias} días, el último ${ids?.ultimoEsVuelta ? 'es' : 'no es'} de vuelta)`)
      const abrirDia = async (id) => {
        await a.evaluar(`(async () => { const st = ${R}; st.getState().setActiveDayId(${JSON.stringify(id)}); st.getState().setMode('days'); return true })()`)
        await a.esp(3000)
      }
      const texto = () => a.evaluar("document.body.innerText.replace(/\\s+/g, ' ')")
      // Primer día: el alojamiento (encima del día) y el billete de llegada (dentro de la tarjeta).
      await abrirDia(ids.primero)
      const t1 = await texto()
      debe(t1.includes(D.hotel), destino, `DÍAS día 1: sale el alojamiento «${D.hotel}» (encima del día, V24)`)
      const b1 = await a.evaluar("(() => { const e = document.querySelector('[data-billete=\"llegada\"]'); return e ? { qr: e.getAttribute('data-billete-qr'), txt: e.innerText.replace(/\\s+/g, ' '), dentro: Boolean(e.closest('[data-dia-id], [data-day-id], section, article, div')) } : null })()")
      debe(Boolean(b1), destino, 'DÍAS día 1: sale el billete de llegada')
      debe(Boolean(b1) && b1.qr === 'si' && /Tarjeta de embarque guardada/.test(b1.txt), destino, `DÍAS día 1: el billete de llegada tiene el QR guardado («${(b1?.txt ?? '').slice(0, 90)}»)`)
      debe(Boolean(b1) && b1.txt.includes(D.llegada.arrivalFlightTime.replace(/^0/, '').padStart(5, '0')) || (b1?.txt ?? '').includes(D.llegada.arrivalFlightTime), destino, `DÍAS día 1: el billete lleva la hora de llegada (${D.llegada.arrivalFlightTime})`)
      if (conCapturas) await a.captura(path.join(CAP, `paso6_dias_${destino.toLowerCase()}_dia1.jpg`))
      // Último día: el billete de vuelta.
      await abrirDia(ids.ultimo)
      const b2 = await a.evaluar("(() => { const e = document.querySelector('[data-billete=\"vuelta\"]'); return e ? { qr: e.getAttribute('data-billete-qr'), txt: e.innerText.replace(/\\s+/g, ' ') } : null })()")
      debe(Boolean(b2), destino, 'DÍAS último día: sale el billete de vuelta')
      debe(Boolean(b2) && b2.qr === 'si' && /Tarjeta de embarque guardada/.test(b2.txt), destino, `DÍAS último día: el billete de vuelta tiene el QR guardado («${(b2?.txt ?? '').slice(0, 90)}»)`)
      debe((b2?.txt ?? '').includes(D.vuelta.departureFlightTime), destino, `DÍAS último día: el billete lleva la hora de la vuelta (${D.vuelta.departureFlightTime})`)
      if (conCapturas) {
        await a.evaluar("(() => { const e = document.querySelector('[data-billete=\"vuelta\"]'); if (e) e.scrollIntoView({ block: 'center' }); return true })()")
        await a.esp(1000)
        await a.captura(path.join(CAP, `paso6_dias_${destino.toLowerCase()}_ultimo.jpg`))
      }
      const t2 = await texto()
      // Sin QR: gris con «+» en DÍAS (la misma regla que RESERVAS).
      await a.evaluar(`(async () => { const b = ${B}; const tid = b.getState().tripId; const p = b.getState().datos.departure; b.getState().poner(tid, 'departure', { ...p, codigo: null }); return true })()`)
      await a.esp(1500)
      const b3 = await a.evaluar("(() => { const e = document.querySelector('[data-billete=\"vuelta\"]'); return e ? e.getAttribute('data-billete-qr') : null })()")
      debe(b3 === 'falta', destino, 'DÍAS último día: quitado el QR guardado, el billete pasa a «falta» (gris con +, como en RESERVAS)')
      // RESERVAS: los mismos datos (V62).
      await a.evaluar(`(async () => { ${R}.getState().setMode('bookings'); return true })()`)
      await a.esp(3500)
      // Las secciones de RESERVAS vienen plegadas: se abren «Llegada y vuelta» y «Alojamiento».
      for (const nombre of ['Llegada y vuelta', 'Alojamiento']) {
        await a.evaluar(`(() => { const e = [...document.querySelectorAll('[data-cabecera-bloque]')].find((x) => (x.innerText || '').replace(/\s+/g, ' ').trim().startsWith(${JSON.stringify(nombre)})); if (e) { e.click(); return true } return false })()`)
        await a.esp(1500)
      }
      const tr = await texto()
      debe(tr.includes(D.hotel), destino, `RESERVAS: sale el mismo alojamiento «${D.hotel}»`)
      debe(tr.includes(D.llegada.arrivalCodigo) || tr.includes(D.llegada.arrivalCompania), destino, `RESERVAS: sale el vuelo de ida (${D.llegada.arrivalCompania} ${D.llegada.arrivalCodigo})`)
      debe(tr.includes(D.vuelta.departureCodigo) || tr.includes(D.vuelta.departureCompania), destino, `RESERVAS: sale el vuelo de vuelta (${D.vuelta.departureCompania} ${D.vuelta.departureCodigo})`)
      debe(tr.includes(D.vuelta.departureFlightTime.replace(/^0/, '')) || tr.includes(D.vuelta.departureFlightTime), destino, `RESERVAS: la hora de la vuelta es la misma (${D.vuelta.departureFlightTime})`)
      if (conCapturas) await a.captura(path.join(CAP, `paso6_reservas_${destino.toLowerCase()}.jpg`))
      resumen.push({ caso: `dias ${destino}`, dia1: t1.slice(0, 900), ultimo: t2.slice(0, 900), reservas: tr.slice(0, 1200) })
    } finally {
      a.cerrar()
    }
  }
}

if (MODO === 'dias') await modoDias()
else await modoProbador()
fs.writeFileSync(path.join(CAP, `_paso6_textos_${MODO}.json`), JSON.stringify(resumen, null, 1))
console.log(`\nPaso 6 (${MODO}): ${comprobaciones} comprobaciones · ${fallos.length} fallos`)
for (const f of fallos) console.log(`  ✗ [${f.caso}] ${f.texto}`)
process.exit(fallos.length ? 1 : 0)
