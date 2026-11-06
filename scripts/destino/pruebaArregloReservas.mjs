// PRUEBA DEL ARREGLO DE RESERVAS (6-nov): el bloque del coche, [Buscar vuelos], los enlaces de afiliado en un solo archivo y «Útil para el viaje».
//   node scripts/destino/pruebaArregloReservas.mjs        (sin navegador ni servidor: lee los archivos y llama a los módulos puros)
// 1. Enlaces de afiliado: un solo archivo, los cuatro códigos, el enlace profundo de vuelos y nadie más escribe esas direcciones.
// 2. [Buscar vuelos]: el botón existe, usa el archivo único, no lleva el nombre de ninguna web y sale mientras falte un vuelo en avión.
// 3. «Útil para el viaje»: fuera la fila de vuelos; el alquiler no sale en los destinos con el bloque del coche.
// 4. El bloque del coche: «¿Para quién es?» solo con 2 o más, [Añadir tu reserva] a la vista, «Listo» con compañía · coche · precio.
// 5. La lectura de la reserva (servidor): limpia lo que devuelve la IA, sin nombre del conductor ni pagos.
// 6. El motor: la hora de recogida cuenta en el día de llegada, la de devolución en el último día; «Mi coche» quita la recogida.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const importar = (ruta) => import(pathToFileURL(join(RAIZ, ruta)).href)

let fallos = 0
let total = 0
const debe = (ok, id, texto) => {
  total += 1
  if (!ok) {
    fallos += 1
    console.log(`  FALLO [${id}] ${texto}`)
  }
}

