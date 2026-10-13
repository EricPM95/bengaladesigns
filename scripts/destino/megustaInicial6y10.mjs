// Los «me gusta» de partida de cada sitio (Tanda 6y10, punto 2). Son «me gusta» reales de las redes de Eric; como no sabe el número exacto, se pone una cifra POR DEBAJO de la real:
//   imprescindibles y nivel 1: de 100 a 199 · nivel 2: de 50 a 99 · nivel 3: 0 · los restaurantes que más salen en los días escritos (data/dias/roma/listas.json): de 100 a 199 · el resto de restaurantes: 0.
// La cifra de cada sitio sale del NOMBRE con una semilla fija (nunca al azar): correr esto dos veces da lo mismo. Se guarda en el propio sitio, en `megusta_inicial` (data/pipeline_v2/roma.json),
// y la nota «redes de Eric, aproximado por debajo del real» va una vez, en `megusta_inicial_nota`. El fichero se edita SOLO por líneas (se añade una línea por sitio, con la sangría del fichero):
// el resto del fichero no se reformatea.
//   node scripts/destino/megustaInicial6y10.mjs            escribe los campos (idempotente: quita los que hubiera y los vuelve a poner)
//   node scripts/destino/megustaInicial6y10.mjs --ver      solo enseña la tabla, sin escribir
import fs from 'node:fs'

const SEMILLA = 'megusta-6y10'
const FICHERO = 'data/pipeline_v2/roma.json'
const LISTAS = 'data/dias/roma/listas.json'
const NOTA = 'redes de Eric, aproximado por debajo del real'
/** Cuántos restaurantes llevan cifra: los 21 que más salen (el corte cae entre el 21 y el 22, que ya no empatan con él). */
const RESTAURANTES_CON_CIFRA = 21

