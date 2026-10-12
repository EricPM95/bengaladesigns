# Informe de la parte de datos y textos (Tanda 6y7, puntos 7, 8 y 9)

## Punto 7: las 31 historias, versión 4

- Las 31 historias de HISTORIAS_ROMA.md (versión 4) están en el campo `historia` de su ficha, solo el texto (sin título, sin «Comprobar», sin notas). Script que lo hace: `scripts/destino/pasarHistorias6y7.mjs` (se puede repetir). El del 6y5 se borró porque quedó viejo.
- Todas las historias encontraron su ficha. La del Coliseo sigue siendo la gratis. Solo cambia el campo `historia`: ninguna otra línea de los ficheros.
- La prueba `scripts/destino/pruebaFase6y7_historias.mjs` (antes 6y5) compara letra por letra con el documento, comprueba que exactamente esos 31 sitios llevan historia (ninguna ficha sin historia la tiene) y que **ninguna historia comparte 15 palabras seguidas con su ficha** (descripción, «Qué vas a ver», consejos y secretos). Resultado: 554 comprobaciones, 0 fallos.
- **Ninguna historia versión 4 comparte 15 palabras con su ficha: no hizo falta avisar de ninguna.** Los tramos iguales más largos (en palabras): Panteón 12 (es la frase de Eric «Todavía hoy es la mayor cúpula de hormigón sin armar del mundo», que está en un secreto), Trevi 9, Piazza Navona 9, Museos Vaticanos 8, Plaza del Campidoglio 7, San Pedro 7; el resto, 6 o menos.

| Sitio | Palabras de la historia | Tramo igual más largo con la ficha |
|---|---|---|
| Coliseo | 441 | 4 |
| Foro Romano y Palatino | 425 | 4 |
| Arco de Constantino | 428 | 4 |
| Fontana de Trevi | 386 | 9 |
| Panteón | 449 | 12 |
| Piazza Navona | 449 | 9 |
| Plaza de España | 432 | 4 |
| Museos Vaticanos y Capilla Sixtina | 443 | 8 |
| Basílica de San Pedro | 430 | 7 |
| Plaza de San Pedro | 450 | 5 |
| Altar de la Patria | 407 | 4 |
| Castillo de Sant'Angelo | 432 | 4 |
| Boca de la Verdad | 436 | 5 |
| Largo di Torre Argentina | 446 | 4 |
| Campo de' Fiori | 449 | 5 |
| Plaza del Campidoglio | 449 | 7 |
| Basílica de San Clemente | 449 | 4 |
| Iglesia de San Pietro in Vincoli | 439 | 6 |
| Ojo de la Cerradura del Aventino | 446 | 5 |
| Isla Tiberina | 443 | 3 |
| Galería Borghese | 447 | 5 |
| Basílica de Santa María la Mayor | 449 | 5 |
| Circo Máximo | 435 | 4 |
| Termas de Caracalla | 415 | 3 |
| Via Appia Antica | 429 | 5 |
| Columna de Trajano | 436 | 4 |
| Iglesia de San Luigi dei Francesi | 434 | 3 |
| Iglesia de Santa Maria della Vittoria | 417 | 6 |
| Mirador del Janículo | 400 | 6 |
| Piazza del Popolo | 426 | 4 |
| Iglesia de Santa Maria in Trastevere | 421 | 5 |

- GUIA_NUEVOS_DESTINOS.md: la frase «La historia nunca repite lo que dice la ficha» cambiada por la nueva («Cada sitio importante lleva su historia, de unos 3 minutos, contada como un cuento. Puede contar lo importante aunque salga en la ficha, pero no copia sus frases.»).
- También se subieron, sin tocarlos, HISTORIAS_ROMA.md (v4), PENDIENTES_ESCUCHAR.md y el prompt de la 6y7 (copiados de la carpeta principal, donde no estaban en git).
- Los textos de la prueba que dependían de la v3 (la historia de Trevi empezaba por otra frase; el largo de 120-330 palabras) se ajustaron a la v4.

## Punto 8: superlativos de las fichas

Script: `scripts/destino/corregirFichas6y7.mjs` (cambia solo las frases, sin reformatear). Se miraron todos los campos de texto (menos `historia`) de las 7 fichas de `detalle/roma`, y `roma.json`.

Lista de cambios (antes → después):

