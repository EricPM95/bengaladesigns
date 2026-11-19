/**
 * (V23) Los importes que vienen escritos en un texto de fuera («Entrada (24EUR)», «10 EUR», «EUR 24»): con el formato de la app, «24 €». Pura.
 * Solo toca el euro (el único que viene así en los datos); un texto sin importes vuelve igual.
 */
export function limpiarImportes(texto: string): string {
  return texto
    .replace(/(\d+(?:[.,]\d+)?)\s*EUR\b/gi, (_t, n: string) => `${n} €`)
    .replace(/\bEUR\s*(\d+(?:[.,]\d+)?)/gi, (_t, n: string) => `${n} €`)
}

/** (V23) ¿El texto de un precio lleva de verdad un número? Un «€» suelto, sin número, no se enseña nunca. */
export const precioConNumero = (texto: string | null | undefined): texto is string => typeof texto === 'string' && /\d/.test(texto)
