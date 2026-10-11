/**
 * La línea de «llega antes» de una entrada reservada (Tanda 6y4, punto 6). El motor ya la escribe sin hora («Llega unos 30 minutos antes: hay cola de control»; 15 en el Free Tour), pero un viaje guardado
 * antes de esta tanda lleva la vieja, con dos horas («🕘 Entrada a las 10:30 · llega a las 10:00: el control de seguridad…»). Aquí se pasa la vieja a la nueva —la hora de la entrada sale UNA sola vez en la
 * ficha, en «✓ Tu entrada: 10:30»— y la nueva se deja tal cual.
 */
export function notaDeLlegadaSinHora(nota: string | null | undefined, minutos?: number | null): string | null {
  if (!nota) return null
  const texto = nota.replace(/^\p{Extended_Pictographic}️?\s*/u, '').trim()
  // Vieja de entrada: «Entrada a las 10:30 · llega a las 10:00: frase».
  const entrada = /^Entrada a las \d{1,2}:\d{2}\s*[·.]\s*llega a las \d{1,2}:\d{2}:\s*(.+)$/i.exec(texto)
  if (entrada) return minutos ? `Llega unos ${minutos} minutos antes: ${entrada[1]}` : `Llega antes: ${entrada[1]}`
  // Vieja del Free Tour: «Free Tour a las 10:30 · llega a las 10:15 a la Plaza de España. Frase».
  const tour = /^Free Tour a las \d{1,2}:\d{2}\s*[·.]\s*llega a las \d{1,2}:\d{2}\s+(a .+)$/i.exec(texto)
  if (tour) return minutos ? `Llega unos ${minutos} minutos antes ${tour[1]}` : `Llega antes ${tour[1]}`
  return texto
}
