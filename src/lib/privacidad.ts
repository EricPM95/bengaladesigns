import { CORREO_PRIVACIDAD, CORREO_SOPORTE } from './contacto'
/**
 * La estructura de la página de privacidad (cuentas, parte 1) y la lista de servicios de fuera que tratan datos. Los textos legales NO están escritos: cada apartado
 * lleva «Texto pendiente» hasta que Eric los escriba. La lista de servicios sale de lo que la app usa de verdad (ver docs/dias/INFORME_CUENTAS_1.md): si se añade o se
 * quita un servicio, se cambia aquí y la página lo enseña sola.
 */

export const TEXTO_PENDIENTE = 'Texto pendiente'

/** Tanda 10: lo que se guarda cuando alguien pide que le avisen de un destino que aún no tenemos (tabla `avisos_destino`, migración 0028). */
export const AVISO_DE_DESTINOS_PRIVACIDAD =
  'Avisos de destinos nuevos: si escribes un destino que aún no tenemos y pides que te avisemos, guardamos tu email y ese destino. Solo los usamos para avisarte cuando llegue ese destino.'

export interface ApartadoDePrivacidad {
  id: string
  titulo: string
  /** La pregunta a la que tiene que responder el texto que escriba Eric. */
  pregunta: string
  /** Líneas ya escritas (Tanda 10: el aviso de destinos). Salen encima del «Texto pendiente». */
  escrito?: string[]
}

/** (V20) Lo que manda el botón «Cuéntanos» y para qué (un solo sitio: lo enseña la página de privacidad). */
export const AVISO_DE_CUENTANOS_PRIVACIDAD =
  'Cuéntanos: cuando mandas un aviso (un sitio, un dato que está mal, una idea, una foto…) enviamos lo que escribes y, sin que tengas que escribir nada, el destino y el viaje, la pantalla en la que estabas, la versión de la app, el modelo de tu móvil y el navegador, y la hora, para poder encontrar el fallo o revisar el sitio. En «Algo no funciona» enviamos además los últimos errores de la app y la captura de la pantalla (puedes quitarla antes de enviar). Las fotos que acompañan un aviso se mandan reducidas; en «Comparte tu foto» se manda entera, con tu permiso (la casilla es obligatoria), la fecha y el nombre que pongas, y solo sale en la app con «Foto: tu nombre» si la elegimos. Si no tienes cuenta, o si apagas «Avísame», no guardamos nada que te identifique. Si tienes cuenta y dejas «Avísame» encendido, guardamos quién eres solo para avisarte en la campana cuando lo revisemos. Si no hay red, el aviso se guarda en tu móvil y se manda solo al volver.'

/** (V35B) El país donde vives: lo que preguntamos, para qué y cómo se cambia (un solo sitio: lo enseña la página de privacidad). */
export const AVISO_DE_PAIS_PRIVACIDAD =
  'País donde vives: en las primeras preguntas te preguntamos en qué país vives. Es opcional: puedes saltarlo, y lo puedes cambiar o quitar cuando quieras en Ajustes. Lo usamos para saber desde dónde viaja la gente y mejorar JUTRIP. Si te lo proponemos ya marcado, sale del idioma de tu móvil: nunca de tu ubicación ni de tu dirección IP. No lo enseñamos a nadie.'

/** (V35B) El uso de la app: lo mínimo que se guarda (un solo sitio: lo enseña la página de privacidad). */
export const AVISO_DE_USO_PRIVACIDAD =
  'Uso de la app: guardamos un día de uso por cuenta (la fecha, sin hora), el tipo de aparato (iPhone, Android u ordenador, sin el modelo) y si usas la app instalada en tu pantalla de inicio o desde el navegador. Lo usamos para saber cuánta gente usa JUTRIP y desde qué tipo de aparato, y así mejorarlo. Con esto no guardamos tu dirección IP ni tu ubicación.'

