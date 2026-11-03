// Prueba extremo a extremo por HTTP (LZ2a): API en 8787 arrancada con DESTINOS_OCULTOS='-'. node scripts/destino/_httpLZ2a.mjs
const B = 'http://localhost:8787'
const post = async (r, b) => { const x = await fetch(B + r, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); let j = null; try { j = await x.json() } catch {} return { s: x.status, j } }
const answers = (extra = {}) => ({ origin: 'Madrid', days: 6, companion: 'pareja', experiences: ['imprescindibles'], experiencesPositive: ['imprescindibles'], chronotype: 'normal', budgetLevel: 'medio', dateRange: { start: '2026-11-08', end: '2026-11-13' }, month: 11, season: 'invierno', ...extra })
const sk = await post('/api/generate-skeleton', { destination: 'Lanzarote', answers: answers() })
console.log('skeleton', sk.s, JSON.stringify(sk.j)?.slice(0, 300))
const sd = sk.j?.days ?? sk.j?.skeleton?.days
const all_days = (sd ?? Array.from({ length: 5 }, (_, i) => ({ day_number: i + 1 }))).map((d, i) => ({ day_number: d.day_number ?? i + 1, type: d.type ?? 'city' }))
const CAMPOS = ['trayecto_previo', 'coche', 'cena_cerca', 'opcionales_quitados', 'sin_coche', 'aeropuerto', 'timezone', 'dia_id']
for (const [zona, pase, coche] of [['costa_teguise', true, 'alquiler'], ['el_norte', false, 'alquiler'], ['costa_teguise', false, 'no'], ['el_norte', true, 'propio']]) {
  const a = answers({ zona, coche })
  for (const via of ['generate-day-block', 'rebuild-day']) {
    const cuerpo = via === 'rebuild-day'
      ? { destination: 'Lanzarote', answers: a, all_days, day_number: 3, pase }
      : { destination: 'Lanzarote', answers: a, block_days: [{ day_number: 3, type: 'city' }], all_days, pase, is_first_block_of_trip: false }
    const r = await post('/api/' + via, cuerpo)
    const day = r.j?.day ?? r.j?.days?.[0]
    const stop = day?.stops?.find((s) => s.trayecto_previo) ?? day?.stops?.[0]
    const faltan = day ? CAMPOS.filter((c) => c !== 'trayecto_previo' && day[c] === undefined) : CAMPOS
    console.log(via, zona, pase ? 'pase' : 'sin', coche, '->', r.s, day ? `${day.dia_id} coche=${day.coche?.coche_min} activo=${day.coche?.activo} zona=${day.coche?.zona?.id} tray=${stop?.trayecto_previo?.texto ?? (coche === 'no' ? '(sin coche)' : 'FALTA')} cena=${day.cena_cerca?.con_pase} faltan=[${faltan}]` : JSON.stringify(r.j)?.slice(0, 200))
  }
}
// Roma sigue igual: un día
const roma = await post('/api/rebuild-day', { destination: 'Roma', answers: answers({ days: 4, dateRange: { start: '2026-11-09' } }), all_days: [{ day_number: 1 }, { day_number: 2 }, { day_number: 3 }], day_number: 1 })
console.log('Roma rebuild', roma.s, roma.j?.day?.stops?.map((s) => s.name).join(' | '), 'coche:', roma.j?.day?.coche)
