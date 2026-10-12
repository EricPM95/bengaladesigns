// Tanda 6y9, agente F: textos de las fichas y de los días escritos de Roma.
//   P15: las 11 correcciones de datos que Eric confirmó (la 10, Piazza del Popolo, se deja como está).
//   P16: los superlativos de data/pipeline_v2/roma.json y docs/roma_por_que.json, suavizados igual.
//   node scripts/destino/corregirFichas6y9.mjs      (se puede repetir: lo que ya está cambiado no se toca)
// Hace reemplazos puntuales de texto sobre el fichero tal cual está escrito (sin reformatear nada: git diff mínimo).
// No toca horarios (schedule, by_season...) ni las historias (son de Eric). La lista antes → después está en docs/dias/INFORME_PARTE_FICHAS_TANDA6Y9.md.
import fs from 'node:fs'

const D = 'data/pipeline_v2/detalle/roma/'

// [fichero, antes, después] — cada frase de P15 tiene que salir exactamente 1 vez.
export const P15 = [
  // 1. Panteón: el rayo del 21 de abril es una teoría, no un hecho.
  ['centro_historico.json', 'al mediodía, el rayo de luz del óculo cae exactamente en la puerta de entrada — los romanos lo diseñaron así intencionadamente.', 'al mediodía, el rayo de luz del óculo cae exactamente en la puerta de entrada — se dice que lo diseñaron así.'],
  // 2. Obelisco de San Pedro: las dos frases dicen solo que lo trajo de Egipto Calígula.
  ['vaticano.json', 'El obelisco egipcio de 25 metros en el centro fue el único que nunca cayó desde la antigua Roma.', 'El obelisco de 25 metros del centro lo trajo de Egipto el emperador Calígula.'],
  ['vaticano.json', 'El obelisco central no tiene ninguna inscripción jeroglífica — es un obelisco romano mandado tallar en Egipto, no uno egipcio original. Calígula lo trajo en un barco especialmente construido para ello.', 'El obelisco central lo trajo de Egipto el emperador Calígula, en un barco especialmente construido para ello.'],
  // 3. Piazza Navona: el agua.
  ['centro_historico.json', 'Bernini la trazó subterráneamente hasta aquí.', 'El agua llegó a la plaza en el siglo XVI, y Bernini la aprovechó para su fuente.'],
  // 5. Altar de la Patria: fuera las 50 toneladas.
  ['roma_antigua.json', 'Las cuadrigas de bronce en la parte superior — cada una pesa 50 toneladas', 'Las cuadrigas de bronce en la parte superior'],
  // 6. Castillo de Sant'Angelo: Cellini preso; Cenci ejecutada junto al puente en 1599 (no presa en el castillo).
  ['vaticano.json', 'Las celdas de la prisión donde estuvo preso Benvenuto Cellini (y, según la tradición, Beatrice Cenci)', 'Las celdas de la prisión, donde estuvo preso Benvenuto Cellini; junto al puente fue ejecutada Beatrice Cenci en 1599'],
  // 7. San Pedro: la tumba del apóstol, bajo la basílica, en la necrópolis.
  ['vaticano.json', 'y las Grutas Vaticanas con la tumba de San Pedro. Todo es descomunal', 'y las Grutas Vaticanas; la tumba del apóstol Pedro está bajo la basílica, en la necrópolis. Todo es descomunal'],
  // 8. Cavalier d'Arpino: le confiscaron los cuadros, sin decir por qué.
  ['villa_borghese.json', "confiscó 100 cuadros de Cavaliere d'Arpino por impago de impuestos (incluyendo los Caravaggios)", "a Cavaliere d'Arpino le confiscaron sus 100 cuadros (incluyendo los Caravaggios)"],
  // 9. Piranesi: se cuenta, no está probado.
  ['roma_antigua.json', 'Alineó la cerradura, los setos y la cúpula a propósito.', 'Se cuenta que alineó la cerradura, los setos y la cúpula a propósito.'],
  // 11. Santa Maria in Trastevere: una de las más antiguas dedicadas a la Virgen, no «la primera».
  ['trastevere.json', 'Una de las iglesias más antiguas de Roma (fundada en el siglo III, reconstruida en el XII) y probablemente la primera dedicada a la Virgen María.', 'Una de las iglesias más antiguas de Roma dedicadas a la Virgen María (fundada en el siglo III, reconstruida en el XII).'],
  ['trastevere.json', 'fundaron aquí la primera iglesia mariana de Roma.', 'fundaron aquí una de las iglesias más antiguas de Roma dedicadas a la Virgen.'],
  // 12. San Clemente: banquetes rituales, sin sangre de toro.
  ['roma_antigua.json', 'se celebraban rituales con sangre de toro exactamente debajo', 'se celebraban banquetes rituales exactamente debajo'],
]

