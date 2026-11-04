// (Tanda LL, parte 2, Roma) Escribe `hora_util` en data/dias/roma/_llegada.json (la tabla 5.1 de docs/llegadas/ROMA_LLEGADAS_ANALISIS.md, comprobada con los tramos del propio fichero)
// y `instalarse_min` en roma.json › destination_config.llegada.  node scripts/destino/romaLlegadasHoraUtil.mjs
import fs from 'node:fs'
const RUTA = 'data/dias/roma/_llegada.json'
const texto = fs.readFileSync(RUTA, 'utf8')
const j = JSON.parse(texto)
j.hora_util = {
  _nota: 'Tanda LL, parte 2 (Eric, 4-nov-2026). UNA SOLA CUENTA de la hora útil y de la hora de irse (shared/arrival/horaUtil.js): hora útil = aterrizas + salir del punto + trayecto a la zona + instalarse (destination_config.llegada.instalarse_min); hora de irse = billete − antes del billete − trayecto desde la zona − maleta. Los trayectos son puerta a puerta con el transporte que recomienda la app (esperas y andar incluidos) y son ESTIMACIONES: contrastadas con los tiempos de `tramos` (Leonardo 32 min, autobús de Fiumicino 45-50, FL1 27, Airlink de Ciampino, autobús de Ciampino 40, metro B Tiburtina-Termini 10, tren de Civitavecchia 60-80). `al_centro_min` de cada punto NO se toca: lo sigue leyendo la ficha «en el centro a las…».',
  comprobado: '2026-11-04',
  salir_del_punto_min: { fco: 45, cia: 45, termini: 10, tiburtina: 10, civitavecchia: 45 },
  antes_del_billete_min: { avion: 120, tren: 30, bus: 30, ferry: 120 },
  maleta_min: 30,
  trayectos: {
    termini: { fco: 50, cia: 45, termini: 10, tiburtina: 20, civitavecchia: 90 },
    monti: { fco: 60, cia: 55, termini: 15, tiburtina: 25, civitavecchia: 100 },
    plaza_de_espana: { fco: 65, cia: 60, termini: 20, tiburtina: 30, civitavecchia: 105 },
    centro: { fco: 70, cia: 65, termini: 25, tiburtina: 35, civitavecchia: 105 },
    prati: { fco: 70, cia: 70, termini: 25, tiburtina: 35, civitavecchia: 90 },
    trastevere: { fco: 60, cia: 75, termini: 30, tiburtina: 40, civitavecchia: 90 },
  },
}
fs.writeFileSync(RUTA, `${JSON.stringify(j, null, 2).replace(/\n/g, '\r\n')}\r\n`)

// roma.json: instalarse_min en destination_config.llegada (sustituye libre_extra_min). Se edita el texto para no reformatear el fichero.
const RJ = 'data/pipeline_v2/roma.json'
let r = fs.readFileSync(RJ, 'utf8')
if (!r.includes('"instalarse_min"')) {
  const antes = r.length
  r = r.replace(/"libre_extra_min": 30,/, '"instalarse_min": 60,
      "dia_entero_hasta": "09:30",')
  if (r.length === antes) throw new Error('no encuentro libre_extra_min en roma.json')
  fs.writeFileSync(RJ, r)
}
console.log('hecho')
