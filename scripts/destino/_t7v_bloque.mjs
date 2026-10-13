// Explorador (Tanda 7, vuelta): la lista de un día escrito con una reserva a una hora (y, si se pide, con ese sitio cerrado). Uso: node _t7v_bloque.mjs <dia> <lugar> <hora> [dia de la semana] [cerrado]
import { written } from './viajes20Lib.mjs'
import { copiarParte, aplicarVariantes } from '../../shared/routeEngine/listasDia.js'

const [id, lugar, hora, wd, cerrado] = process.argv.slice(2)
const dia = written.days[id]
const parte = dia.partes.unica ?? Object.values(dia.partes)[0]
const entradas = hora && hora !== '-' ? { [lugar]: hora } : {}
const ctx = { weekday: wd ?? 'jueves', dateIso: null, month: 5, hasFreeTour: false, freeTourFranja: null, tourName: 'Free Tour por Roma', ftAqui: false, ftOtroDia: false, entradas, poolNames: [], experiencias: [], orden: ['D1', 'D2', 'D4'], parte: null, enFechas: () => false, cerrado: (n) => cerrado === 'cerrado' && n === lugar }
const ap = []
const t = aplicarVariantes(copiarParte(parte), dia, ctx, ap)
const s = (l) => l.map((x) => `${x.tipo === 'traslado' ? `TRASLADO ${x.como}` : x.lugar}${x.modo ? `(${x.modo})` : ''}:${x.min}`).join(' | ')
console.log(ap.join(','))
console.log('M:', s(t.manana))
console.log('comida:', t.comida?.restaurante)
console.log('T:', s(t.tarde))
console.log('S:', s(t.sobra ?? []))
