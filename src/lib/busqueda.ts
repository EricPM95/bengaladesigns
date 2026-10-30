/**
 * (Tanda 10S4, apartado 5) UNA sola forma de buscar para todos los buscadores de la app: sin acentos ni mayúsculas («cupula» = «Cúpula»), con palabras a medias («capito» → Museos Capitolinos),
 * con una letra equivocada («cupla», «capitolionos») y con el nombre en otros idiomas si el sitio lo trae entre sus alias («Cupola», «Musei Capitolini»). Pura, sin React.
 *
 * Uso: `buscar(lista, texto, (x) => [x.name, ...x.search_aliases])` devuelve los elementos que encajan, el mejor primero.
 * Cada texto de un elemento (su nombre, un alias) se puntúa aparte y se queda con el mejor; todas las palabras de lo escrito tienen que encajar con alguna palabra de ese texto.
 */

/** Minúsculas, sin acentos, sin signos: «Cúpula de San Pedro» → «cupula de san pedro». */
export function normalizarTexto(valor: string | null | undefined): string {
  return String(valor ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim()
}

/** Distancia de edición (Damerau-Levenshtein simple: sustituir, quitar, añadir y cambiar dos letras de sitio), con tope: pasado el tope devuelve tope + 1. */
export function distanciaDeEdicion(a: string, b: string, tope = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > tope) return tope + 1
  const filas: number[][] = []
  for (let i = 0; i <= a.length; i++) {
    filas[i] = [i]
    for (let j = 1; j <= b.length; j++) filas[i][j] = i === 0 ? j : 0
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1
      let valor = Math.min(filas[i - 1][j] + 1, filas[i][j - 1] + 1, filas[i - 1][j - 1] + coste)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) valor = Math.min(valor, filas[i - 2][j - 2] + 1)
      filas[i][j] = valor
    }
  }
  return filas[a.length][b.length]
}

/** Cuántas letras equivocadas se perdonan según lo largo que es lo escrito: ninguna con 1-3 letras, una con 4-7, dos con 8 o más. */
function erroresPerdonados(longitud: number): number {
  return longitud >= 8 ? 2 : longitud >= 4 ? 1 : 0
}

/** Puntos de UNA palabra escrita contra UNA palabra del texto: 100 igual, 80 empieza igual, 55 está dentro, 40 con letras equivocadas (al principio o entera); 0 si no encaja. */
function puntosDePalabra(escrita: string, palabra: string): number {
  if (escrita === palabra) return 100
  if (palabra.startsWith(escrita)) return 80
  if (escrita.length >= 3 && palabra.includes(escrita)) return 55
  const tolerancia = erroresPerdonados(escrita.length)
  if (tolerancia === 0) return 0
  // Entera («cupla» ≈ «cupula») o contra el principio de la palabra, de la misma longitud ±1 («capitolinis» ≈ «capitoli»·nos).
  if (distanciaDeEdicion(escrita, palabra, tolerancia) <= tolerancia) return 40
  for (const largo of [escrita.length - 1, escrita.length, escrita.length + 1]) {
    if (largo >= 3 && largo < palabra.length && distanciaDeEdicion(escrita, palabra.slice(0, largo), tolerancia) <= tolerancia) return 35
  }
  return 0
}

/** Puntos de lo escrito contra UN texto (un nombre o un alias): 0 si alguna palabra escrita no encaja; si no, la media, con un extra si el texto entero empieza igual. */
export function puntuarTexto(consulta: string, texto: string): number {
  const palabras = normalizarTexto(texto).split(' ').filter(Boolean)
  const escritas = normalizarTexto(consulta).split(' ').filter(Boolean)
  if (palabras.length === 0 || escritas.length === 0) return 0
  let suma = 0
  for (const escrita of escritas) {
    let mejor = 0
    for (const palabra of palabras) mejor = Math.max(mejor, puntosDePalabra(escrita, palabra))
    if (mejor === 0) return 0
    suma += mejor
  }
  const media = suma / escritas.length
  return media + (normalizarTexto(texto).startsWith(normalizarTexto(consulta)) ? 20 : 0)
}

/** Puntos de lo escrito contra varios textos de un mismo elemento (nombre y alias): el mejor. */
export function puntuar(consulta: string, textos: Array<string | null | undefined>): number {
  let mejor = 0
  for (const texto of textos) if (texto) mejor = Math.max(mejor, puntuarTexto(consulta, texto))
  return mejor
}

/** ¿Encaja lo escrito con alguno de los textos? (para filtros que solo necesitan sí o no). */
export function encaja(consulta: string, textos: Array<string | null | undefined>, minimo = 1): boolean {
  return normalizarTexto(consulta).length < minimo || puntuar(consulta, textos) > 0
}

/** Los elementos que encajan con lo escrito, el mejor primero (a igualdad, en su orden de siempre). Sin nada escrito, devuelve lista vacía: quien llama decide qué enseñar entonces. */
export function buscar<T>(elementos: readonly T[], consulta: string, textosDe: (elemento: T) => Array<string | null | undefined>, opciones: { max?: number; minimoDeLetras?: number } = {}): T[] {
  const { max = 8, minimoDeLetras = 2 } = opciones
  if (normalizarTexto(consulta).length < minimoDeLetras) return []
  return elementos
    .map((elemento, orden) => ({ elemento, orden, puntos: puntuar(consulta, textosDe(elemento)) }))
    .filter((fila) => fila.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos || a.orden - b.orden)
    .slice(0, max)
    .map((fila) => fila.elemento)
}
