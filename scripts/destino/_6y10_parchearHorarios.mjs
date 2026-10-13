// Tanda 6y10, agente A: horarios oficiales de Eric (13-oct-2026) en los datos de Roma.
// Reemplazos puntuales de texto (git diff mínimo, sin reformatear los ficheros). Se puede volver a lanzar: si ya está aplicado, no cambia nada.
//   node scripts/destino/_6y10_parchearHorarios.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const FECHA = '2026-10-13'
const WEB = 'Eric, mirado en la web oficial, 2026-10-13'

let ficheroActual = ''
let texto = ''
const cambios = []

function abrir(rel) {
  ficheroActual = rel
  texto = fs.readFileSync(path.join(raiz, rel), 'utf8')
}
function guardar() {
  fs.writeFileSync(path.join(raiz, ficheroActual), texto)
}

/** Reemplaza `viejo` por `nuevo` dentro del lugar `id` (entre su "id" y el siguiente). Si ya está el nuevo, no hace nada. */
function enLugar(id, etiqueta, viejo, nuevo) {
  const inicio = texto.indexOf(`      "id": "${id}",\n`)
  if (inicio < 0) throw new Error(`No encuentro el lugar ${id}`)
  let fin = texto.indexOf('\n    {\n      "id": ', inicio + 10)
  if (fin < 0) fin = texto.length
  const trozo = texto.slice(inicio, fin)
  if (trozo.includes(nuevo) && !trozo.includes(viejo)) return
  const partes = trozo.split(viejo)
  if (partes.length !== 2) throw new Error(`${id} · ${etiqueta}: esperaba 1 coincidencia y hay ${partes.length - 1}`)
  texto = texto.slice(0, inicio) + partes.join(nuevo) + texto.slice(fin)
  cambios.push(`${id}: ${etiqueta}`)
}

function global(etiqueta, viejo, nuevo) {
  // (Algunas fichas ampliadas llevan saltos de línea de Windows: se respetan.)
  if (texto.includes('\r\n')) {
    viejo = viejo.replace(/\n/g, '\r\n')
    nuevo = nuevo.replace(/\n/g, '\r\n')
  }
  if (texto.includes(nuevo) && !texto.includes(viejo)) return
  const partes = texto.split(viejo)
  if (partes.length !== 2) throw new Error(`${etiqueta}: esperaba 1 coincidencia y hay ${partes.length - 1}`)
  texto = partes.join(nuevo)
  cambios.push(etiqueta)
}

// ───────────────────────── roma.json ─────────────────────────
abrir('data/pipeline_v2/roma.json')

// ── Panteón: todos los días 09:00-19:00, última entrada 18:30; cierra el 1 de enero y el 25 de diciembre ──
enLugar('panteon', 'nota de la reserva', `"reserva_nota": "SIN VERIFICAR: la web del Ministerio dice que se entra por orden de llegada y una guía de viajes dice que la entrada se compra con hora. Se deja la franja libre, de la apertura a la última entrada.",`,
  `"reserva_nota": "Entrada con hora: se elige la hora al comprarla. La rueda va de la apertura a la última entrada oficial de ese día.",`)
enLugar('panteon', 'fuera by_day (sábado y domingo con misa)', `      "by_day": {
        "lun-vie": [
          "09:00-19:00"
        ],
        "sab": [
          "09:00-16:00"
        ],
        "dom": [
          "09:00-09:30",
          "11:45-19:00"
        ]
      },
`, '')
enLugar('panteon', 'texto de la tarjeta', `"card_text": "Todos los días de 09:00 a 19:00 (última entrada 18:30). Durante las misas solo entran fieles y la venta de entradas se corta una hora antes: sábado desde las 16:00 (misa 17:00) y domingo hacia las 10:30. En agosto, apertura nocturna 19:00-23:00 (salvo jueves). Cierra 1 ene, 15 ago y 25 dic. Entrada: 7 €.",`,
  `"card_text": "Todos los días de 09:00 a 19:00 (última entrada 18:30). En agosto, apertura nocturna 19:00-23:00 (salvo jueves). Cierra 1 ene y 25 dic. Entrada: 7 €.",`)
