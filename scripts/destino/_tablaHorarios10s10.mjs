// (Tanda 10S10, apartado 2) Genera docs/dias/_10s10_tabla_horarios.json: qué sitios de Roma son «por dentro y por fuera» y cuáles «solo por dentro», con la frase del aviso, para el REPASO de Eric.
import fs from 'node:fs'
import { verPorDeLugar, nombreParaAviso, frasePorHora } from '../../shared/verPor.js'

const datos = JSON.parse(fs.readFileSync(new URL('../../data/pipeline_v2/roma.json', import.meta.url), 'utf8'))
const filas = []
for (const lugar of datos.places) {
  const verPor = verPorDeLugar(lugar)
  if (!verPor) continue
  const nombre = nombreParaAviso(lugar.name, lugar.id)
  const horario = Array.isArray(lugar.windows) ? lugar.windows.join(' y ') : (lugar.schedule ?? null)
  filas.push({
    id: lugar.id,
    nombre: lugar.name,
    ver_por: verPor,
    por_que: lugar.ver_por ? 'escrito en los datos' : lugar.id === 'galeria_borghese' ? 'decidido por Eric (1-nov)' : verPor === 'dentro_y_fuera' ? 'tiene texto «por fuera» en los datos' : 'se visita por dentro y no tiene texto «por fuera»',
    horario,
    frase_si_cerrado: frasePorHora({ tipo: 'cerrado', verPor, nombre }),
    frase_si_sin_abrir: frasePorHora({ tipo: 'sin_abrir', nombre }),
  })
}
const salida = {
  _nota: 'Generado por scripts/destino/_tablaHorarios10s10.mjs desde data/pipeline_v2/roma.json con shared/verPor.js. Para cambiar un sitio: escribe `ver_por` («dentro_y_fuera» o «solo_dentro») en el sitio del JSON, o añádelo a VER_POR_A_MANO en shared/verPor.js; el nombre de la frase, en NOMBRE_DE_AVISO.',
  dentro_y_fuera: filas.filter((f) => f.ver_por === 'dentro_y_fuera'),
  solo_dentro: filas.filter((f) => f.ver_por === 'solo_dentro'),
}
fs.writeFileSync(new URL('../../docs/dias/_10s10_tabla_horarios.json', import.meta.url), `${JSON.stringify(salida, null, 2)}\n`)
console.log('dentro_y_fuera:', salida.dentro_y_fuera.length, '| solo_dentro:', salida.solo_dentro.length)
for (const f of [...salida.dentro_y_fuera, ...salida.solo_dentro]) console.log(f.ver_por.padEnd(15), f.nombre.padEnd(48), '|', f.frase_si_cerrado)
