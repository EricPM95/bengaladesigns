// Prueba pura de lo que decide el texto tras el Visto (Tanda 8B3): nunca un texto que luego cambia, y sin respuesta, nada.
import { faltaDe, hojaSegunRespuesta, TEXTO_DE_FALTA, tiraDeParada } from '../../src/components/logros/visto/decidir.ts'

let fallos = 0
const debe = (ok, que) => {
  if (!ok) fallos++
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${que}`)
}

// 1. Sin respuesta (el servidor tarda o no hay cobertura): ninguna hoja, ninguna falta, ningún texto.
debe(hojaSegunRespuesta(null, 'Coliseo') === null, 'sin respuesta no hay hoja («Guarda un recuerdo» no sale nunca antes de saber)')
debe(tiraDeParada(undefined, undefined) === undefined, 'sin respuesta ni servidor no hay tira de parada')

// 2. El Coliseo (con emblema): desde la PRIMERA respuesta es «Te espera una sorpresa», nunca «Guarda un recuerdo».
const coliseo = hojaSegunRespuesta({ cuenta: true, ubic: 'cerca', hay_emblema: true, hay_pedazo: false, nuevos: [{ tipo: 'suma' }] }, 'Coliseo')
debe(coliseo?.tipo === 'oculto', 'Coliseo: la hoja es la del Emblema Oculto (aunque el Visto también gane un pedazo)')
debe(TEXTO_DE_FALTA[faltaDe(coliseo.tipo)] === 'Te espera una sorpresa: sube tu foto', 'Coliseo: la tira dice «Te espera una sorpresa» desde el primer momento')

// 3. La tira sale de la misma decisión que la hoja: nunca se contradicen.
for (const [r, tipo, falta] of [
  [{ cuenta: true, ubic: 'sin', hay_pedazo: true }, 'sin_ubicacion', 'pedazo'],
  [{ cuenta: true, ubic: 'cerca', nuevos: [{ tipo: 'suma' }] }, 'ganado', 'recuerdo'],
  [{ cuenta: true, ubic: 'cerca' }, 'recuerdo', 'recuerdo'],
  [{ cuenta: false, motivo: 'lejos', hay_pedazo: true }, 'lejos', null],
]) {
  const h = hojaSegunRespuesta(r, 'Panteón')
  debe(h?.tipo === tipo && faltaDe(h.tipo) === falta, `${tipo}: hoja y tira coinciden (${falta ?? 'sin tira'})`)
}

// 4. Los textos llevan el nombre de LA parada marcada.
debe(hojaSegunRespuesta({ cuenta: false, motivo: 'lejos', hay_pedazo: true }, 'Panteón').mensaje === 'Parece que no estás en el Panteón. Tu pedazo te espera allí.', 'lejos: «Parece que no estás en Panteón…»')
debe(hojaSegunRespuesta({ cuenta: true, ubic: 'cerca' }, 'Coliseo (noche)').nombreSitio === 'Coliseo', 'el «(noche)» no sale en el nombre')

// 5. Si el servidor repite lo suyo, manda el servidor; el móvil no inventa.
debe(tiraDeParada('local', 'servidor') === 'servidor' && tiraDeParada('local', undefined) === 'local', 'manda el servidor; si no hay, lo decidido con el Visto')

// 6. El móvil no tiene catálogo de emblemas: sin hay_emblema en la respuesta, nunca sale la hoja oscura.
debe(hojaSegunRespuesta({ cuenta: true, ubic: 'cerca' }, 'Coliseo').tipo !== 'oculto', 'sin hay_emblema del servidor no se adivina el emblema')

console.log(fallos === 0 ? '\nVisto 8B3: 0 fallos' : `\nVisto 8B3: ${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
