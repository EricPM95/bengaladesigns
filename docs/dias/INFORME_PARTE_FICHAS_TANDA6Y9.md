# Informe: textos de las fichas (Tanda 6y9, agente F)

Solo se han cambiado frases de texto. Sin código, sin pantallas, sin horarios (`schedule`, `by_season`...) y sin tocar las historias (son de Eric).
Todo sale de un script que se puede repetir: `node scripts/destino/corregirFichas6y9.mjs` (reemplazos puntuales sobre el texto tal cual está escrito; el diff de git es mínimo, sin reformatear ficheros).

## P15: las 11 correcciones (la 10 se deja como está)

Las fichas están en `data/pipeline_v2/detalle/roma/`. Ninguna de estas frases estaba en `roma.json` ni en `docs/roma_por_que.json`.

| # | Sitio | Dónde estaba | Antes | Después |
|---|---|---|---|---|
| 1 | Panteón | centro_historico.json, secretos | «…cae exactamente en la puerta de entrada — los romanos lo diseñaron así intencionadamente.» | «…— se dice que lo diseñaron así.» |
| 2 | Plaza de San Pedro (obelisco) | vaticano.json, descripción | «El obelisco egipcio de 25 metros en el centro fue el único que nunca cayó desde la antigua Roma.» | «El obelisco de 25 metros del centro lo trajo de Egipto el emperador Calígula.» |
| 2 | Plaza de San Pedro (obelisco) | vaticano.json, secretos | «El obelisco central no tiene ninguna inscripción jeroglífica — es un obelisco romano mandado tallar en Egipto, no uno egipcio original. Calígula lo trajo en un barco especialmente construido para ello.» | «El obelisco central lo trajo de Egipto el emperador Calígula, en un barco especialmente construido para ello.» |
| 3 | Piazza Navona (agua) | centro_historico.json, secretos | «Bernini la trazó subterráneamente hasta aquí.» | «El agua llegó a la plaza en el siglo XVI, y Bernini la aprovechó para su fuente.» |
| 4 | Largo di Torre Argentina | centro_historico.json, secretos | «Mussolini quería demoler los templos… los arqueólogos ganaron la batalla — …» | Frase quitada entera (queda 1 secreto: el hallazgo de 1927) |
| 5 | Altar de la Patria | roma_antigua.json, «Qué vas a ver» | «Las cuadrigas de bronce en la parte superior — cada una pesa 50 toneladas» | «Las cuadrigas de bronce en la parte superior» |
| 6 | Castillo de Sant'Angelo | vaticano.json, «Qué vas a ver» | «Las celdas de la prisión donde estuvo preso Benvenuto Cellini (y, según la tradición, Beatrice Cenci)» | «Las celdas de la prisión, donde estuvo preso Benvenuto Cellini; junto al puente fue ejecutada Beatrice Cenci en 1599» |
| 7 | Basílica de San Pedro | vaticano.json, descripción | «…y las Grutas Vaticanas con la tumba de San Pedro. Todo es descomunal…» | «…y las Grutas Vaticanas; la tumba del apóstol Pedro está bajo la basílica, en la necrópolis. Todo es descomunal…» |
| 8 | Galería Borghese | villa_borghese.json, secretos | «confiscó 100 cuadros de Cavaliere d'Arpino por impago de impuestos (incluyendo los Caravaggios)» | «a Cavaliere d'Arpino le confiscaron sus 100 cuadros (incluyendo los Caravaggios)» |
| 9 | Ojo de la Cerradura (Piranesi) | roma_antigua.json, secretos | «Alineó la cerradura, los setos y la cúpula a propósito.» | «Se cuenta que alineó la cerradura, los setos y la cúpula a propósito.» |
| 10 | Piazza del Popolo (nombre) | — | sin cambios (sigue diciendo «los álamos») | sin cambios |
| 11 | Santa Maria in Trastevere | trastevere.json, descripción | «Una de las iglesias más antiguas de Roma (fundada en el siglo III, reconstruida en el XII) y probablemente la primera dedicada a la Virgen María.» | «Una de las iglesias más antiguas de Roma dedicadas a la Virgen María (fundada en el siglo III, reconstruida en el XII).» |
| 11 | Santa Maria in Trastevere | trastevere.json, secretos | «fundaron aquí la primera iglesia mariana de Roma.» | «fundaron aquí una de las iglesias más antiguas de Roma dedicadas a la Virgen.» |
| 12 | San Clemente | roma_antigua.json, secretos | «se celebraban rituales con sangre de toro exactamente debajo…» | «se celebraban banquetes rituales exactamente debajo…» |