// 4. Torre Argentina: se quita entera la frase de la «batalla» con Mussolini (es el último elemento de «secrets»: se quita también la coma anterior).
const QUITAR_BATALLA = {
  fichero: 'centro_historico.json',
  regex: /(Debajo apareció un trozo de la Roma republicana intacto\.")\s*,\s*\r?\n\s*"Mussolini quería demoler los templos para ensanchar la avenida, pero los arqueólogos ganaron la batalla[^"]*"/,
  despues: '$1',
}

// P16: [antes, después]; se cambian TODAS las apariciones (el mismo texto sale varias veces en roma.json).
export const P16 = [
  ['La fuente más famosa del mundo, y desde la plaza se ve gratis.', 'Una de las fuentes más famosas del mundo, y desde la plaza se ve gratis.'],
  ['La escalinata más famosa del mundo, con la iglesia', 'Una de las escalinatas más famosas del mundo, con la iglesia'],
  ['La mejor colección de Bernini y Caravaggio del mundo, en la villa', 'Una de las mejores colecciones de Bernini y Caravaggio, en la villa'],
  ['Dentro está la mejor colección de Bernini del mundo:', 'Dentro está una de las mejores colecciones de Bernini:'],
  ['Explora el puerto romano mejor conservado del mundo.', 'Explora uno de los puertos romanos mejor conservados.'],
  ['La mejor pizza al taglio del mundo (cerca del Vaticano)', 'Una de las mejores pizzas al taglio (cerca del Vaticano)'],
  ['La iglesia más grande del mundo, y entrar es gratis.', 'Una de las iglesias más grandes del mundo, y entrar es gratis.'],
  ['Los museos públicos más antiguos del mundo, en la plaza', 'Considerados los museos públicos más antiguos del mundo, en la plaza'],
  ['El museo público más antiguo del mundo — la Loba', 'Considerado el museo público más antiguo del mundo — la Loba'],
  ['Los baños públicos más grandes de la antigua Roma', 'Entre los baños públicos más grandes de la antigua Roma'],
  ['El barrio judío más antiguo de Europa', 'Uno de los barrios judíos más antiguos de Europa'],
  ['El primer centro comercial de la historia', 'Considerado el primer centro comercial de la historia'],
  ['El forno más famoso de Roma desde 1824.', 'Uno de los fornos más famosos de Roma, desde 1824.'],
  ['El tiramisú más famoso de Roma, desde 1960', 'Uno de los tiramisús más famosos de Roma, desde 1960'],
  ['La calle de compras más famosa de Roma', 'Una de las calles de compras más famosas de Roma'],
  ['hoy es la perspectiva más famosa del Vaticano.', 'hoy es una de las perspectivas más famosas del Vaticano.'],
  ['La calzada romana mejor conservada, con su', 'Una de las calzadas romanas mejor conservadas, con su'],
  ['La calzada más famosa de la antigua Roma, con sus', 'Una de las calzadas más famosas de la antigua Roma, con sus'],
  ['El barrio más antiguo de Roma, a dos pasos del Coliseo', 'Uno de los barrios más antiguos de Roma, a dos pasos del Coliseo'],
]
const FICHEROS_P16 = ['data/pipeline_v2/roma.json', 'docs/roma_por_que.json']

const esc = (s) => JSON.stringify(s).slice(1, -1)

// Una frase de la ficha: debe salir exactamente 1 vez (o ya estar cambiada).
function aplicarUna(texto, antes, despues, etiqueta) {
  const a = esc(antes), d = esc(despues)
  if (!texto.includes(a)) {
    if (texto.includes(d)) return { texto, hecho: false }
    throw new Error(`${etiqueta}: no encuentro la frase: ${antes.slice(0, 70)}`)
  }
  const n = texto.split(a).length - 1
  if (n !== 1) throw new Error(`${etiqueta}: la frase sale ${n} veces (debería salir 1): ${antes.slice(0, 70)}`)
  return { texto: texto.replace(a, () => d), hecho: true }
}

function aplicar() {
const cambios = []
for (const f of new Set(P15.map((c) => c[0]))) {
  const ruta = D + f
  let t = fs.readFileSync(ruta, 'utf8')
  for (const [, antes, despues] of P15.filter((c) => c[0] === f)) {
    const r = aplicarUna(t, antes, despues, ruta)
    t = r.texto
    if (r.hecho) cambios.push(`${ruta}: ${antes.slice(0, 60)}`)
  }
  if (f === QUITAR_BATALLA.fichero) {
    if (QUITAR_BATALLA.regex.test(t)) {
      t = t.replace(QUITAR_BATALLA.regex, QUITAR_BATALLA.despues)
      cambios.push(`${ruta}: (quitada la frase de la batalla con Mussolini)`)
    } else if (/ganaron la batalla/.test(t)) throw new Error('Torre Argentina: la frase de la batalla no tiene la forma esperada')
  }
  fs.writeFileSync(ruta, t)
}
for (const ruta of FICHEROS_P16) {
  let t = fs.readFileSync(ruta, 'utf8')
  for (const [antes, despues] of P16) {
    const a = esc(antes), d = esc(despues)
    const n = t.split(a).length - 1
    if (n === 0) continue
    t = t.split(a).join(d)
    cambios.push(`${ruta}: ${antes.slice(0, 55)} (x${n})`)
  }
  fs.writeFileSync(ruta, t)
}
for (const f of [...new Set(P15.map((c) => D + c[0])), ...FICHEROS_P16]) JSON.parse(fs.readFileSync(f, 'utf8'))
console.log(cambios.join('\n'))
console.log(`Cambios aplicados: ${cambios.length}`)
}
if (process.argv[1] && process.argv[1].endsWith('corregirFichas6y9.mjs')) aplicar()
