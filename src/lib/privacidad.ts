/**
 * La estructura de la página de privacidad (cuentas, parte 1) y la lista de servicios de fuera que tratan datos. Los textos legales NO están escritos: cada apartado
 * lleva «Texto pendiente» hasta que Eric los escriba. La lista de servicios sale de lo que la app usa de verdad (ver docs/dias/INFORME_CUENTAS_1.md): si se añade o se
 * quita un servicio, se cambia aquí y la página lo enseña sola.
 */

export const TEXTO_PENDIENTE = 'Texto pendiente'

export interface ApartadoDePrivacidad {
  id: string
  titulo: string
  /** La pregunta a la que tiene que responder el texto que escriba Eric. */
  pregunta: string
}

export const APARTADOS_DE_PRIVACIDAD: ApartadoDePrivacidad[] = [
  { id: 'quien', titulo: 'Quién es el responsable', pregunta: 'Quién trata tus datos y cómo contactar con él.' },
  { id: 'que-guardamos', titulo: 'Qué guardamos', pregunta: 'Tu email, tus viajes, tus Vistos, tus fotos (y la fecha y el sitio de cada una), tus logros y tus pases.' },
  { id: 'para-que', titulo: 'Para qué lo usamos', pregunta: 'Para qué sirve cada dato y en qué se basa tratarlo.' },
  { id: 'cuanto-tiempo', titulo: 'Cuánto tiempo lo guardamos', pregunta: 'Cuánto dura cada dato y qué pasa cuando dejas de usar la app.' },
  { id: 'con-quien', titulo: 'Con quién lo compartimos', pregunta: 'Los servicios de fuera que tratan datos para que la app funcione (lista de abajo).' },
  { id: 'como-borrarlo', titulo: 'Cómo borrarlo', pregunta: 'Cómo borrar tu cuenta y todo lo tuyo desde la app, y qué se borra.' },
  { id: 'tus-derechos', titulo: 'Tus derechos', pregunta: 'Acceder, corregir, llevarte tus datos y reclamar.' },
  { id: 'a-quien-escribir', titulo: 'A quién escribir', pregunta: 'El correo para dudas de privacidad.' },
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
  { nombre: 'Un servicio de envío de correos (por elegir)', para: 'Manda los enlaces para entrar a tu email.', datos: 'Tu email.' },
]
