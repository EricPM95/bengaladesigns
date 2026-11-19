/**
 * (V20) «CUÉNTANOS»: los ocho tipos de aviso que el viajero puede mandar y sus datos (Design «Cuentanos Boton», U1 a U4). Puro: sin React ni red.
 * El contrato con el servidor (server/avisosViajeros.js, tabla `avisos_de_viajeros`) está en `docs/dias/REPASO_V20.html`.
 */
export type TipoAviso = 'restaurante' | 'lugar' | 'destino' | 'foto' | 'dato_mal' | 'consejo' | 'no_funciona' | 'idea'

export interface MetaDeTipo {
  id: TipoAviso
  /** El botón grande de U1. */
  boton: string
  sub: string
  /** El título de su pantalla. */
  titulo: string
  /** Colores del cuadro de icono (fondo y trazo), los de Design. */
  fondo: string
  trazo: string
  /** El trazo del icono (viewBox 24). */
  icono: string
}

const P = {
  rest: 'M7 3v8a3 3 0 0 0 3 3v7M7 3v5M10 3v5M17 3c-2 2-2 6 0 8v10',
  pin: 'M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  edit: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  warn: 'M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  idea: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  cam: 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
}
export const ICONOS_CUENTANOS = { ...P, check: 'M5 12.5l4.5 4.5L19 7.5' }

/** Los 8 botones de U1, en su orden (2 × 4). */
export const TIPOS: MetaDeTipo[] = [
  { id: 'restaurante', boton: 'Añadir un restaurante', sub: 'Un sitio para comer', titulo: 'Añadir un restaurante', fondo: '#F9E4D8', trazo: '#A8481C', icono: P.rest },
  { id: 'lugar', boton: 'Añadir un lugar', sub: 'Algo que ver o hacer', titulo: 'Añadir un lugar', fondo: '#DDEBFA', trazo: '#1F5CA8', icono: P.pin },
  { id: 'destino', boton: 'Añadir un destino', sub: 'Una ciudad o un país', titulo: 'Añadir un destino', fondo: '#D8F0EE', trazo: '#16706A', icono: P.globe },
  { id: 'foto', boton: 'Comparte tu foto', sub: 'Para que salga en la app', titulo: 'Comparte tu foto', fondo: '#FCE3EC', trazo: '#A02A5A', icono: P.cam },
  { id: 'dato_mal', boton: 'Un dato está mal', sub: 'Horario, precio, cerrado…', titulo: 'Un dato está mal', fondo: '#FBEFC8', trazo: '#8A6210', icono: P.edit },
  { id: 'consejo', boton: 'Un consejo', sub: '«Llega antes de las 9»', titulo: 'Un consejo', fondo: '#DDF1DC', trazo: '#2F6B43', icono: P.bulb },
  { id: 'no_funciona', boton: 'Algo no funciona', sub: 'En la app', titulo: 'Algo no funciona', fondo: '#FADCDC', trazo: '#A32A2A', icono: P.warn },
  { id: 'idea', boton: 'Una idea', sub: 'Para mejorar JUTRIP', titulo: 'Una idea', fondo: '#F1E6FA', trazo: '#6A3A9A', icono: P.idea },
]
export const metaDe = (tipo: TipoAviso): MetaDeTipo => TIPOS.find((t) => t.id === tipo) ?? TIPOS[0]

export const FALLOS = [
  { id: 'horario', texto: 'Horario' },
  { id: 'precio', texto: 'Precio' },
  { id: 'cerrado', texto: 'Está cerrado' },
  { id: 'ubicacion', texto: 'Ubicación' },
  { id: 'foto', texto: 'La foto' },
  { id: 'otro', texto: 'Otro' },
] as const
export type FalloId = (typeof FALLOS)[number]['id']

export const CUANDOS = [
  { id: 'este_ano', texto: 'Este año' },
  { id: 'el_ano_que_viene', texto: 'El año que viene' },
  { id: 'algun_dia', texto: 'Algún día' },
] as const
export type CuandoId = (typeof CUANDOS)[number]['id']

export const PRECIOS = ['€', '€€', '€€€'] as const

export const TEXTO_LEGAL_NO_FUNCIONA = 'Con tu aviso enviamos la pantalla en la que estabas y el modelo de tu móvil, para encontrar el fallo.'
export const TEXTO_PERMISO_FOTO = 'Es mi foto y dejo que JUTRIP la use en la app con mi nombre'