enLugar('panteon', 'fuera misas_festivos', `      "misas_festivos": [
        "01-01",
        "06-29",
        "01-06",
        "easter+1",
        "04-25",
        "05-01",
        "06-02",
        "08-15",
        "11-01",
        "12-08",
        "12-25",
        "12-26"
      ],
      "_misas_festivos": "Festivos nacionales de Italia. La web oficial del Panteón: misa a las 17:00 los sábados y las vísperas de festivo (venta cortada a las 16:00) y a las 10:30 los domingos y los festivos (venta cortada a las 09:30). El motor lee el festivo como un domingo y su víspera como un sábado (massWeekday, openingHours.js). Pendiente de decidir: el 29 de junio (San Pedro y San Pablo, festivo solo en Roma).",
`, '')
enLugar('panteon', 'cierres: solo 25 dic y 1 ene', `      "closed_dates": [
        "08-15",
        "12-25",
        "01-01"
      ],`, `      "closed_dates": [
        "12-25",
        "01-01"
      ],`)
enLugar('panteon', 'hours_audit', `      "hours_audit": {
        "confianza": "alta (sábado y domingo: media)",
        "fuente": "https://www.pantheonroma.com/en/openings-info/ (web oficial del Capítulo: 09:00-19:00, última entrada 18:45, cierra 1 ene, 15 ago y 25 dic) + https://it.vatican-city.it/pantheon-roma/ (misas: sábado 17:00, domingo 10:30; venta suspendida 1 h antes)",
        "nota": "La web oficial no publica el horario de las misas. \\"Sábados, solo de 09:00 a 16:00\\" sale de la misa de las 17:00 con la venta cortada una hora antes; es posible que tras la misa se vuelva a entrar hasta las 19:00, sin confirmar: se deja lo prudente.",
        "comprobado_web": "Buscador (cultura.gov.it), 2026-10-12: todos los días 09:00-19:00, última entrada 18:30, taquillas hasta las 18:00 (se deja la última entrada de 18:30). Sin publicar el horario de las misas.",
        "fecha": "2026-09-25"
      },`, `      "hours_audit": {
        "confianza": "alta",
        "fuente": "Web oficial del Panteón (pantheonroma.com y cultura.gov.it), mirada por Eric",
        "nota": "Todos los días de 09:00 a 19:00, última entrada 18:30. Cierra el 1 de enero y el 25 de diciembre. La entrada lleva hora (la rueda se queda). Sin horario de misas ni cierres de agosto: no se meten.",
        "comprobado_web": "${WEB}: todos los días 09:00-19:00, última entrada 18:30; cierra 1 ene y 25 dic.",
        "fecha": "${FECHA}"
      },`)
enLugar('panteon', 'auditoría de cierres', `        "01-01": {
          "estado": "abre con horario especial (probable)",
          "fuente": "cultura.gov.it, «1 gennaio 2026 al Pantheon» (09:00-17:00, última entrada 16:30). pantheonroma.com dice que cierra el 1 de enero: manda el aviso del Ministerio de ese año.",
          "comprobado": "2026-09-30",
          "antes": "[\\"01-01\\",\\"08-15\\",\\"12-25\\"]"
        },
        "08-15": {
          "estado": "cierra (hasta que se publique)",
          "verificar": true,
          "fuente": "Dos fuentes oficiales que no coinciden. pantheonroma.com (el Capítulo): cierra el 1 de enero, el 15 de agosto y el 25 de diciembre. cultura.gov.it (el Ministerio): abrió el 15 de agosto de 2022, 2023 y 2026 con el horario de siempre. Para 2027 no hay nada publicado: sigue como cerrado, con el mismo criterio que el Castillo.",
          "revisar": "agosto de 2027, en cultura.gov.it",
          "comprobado": "2026-10-01"
        },
`, `        "01-01": {
          "estado": "cierra",
          "fuente": "${WEB}: cierra el 1 de enero y el 25 de diciembre. El 15 de agosto ya no cierra.",
          "comprobado": "${FECHA}"
        },
`)

// ── Museos Vaticanos: lunes a sábado 08:00-20:00 (última 18:00); último domingo 09:00-14:00; la lista de cierres de Eric ──
enLugar('museos_vaticanos_y_capilla_sixtina', 'cierres: fuera 2027 sueltas, dentro 1 de noviembre', `        "08-15",
        "12-08",
        "12-25",
        "12-26",
        "2027-08-16",
        "2027-11-01"
      ],`, `        "08-15",
        "11-01",
        "12-08",
        "12-25",
        "12-26"
      ],`)
enLugar('museos_vaticanos_y_capilla_sixtina', 'texto de la tarjeta', `Cierra también en varios festivos (1 y 6 ene, 11 feb, 19 mar, lunes de Pascua, 1 may, 29 jun, 14-15 ago, 8, 25 y 26 dic).",`,
  `Cierra también en varios festivos (1 y 6 ene, 11 feb, 19 mar, lunes de Pascua, 1 may, 29 jun, 14-15 ago, 1 nov, 8, 25 y 26 dic). El 24 y el 31 de diciembre abren de 08:00 a 15:00 (última entrada 13:00).",`)