| Sitio | Antes | Después |
|---|---|---|
| Fontana de Trevi | La fuente más famosa del mundo | Una de las fuentes más famosas del mundo |
| Plaza de España | La escalinata más famosa de Italia | Una de las escalinatas más famosas de Italia |
| Iglesia de San Ignacio de Loyola | el trampantojo más famoso del mundo | uno de los trampantojos más famosos del mundo |
| Iglesia del Gesù | la mayor columna de lapislázuli del mundo | una de las mayores columnas de lapislázuli del mundo |
| Catacumbas de San Calixto | El cementerio cristiano subterráneo más grande e importante de Roma | Uno de los cementerios cristianos subterráneos más grandes e importantes de Roma |
| Domus Aurea | la residencia más extravagante jamás construida | una de las residencias más extravagantes jamás construidas |
| Santa Maria della Vittoria | la escultura barroca más famosa del mundo | una de las esculturas barrocas más famosas del mundo |
| Santa María la Mayor | el primer oro que llegó de América / literalmente el primer oro del Nuevo Mundo | «según la tradición» delante, en las dos frases |
| Museos Vaticanos | La colección de arte más impresionante del mundo | Una de las colecciones de arte más impresionantes del mundo |
| Plaza de San Pedro | La plaza más monumental del mundo | Una de las plazas más monumentales del mundo |
| Basílica de San Pedro (Grutas) | el cementerio papal más impresionante del mundo | uno de los cementerios papales más impresionantes del mundo |
| Galería Nacional de Arte Moderno | la mejor colección de arte italiano moderno que existe | una de las mejores colecciones de arte italiano moderno que existen |
| Basílica de San Pedro (descripción) | La iglesia más grande del mundo | Una de las iglesias más grandes del mundo (ver punto 9) |

Se dejaron, porque el dato es seguro: «la más grande del mundo durante 1.300 años» (cúpula del Panteón), «la mayor cúpula de hormigón sin armar del mundo», «el anfiteatro más grande jamás construido» (Coliseo), «el museo público más antiguo del mundo» (Capitolinos), «el obelisco más alto de los que quedan en pie» (San Juan de Letrán), «el único que nunca cayó» (obelisco de San Pedro), «la comunidad judía más antigua de Europa occidental». Las opiniones locales («la mejor panorámica de Roma», «el puente más bonito de Roma») no son del tipo «del mundo» y se dejaron.

**roma.json**: lo he tocado en solo dos descripciones cortas de sitio, que repetían lo de la ficha: Santa Maria della Vittoria («una de las esculturas barrocas más famosas del mundo») y Catacumbas de San Calixto («Uno de los cementerios subterráneos más grandes de Roma»). Dos líneas, nada más. Las frases parecidas de los textos de los días escritos (Trevi, Plaza de España, Galería Borghese...) NO se tocaron: están en PREGUNTAS_TANDA6Y7_PARTE_DATOS.md (pregunta 13).

## Punto 9: datos dudosos corregidos (con fuente)

Fuentes: Wikipedia en inglés (artículos citados) salvo donde se indica.

