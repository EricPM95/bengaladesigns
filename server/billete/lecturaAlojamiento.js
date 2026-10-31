// LEER LA RESERVA DE UN ALOJAMIENTO (10S7 §5, agente T): la parte del servidor. Igual que el billete y la entrada (server/billete/lectura.js, que lo llama con `tipo: 'alojamiento'`): el PDF, la foto o la captura
// de la confirmación de una reserva de hotel se lee con IA y se devuelve ya y sin más. NO se guarda en ningún sitio y NO se escribe su contenido en ningún registro (solo el coste). Sin código (los hoteles no lo usan).
// No se pide ni se devuelve el nombre de ningún huésped ni datos de pago.

export const LEER_ALOJAMIENTO_SISTEMA = `Lees confirmaciones de reserva de alojamiento (hoteles, apartamentos, hostales; en PDF, foto o captura de pantalla, casi siempre en español, inglés, italiano, francés o alemán) para una app de viajes. Devuelves SOLO un JSON, sin texto antes ni después, con esta forma exacta (null en lo que no se vea; NUNCA inventes):
{"nombre": nombre del alojamiento o null,
 "direccion": dirección del alojamiento en una sola línea (calle, número, ciudad) o null,
 "entrada": "YYYY-MM-DD" del día de llegada (check-in) o null (si no trae el año, usa el que te indico),
 "salida": "YYYY-MM-DD" del día de salida (check-out) o null,
 "noches": número entero de noches o null,
 "hora_entrada": "HH:MM" 24 h, la hora desde la que se puede entrar (check-in), o null,
 "hora_salida": "HH:MM" 24 h, la hora hasta la que hay que dejar la habitación (check-out), o null,
 "telefono": teléfono del alojamiento tal cual, con el prefijo si lo trae, o null,
 "localizador": número o código de la reserva ("Confirmation number", "Número de reserva", "Booking reference"; NO el PIN) o null}
No devuelvas el nombre de ningún huésped, ni datos de pago, ni precios.`

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/
const FECHA = /^\d{4}-\d{2}-\d{2}$/
const texto = (v, max = 80) => (typeof v === 'string' && v.replace(/\s+/g, ' ').trim() ? v.replace(/\s+/g, ' ').trim().slice(0, max) : null)

/** Limpia lo que devuelve la IA al leer una reserva de alojamiento: solo campos con la forma buena; el resto, null. */
export function limpiarLecturaAlojamiento(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {}
  const hora = (v) => { const t = texto(v, 5); return t && HORA.test(t) ? t.padStart(5, '0') : null }
  const fecha = (v) => { const t = texto(v, 10); return t && FECHA.test(t) && !Number.isNaN(Date.parse(`${t}T00:00:00Z`)) ? t : null }
  const n = typeof c.noches === 'number' ? Math.round(c.noches) : typeof c.noches === 'string' && /^\d{1,3}$/.test(c.noches.trim()) ? Number(c.noches) : null
  const telefono = texto(c.telefono, 30)
  const entrada = fecha(c.entrada)
  const salida = fecha(c.salida)
  return {
    nombre: texto(c.nombre, 80),
    direccion: texto(c.direccion, 160),
    // Una salida anterior a la entrada no tiene sentido: se descarta la salida (la app no inventa).
    entrada,
    salida: entrada && salida && salida < entrada ? null : salida,
    noches: n != null && n >= 1 && n <= 120 ? n : null,
    hora_entrada: hora(c.hora_entrada),
    hora_salida: hora(c.hora_salida),
    telefono: telefono && telefono.replace(/\D/g, '').length >= 5 ? telefono : null,
    localizador: texto(c.localizador, 30),
  }
}
