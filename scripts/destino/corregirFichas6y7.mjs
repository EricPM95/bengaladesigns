// Tanda 6y7, puntos 8 y 9: suaviza los superlativos de las fichas de Roma y corrige los datos dudosos que se han podido confirmar con una fuente.
//   node scripts/destino/corregirFichas6y7.mjs      (se puede repetir: lo que ya está cambiado no se toca)
// Cambia el texto tal cual está escrito en los ficheros (sin reformatear nada). La lista de cambios, con su fuente, está en docs/dias/INFORME_PARTE_DATOS_TANDA6Y7.md.
import fs from 'node:fs'

const D = 'data/pipeline_v2/detalle/roma/'
const C = [
  // ═══ Punto 8: superlativos ═══
  ['centro_historico.json', 'La fuente más famosa del mundo. 26 metros', 'Una de las fuentes más famosas del mundo. 26 metros'],
  ['centro_historico.json', 'La escalinata más famosa de Italia:', 'Una de las escalinatas más famosas de Italia:'],
  ['centro_historico.json', 'el trampantojo más famoso del mundo', 'uno de los trampantojos más famosos del mundo'],
  ['centro_historico.json', 'la mayor columna de lapislázuli del mundo', 'una de las mayores columnas de lapislázuli del mundo'],
  ['appia.json', 'El cementerio cristiano subterráneo más grande e importante de Roma', 'Uno de los cementerios cristianos subterráneos más grandes e importantes de Roma'],
  ['roma_antigua.json', 'la residencia más extravagante jamás construida', 'una de las residencias más extravagantes jamás construidas'],
  ['roma_antigua.json', 'la escultura barroca más famosa del mundo', 'una de las esculturas barrocas más famosas del mundo'],
  ['roma_antigua.json', 'se hizo con el primer oro que llegó de América', 'se hizo, según la tradición, con el primer oro que llegó de América'],
  ['roma_antigua.json', 'literalmente el primer oro del Nuevo Mundo', 'según la tradición, el primer oro del Nuevo Mundo'],
  ['vaticano.json', 'La colección de arte más impresionante del mundo,', 'Una de las colecciones de arte más impresionantes del mundo,'],
  ['vaticano.json', 'La plaza más monumental del mundo:', 'Una de las plazas más monumentales del mundo:'],
  ['vaticano.json', 'son el cementerio papal más impresionante del mundo', 'son uno de los cementerios papales más impresionantes del mundo'],
  ['villa_borghese.json', 'con la mejor colección de arte italiano moderno que existe', 'con una de las mejores colecciones de arte italiano moderno que existen'],

  // ═══ Punto 9: datos dudosos confirmados ═══
  // Plaza de España: la pagó el legado de un diplomático francés y la diseñaron arquitectos italianos (Wikipedia, «Spanish Steps»).
  ['centro_historico.json', "pero la construyeron los franceses (la iglesia de arriba es francesa). Los italianos la pagaron, los franceses la diseñaron y los españoles le pusieron el nombre — historia europea en estado puro.", "pero la pagó el legado de un diplomático francés, Étienne Gueffier, y la diseñaron arquitectos italianos, Francesco De Sanctis y Alessandro Specchi (la iglesia de arriba es francesa). Los españoles le pusieron el nombre — historia europea en estado puro."],
  // Panteón: 60 toneladas por columna; la inscripción de Agripa está en la fachada, bajo el frontón; el hormigón pesado de abajo lleva travertino (Wikipedia, «Pantheon, Rome»).
  ['centro_historico.json', 'cada una de 40 toneladas, traídas de Egipto', 'cada una de unas 60 toneladas, traídas de Egipto'],
  ['centro_historico.json', "en el frontón: significa", 'en la fachada, bajo el frontón: significa'],
  ['centro_historico.json', 'más pesado abajo (con basalto)', 'más pesado abajo (con travertino)'],
  // Piazza Navona: la Fontana del Moro (los tritones son de Giacomo della Porta; Bernini añadió el Moro). Wikipedia, «Piazza Navona».
  ['centro_historico.json', 'La Fontana del Moro (extremo sur) con el tritón de Bernini', 'La Fontana del Moro (extremo sur), con el Moro de Bernini rodeado de tritones'],
  // Largo di Torre Argentina: César murió en la Curia de Pompeyo, no en un templo; fechas de los templos; hallazgo en 1927 (Wikipedia, «Largo di Torre Argentina»; Smithsonian/AP sobre la Curia).
  ['centro_historico.json', 'Una plaza con cuatro templos republicanos del siglo III a.C. excavados a nivel de calle — aquí es exactamente donde asesinaron a Julio César en los Idus de Marzo del 44 a.C.', 'Una plaza con cuatro templos republicanos, de entre los siglos III y I a.C., excavados a nivel de calle — junto a ellos, en la Curia de Pompeyo, asesinaron a Julio César en los Idus de Marzo del 44 a.C.'],
  ['centro_historico.json', 'El templo B (el redondo) es probablemente donde cayó César. No hay señalización clara, pero es el circular con columnas que ves desde la esquina sudoeste.', 'César no cayó en ningún templo, sino en la Curia de Pompeyo, cuyos restos quedan detrás de los templos y no se visitan. El templo B es el redondo, el circular con columnas que ves desde la esquina sudoeste.'],
  ['centro_historico.json', 'se descubrió por accidente en 1929, cuando', 'se descubrió por accidente en 1927, cuando'],
  // Arco de Constantino: medallones de Adriano y friso de Trajano en el paso central (Wikipedia, «Arch of Constantine»).
  ['roma_antigua.json', 'Fíjate en los relieves: los de arriba son del siglo II (robados de monumentos de Trajano y Marco Aurelio), los de abajo son del siglo IV — nota la diferencia de calidad entre ambas épocas.', 'Fíjate en los relieves: casi todos son del siglo II, robados de monumentos de Adriano, Trajano y Marco Aurelio (los medallones redondos son de Adriano, y el friso de Trajano está en el paso central), y los de abajo son del siglo IV — nota la diferencia de calidad entre ambas épocas.'],
  // Museos Vaticanos: la escalera de doble hélice es de 1932 (Giuseppe Momo), no la de Bramante (1505).
  ['vaticano.json', 'La Escalera de Bramante (la helicoidal de doble hélice) — la foto más icónica del museo', 'La escalera helicoidal de doble hélice (la llaman «de Bramante», pero es de 1932, de Giuseppe Momo) — la foto más icónica del museo'],
  ['vaticano.json', 'La Escalera de Bramante (la doble hélice) NO es la escalera original de Bramante', 'La escalera de doble hélice, que se conoce como «de Bramante», NO es la escalera original de Bramante'],
  // Basílica de San Pedro: tamaño y tumba de Juan Pablo II (Wikipedia, «St. Peter's Basilica»; archivo de Radio Vaticana, 2011).
  ['vaticano.json', 'La iglesia más grande del mundo y el centro del catolicismo. 190 metros de largo,', 'Una de las iglesias más grandes del mundo y el centro del catolicismo. Unos 220 metros de largo,'],
  ['vaticano.json', 'tumbas papales desde San Pedro hasta Juan Pablo II', 'tumbas de papas de muchos siglos'],
  ['vaticano.json', ' Ninguna llega ni a la mitad.', ''],
  ['vaticano.json', 'La tumba de Juan Pablo II suele tener flores frescas dejadas por peregrinos polacos.', 'Desde 2011 la tumba de Juan Pablo II no está aquí abajo, sino arriba, en la capilla de San Sebastián, y suele tener flores frescas dejadas por peregrinos polacos.'],
  // Castillo de Sant'Angelo: Cellini estuvo preso de verdad (Wikipedia, «Castel Sant'Angelo»).
  ['vaticano.json', 'Las celdas de la prisión donde estuvo preso (según la leyenda) Beatrice Cenci y Benvenuto Cellini', 'Las celdas de la prisión donde estuvo preso Benvenuto Cellini (y, según la tradición, Beatrice Cenci)'],
  // Circo Máximo: 250.000 es la cifra de Plinio; hoy se calculan más de 150.000 (Wikipedia, «Circus Maximus»).
  ['roma_antigua.json', 'aquí cabían 250.000 espectadores viendo carreras de cuadrigas', 'aquí cabían, según Plinio, 250.000 espectadores viendo carreras de cuadrigas (hoy se calculan más de 150.000)'],
  // Termas de Caracalla: las de Diocleciano eran mayores; los mosaicos de atletas están en los Museos Vaticanos (Wikipedia, «Baths of Caracalla»).
  ['roma_antigua.json', 'Los baños públicos más grandes de la antigua Roma', 'Los segundos baños públicos más grandes de la antigua Roma, después de las termas de Diocleciano'],
  ['roma_antigua.json', 'Los mosaicos originales del suelo (atletas en blanco y negro) se ven aún en algunas salas — busca los que están protegidos con cristal.', 'Los famosos mosaicos de los atletas se llevaron a los Museos Vaticanos; en las propias termas quedan, en algunas salas, trozos del mosaico del suelo, sobre todo geométricos.'],
  // Janículo: Garibaldi es una estatua ecuestre (Wikipedia, «Monument to Garibaldi (Rome)»).
  ['trastevere.json', 'El busto de Garibaldi a caballo', 'La estatua ecuestre de Garibaldi'],
  // Galería Borghese: Napoleón era hermano de Paulina (la propia ficha lo dice más arriba).
  ['villa_borghese.json', 'Napoleón (cuñado de Paulina)', 'Napoleón (hermano de Paulina)'],
  // Santa María la Mayor: la mayor iglesia mariana de Roma, no del mundo (Wikipedia, «Santa Maria Maggiore»).
  ['roma_antigua.json', 'y la mayor iglesia dedicada a la Virgen María', 'y la mayor iglesia de Roma dedicada a la Virgen María'],
  // Aventino: la Orden de Malta no tiene territorio, sus dos sedes de Roma son extraterritoriales (Wikipedia, «Sovereign Military Order of Malta»).
  ['roma_antigua.json', 'La Orden de Malta es el estado soberano más pequeño del mundo con territorio: solo esta plaza y un palacio en Via Condotti. Emite sus propios sellos y pasaportes.', 'La Orden de Malta es una entidad soberana sin territorio propio: su villa del Aventino y su palacio de Via Condotti tienen estatus de extraterritorialidad, como una embajada. Emite sus propios sellos y pasaportes.'],
  // Boca de la Verdad: la pieza es romana, la leyenda del detector de mentiras es medieval (Wikipedia, «Bocca della Verità»).
  ['roma_antigua.json', 'pero funciona como detector de mentiras desde hace 2.000 años.', 'pero la leyenda que la convirtió en detector de mentiras es medieval.'],
  // San Clemente: la iglesia de en medio tiene frescos medievales; el mitreo se hizo en una casa romana del siglo I (basilicasanclemente.com; Italian Art Society).
  ['roma_antigua.json', 'una iglesia paleocristiana del siglo IV en medio, con frescos originales; y en lo más profundo, un templo romano de Mitra del siglo I.', 'una iglesia paleocristiana del siglo IV en medio, con frescos medievales; y en lo más profundo, una casa romana del siglo I convertida más tarde en templo de Mitra.'],
]