enLugar('museos_vaticanos_y_capilla_sixtina', 'hours_audit', `        "confianza": "alta",
        "fuente": "https://www.museivaticani.va/content/museivaticani/it/info/orari-musei-vaticani.html",
        "nota": "La web publica \\"6 aprile\\" (lunes de Pascua de 2026): se guarda como easter+1 para que valga cada año. El último domingo no abre si coincide con Pascua, 29 jun, 25, 26 o 31 dic.",
        "comprobado_web": "Buscador, 2026-10-12: el último domingo del mes 09:00-14:00 (última entrada 12:30) confirmado. El horario de lunes a sábado no se pudo volver a ver en la web oficial: se deja el del 2026-09-25.",
        "fecha": "2026-09-25"
      },`, `        "confianza": "alta",
        "fuente": "https://www.museivaticani.va/content/museivaticani/it/info/orari-musei-vaticani.html",
        "nota": "Lunes a sábado 08:00-20:00 (última entrada 18:00). Último domingo de cada mes 09:00-14:00 (última entrada 12:30), salvo si cae en Pascua, 29 jun, 25, 26 o 31 dic. Cierran: los domingos (menos el último del mes), 1 y 6 ene, 11 feb, 19 mar, lunes de Pascua (easter+1, vale cada año), 1 may, 29 jun, 14 y 15 ago, 1 nov, 8, 25 y 26 dic. El 24 y el 31 de dic abren de 08:00 a 15:00 (special_hours, última entrada 13:00 del calendario oficial). Sin fechas sueltas de un solo año.",
        "comprobado_web": "${WEB}: horario y lista de cierres tal cual los publica la web.",
        "fecha": "${FECHA}"
      },`)
enLugar('museos_vaticanos_y_capilla_sixtina', 'auditoría de cierres', `      "closed_dates_audit": {
        "2027-08-16": {
          "estado": "cierra (el 15 cae en domingo)",
          "fuente": "Calendario oficial de los Museos Vaticanos 2027 (m.museivaticani.va/content/dam/museivaticani/pdf/utilities/calendario_musei.pdf), día marcado en rojo (cierre).",
          "comprobado": "2026-09-30"
        },
        "2027-11-01": {
          "estado": "cierra (lunes, Todos los Santos)",
          "fuente": "Calendario oficial de los Museos Vaticanos 2027 (m.museivaticani.va/content/dam/museivaticani/pdf/utilities/calendario_musei.pdf), día marcado en rojo (cierre).",
          "comprobado": "2026-09-30"
        }
      }`, `      "closed_dates_audit": {
        "11-01": {
          "estado": "cierra (Todos los Santos, cada año)",
          "fuente": "${WEB}: la web publica el 1 de noviembre como cierre. Se quitaron las fechas sueltas de 2027 (16 ago y 1 nov) que no salen en la lista de la web.",
          "comprobado": "${FECHA}"
        }
      }`)

// ── Galería Borghese: martes a domingo 09:00-19:00, no se entra después de las 17:00; turnos de 2 h (9, 11, 13, 15, 17) ──
enLugar('galeria_borghese', 'nota de la reserva', `"reserva_nota": "Entrada con hora fija (reserva obligatoria). Horario oficial 09:00-19:00, última entrada 17:45 (cultura.gov.it, 2026-10-12). SIN VERIFICAR: las horas de los turnos (cada hora y la de las 17:45) salen de la auditoría anterior; una guía de viajes habla de 5 turnos de 2 horas (9, 11, 13, 15 y 17).",`,
  `"reserva_nota": "Entrada con hora fija (reserva obligatoria). Horario oficial 09:00-19:00 de martes a domingo; no se entra después de las 17:00. Turnos de 2 horas: 9:00, 11:00, 13:00, 15:00 y 17:00.",`)
enLugar('galeria_borghese', 'última entrada 17:00', `      "windows": [
        "09:00-19:00"
      ],
      "last_entry": "17:45",`, `      "windows": [
        "09:00-19:00"
      ],
      "last_entry": "17:00",
      "hours_audit": {
        "confianza": "alta",
        "fuente": "https://galleriaborghese.cultura.gov.it/info (web oficial de la Galería)",
        "nota": "Martes a domingo 09:00-19:00, no se entra después de las 17:00. Turnos de 2 horas: 9, 11, 13, 15 y 17. Cierra los lunes, el 25 de diciembre y el 1 de enero. Sin cierres nuevos (el lunes de Pascua cae en lunes: ya cerrado).",
        "comprobado_web": "${WEB}: 09:00-19:00, última entrada 17:00, turnos 9, 11, 13, 15 y 17; cierra lunes.",
        "fecha": "${FECHA}"
      },`)