Notas:
- Las columnas «de edificios romanos» de Santa Maria in Trastevere se dejan como estaban.
- En el 6 se ha puesto la frase de Eric tal cual en la lista de «Qué vas a ver»: Cellini preso y Cenci ejecutada junto al puente en 1599; ya no se dice que estuviera presa en el castillo.
- En el 8 se ha mantenido la cifra «100 cuadros» (no se tocó, Eric solo pidió quitar el motivo).
- En el 3 la frase de Eric queda justo después de «…el mismo que alimenta la Fontana de Trevi.», así que se leen dos frases seguidas que empiezan por «El agua». Es lo que se pidió; si quieres, se une en una sola.

### Lo que dicen las historias (no se han tocado)
- Panteón: ya dice «Algunos estudiosos creen que no es casualidad…» (coincide con el «se dice que»).
- Plaza de San Pedro y Castillo: la historia dice solo que Calígula trajo el obelisco / Cellini estuvo preso; no chocan.
- Ojo de la Cerradura: la historia dice «Mucha gente dice que alineó la cerradura… No se sabe con seguridad»; coincide.
- Santa Maria in Trastevere: en las notas «Comprobar» de la historia se habla del origen de las columnas «según algunas fuentes»; no choca.
- Galería Borghese: la nota «Comprobar» del documento de Eric dice «la ficha dice que por impago de impuestos; se suele contar también por posesión ilegal…». Esa nota ya no describe la ficha (ahora no dice el motivo). No es lo que oye el viajero (las notas no se sirven), pero Eric puede querer quitar el paréntesis.
- Torre Argentina: la nota «Comprobar» sigue diciendo que lo de que los arqueólogos «le ganaron» a Mussolini es dudoso; coincide con quitar la frase.
- San Clemente: la historia ya dice «banquetes rituales».
Ninguna historia cuenta lo que se ha quitado de las fichas.

## P16: superlativos suavizados en `data/pipeline_v2/roma.json` y `docs/roma_por_que.json`

Cada frase se cambia en todas sus apariciones (el mismo texto sale varias veces en roma.json). Entre paréntesis, nº de veces en roma.json / roma_por_que.json.

Las cinco de Eric:
| Antes | Después |
|---|---|
| La fuente más famosa del mundo, y desde la plaza se ve gratis. (6/2) | Una de las fuentes más famosas del mundo, y desde la plaza se ve gratis. |
| La escalinata más famosa del mundo, con la iglesia… (5/1) | Una de las escalinatas más famosas del mundo, con la iglesia… |
| La mejor colección de Bernini y Caravaggio del mundo, en la villa… (5/1) | Una de las mejores colecciones de Bernini y Caravaggio, en la villa… |
| Dentro está la mejor colección de Bernini del mundo: (1/1) | Dentro está una de las mejores colecciones de Bernini: |
| Explora el puerto romano mejor conservado del mundo. (1/0) | Explora uno de los puertos romanos mejor conservados. |
| una de las fachadas más copiadas del mundo (Gesù) | ya decía «una de…»: no se toca |

