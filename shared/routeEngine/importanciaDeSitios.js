/**
 * Cuánto pesa cada sitio de un destino (Tanda 6y10, «Cambiar un día por la excursión»): `{ nombre de sitio: 'imprescindible' | 'nivel1' }`, todo del dato del destino.
 *  - 'imprescindible': los de nivel 1 que el dato marca como `tier: 'joya'` o `tier: 'imprescindible'` (lo que el motor protege antes que nada).
 *  - 'nivel1': el resto de los de nivel 1.
 * Un sitio que no sale es de los demás. Sin nada de Roma dentro: lo que decide es el dato (`level` y `tier`) de cada destino. Un destino sin `tier` solo tiene 'nivel1'.
 * También sale con el título de su parada (`titulo_parada`), que es como a veces se llama en el día.
 */
export function importanciaDeSitios(data) {
  const resultado = {}
  for (const sitio of data?.places ?? []) {
    if (!sitio?.name || sitio.level !== 1) continue
    const peso = sitio.tier === 'joya' || sitio.tier === 'imprescindible' ? 'imprescindible' : 'nivel1'
    resultado[sitio.name] = peso
    if (sitio.titulo_parada) resultado[sitio.titulo_parada] = peso
  }
  return resultado
}