enLugar('galeria_borghese', 'nota de los turnos', `con reserva (decisión del usuario, 6-oct-2026): sin reserva puesta`, `con reserva (web oficial, mirada por Eric el 13-oct-2026): sin reserva puesta`)
enLugar('galeria_borghese', 'auditoría: fuera lunes_festivos', `        },
        "lunes_festivos": {
          "estado": "cierra (hasta que se publique)",
          "verificar": true,
          "fechas": [
            "2027-03-29"
          ],
          "fuente": "galleriaborghese.cultura.gov.it: cierra el lunes, el 25 de diciembre y el 1 de enero. cultura.gov.it: abrió el Lunes de Pascua de 2022, 2024, 2025 y 2026 (9:00-19:00). Para 2027 no hay nada publicado: el lunes 29 de marzo de 2027 sigue como cerrado, con el mismo criterio que el Castillo.",
          "revisar": "marzo de 2027",
          "comprobado": "2026-10-01"
        }
      },`, `        }
      },`)
enLugar('galeria_borghese', 'turnos de reserva: 5 de 2 horas', `      "turnos_reserva": [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
        "17:45"
      ]`, `      "turnos_reserva": [
        "09:00",
        "11:00",
        "13:00",
        "15:00",
        "17:00"
      ]`)

// ── Coliseo y Foro: el horario normal también en febrero y marzo de 2027 (fuera «sin verificar» y el patrón prudente) ──
for (const [id, abre] of [['coliseo', '08:30'], ['foro_romano_y_palatino', '09:00']]) {
  const inicio = texto.indexOf(`      "id": "${id}",\n`)
  let fin = texto.indexOf('\n    {\n      "id": ', inicio + 10)
  const trozo = texto.slice(inicio, fin)
  const a = trozo.indexOf('      "hours_audit": {')
  const b = trozo.indexOf('      },', a) + '      },'.length
  const nuevo = `      "hours_audit": {
        "confianza": "alta",
        "fuente": "https://colosseo.it/orari-e-biglietti/",
        "nota": "Horario normal de la web oficial, también en febrero y marzo de 2027: 29 mar–30 sep ${abre}-19:15 (última entrada 18:15); 1–24 oct ${abre}-18:30 (17:30); 25 oct–28 feb ${abre}-16:30 (15:30); marzo antes del cambio de hora ${abre}-17:00 y ${abre}-17:30 (tramos de la tabla). Cierra el 25 de diciembre y el 1 de enero.",
        "comprobado_web": "${WEB}: horario normal, también febrero y marzo de 2027. Cierra 25 dic y 1 ene.",
        "fecha": "${FECHA}"
      },`
  const viejo = trozo.slice(a, b)
  if (viejo === nuevo) continue
  texto = texto.slice(0, inicio) + trozo.replace(viejo, nuevo) + texto.slice(fin)
  cambios.push(`${id}: hours_audit`)
}
guardar()

// ───────────────────────── fichas ampliadas ─────────────────────────
abrir('data/pipeline_v2/detalle/roma/villa_borghese.json')
global('ficha Galería: última entrada', `            "hours": "09:00–19:00",
            "last_entry": "17:45"`, `            "hours": "09:00–19:00",
            "last_entry": "17:00"`)
global('ficha Galería: notas', `Turnos cada hora desde las 09:00 hasta las 17:45.`, `Turnos de 2 horas: 9:00, 11:00, 13:00, 15:00 y 17:00.`)
global('ficha Galería: consejo del último turno', `El último turno (17:45) es más corto (solo hasta las 19:00) pero también tranquilo.`, `El último turno (17:00) acaba a las 19:00, cuando cierra, y también es tranquilo.`)
guardar()

abrir('data/pipeline_v2/detalle/roma/centro_historico.json')
global('ficha Panteón: todos los días 09:00-19:00', `          {
            "dates": "Todo el año (lun–sáb)",
            "hours": "09:00–19:00",
            "last_entry": "18:45"
          },
          {
            "dates": "Todo el año (dom)",
            "hours": "09:00–18:00",
            "last_entry": "17:45"
          }
        ],
        "closed": [
          "1 ene",
          "15 ago",
          "25 dic"
        ],`, `          {
            "dates": "Todo el año (todos los días)",
            "hours": "09:00–19:00",
            "last_entry": "18:30"
          }
        ],
        "closed": [
          "1 ene",
          "25 dic"
        ],`)
guardar()

console.log(cambios.length ? `Hecho (${cambios.length}):\n- ${cambios.join('\n- ')}` : 'Nada que cambiar: ya estaba aplicado.')