| Sitio | Ficha decía | Ahora dice | Fuente |
|---|---|---|---|
| Plaza de España (secreto) | los italianos la pagaron, los franceses la diseñaron | la pagó el legado del diplomático francés Étienne Gueffier; la diseñaron los italianos Francesco De Sanctis y Alessandro Specchi | Spanish Steps |
| Panteón | columnas de 40 toneladas | unas 60 toneladas | Pantheon, Rome |
| Panteón | inscripción de Agripa «en el frontón» | «en la fachada, bajo el frontón» | Pantheon, Rome |
| Panteón | hormigón más pesado abajo «con basalto» | «con travertino» | Pantheon, Rome |
| Piazza Navona | Fontana del Moro «con el tritón de Bernini» | «con el Moro de Bernini rodeado de tritones» (los tritones son de Giacomo della Porta) | Piazza Navona |
| Largo di Torre Argentina | «aquí es exactamente donde asesinaron» a César; el templo B «probablemente» donde cayó | lo asesinaron en la Curia de Pompeyo, junto a los templos (sus restos están detrás y no se visitan); templos de entre los siglos III y I a.C.; hallazgo en 1927 | Largo di Torre Argentina; Smithsonian / AP sobre la Curia |
| Arco de Constantino | relieves de arriba del siglo II | medallones redondos de Adriano; friso de Trajano en el paso central | Arch of Constantine |
| Museos Vaticanos | «Escalera de Bramante» (doble hélice) | la llaman «de Bramante», pero es de 1932, de Giuseppe Momo (en «Qué vas a ver» y en el secreto, que ya no se contradicen) | varias guías (futilitycloset y otras) |
| Basílica de San Pedro | 190 metros de largo; «la más grande del mundo» | unos 220 metros de largo; «una de las más grandes» | St. Peter's Basilica |
| Basílica de San Pedro | tumbas papales «desde San Pedro hasta Juan Pablo II»; la tumba de Juan Pablo II en las Grutas | tumbas de papas de muchos siglos; desde 2011 Juan Pablo II está arriba, en la capilla de San Sebastián | Radio Vaticana (archivo, mayo 2011) |
| Basílica de San Pedro (consejo) | «Ninguna llega ni a la mitad» | se quita la frase (queda: las marcas muestran la longitud de otras catedrales) | tu documento: San Pablo de Londres o Milán pasan de la mitad |
| Castillo de Sant'Angelo | presos «según la leyenda» Cenci y Cellini | preso Benvenuto Cellini «(y, según la tradición, Beatrice Cenci)» | Castel Sant'Angelo (Cellini). De Cenci, ver preguntas |
| Circo Máximo | cabían 250.000 | «según Plinio, 250.000 (hoy se calculan más de 150.000)» | Circus Maximus |
| Termas de Caracalla | las más grandes de la antigua Roma; mosaicos de atletas en las salas | las segundas, tras las de Diocleciano; los mosaicos de atletas están en los Museos Vaticanos, allí quedan sobre todo geométricos | Baths of Caracalla |
| Janículo | «el busto de Garibaldi a caballo» | «la estatua ecuestre de Garibaldi» | Monument to Garibaldi (Rome) |
| Galería Borghese | «Napoleón (cuñado de Paulina)» | «hermano de Paulina» (la misma ficha ya decía que Paulina era su hermana) | la propia ficha |
| Santa María la Mayor | la mayor iglesia dedicada a la Virgen | la mayor «de Roma» | Santa Maria Maggiore |
| Ojo de la Cerradura | la Orden de Malta «el estado soberano más pequeño del mundo con territorio» | entidad soberana sin territorio propio; su villa del Aventino y su palacio de Via Condotti son extraterritoriales | Sovereign Military Order of Malta |
| Boca de la Verdad | «detector de mentiras desde hace 2.000 años» | «la leyenda que la convirtió en detector de mentiras es medieval» | Bocca della Verità |
| San Clemente | iglesia de en medio con «frescos originales»; «templo de Mitra del siglo I» | «frescos medievales»; «casa romana del siglo I convertida más tarde en templo de Mitra» | basilicasanclemente.com e Italian Art Society (frescos de los siglos VIII al XI) |

Los que no se pudieron confirmar quedan en **PREGUNTAS_TANDA6Y7_PARTE_DATOS.md** (12 datos más la pregunta de los textos de los días escritos). No se tocaron.

## Pruebas (con mi servidor en el puerto 8832)

0 fallos en: pruebaFase6y7_historias (554), pruebaFase6y4_ficha, pruebaFase6y5_pantallas, pruebaFase6y6_cierre (la frase de la moneda de Trevi sigue como estaba), pruebaTanda6z6c, 6z3, pruebaCorr6z6 (las tres partes), pruebaFase6y2_fotos, pruebaFase6z6e, pruebaFase6z6fWikimedia, pruebaTanda6s, 6u, 6v, 6z5 y pruebaFotos6z3.

## Ficheros tocados

data/pipeline_v2/detalle/roma/{appia,centro_historico,roma_antigua,trastevere,vaticano,villa_borghese}.json; data/pipeline_v2/roma.json (2 líneas); docs/dias/GUIA_NUEVOS_DESTINOS.md; scripts/destino/{pasarHistorias6y7,corregirFichas6y7,pruebaFase6y7_historias}.mjs (y borrado pasarHistorias6y5.mjs); docs de esta parte. HISTORIAS_ROMA.md, PENDIENTES_ESCUCHAR.md y el prompt solo copiados tal cual.
