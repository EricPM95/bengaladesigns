// Tanda 8B5: pone como fotos propias las 6 de Unsplash que eligió Eric (candidatas en docs/dias/notas_8b/candidatas_8b4.json).
//   node scripts/destino/aplicarFotosElegidas8b5.mjs
// Baja la foto (1600 px de ancho), saca la tarjeta (640 px), la apunta en data/dias/roma/_fotos.json con autor, enlace y licencia, y quita el sitio de sin_foto / fotos_rechazadas.
// Después: node scripts/generarMiniaturas.mjs y reiniciar el api-server.
import fs from 'node:fs'
import sharp from 'sharp'

const ELEGIDAS = [
  ['foro_romano_y_palatino', 2, ['Foro Romano y Palatino'], 'dia_foro_romano_y_palatino.jpg'],
  ['arco_de_constantino', 1, ['Arco de Constantino'], 'dia_arco_de_constantino.jpg'],
  ['panteon', 1, ['Panteón'], 'dia_panteon.jpg'],
  ['piazza_navona', 3, ['Piazza Navona'], 'dia_piazza_navona.jpg'],
  ['museos_vaticanos_y_capilla_sixtina', 2, ['Museos Vaticanos y Capilla Sixtina', 'Museos Vaticanos'], 'dia_museos_vaticanos.jpg'],
  ['columna_de_trajano', 2, ['Columna de Trajano'], 'dia_columna_de_trajano.jpg'],
]
const candidatas = JSON.parse(fs.readFileSync('docs/dias/notas_8b/candidatas_8b4.json', 'utf8'))
const archivoJson = 'data/dias/roma/_fotos.json'
const tabla = JSON.parse(fs.readFileSync(archivoJson, 'utf8'))
const DIR = 'public/fotos/roma'

for (const [id, opcion, lugares, archivo] of ELEGIDAS) {
  const c = candidatas.sitios.find((s) => s.id === id)?.candidatas.find((x) => x.opcion === opcion)
  if (!c) throw new Error(`Sin candidata ${id} ${opcion}`)
  const url = `${c.raw}${c.raw.includes('?') ? '&' : '?'}fm=jpg&q=85&w=2400`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo bajar ${id}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toFile(`${DIR}/${archivo}`)
  await sharp(buf).rotate().resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${DIR}/${archivo.replace(/\.jpg$/, '_p.jpg')}`)
  tabla.fotos = tabla.fotos.filter((f) => f.archivo !== archivo)
  tabla.fotos.push({
    archivo, lugares, cuando: 'dia', ancho: 1600, fuente: 'Unsplash', autor: c.autor, enlace: c.enlace,
    nota: `8B5: la opción ${opcion} que eligió Eric entre las candidatas de la 8B4 (Unsplash ${c.id_unsplash}).${id === 'piazza_navona' ? ' Su foto de día para todo el año; en las fechas del mercadillo (12-01 a 01-05) sigue ganando la de Navidad.' : ''}`,
    credito: { autor: c.autor, licencia: 'Licencia de Unsplash', enlace: c.enlace },
  })
  tabla.sin_foto = (tabla.sin_foto ?? []).filter((n) => !lugares.includes(n))
  tabla.fotos_rechazadas = (tabla.fotos_rechazadas ?? []).filter((r) => !lugares.includes(r.lugar))
  console.log('ok', archivo, c.autor)
}
fs.writeFileSync(archivoJson, JSON.stringify(tabla, null, 2) + '\n')
