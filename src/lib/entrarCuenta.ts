/**
 * Lo puro de la pantalla de entrar (cuentas parte 3, A1 a A3): a qué correo lleva [Abrir mi correo] y cuánto hay que esperar para pedir otro enlace.
 * Sin ventana ni red, para poder probarlo.
 */

/** Cuánto hay que esperar para pedir otro enlace (así no se llena la bandeja de enlaces ni se agota el envío de correos). */
export const ESPERA_REENVIO_MS = 60_000

/** Cuántos milisegundos faltan para poder pedir otro enlace (0 = ya se puede). */
export function esperaRestante(ultimoEnvioMs: number | null, ahoraMs: number, esperaMs = ESPERA_REENVIO_MS): number {
  if (ultimoEnvioMs == null || !Number.isFinite(ultimoEnvioMs)) return 0
  return Math.max(0, ultimoEnvioMs + esperaMs - ahoraMs)
}

/** «Puedes pedir otro en 45 s» (redondea hacia arriba para no decir «0 s» antes de tiempo). */
export function textoDeEspera(restanteMs: number): string {
  return `Puedes pedir otro en ${Math.max(1, Math.ceil(restanteMs / 1000))} s`
}

/**
 * La dirección que abre el correo de esa persona. Los servicios conocidos abren su bandeja; con cualquier otro dominio, la aplicación de correo del móvil (`mailto:`).
 * Devuelve siempre una dirección válida para un enlace `<a href>`.
 */
export function enlaceDeCorreo(email: string): string {
  const dominio = String(email ?? '').split('@')[1]?.trim().toLowerCase() ?? ''
  if (dominio === 'gmail.com' || dominio === 'googlemail.com') return 'https://mail.google.com/mail/u/0/#inbox'
  if (/^(outlook|hotmail|live|msn)\./.test(dominio)) return 'https://outlook.live.com/mail/0/inbox'
  if (/^yahoo\./.test(dominio) || dominio === 'ymail.com') return 'https://mail.yahoo.com/'
  if (dominio === 'icloud.com' || dominio === 'me.com' || dominio === 'mac.com') return 'https://www.icloud.com/mail'
  return 'mailto:'
}

/** El email tapado a la mitad para enseñarlo («elena@…»), como en el diseño: la parte de antes de la arroba y puntos suspensivos. */
export function emailResumido(email: string): string {
  const antes = String(email ?? '').split('@')[0]
  return antes ? `${antes}@…` : ''
}

/** Pura (Tanda 10G): ¿tiene pinta de código del email? De 6 a 8 números (sin espacios). */
export const codigoValido = (codigo: string): boolean => /^\d{6,8}$/.test(codigo)