/** Un número entre 0 y 1 que sale del texto y de la semilla (FNV-1a + mezcla), siempre el mismo. */
function huella(texto) {
  let h = 2166136261
  for (const c of `${SEMILLA}|${texto}`) {
    h ^= c.codePointAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822519) >>> 0
  h ^= h >>> 13
  h = Math.imul(h, 3266489917) >>> 0
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
const entre = (nombre, min, max) => min + Math.floor(huella(nombre) * (max - min + 1))

export function cifraPorNivel(nombre, nivel) {
  if (nivel === 1) return entre(nombre, 100, 199)
  if (nivel === 2) return entre(nombre, 50, 99)
  return 0
}

// ═══ Tanda 7 (Eric, 13-oct): los lugares ya no salen de la semilla, salen de un ORDEN escrito (de más a menos conocido) ═══
// Los seis primeros llevan cifras FIJAS (cada uno 15 o más por encima del siguiente, el primero por encima de 400). Todos los demás, por debajo de 290.
// Los rangos de siempre se quedan: imprescindibles y nivel 1 de 100 a 199 · nivel 2 de 50 a 99 · nivel 3 a 0. La excepción son los seis primeros (de 305 a 412, fuera de 100–199).
export const FIJAS = [
  ['Coliseo', 412],
  ['Fontana de Trevi', 391],
  ['Museos Vaticanos y Capilla Sixtina', 368],
  ['Basílica de San Pedro', 347],
  ['Panteón', 326],
  ['Plaza de España', 305],
]
/** El resto de imprescindibles y del nivel 1, de más a menos conocido (cifras de 199 a 139, de 15 en 15). */
export const ORDEN_NIVEL_1 = ['Piazza Navona', 'Foro Romano y Palatino', 'Plaza de San Pedro', 'Altar de la Patria', 'Arco de Constantino']
/** El nivel 2, de más a menos conocido (cifras de 99 a 52). */
export const ORDEN_NIVEL_2 = [
  'Galería Borghese', "Castillo de Sant'Angelo", 'Trastevere', 'Cúpula de San Pedro', 'Museos Capitolinos', 'Plaza del Campidoglio', 'Boca de la Verdad',
  'Basílica de San Juan de Letrán', 'Basílica de Santa María la Mayor', 'Termas de Caracalla', 'Circo Máximo', "Campo de' Fiori", 'Isla Tiberina',
  'Parque de Villa Borghese', 'Mirador del Janículo', 'Terraza del Pincio', 'Barrio Judío', 'Cripta de los Capuchinos', 'Basílica de San Clemente',
  'Domus Aurea', 'Piazza del Popolo', 'Trinità dei Monti', 'Iglesia de San Pietro in Vincoli', 'Ara Pacis', 'Iglesia de Santa Maria in Trastevere',
  'Santa Maria del Popolo', 'Iglesia de San Luigi dei Francesi', 'Iglesia del Gesù', 'Mercados de Trajano', 'Monti', 'Testaccio', 'Largo di Torre Argentina',
  'Villa Farnesina', 'Jardín de los Naranjos', 'San Pietro in Montorio y Tempietto de Bramante',
]
const CIFRA_N1 = (i) => 199 - i * 15
const CIFRA_N2 = (i) => Math.round(99 - i * 1.38)

/** La cifra de un lugar: fija (los seis primeros), por su sitio en el orden escrito, o la de siempre por nivel (nivel 3: 0; un lugar nuevo sin orden escrito cae a la semilla de su nivel). */
export function cifraDeLugar(nombre, nivel) {
  const fija = FIJAS.find(([n]) => n === nombre)
  if (fija) return fija[1]
  const i1 = ORDEN_NIVEL_1.indexOf(nombre)
  if (i1 >= 0) return CIFRA_N1(i1)
  const i2 = ORDEN_NIVEL_2.indexOf(nombre)
  if (i2 >= 0) return CIFRA_N2(i2)
  return cifraPorNivel(nombre, nivel)
}

/** Cuántas veces sale cada restaurante en los días escritos (comida y cena: el principal, la alternativa y la tercera, en todas las partes, variantes y pools). */
export function vecesPorRestaurante(listas, nombres) {
  const veces = new Map()
  const andar = (nodo) => {
    if (Array.isArray(nodo)) return nodo.forEach(andar)
    if (!nodo || typeof nodo !== 'object') return
    if ('restaurante' in nodo) for (const campo of ['restaurante', 'alternativa', 'tercera']) if (typeof nodo[campo] === 'string' && nombres.has(nodo[campo])) veces.set(nodo[campo], (veces.get(nodo[campo]) ?? 0) + 1)
    Object.values(nodo).forEach(andar)
  }
  andar(listas.dias)
  return [...veces.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
}

export function calcular() {
  const datos = JSON.parse(fs.readFileSync(FICHERO, 'utf8'))
  const listas = JSON.parse(fs.readFileSync(LISTAS, 'utf8'))
  const lugares = datos.places.map((p) => ({ tipo: 'places', nombre: p.name, nivel: p.level ?? null, cifra: cifraDeLugar(p.name, p.level ?? null) }))
  const ranking = vecesPorRestaurante(listas, new Set(datos.restaurants.map((r) => r.name)))
  const conCifra = new Map(ranking.slice(0, RESTAURANTES_CON_CIFRA).map(([nombre, veces]) => [nombre, veces]))
  const restaurantes = datos.restaurants.map((r) => ({ tipo: 'restaurants', nombre: r.name, veces: ranking.find(([n]) => n === r.name)?.[1] ?? 0, cifra: conCifra.has(r.name) ? entre(r.name, 100, 199) : 0 }))
  return { lugares, restaurantes, ranking }
}

function escribir({ lugares, restaurantes }) {
  const texto = fs.readFileSync(FICHERO, 'utf8')
  if (texto.includes('\r\n')) throw new Error('roma.json trae saltos de línea de Windows: este script espera \\n')
  // 1. Fuera lo que hubiera (para poder repetir el script).
  let lineas = texto.split('\n').filter((l) => !/^ {2,6}"megusta_inicial(_nota)?":/.test(l))
  // 2. Una línea por sitio, justo debajo de su `"name"` (sangría de 6 en el array de nivel superior).
  const cifras = { places: new Map(lugares.map((l) => [l.nombre, l.cifra])), restaurants: new Map(restaurantes.map((r) => [r.nombre, r.cifra])) }
  const salida = []
  let region = null
  const puestos = { places: 0, restaurants: 0 }
  for (const linea of lineas) {
    if (linea === '  "places": [') region = 'places'
    else if (linea === '  "restaurants": [') {
      region = 'restaurants'
      salida.push(`  "megusta_inicial_nota": ${JSON.stringify(NOTA)},`)
    } else if (/^ {2}\S/.test(linea) && region && !/^ {2}[\]}]/.test(linea)) region = null
    salida.push(linea)
    if (region) {
      const m = /^ {6}"name": (".*"),$/.exec(linea)
      if (m) {
        const nombre = JSON.parse(m[1])
        if (cifras[region].has(nombre)) {
          salida.push(`      "megusta_inicial": ${cifras[region].get(nombre)},`)
          puestos[region]++
        }
      }
    }
  }
  if (puestos.places !== lugares.length || puestos.restaurants !== restaurantes.length) throw new Error(`no se han puesto todos: lugares ${puestos.places}/${lugares.length}, restaurantes ${puestos.restaurants}/${restaurantes.length}`)
  const nuevo = salida.join('\n')
  JSON.parse(nuevo) // tiene que seguir siendo un JSON válido
  fs.writeFileSync(FICHERO, nuevo)
  return puestos
}

if (/megustaInicial6y10.mjs$/.test(process.argv[1] ?? '')) {
  const resultado = calcular()
  if (process.argv.includes('--ver')) {
    for (const l of resultado.lugares) console.log(`lugar\tnivel ${l.nivel}\t${l.cifra}\t${l.nombre}`)
    for (const r of resultado.restaurantes.filter((x) => x.cifra > 0)) console.log(`restaurante\t${r.veces} veces\t${r.cifra}\t${r.nombre}`)
  } else {
    console.log('puestos:', escribir(resultado))
  }
}
