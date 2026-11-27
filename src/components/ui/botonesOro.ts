import type { CSSProperties } from 'react'

/**
 * V43 §9 (regla en CLAUDE.md): UN SOLO botón dorado y UN SOLO botón claro. Se escriben aquí, una vez, y todos los botones de HOY los usan.
 * El dorado es el de Design: degradado a 135°, sin borde. Nunca se vuelve a escribir un degradado dorado ni un borde `#9A7228` en un botón.
 */
export const DORADO = 'linear-gradient(135deg,#F3E2B0,#D2B67A 55%,#B58A2E)'
export const MARFIL = '#FBF3E2'
/** El oro del filo de una tarjeta destacada (el borde de «Te lo recomendamos»): el mismo oro que cierra el degradado. */
export const ORO_BORDE = '#B58A2E'

export const BOTON_ORO: CSSProperties = { background: DORADO, color: '#4A3510', boxShadow: '0 10px 20px -14px rgba(110,80,24,.7),inset 0 1px 0 rgba(255,255,255,.55)' }
export const BOTON_CLARO: CSSProperties = { background: MARFIL, border: '1px solid rgba(181,138,46,.55)', color: '#4A3510' }

/**
 * (V79, regla en CLAUDE.md) EL PASAPORTE VA SIEMPRE EN GRANATE, también su botón: es la ÚNICA excepción al dorado único (V53). El granate es el de la tapa del pasaporte (`PasaporteScreen`: 150°, #6A1A2C a #4A1220) con el texto en oro claro.
 * Lo usan los botones que llevan al pasaporte ([Ver mi pasaporte] del resumen del viaje). Nunca se escribe otro granate a mano.
 */
export const GRANATE_PASAPORTE = 'linear-gradient(150deg,#6A1A2C,#4A1220)'
export const BOTON_GRANATE: CSSProperties = { background: GRANATE_PASAPORTE, color: '#F3D59A', boxShadow: '0 12px 20px -14px rgba(62,14,24,.8),inset 0 0 0 1px rgba(243,213,154,.35)' }