export interface Punto {
  lat: number
  lng: number
  direccion?: string
}

/** Lo que el viajero rellena (todos los campos de todas las pantallas; cada pantalla usa los suyos). */
export interface Borrador {
  nombre: string
  precio: (typeof PRECIOS)[number] | null
  bueno: string
  porque: string
  sitio: { nombre: string; id?: string } | null
  falla: FalloId | null
  mas: string
  consejo: string
  que: string
  texto: string
  destino: string
  cuando: CuandoId | null
  acepta: boolean
  nombreEnFoto: string
  punto: Punto | null
  avisame: boolean
}

export const borradorVacio = (): Borrador => ({
  nombre: '', precio: null, bueno: '', porque: '', sitio: null, falla: null, mas: '', consejo: '', que: '', texto: '', destino: '', cuando: 'el_ano_que_viene', acepta: false, nombreEnFoto: '', punto: null, avisame: true,
})

const largo = (t: string, min = 2): boolean => t.trim().length >= min

/** Pura: ¿se puede enviar este aviso? (lo mínimo de cada pantalla; lo «opcional» no se pide). `fotos` = cuántas lleva. */
export function avisoValido(tipo: TipoAviso, b: Borrador, fotos = 0): boolean {
  switch (tipo) {
    case 'restaurante':
    case 'lugar':
      return largo(b.nombre)
    case 'dato_mal':
      return Boolean(b.sitio && largo(b.sitio.nombre)) && b.falla !== null
    case 'consejo':
      return Boolean(b.sitio && largo(b.sitio.nombre)) && largo(b.consejo, 3)
    case 'no_funciona':
      return largo(b.que, 3)
    case 'idea':
      return largo(b.texto, 3)
    case 'destino':
      return largo(b.destino) && b.cuando !== null
    case 'foto':
      // La casilla es obligatoria: sin ella no se puede enviar.
      return Boolean(b.sitio && largo(b.sitio.nombre)) && fotos >= 1 && b.acepta === true
  }
}

/** Pura: los datos del tipo, en la forma que espera el servidor (`datos`). */
export function datosDelAviso(tipo: TipoAviso, b: Borrador): Record<string, unknown> {
  const t = (x: string) => x.trim()
  switch (tipo) {
    case 'restaurante':
      return { nombre: t(b.nombre), precio: b.precio, ...(t(b.bueno) ? { bueno: t(b.bueno) } : {}) }
    case 'lugar':
      return { nombre: t(b.nombre), ...(t(b.porque) ? { porque: t(b.porque) } : {}) }
    case 'dato_mal':
      return { sitio: t(b.sitio?.nombre ?? ''), ...(b.sitio?.id ? { sitio_id: b.sitio.id } : {}), falla: b.falla, ...(t(b.mas) ? { mas: t(b.mas) } : {}) }
    case 'consejo':
      return { sitio: t(b.sitio?.nombre ?? ''), consejo: t(b.consejo) }
    case 'no_funciona':
      return { que: t(b.que) }
    case 'idea':
      return { texto: t(b.texto) }
    case 'destino':
      return { destino: t(b.destino), cuando: b.cuando, ...(t(b.mas) ? { mas: t(b.mas) } : {}) }
    case 'foto':
      return { sitio: t(b.sitio?.nombre ?? ''), nombre_en_foto: t(b.nombreEnFoto), acepta: b.acepta === true }
  }
}

/** Pura: «Gracias. Lo revisamos y, si encaja, lo añadimos.» y su segunda línea (U3, U2i-g, U2j-g). */
export function textosDeGracias(tipo: TipoAviso, avisame: boolean, tieneCuenta: boolean, destino = ''): { titulo: string; sub: string } {
  const avisa = avisame && tieneCuenta
  if (tipo === 'destino') return { titulo: `¡Apuntado! Te avisaremos cuando ${destino.trim() || 'ese destino'} esté en JUTRIP.`, sub: avisa ? 'Te avisaremos en la campana' : '' }
  if (tipo === 'foto') return { titulo: '¡Gracias! Si la elegimos, saldrá en la app con tu nombre.', sub: '' }
  return { titulo: 'Gracias. Lo revisamos y, si encaja, lo añadimos.', sub: avisa ? 'Te avisaremos en la campana' : '' }
}
