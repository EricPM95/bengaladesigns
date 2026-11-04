// Genera data/dias/lanzarote/_ll.json: el día de llegada (filas A a F, por zona) y el día de vuelta (filas V0 a V5, por zona) de Lanzarote.
// Sale de docs/llegadas/LANZAROTE_LLEGADAS_PROPUESTA.md (apartados 3 y 5) con las decisiones de Eric del 4-nov. Cada lista usa el mismo formato de filas que listas.json
// (tipo parada, lugar = nombre del sitio en lanzarote.json, min, opcional...). Campos nuevos: `llegar_sol_menos` (no antes de N min antes del atardecer), `parada` (aparcamiento propio).
//   node scripts/destino/lanzaroteLlegadasDatos.mjs
import fs from 'node:fs'

const P = (lugar, min, extra = {}) => ({ tipo: 'parada', lugar, ...(min ? { min } : {}), opcional: true, ...extra })
const ANCLA = (lugar, min, extra = {}) => P(lugar, min, { opcional: false, ...extra }) // la parada que no se quita
const CHARCO = (extra = {}) => P('Arrecife: Charco de San Ginés y el paseo', 60, { llegar_sol_menos: 30, al_caer_la_tarde: true, ...extra })
const FUND = (m = 90) => P('Fundación César Manrique', m)
const CACTUS = () => P('Jardín de Cactus', 60)
const TEG = (m = 60) => P('Teguise (villa)', m)
const CAMP = () => P('Casa-Museo del Campesino', 50)
const GRIETAS = () => P('Las Grietas (Montaña Blanca)', 40)
const CASTILLO = () => P('Castillo de San José', 45)
const LAGOMAR = () => P('LagOmar', 60)
const PUERTO_VIEJO = (extra = {}) => P('Puerto del Carmen (Puerto Viejo)', 60, extra)
const ARRIETA = (extra = {}) => P('Punta Mujeres y Arrieta (La Garita)', 60, extra)
const FAMARA = (extra = {}) => P('Caleta de Famara y Playa de Famara', 60, { llegar_sol_menos: 30, ...extra })
const PAPAGAYO = (m) => P('Playas de Papagayo', m)
const PASEO_PB = () => P('Playa Blanca y el Faro de Pechiguera', 45, { titulo: 'El paseo marítimo de Playa Blanca' })
const FARO = (extra = {}) => P('Playa Blanca y el Faro de Pechiguera', 45, { titulo: 'Faro de Pechiguera', parada: 'faro_de_pechiguera', hasta_atardecer: true, ...extra })
const REDUCTO = () => P('Playa del Reducto', 45, { parada: 'playa_del_reducto' })

const TEG_COMIDA = (hora = '13:00') => ({ zona: 'en Teguise', hora_aprox: hora, lista: 'D3_comida' })
const MR_COMIDA = (hora = '14:00') => ({ zona: 'en Marina Rubicón', hora_aprox: hora, lista: 'D4_comida' })

const dia = (manana, comida, tarde) => ({ manana, comida: comida ?? null, tarde })
const sinRuta = () => dia([], null, [])

// ── La llegada, por zona. A y B cuentan el D3 (D4 en Playa Blanca) como hecho (`absorbe` lo pone el motor). El domingo, su versión (mercadillo de Teguise 9:00-14:00).
const manriqueEnCasa = (inicio) => ({
  A: dia([FUND(), CACTUS()], TEG_COMIDA(), [TEG(), CAMP(), CHARCO()]),
  B: dia([FUND()], TEG_COMIDA('14:00'), [TEG(), CHARCO()]),
  ...inicio,
})
const domingoManrique = {
  domingoA: dia([TEG(75)], TEG_COMIDA('12:30'), [CACTUS(), FUND(), CHARCO()]),
  domingoB: dia([], TEG_COMIDA('12:30'), [TEG(60), FUND(), CHARCO()]),
}

const llegada = {
  costa_teguise: { ...manriqueEnCasa({ C: dia([CASTILLO()], null, [CHARCO({ opcional: false })]), D: dia([], null, [CHARCO({ opcional: false })]) }), ...domingoManrique },
  arrecife: { ...manriqueEnCasa({ C: dia([CASTILLO()], null, [CHARCO({ opcional: false })]), D: dia([], null, [CHARCO({ opcional: false })]) }), ...domingoManrique },
  puerto_del_carmen: {
    A: dia([FUND(), CACTUS()], TEG_COMIDA(), [TEG(), CAMP(), CHARCO()]),
    B: dia([FUND()], TEG_COMIDA('14:00'), [TEG(), PUERTO_VIEJO({ opcional: false, llegar_sol_menos: 30 })]),
    C: dia([GRIETAS()], null, [PUERTO_VIEJO({ opcional: false, llegar_sol_menos: 30 })]),
    D: dia([], null, [PUERTO_VIEJO({ opcional: false, llegar_sol_menos: 30 })]),
    ...domingoManrique,
  },
  playa_blanca: {
    A: dia([PAPAGAYO(120)], MR_COMIDA(), [PASEO_PB(), FARO({ opcional: false })]),
    B: dia([], MR_COMIDA('13:30'), [P('Playas de Papagayo', 90, { hasta_hora: '16:15' }), PASEO_PB(), FARO({ opcional: false })]),
    C: dia([], null, [PASEO_PB(), FARO({ opcional: false })]),
    D: dia([], null, [FARO({ opcional: false })]),
  },
  el_norte: {
    A: dia([CACTUS(), FUND()], TEG_COMIDA(), [TEG(), CAMP(), ARRIETA({ llegar_sol_menos: 30 })]),
    B: dia([CACTUS()], TEG_COMIDA('14:00'), [FUND(), ARRIETA({ llegar_sol_menos: 30 })]),
    C: dia([CACTUS()], null, [ARRIETA({ opcional: false, llegar_sol_menos: 30 })]),
    D: dia([], null, [ARRIETA({ opcional: false, llegar_sol_menos: 30 })]),
    ...domingoManrique,
  },
  el_interior: {
    A: dia([FUND(), CACTUS()], TEG_COMIDA(), [TEG(), CAMP(), FAMARA()]),
    B: dia([TEG()], TEG_COMIDA('14:00'), [CAMP(), FAMARA({ opcional: false })]),
    C: dia([CAMP()], null, [FAMARA({ opcional: false })]),
    D: dia([], null, [FAMARA({ opcional: false })]),
    ...domingoManrique,
  },
}
for (const z of Object.values(llegada)) { z.E = sinRuta(); z.F = sinRuta() }
// El verano (el atardecer pasa de las 20:30): un rato de playa antes.
const verano = {
  costa_teguise: { C: [REDUCTO()] }, arrecife: { C: [REDUCTO()] }, el_norte: { C: [P('Playa de La Garita', 60)] },
}