Otros del mismo tipo que se han suavizado:
| Antes | Después |
|---|---|
| La mejor pizza al taglio del mundo (cerca del Vaticano) | Una de las mejores pizzas al taglio (cerca del Vaticano) |
| La iglesia más grande del mundo, y entrar es gratis. (San Pedro; 5/1) | Una de las iglesias más grandes del mundo, y entrar es gratis. (igual que ya se hizo en la ficha) |
| Los museos públicos más antiguos del mundo, en la plaza… (2/1) | Considerados los museos públicos más antiguos del mundo, en la plaza… |
| El museo público más antiguo del mundo — la Loba… | Considerado el museo público más antiguo del mundo — la Loba… |
| Los baños públicos más grandes de la antigua Roma (Caracalla; en la ficha ya se corrigió a «segundos») | Entre los baños públicos más grandes de la antigua Roma |
| El barrio judío más antiguo de Europa | Uno de los barrios judíos más antiguos de Europa |
| El primer centro comercial de la historia | Considerado el primer centro comercial de la historia |
| El forno más famoso de Roma desde 1824. | Uno de los fornos más famosos de Roma, desde 1824. |
| El tiramisú más famoso de Roma, desde 1960 | Uno de los tiramisús más famosos de Roma, desde 1960 |
| La calle de compras más famosa de Roma (Via Condotti) | Una de las calles de compras más famosas de Roma |
| hoy es la perspectiva más famosa del Vaticano. | hoy es una de las perspectivas más famosas del Vaticano. |
| La calzada romana mejor conservada, con su… (2/0) | Una de las calzadas romanas mejor conservadas, con su… |
| La calzada más famosa de la antigua Roma, con sus… (3/1) | Una de las calzadas más famosas de la antigua Roma, con sus… |
| El barrio más antiguo de Roma, a dos pasos del Coliseo (Monti) | Uno de los barrios más antiguos de Roma, a dos pasos del Coliseo |

Se quedan tal cual (dato seguro o opinión sobre un sitio recomendado): «la mayor cúpula de hormigón sin armar del mundo» (Panteón, ficha), «el puente romano más antiguo que sigue en pie», «el obelisco egipcio más alto de Roma», «la única isla del Tíber», «el arco triunfal mejor conservado de Roma», «el edificio más famoso de Roma» (Coliseo), los «el mejor … de Roma» de los restaurantes, «las termas más espectaculares de Roma» y los «de las mejores vistas / los rincones más bonitos de Roma» (opiniones, no datos de «del mundo»).

## Pruebas (todas con servidor propio en el puerto 8856, en serie)
- Nueva `scripts/destino/pruebaFase6y9_fichas.mjs`: 145 comprobaciones, 0 fallos (las 11 correcciones en su sitio y las frases viejas fuera de todos los datos servidos; superlativos viejos fuera y suavizados dentro; JSON válido; frase de la moneda de Trevi intacta; ninguna de las 31 historias comparte 15 palabras seguidas con su ficha).
- pruebaFase6y7_historias 554/0; pruebaFase6y4_ficha 124/0; pruebaFase6y5_pantallas 247/0; pruebaFase6y6_cierre 3211/0 (la moneda de Trevi, bien); pruebaTanda6z6c 94/0; pruebaFase6z6f 22/0; pruebaTanda6z3 29223/0; pruebaCorr6z6 (las 3 partes) 0 fallos; pruebaFase6y2_fotos 102/0; pruebaFase6z6e 27/0; pruebaFase6z6fWikimedia 40/0; pruebaTanda6s 2511/0; pruebaTanda6u 1884 viajes/0; pruebaTanda6v 82/0; pruebaTanda6z5 119/0; pruebaFotos6z3 52/0.
- No hizo falta ajustar ninguna prueba antigua.
- No se lanzaron las 365 fechas.

## Decidido por Code
- Torre Argentina: se quita la frase de la batalla entera, y con ella la coma que la separaba del secreto anterior (queda 1 secreto).
- Obelisco: también se quita «el único que nunca cayó» de la descripción, para que las dos frases digan solo lo que Eric pidió.
- En P16 se ha ampliado a los superlativos de «del mundo», «la más famosa» y «mejor conservado» que no son un dato seguro; se ha usado «Considerado…» para los dos de «más antiguo del mundo» (Capitolinos, Mercados de Trajano) y se han dejado los de «de Roma» que son opinión de un sitio recomendado.
- `scripts/destino/corregirFichas6y7.mjs` ya no se puede volver a ejecutar (su frase del Castillo ahora tiene otro texto); no lo usa nada.

## Preguntas abiertas
1. ¿Quito del documento de historias la nota «Comprobar» del Cavalier d'Arpino («la ficha dice que por impago de impuestos»), que ya no es cierta? Es un texto de Eric: no se ha tocado.
2. ¿Dejo «El edificio más famoso de Roma» en los dos textos del Coliseo, o lo suavizo a «uno de los edificios más famosos»? Se han dejado porque es casi seguro, pero entra en la regla de «la más famosa».
