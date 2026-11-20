/**
 * LOS CORREOS DE LA MARCA (V32), en UN solo sitio. Donde la app da un correo de contacto, sale de aquí:
 *   · soporte@jutrip.app     el público, para usuarios (Ajustes › Contactar, los pases y los pagos);
 *   · privacidad@jutrip.app  para dudas de privacidad (la página de privacidad).
 * (Los demás alias —colabora@, pagos@, hola@, info@— existen en el correo, pero la app no los enseña.)
 */
export const CORREO_SOPORTE = 'soporte@jutrip.app'
export const CORREO_PRIVACIDAD = 'privacidad@jutrip.app'

/** El enlace que abre el correo del móvil con el asunto puesto. */
export const enlaceDeCorreo = (correo: string, asunto = ''): string => `mailto:${correo}${asunto ? `?subject=${encodeURIComponent(asunto)}` : ''}`