// Los mismos textos cuando salen también en data/pipeline_v2/roma.json (descripción corta del sitio): solo estas dos frases.
const R = [
  ['la escultura barroca más famosa del mundo', 'una de las esculturas barrocas más famosas del mundo'],
  ['El cementerio subterráneo más grande de Roma y el lugar', 'Uno de los cementerios subterráneos más grandes de Roma y el lugar'],
]

const esc = (s) => JSON.stringify(s).slice(1, -1)
const aplicar = (fichero, pares) => {
  let t = fs.readFileSync(fichero, 'utf8')
  const hechos = []
  for (const [antes, despues] of pares) {
    const a = esc(antes), d = esc(despues)
    if (t.includes(d) && !t.includes(a)) continue
    const n = t.split(a).length - 1
    if (n !== 1) throw new Error(`${fichero}: la frase sale ${n} veces (debería salir 1): ${antes.slice(0, 70)}`)
    t = t.replace(a, () => d)
    hechos.push(antes.slice(0, 50))
  }
  fs.writeFileSync(fichero, t)
  return hechos.length
}
let total = 0
for (const f of new Set(C.map((c) => c[0]))) total += aplicar(D + f, C.filter((c) => c[0] === f).map((c) => [c[1], c[2]]))
total += aplicar('data/pipeline_v2/roma.json', R)
console.log(`Frases cambiadas: ${total}`)
