/**
 * LOS CRÉDITOS (Tanda 6z6d): lo que las licencias de nuestras fuentes piden citar, en una página al final del Perfil y no en las pantallas (decidido por Eric el 10-oct-2026). Una sola lista: si una fuente nueva pide
 * citarla, se añade aquí.
 *  · Open-Meteo: sus datos van con licencia CC BY 4.0, que pide citar la fuente, enlazar la licencia e indicar si se cambió algo. Lo pide también con el plan de pago.
 *  · Mapbox y OpenStreetMap: los mapas y las búsquedas de lugares. Cada mapa ya lleva su aviso pequeño; aquí queda también por escrito.
 *  · Fotos de lugares (Tanda 6y2: la cabecera de las excursiones lleva el crédito en pequeño sobre una esquina de la foto; las fotos pequeñas de las tarjetas, ninguna línea): las de Unsplash llevan el nombre de su autor y su enlace bajo la foto (ficha de la parada); las de Wikipedia/Wikimedia Commons llevan autor y licencia bajo la foto (Tanda 6z6f, data/dias/<destino>/_fotos_wikimedia.json; las de dominio público, nada). Las fotos propias (de Eric) NUNCA llevan crédito, ni aquí ni en pantalla (Tanda 6z6e).
 * Las empresas con las que tenemos enlaces de compra no piden que se las cite, así que no salen. Las fotos propias y las del viajero no llevan crédito.
 */
export interface Credito {
  clave: string
  titulo: string
  texto: string
  enlaces: { texto: string; url: string }[]
}

export const CREDITOS: Credito[] = [
  {
    clave: 'tiempo',
    titulo: 'El tiempo',
    texto: 'Los datos del tiempo son de Open-Meteo.com y se usan con la licencia CC BY 4.0. Mostramos las temperaturas redondeadas y no cambiamos nada más.',
    enlaces: [
      { texto: 'Weather data by Open-Meteo.com', url: 'https://open-meteo.com/' },
      { texto: 'Licencia CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    ],
  },
  {
    clave: 'mapas',
    titulo: 'Mapas y lugares',
    texto: 'Los mapas y la búsqueda de lugares son de Mapbox, con datos de los colaboradores de OpenStreetMap.',
    enlaces: [
      { texto: '© Mapbox', url: 'https://www.mapbox.com/about/maps/' },
      { texto: '© colaboradores de OpenStreetMap', url: 'https://www.openstreetmap.org/copyright' },
    ],
  },
  {
    clave: 'fotos',
    titulo: 'Fotos de los lugares',
    texto: 'Las fotos de los lugares que vienen de fuera son de Wikipedia (Wikimedia Commons) y de Unsplash. Las de Wikipedia llevan su autor y su licencia bajo la foto, en la ficha de la parada, y en la cabecera de las excursiones, en pequeño sobre una esquina de la foto (las de dominio público no). Las de Unsplash llevan el nombre de su autor y su enlace. En las fotos pequeñas de las tarjetas no hay línea: su crédito está en la ficha del lugar y aquí.',
    enlaces: [
      { texto: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/' },
      { texto: 'Unsplash', url: 'https://unsplash.com/' },
    ],
  },
]