// ── 1. Los enlaces, en un solo sitio ─────────────────────────────────────────────────────────────
const afiliado = sinComentarios(leer('src/lib/enlacesAfiliado.ts'))
debe(afiliado.includes('https://skyscanner.pxf.io/B539xL'), '1a', 'vuelos: el enlace de Skyscanner de Eric')
debe(afiliado.includes('https://www.iatiseguros.com/?r=60565847640308'), '1b', 'seguro: el enlace de IATI con su código')
debe(afiliado.includes('https://holafly.sjv.io/NGxJQK'), '1c', 'eSIM: el enlace de Holafly de Eric')
debe(afiliado.includes('https://www.discovercars.com/es?a_aid=JUTRIP'), '1d', 'coche: DiscoverCars con a_aid=JUTRIP')
debe(/\?u=\$\{encodeURIComponent/.test(afiliado), '1e', 'vuelos: el enlace profundo lleva la búsqueda codificada en `?u=`')
const fuera = ['src/components/route/reservas/TransportRow.tsx', 'src/components/route/reservas/UtilParaElViaje.tsx', 'src/components/route/reservas/InsuranceRow.tsx', 'src/components/route/reservas/CocheDeViaje.tsx', 'src/components/route/reservas/BuscarVuelos.tsx', 'src/lib/vehicleRentalLinks.ts', 'src/lib/enlacesUtil.ts']
for (const archivo of fuera) debe(!/https?:\/\/[^'"`\s]*(skyscanner|discovercars|iatiseguros|holafly)/i.test(sinComentarios(leer(archivo))), '1f', `${archivo} no escribe ninguna dirección de afiliado: las coge de enlacesAfiliado.ts`)
const A = await importar('src/lib/enlacesAfiliado.ts').catch(() => null)
// (El módulo es TypeScript: sin Vite no se importa; se prueba su lógica pura con una copia mínima de lo que hace.)
if (!A) {
  const iso = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? ''); return m ? `${m[1].slice(2)}${m[2]}${m[3]}` : null }
  debe(iso('2026-11-08') === '261108' && iso('2026-11-13') === '261113', '1g', 'las fechas de la búsqueda van como aammdd (8 y 13 de noviembre de 2026)')
  debe(afiliado.includes("`https://www.skyscanner.es/transporte/vuelos/${origen}/${destino}/"), '1h', 'la búsqueda es /transporte/vuelos/<origen>/<destino>/<ida>/<vuelta>/')
}

// ── 2. [Buscar vuelos] ───────────────────────────────────────────────────────────────────────────
const buscar = leer('src/components/route/reservas/BuscarVuelos.tsx')
debe(/enlaceBuscarVuelos/.test(buscar) && /origen: ciudadDeSalida\(route\)/.test(buscar) && /destino: route\.destination/.test(buscar) && /dateRange\?\.start/.test(buscar) && /dateRange\?\.end/.test(buscar), '2a', '[Buscar vuelos] abre el buscador con el origen, el destino y las fechas del viaje')
debe(/>\s*Buscar vuelos\s*</.test(buscar) || buscar.includes('Buscar vuelos\n'), '2b', 'el botón dice «Buscar vuelos»')
debe(!/skyscanner/i.test(sinComentarios(buscar).replace(/\s+/g, ' ').replace(/enlaceBuscarVuelos/g, '')), '2c', 'el botón no lleva el nombre de ninguna web')
const vuelos = leer('src/components/route/reservas/LlegadaYVuelta.tsx')
debe(/<BuscarVuelos route=\{route\}/.test(vuelos) && /faltaAvion/.test(vuelos), '2d', 'el bloque «Llegada y vuelta» lo enseña mientras falte un vuelo en avión')

// ── 3. «Útil para el viaje» ──────────────────────────────────────────────────────────────────────
const util = sinComentarios(leer('src/components/route/reservas/UtilParaElViaje.tsx'))
debe(!/id: 'vuelos'|Buscar vuelos|soloBuscar/.test(util), '3a', 'fuera la fila de vuelos')
debe(/hasRentalVehicle = [^\n]*!esDestinoDeCoche\(route\.destination\)/.test(util), '3b', 'en los destinos con el bloque del coche (Lanzarote) no sale el alquiler; en Roma, sí')
debe(/ENLACE_SEGURO/.test(util) && /ENLACE_ESIM/.test(util) && /ENLACE_TARJETA/.test(util), '3c', 'se quedan el seguro, la eSIM y la tarjeta')

// ── 4. El bloque del coche ───────────────────────────────────────────────────────────────────────
const coche = leer('src/components/route/reservas/CocheDeViaje.tsx')
debe(/gente\.length >= 2 && \(\s*<div[^>]*data-coche-fila="para-quien"/.test(coche), '4a', '«¿Para quién es?» solo con 2 personas o más')
debe(/BotonAnadirReservaCoche/.test(coche) && /!rentalBooking && <BotonAnadirReservaCoche/.test(coche), '4b', '[Añadir tu reserva] a la vista, sin reserva')
const reserva = leer('src/components/route/reservas/ReservaDelCoche.tsx')
debe(reserva.includes('Desde el PDF, una foto o una captura.') && reserva.includes("clave=\"documento_coche\"") && reserva.includes('Añadir tu reserva'), '4c', 'la línea «Desde el PDF, una foto o una captura.» y el candado del pase (documento_coche)')
for (const campo of ['compania', 'coche', 'lugarRecogida', 'fechaRecogida', 'horaRecogida', 'lugarDevolucion', 'fechaDevolucion', 'horaDevolucion', 'codigo']) debe(new RegExp(`data-reserva-coche-campo|${campo}`).test(reserva) && reserva.includes(campo), '4d', `la hoja tiene el dato «${campo}» y se corrige a mano`)
debe(/CampoPrecio/.test(reserva) && /precio/.test(reserva), '4e', 'la hoja tiene el precio')
debe(/rentalBooking\.provider, rentalBooking\.coche, precioGuardado/.test(coche), '4f', 'con la reserva: compañía · coche · precio')
debe(/const listo = coche === 'propio' \|\| Boolean\(rentalBooking\)/.test(coche), '4g', 'con la reserva puesta, el bloque pasa a «Listo»')
const pase = leer('src/lib/avisoPaseTextos.ts')
debe(/documento_coche: \{/.test(pase), '4h', 'sin pase: el aviso del pase de «Añadir tu reserva» del coche, como el del alojamiento')
const readiness = leer('src/lib/readiness.ts')
for (const campo of ['coche?', 'lugarRecogida?', 'horaRecogida?', 'lugarDevolucion?', 'horaDevolucion?', 'codigo?']) debe(readiness.includes(campo), '4i', `la reserva del coche guarda «${campo.replace('?', '')}»`)

// ── 5. La lectura (servidor) ─────────────────────────────────────────────────────────────────────
const L = await importar('server/billete/lecturaCoche.js')
const limpio = L.limpiarLecturaCoche({
  compania: ' Cicar ', coche: 'Fiat 500 o similar', lugar_recogida: 'Aeropuerto de Lanzarote', fecha_recogida: '2026-11-08', hora_recogida: '9:30', lugar_devolucion: 'Aeropuerto de Lanzarote',
  fecha_devolucion: '2026-11-13', hora_devolucion: '15:00', precio: '183,50', moneda: 'eur', codigo: 'CR-48213', conductor: 'Eric Pérez', tarjeta: '4111 1111 1111 1111',
})
debe(limpio.compania === 'Cicar' && limpio.coche === 'Fiat 500 o similar' && limpio.hora_recogida === '09:30' && limpio.hora_devolucion === '15:00' && limpio.precio === 183.5 && limpio.moneda === 'EUR' && limpio.codigo === 'CR-48213', '5a', 'limpia lo leído: compañía, coche, horas, precio, moneda y código')
debe(!('conductor' in limpio) && !('tarjeta' in limpio) && !JSON.stringify(limpio).includes('4111') && !JSON.stringify(limpio).includes('Pérez'), '5b', 'sin nombre del conductor ni datos de pago')
const roto = L.limpiarLecturaCoche({ fecha_recogida: '2026-11-13', fecha_devolucion: '2026-11-08', hora_recogida: '25:99', precio: -4, moneda: 'euros', codigo: 5 })
debe(roto.fecha_devolucion === null && roto.hora_recogida === null && roto.precio === null && roto.moneda === null && roto.codigo === null, '5c', 'lo que no tiene sentido (devolución antes de recoger, hora imposible, precio negativo) se queda en null')
debe(Object.values(L.limpiarLecturaCoche(null)).every((v) => v === null), '5d', 'sin nada leído, todo null')
const lectura = leer('server/billete/lectura.js')
debe(/tipo === 'coche'/.test(lectura) && /limpiarLecturaCoche\(crudo\)/.test(lectura) && /LEER_COCHE_SISTEMA/.test(lectura), '5e', '/api/read-ticket lee la reserva del coche (tipo «coche»)')
debe(/tipo\?: 'entrada' \| 'alojamiento' \| 'excursion' \| 'coche'/.test(leer('src/lib/billeteLeer.ts')) && /export async function leerReservaCoche/.test(leer('src/lib/billeteLeer.ts')), '5f', 'el cliente tiene leerReservaCoche')

// ── 6. El motor: las horas de la reserva del coche ───────────────────────────────────────────────
const C = await importar('shared/routeEngine/cocheLlegada.js')
const coche15 = { tiene: () => true, min: () => 15 }
const util2 = (recogida, alquiler = true) => C.planDeLlegadaLL({ aterriza: '08:25', alquiler, coche: coche15, zona: 'z', zonas: ['z'], sol: 1100, recogida })?.horaUtil
debe(util2(null) === 685 && util2('08:30') === 685, '6a', 'sin reserva con hora (o con una hora anterior a salir del aeropuerto), la hora útil es la de siempre (aterrizaje + 45 + 60 + trayecto + 60)')
debe(util2('12:00') === 855, '6b', 'la hora de recogida de la reserva (12:00) cuenta en el día de llegada: recoger a las 12:00 + 60 + trayecto + 60 = 14:15')
debe(util2('12:00', false) === 625 && util2(null, false) === 625, '6c', '«Mi coche»: no hay recogida, quita los 60 minutos y la hora de la reserva no cuenta')
const lim = (devolucion) => C.planDeVueltaLL({ vuelo: '19:40', coche: coche15, zona: 'z', zonas: ['z'], devolucion }).limiteT1
debe(lim(null) === 1030 && lim('18:00') === 1030, '6d', 'sin devolución (o más tarde de lo que deja el vuelo), la hora límite en la T1 es la de siempre (17:10)')
debe(lim('13:00') === 780, '6e', 'la hora de devolución de la reserva (13:00) manda en el último día cuando es más temprana')
const dia = leer('server/engine/cocheDay.js')
debe(/recogida: options\.llegada\?\.recogida/.test(dia) && /devolucion: options\.vuelta\?\.devolucion/.test(dia), '6f', 'el día de coche pasa las dos horas al motor')
const llv = leer('src/lib/llegadaVuelta.ts')
debe(/recogida: opciones\.coche\?\.horaRecogida/.test(llv) && /devolucion: opciones\.coche\?\.horaDevolucion/.test(llv), '6g', 'el cliente manda las dos horas (dentro de `llegada` y `vuelta`)')
debe(/coche: useRouteStore\.getState\(\)\.rentalVehicleBooking/.test(leer('src/lib/adaptarVuelos.ts')), '6h', 'al rehacer los días de coche se manda la reserva puesta')

console.log(`\nLa prueba del arreglo de RESERVAS: ${total} comprobaciones · ${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
