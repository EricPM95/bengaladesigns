/**
 * EL NOMBRE DEL PASE, siempre del destino (Tanda 10H): «Pase Roma», «Pase París», «Pase Londres»… sale del nombre del destino que traen los datos (`route.destination`, el del tramo, el de la ficha);
 * nunca escrito a mano. Una sola función para toda la app.
 */
export const nombreDelPase = (destino: string): string => `Pase ${String(destino ?? '').trim()}`
