// Un solo uso (2026-10-03, PARA_CODE_PENDIENTE A.4): los textos `por_fuera` de cinco lugares de Roma, insertados tras su `name` sin reformatear el fichero.
import { readFileSync, writeFileSync } from 'node:fs'
const textos = {
  'Basílica de San Pedro': 'Hoy la ves desde la plaza: la fachada y, detrás, la cúpula de Miguel Ángel. Busca uno de los dos discos de piedra del suelo, entre el obelisco y las fuentes: desde ahí, las cuatro filas de columnas de Bernini se ven como una sola.',
  'Cúpula de San Pedro': 'Hoy no se sube, pero se ve mejor de lejos: desde la plaza, la fachada la tapa en parte. Échate atrás por Via della Conciliazione y la verás entera.',
  'Basílica de Santa Cecilia in Trastevere': 'Hoy la ves por fuera: desde la verja se ve el patio con su jardín y, detrás, el campanario románico. Es uno de los rincones más tranquilos de Trastevere.',
  'Iglesia de San Ignacio de Loyola': "Hoy la ves por fuera, y la plaza es lo mejor: Piazza di Sant'Ignazio parece un decorado de teatro, con sus edificios curvos del siglo XVIII mirando a la fachada.",
  'Iglesia de Santa Maria sopra Minerva': 'Hoy la ves por fuera: delante tienes el Elefantino de Bernini, un elefante que carga un obelisco egipcio. Detrás de esa fachada tan sencilla está la única iglesia gótica de Roma.',
}
const path = 'data/pipeline_v2/roma.json'
let text = readFileSync(path, 'utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
for (const [name, texto] of Object.entries(textos)) {
  const line = `      "name": ${JSON.stringify(name)},${eol}`
  const count = text.split(line).length - 1
  if (count !== 1) {
    console.log('NO ÚNICO', name, count)
    continue
  }
  text = text.replace(line, `${line}      "por_fuera": ${JSON.stringify(texto)},${eol}`)
  console.log('ok', name)
}
JSON.parse(text)
writeFileSync(path, text)
