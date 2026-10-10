import { pagoActivo } from './pago'

/**
 * Qué lleva EXPLORAR en la versión gratis y qué en la de pago (Tanda 6z6): UN solo sitio.
 * - «Cerca de mí / Cerca de ti» (ordenar por cercanía a donde estás) es de pago: la gratis ordena solo por «Recomendado» y no pide la ubicación.
 * - Los filtros de baños y fuentes son de pago (se usan durante el viaje).
 * En la gratis simplemente no están (ni con candado).
 */
export const explorarConCercania = (): boolean => pagoActivo()
export const explorarConBanosYFuentes = (): boolean => pagoActivo()
