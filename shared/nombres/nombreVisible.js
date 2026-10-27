// Tanda 10N5: los nombres de las personas se ENSEÑAN con la primera letra de cada palabra en mayúscula y el resto en minúscula
// («VIAJES» → «Viajes», «josé luis» → «José Luis»). Solo al enseñarlos: el nombre se guarda tal como lo escribió la persona.
export function nombreVisible(nombre) {
  if (typeof nombre !== 'string') return ''
  return nombre
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s\-'’.])(\p{L})/gu, (_m, sep, letra) => sep + letra.toLocaleUpperCase('es'))
}