export const APARTADOS_DE_PRIVACIDAD: ApartadoDePrivacidad[] = [
  { id: 'quien', titulo: 'Quién es el responsable', pregunta: 'Quién trata tus datos y cómo contactar con él.', escrito: [`Para cualquier duda o para contactar con nosotros: ${CORREO_SOPORTE}.`] },
  { id: 'que-guardamos', titulo: 'Qué guardamos', pregunta: 'Tu email, tus viajes, tus Vistos, tus fotos (y la fecha y el sitio de cada una), tus logros y tus pases.' },
  {
    id: 'para-que',
    titulo: 'Para qué lo usamos',
    pregunta: 'Para qué sirve cada dato y en qué se basa tratarlo.',
    escrito: [AVISO_DE_DESTINOS_PRIVACIDAD, AVISO_DE_CUENTANOS_PRIVACIDAD, AVISO_DE_PAIS_PRIVACIDAD, AVISO_DE_USO_PRIVACIDAD],
  },
  { id: 'cuanto-tiempo', titulo: 'Cuánto tiempo lo guardamos', pregunta: 'Cuánto dura cada dato y qué pasa cuando dejas de usar la app.' },
  { id: 'con-quien', titulo: 'Con quién lo compartimos', pregunta: 'Los servicios de fuera que tratan datos para que la app funcione (lista de abajo).' },
  { id: 'como-borrarlo', titulo: 'Cómo borrarlo', pregunta: 'Cómo borrar tu cuenta y todo lo tuyo desde la app, y qué se borra.',
    escrito: [
      'Puedes borrar tu cuenta cuando quieras desde Ajustes, al final: «Borrar mi cuenta». Se borran tus viajes, fotos, logros y datos. Los pases que pagaste se pierden; los que usa otra persona pasan a ella.',
      'Por ley guardamos el registro de tus pagos (fecha e importe). Si no puedes entrar en la app, escríbenos y lo borramos nosotros: ' + CORREO_PRIVACIDAD + '.',
    ],
  },
  { id: 'tus-derechos', titulo: 'Tus derechos', pregunta: 'Acceder, corregir, llevarte tus datos y reclamar.' },
  { id: 'condiciones', titulo: 'Condiciones de uso y de compra', pregunta: 'Las reglas de uso de la app y de la compra del pase: qué incluye, el derecho de desistimiento en lo digital, las devoluciones y cómo reclamar.' },
  { id: 'a-quien-escribir', titulo: 'A quién escribir', pregunta: 'El correo para dudas de privacidad.', escrito: [`Para dudas de privacidad: ${CORREO_PRIVACIDAD}.`] },
]

export interface ServicioDeFuera {
  nombre: string
  /** Para qué lo usa la app, en una frase. */
  para: string
  /** Qué datos le llegan. */
  datos: string
}

/** Única página de la app que nombra empresas. */
export const SERVICIOS_DE_FUERA: ServicioDeFuera[] = [
  { nombre: 'Supabase', para: 'Guarda tu cuenta, tus viajes, tus fotos y tus Vistos, y manda el enlace para entrar.', datos: 'Tu email, tus viajes, tus fotos, tus Vistos, tus logros y tus pases.' },
  { nombre: 'Google', para: 'Te deja entrar con tu cuenta de Google (solo si lo eliges).', datos: 'Tu email y tu nombre de Google.' },
  { nombre: 'Anthropic (Claude)', para: 'Prepara parte de las rutas y de los textos de los destinos que no están escritos a mano.', datos: 'El destino, las fechas y las preferencias del viaje. No tu email.' },
  { nombre: 'Mapbox', para: 'Dibuja los mapas, busca lugares y calcula lo que se tarda andando.', datos: 'Las paradas del día y los lugares que buscas.' },
  { nombre: 'Vercel', para: 'Aloja la web y el servidor de la app.', datos: 'Lo que cualquier web recibe al visitarla (dirección IP, navegador).' },
  { nombre: 'Open-Meteo', para: 'Da la previsión de lluvia de cada día del viaje.', datos: 'La ciudad y las fechas.' },
  { nombre: 'Banco Central Europeo', para: 'Da el cambio de moneda del día para el presupuesto.', datos: 'Ninguno tuyo.' },
  { nombre: 'Wikimedia y Unsplash', para: 'Fotos de los sitios, con su crédito.', datos: 'Ninguno tuyo.' },
  { nombre: 'Stay22, Booking.com, Civitatis, DiscoverCars, Holafly, iati y N26', para: 'Enlaces de afiliado para reservar alojamiento, entradas, coche, eSIM, seguro y tarjeta. Al pulsar uno sales de la app.', datos: 'Un código de campaña del viaje (sin tu nombre ni tu email).' },
  { nombre: 'Stripe', para: 'Cobra el pase con tarjeta (también con Apple Pay y Google Pay) y manda el recibo. La app nunca ve los datos de tu tarjeta.', datos: 'Tu email, el importe y el pase que compras.' },
  { nombre: 'El servicio de avisos de tu móvil (Apple, Google o Mozilla, según tu móvil)', para: 'Hace llegar al móvil los avisos de la app, solo si los activas.', datos: 'Una dirección anónima de tu móvil para avisos y el texto del aviso.' },
  { nombre: 'Un servicio de envío de correos (por elegir)', para: 'Manda los enlaces para entrar a tu email.', datos: 'Tu email.' },
]