// ── La vuelta, por zona. `d3_corto`: el D3 corto del día de vuelta cuando el vuelo sale a las 17:00 o más tarde y el D3 sigue en el viaje.
const D3_CORTO = dia([FUND(), CACTUS()], TEG_COMIDA('13:00'), [TEG(40)])
const generica = (z) => ({
  V2: z.V2, V3: z.V3, V4: z.V4, V5: z.V5,
})
const vuelta = {
  costa_teguise: {
    V2: dia([CACTUS(), CASTILLO()], null, []),
    V3: dia([LAGOMAR(), CASTILLO()], { zona: 'en Arrecife', hora_aprox: '13:15', lista: null }, []),
    V4: dia([CACTUS(), TEG(45), LAGOMAR()], TEG_COMIDA(), [CAMP(), GRIETAS(), CASTILLO()]),
    V5: dia([CACTUS(), TEG(45), LAGOMAR()], TEG_COMIDA(), [CAMP(), GRIETAS(), CASTILLO(), CHARCO()]),
  },
  puerto_del_carmen: {
    V2: dia([PUERTO_VIEJO(), GRIETAS()], null, []),
    V3: dia([PUERTO_VIEJO(), CAMP()], { zona: 'en Teguise', hora_aprox: '13:00', lista: 'D3_comida' }, [FUND()]),
    V4: dia([CAMP(), GRIETAS()], TEG_COMIDA(), [TEG(45), FUND()]),
    V5: dia([CAMP(), GRIETAS()], TEG_COMIDA(), [TEG(45), FUND(), PUERTO_VIEJO({ llegar_sol_menos: 30 })]),
  },
  playa_blanca: {
    V2: dia([PUERTO_VIEJO()], null, [PASEO_PB()]),
    V3: dia([PAPAGAYO(120)], MR_COMIDA('13:00'), []),
    V4: dia([PAPAGAYO(150)], MR_COMIDA('13:30'), [PASEO_PB(), PUERTO_VIEJO()]),
    V5: dia([PAPAGAYO(150)], MR_COMIDA('13:30'), [PASEO_PB(), FARO({ opcional: false })]),
  },
  el_norte: {
    V2: dia([ARRIETA(), CACTUS()], null, []),
    V3: dia([ARRIETA(), CACTUS()], TEG_COMIDA(), []),
    V4: dia([CACTUS(), TEG(45)], TEG_COMIDA(), [CAMP(), FUND()]),
    V5: dia([CACTUS(), TEG(45)], TEG_COMIDA(), [CAMP(), FUND(), CHARCO()]),
  },
  el_interior: {
    V2: dia([CAMP(), GRIETAS()], null, [FUND()]),
    V3: dia([CAMP(), GRIETAS(), FUND()], null, []),
    V4: dia([CACTUS(), TEG(45)], TEG_COMIDA(), [CAMP(), GRIETAS()]),
    V5: dia([CACTUS(), TEG(45)], TEG_COMIDA(), [CAMP(), GRIETAS(), CHARCO()]),
  },
}
vuelta.arrecife = vuelta.costa_teguise
vuelta.nose = vuelta.costa_teguise
for (const z of Object.values(vuelta)) { z.V0 = sinRuta(); z.V1 = sinRuta() }

const salida = {
  _nota: 'LL (4-nov): el día de llegada (filas A a F) y el de vuelta (V0 a V5) de Lanzarote, por zona. Generado por scripts/destino/lanzaroteLlegadasDatos.mjs desde docs/llegadas/LANZAROTE_LLEGADAS_PROPUESTA.md. No editar a mano.',
  constantes: { salir_aeropuerto_min: 45, recoger_coche_min: 60, instalarse_min: 60, devolver_coche_min: 30, aeropuerto_min: 120 },
  llegada, verano, vuelta, d3_corto: D3_CORTO,
}
fs.writeFileSync('data/dias/lanzarote/_ll.json', JSON.stringify(salida, null, 1) + '\n')
console.log('data/dias/lanzarote/_ll.json escrito')
