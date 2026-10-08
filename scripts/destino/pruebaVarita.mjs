// Prueba de la varita «Recuperar mi ruta» por destino (Tanda 6j, punto 8). Uso: node --experimental-strip-types scripts/destino/pruebaVarita.mjs
import assert from 'node:assert/strict'
import { recuperarDestino, destinoCambiado } from '../../src/lib/recuperarDestino.ts'

const dia = (id, city, n, extra = {}) => ({ id, city, dayNumber: n, title: id, stops: [{ name: `${id}-a` }, { name: `${id}-b` }], meals: [{ id: `${id}-m` }], ...extra })
const respuestas = { days: 5, dateRange: { start: '2026-10-01', end: '2026-10-05' } }
const inicial = [
  dia('r1', 'Roma', 1),
  dia('r2', 'Roma', 2),
  dia('r3', 'Roma', 3),
  dia('r4', 'Roma', 4, { interruptor: { mode: 'roma', default: 'roma' } }),
  dia('f5', 'Florencia', 5),
]
const nueva = () => ({ days: JSON.parse(JSON.stringify(inicial)), answers: JSON.parse(JSON.stringify(respuestas)) })
const crear = (days, answers) => ({ destination: 'Roma', days, answers, editedManually: false, originalRoute: nueva() })
const ids = (r) => r.days.map((d) => `${d.id}:${d.dayNumber}`).join(' ')

// 1) Roma sola, con cambios: la varita la deja como al crearla (también el interruptor y los días propios).
{
  const original = nueva()
  const days = [
    { ...dia('r2', 'Roma', 1), stops: [] },
    dia('r1', 'Roma', 2, { meals: [] }),
    dia('r4', 'Roma', 3, { interruptor: { mode: 'excursion', default: 'roma' } }),
    dia('propio', 'Roma', 4, { ownDay: true }),
    dia('libre', 'Roma', 5, { userAdded: true }),
  ]
  const ruta = { ...crear(days, { ...respuestas, days: 5, diaCuatro: 'excursion' }), originalRoute: { days: original.days.filter((d) => d.city === 'Roma'), answers: respuestas }, editedManually: true }
  assert.equal(destinoCambiado(ruta, 'Roma'), true)
  const vuelta = recuperarDestino(ruta, 'Roma')
  assert.deepEqual(vuelta.days, original.days.filter((d) => d.city === 'Roma'))
  assert.equal(vuelta.answers.diaCuatro, undefined)
  assert.deepEqual(vuelta.answers, respuestas)
  assert.equal(destinoCambiado(vuelta, 'Roma'), false)
}

// 2) Roma y Florencia con cambios en los dos: la de Florencia solo toca Florencia; la de Roma, solo Roma.
{
  const days = [
    dia('r2', 'Roma', 1, { stops: [] }),
    dia('r1', 'Roma', 2),
    dia('r3', 'Roma', 3, { meals: [] }),
    dia('r4', 'Roma', 4, { interruptor: { mode: 'excursion', default: 'roma' } }),
    dia('f5', 'Florencia', 5, { stops: [{ name: 'otra' }] }),
    dia('f6', 'Florencia', 6, { userAdded: true }),
  ]
  const ruta = { ...crear(days, { days: 6, dateRange: { start: '2026-10-01', end: '2026-10-06' }, diaCuatro: 'excursion' }), editedManually: true }
  assert.equal(destinoCambiado(ruta, 'Florencia'), true)

  const f = recuperarDestino(ruta, 'Florencia')
  assert.equal(ids(f), 'r2:1 r1:2 r3:3 r4:4 f5:5')
  assert.deepEqual(f.days.slice(0, 4), days.slice(0, 4), 'Roma se queda con sus cambios')
  assert.deepEqual(f.days[4], inicial[4], 'Florencia como al principio')
  assert.equal(f.answers.diaCuatro, 'excursion', 'el interruptor de Roma no se toca')
  assert.deepEqual(f.answers.dateRange, respuestas.dateRange)
  assert.equal(f.answers.days, 5)

  const r = recuperarDestino(ruta, 'Roma')
  assert.equal(ids(r), 'r1:1 r2:2 r3:3 r4:4 f5:5 f6:6')
  assert.deepEqual(r.days.slice(0, 4).map((d) => d.dayNumber), [1, 2, 3, 4])
  assert.deepEqual(r.days.slice(0, 4).map((d) => ({ ...d, dayNumber: 0 })), inicial.slice(0, 4).map((d) => ({ ...d, dayNumber: 0 })))
  assert.deepEqual(r.days[4], days[4], 'Florencia se queda con sus cambios')
  assert.equal(r.answers.diaCuatro, undefined, 'recuperar Roma quita el interruptor elegido')
}

// 3) Roma con un día quitado al principio (fechas movidas) y Florencia detrás: al recuperar Roma vuelven los días y las fechas.
{
  const days = [dia('r2', 'Roma', 1), dia('r3', 'Roma', 2), dia('r4', 'Roma', 3, { interruptor: { mode: 'roma', default: 'roma' } }), dia('f5', 'Florencia', 4)]
  const ruta = crear(days, { days: 4, dateRange: { start: '2026-10-02', end: '2026-10-05' } })
  const r = recuperarDestino(ruta, 'Roma')
  assert.equal(ids(r), 'r1:1 r2:2 r3:3 r4:4 f5:5')
  assert.deepEqual(r.answers.dateRange, respuestas.dateRange)
  assert.equal(r.answers.days, 5)
}

// 4) Viaje antiguo sin copia: no hace nada.
{
  const ruta = { ...crear([dia('r1', 'Roma', 1)], respuestas), originalRoute: undefined }
  assert.equal(recuperarDestino(ruta, 'Roma'), ruta)
}
console.log('pruebaVarita: todo bien')
