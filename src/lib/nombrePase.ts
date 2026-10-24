/**
 * EL NOMBRE DEL PASE, siempre del destino (Tanda 10H): «Pase de Roma», «Pase de París», «Pase de Londres»… sale del nombre del destino que traen los datos (`route.destination`, el del tramo, el de la ficha);
 * nunca escrito a mano. Una sola función para toda la app.
 */
export const nombreDelPase = (destino: string): string => `Pase de ${String(destino ?? '').trim()}`
