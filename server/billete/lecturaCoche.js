// LEER LA RESERVA DE UN COCHE DE ALQUILER (6-nov, arreglo del formulario y de RESERVAS): la parte del servidor. Igual que el alojamiento (server/billete/lecturaAlojamiento.js, que lectura.js llama con `tipo: 'alojamiento'`),
// el PDF, la foto o la captura de la confirmación de un alquiler se lee con IA y se devuelve ya y sin más (`tipo: 'coche'`). NO se guarda en ningún sitio y NO se escribe su contenido en ningún registro (solo el coste).
// No se pide ni se devuelve el nombre del conductor, ni su carné, ni datos de pago: solo el precio total.

export const LEER_COCHE_SISTEMA = `Lees confirmaciones de reserva de coche de alquiler (en PDF, foto o captura de pantalla, casi siempre en español, inglés, italiano, francés o alemán; de la propia compañía o de un comparador) para una app de viajes. Devuelves SOLO un JSON, sin texto antes ni después, con esta forma exacta (null en lo que no se vea; NUNCA inventes):
{"compania": nombre de la compañía que alquila el coche ("Hertz", "Cicar", "Goldcar"; si solo sale el comparador, el de la compañía que se ve en el voucher) o null,
 "coche": el modelo o el grupo del coche tal cual ("Fiat 500 o similar", "Grupo B · Económico") o null,
 "lugar_recogida": dónde se recoge el coche (aeropuerto, oficina; una frase corta) o null,
 "fecha_recogida": "YYYY-MM-DD" del día de recogida o null (si no trae el año, usa el que te indico),
 "hora_recogida": "HH:MM" 24 h, la hora de recogida, o null,
 "lugar_devolucion": dónde se devuelve (una frase corta) o null,
 "fecha_devolucion": "YYYY-MM-DD" del día de devolución o null,
 "hora_devolucion": "HH:MM" 24 h, la hora de devolución, o null,
 "precio": número con el precio TOTAL del alquiler (sin la moneda) o null,
 "moneda": código de 3 letras de la moneda del precio ("EUR", "GBP") o null,
 "codigo": número o código de la reserva ("Confirmation number", "Número de reserva", "Booking reference"; NO el PIN ni el voucher largo de pago) o null}
No devuelvas el nombre del conductor, ni su carné, ni datos de pago.`

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/
const texto = (v, max = 80) => (typeof v === 'string' && v.replace(/\s+/g, ' ').trim() ? v.replace(/\s+/g, ' ').trim().slice(0, max) : null)

/** Limpia lo que devuelve la IA al leer una reserva de coche: solo campos con la forma buena; el resto, null. */
export function limpiarLecturaCoche(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {}
  const hora = (v) => { const t = texto(v, 5); return t && HORA.test(t) ? t.padStart(5, '0') : null }
  const fecha = (v) => { const t = texto(v, 10); return t && FECHA.test(t) && !Number.isNaN(Date.parse(`${t}T00:00:00Z`)) ? t : null }
  const recogida = fecha(c.fecha_recogida)
  const devolucion = fecha(c.fecha_devolucion)
  const bruto = typeof c.precio === 'number' ? c.precio : typeof c.precio === 'string' && /^\d+(?:[.,]\d{1,2})?$/.test(c.precio.trim()) ? Number(c.precio.trim().replace(',', '.')) : null
  const moneda = texto(c.moneda, 10)?.toUpperCase() ?? null
  return {
    compania: texto(c.compania, 60),
    coche: texto(c.coche, 80),
    lugar_recogida: texto(c.lugar_recogida, 120),
    fecha_recogida: recogida,
    hora_recogida: hora(c.hora_recogida),
    lugar_devolucion: texto(c.lugar_devolucion, 120),
    // Una devolución anterior a la recogida no tiene sentido: se descarta (la app no inventa).
    fecha_devolucion: recogida && devolucion && devolucion < recogida ? null : devolucion,
    hora_devolucion: hora(c.hora_devolucion),
    precio: bruto != null && Number.isFinite(bruto) && bruto > 0 && bruto < 100000 ? Math.round(bruto * 100) / 100 : null,
    moneda: moneda && /^[A-Z]{3}$/.test(moneda) ? moneda : null,
    codigo: texto(c.codigo, 30),
  }
}
