# Informe · Diseño de la app, partes 1 y 2 (29 de septiembre de 2026)

Commits por parte, **sin push**. Las reglas generales están en INVARIANTES (354 y 355).

## Parte 1 · Pestaña Días (`d867120`)

- **Cada día con su color.** Cada día guarda su color (`colorIndex`), que se fija al crear el viaje. Va con el día, no con su posición: si se mueve o se elimina otro día, no cambia.
  - Se ve en una franja diagonal fina a la izquierda del acordeón.
  - También en el número del día: claro sobre el cuadrado oscuro, fuerte sobre el claro. El cuadrado no cambia.
  - Y en los pines y la línea del mapa. Sin día abierto, el mapa enseña todos los días, cada uno con su línea; al abrir uno, solo ese. Sin leyenda.
- **El asa.** A la izquierda del todo, asomando por el borde y sin tapar la franja. Es más grande, con 44 × 44 px de zona de toque, y solo sale en los días que se pueden mover.
- **Menú «···».**
  - «Volver al día original», con la varita, solo si el día tiene cambios.
  - «Eliminar día», en todos, también llegada y vuelta. Pregunta en una ventana de la app y deja el aviso «Día eliminado · Deshacer».
  - Si eliminas el primer día, el viaje empieza un día después.
- **La varita, «Volver a mi ruta original».** Es un botón redondo debajo de la flecha del mapa, con su mismo estilo.
  - La primera vez sale con el texto «Ruta original»; después, solo el icono.
  - Solo aparece si hay cambios.
  - Recupera la copia guardada al crear el viaje (días, orden, paradas, horas, restaurantes y fechas), sin recalcular nada.
  - Al terminar deja el aviso «Ruta original recuperada · Deshacer».
- **Un fallo arreglado.** Al mover un día, «Volver al día original» le devolvía su número de antes; ahora se queda donde está.

## Parte 2 · Interior de cada día (`f5bbc2f`)

1. **Color del día dentro.** El número del día y los números de las paradas van en el color del día, como sus pines: relleno claro, número fuerte y borde blanco. Con el día abierto, los pines y la línea del mapa también.
2. **Tres tramos.**
   - El orden es Mañana → Comida → Tarde → Cena → Noche. Ya no hay «Mediodía» ni «Atardecer».
   - Lo de antes de comer es la mañana.
   - La comida y la cena van entre tramos. Si la cena va detrás de las nocturnas (invierno), va dentro de la Noche, al final.
   - Hay 50 px encima de cada bloque. De la cabecera al primer «+ Añadir parada» hay el mismo espacio que entre paradas.
3. **Comida y cena, formato «Mesa».** Tarjeta terracota suave con el icono en un círculo, «COMIDA · 13:15 – 14:15» en mono, el restaurante en Instrument Serif, los minutos debajo y «Cambiar».
4. **El desayuno.** El mismo formato en pequeño, sin número y con «Cambiar» como enlace.
5. **«De camino».** Mini-tarjeta de 60 px con borde discontinuo, foto redonda, «DE CAMINO · SIN DESVÍO», el nombre y «Ver ›». No lleva número ni hora.
6. **Volver al día original.** Ya no hay botón dentro del día: está en el menú «···».
7. **La excursión.** Ya no sale «Montar día manualmente». Al final de la lista de días, si el viaje no lleva excursión, sale la tarjeta «Sal de Roma un día».
   - Tres escapadas sin repetir sitio (Pompeya, Florencia y la Costa Amalfitana), con foto y sin precios.
   - Al tocar una se abre su ficha, y al elegirla pregunta qué día se cambia. En 4 días propone el de D5C.
   - Las fotos de las excursiones se buscan con un término nuevo del destino (`photo_name`, en inglés), porque con el nombre en español salía cualquier cosa.
8. **Las fotos.**
   - Las paradas de noche piden «(noche)». El servidor busca ese lugar de noche y exige que la foto lo diga («night», «evening», «illuminated»…). Si no hay, usa la de día del mismo lugar, nunca la de otro.
   - Llevan su propia clave de caché, así que la Plaza de España ya no sale con la Fontana de Trevi.
   - Revisión en [`docs/FOTOS_ROMA.html`](FOTOS_ROMA.html) (`scripts/destino/fotosRoma.mjs`): 81 lugares; de los 16 que salen de noche, 8 tienen foto nocturna y 8 usan la de día del mismo lugar.
   - La clave de Unsplash sigue solo en el servidor.
9. **Horas y duraciones de 5 en 5.** Ya estaba hecho en el pulido del motor (`eed34c3`, regla 349). La prueba de las 365 fechas y los 56 viajes salieron igual o mejor.
10. **Avisos de fechas.** Flechas ‹ › a los lados, «1 de 3» junto a los puntitos, y «Siguiente» hasta el último aviso, que dice «Entendido».
11. **«34 hasta Museos Vaticanos».** Ahora dice «34 min hasta…», en la comida y en la cena.

## Capturas (móvil, 375 × 812)

| | |
|---|---|
| Días en invierno (19-22 nov, 4 días) | [dias_invierno.jpg](capturas_ui/dias_invierno.jpg) |
| Día eliminado, con la varita y el aviso | [dia_eliminado_varita.jpg](capturas_ui/dia_eliminado_varita.jpg) |
| Día de invierno abierto: mañana | [dia_invierno_manana.jpg](capturas_ui/dia_invierno_manana.jpg) |
| Día de invierno: cena y noche | [dia_invierno_cena_noche.jpg](capturas_ui/dia_invierno_cena_noche.jpg) |
| Comida «Mesa» y «De camino» | [comida_y_de_camino.jpg](capturas_ui/comida_y_de_camino.jpg) |
| «Sal de Roma un día» | [excursion_tarjeta.jpg](capturas_ui/excursion_tarjeta.jpg) |
| «¿Qué día la haces?» (propone el de D5C) | [excursion_que_dia.jpg](capturas_ui/excursion_que_dia.jpg) |
| Días en verano (9-12 jun) | [dias_verano.jpg](capturas_ui/dias_verano.jpg) |
| Día de verano: tarde | [dia_verano_tarde.jpg](capturas_ui/dia_verano_tarde.jpg) |
| Día de verano: cena y noche (el Panteón de noche) | [dia_verano_noche.jpg](capturas_ui/dia_verano_noche.jpg) |

## Lo que no he podido hacer, o conviene saber

- ~~**En local la app sigue sirviendo v3.**~~ *Resuelto el 29 de septiembre: tu `.env.local` ya tiene `ROUTE_ENGINE=v4` y las capturas de las partes 3 y de los retoques salen de v4. Las de arriba siguen siendo de v3.*
  - El diseño es el mismo con los dos motores, pero los días de v4 se ven distintos (por ejemplo, D2 A con el atardecer en el Castillo).
  - No lo he cambiado: es tu configuración. Si quieres v4 en local, quita esa línea o ponla a `v4`.
  - Conviene revisar también que Vercel no tenga `ROUTE_ENGINE` puesto.
- **No tengo el lienzo «Interior del día».** No está en el repo; he seguido el texto del prompt, que es lo que manda.
- **Las líneas del mapa con todos los días** se dibujan (una capa por día), pero con tantos pines juntos en el centro se ven poco.
- **Excursiones de viajes antiguos.** Los viajes creados antes de este cambio no tienen `photo_name`, y sus tarjetas de excursión pueden salir sin foto hasta que se rehagan.
- **Fotos de noche.** Cuando Unsplash no tiene una buena, sale la de día del mismo lugar (8 de 16). Mírala en `FOTOS_ROMA.html` y dime cuáles cambiar a mano.

# Parte 3 · Llegada y vuelta (29 de septiembre de 2026)

Regla 358 en INVARIANTES (y 359-361, arreglos que salieron al probar). Las capturas son de un viaje nuevo con **v4** (Barcelona → Roma, 13-16 oct, en pareja, completo), a 375 px.

- **Dónde van.** La llegada, en el primer día, justo después del bloque de alojamiento; la vuelta, al final del último, con «Fin del viaje. Arrivederci, Roma.» debajo. Van con la posición: al borrar el día 1, el nuevo primero hereda la llegada y el alojamiento.
- **La barra.** Tipo billete (52 px, 48 en móvil): bloque petróleo con el icono del medio y su diagonal, datos en mono, la hora clave en terracota y la línea de puntos con muescas. Sin reserva, «+ AÑADIR VUELO» en azul, que abre Reservas con la casilla de esa hora ya enfocada.
- **Las horas** salen de una sola regla para la app y para la página de revisión (`shared/arrival/arrivalRules.js`): 11:30 en Fiumicino → en el centro 12:30; vuelo 19:30 → sal a las 16:30.
- **Las marcas.** «Llegas después» y «Ya te has ido» en rojo. Nada se mueve solo:
  - «Ajustar este día a tu llegada» reprograma desde la hora en el centro.
  - «Ajustar este día a tu vuelta» no rehace el día: quita lo que acaba después de salir y respeta las horas del motor. En el ejemplo, el día acaba en Santa María la Mayor, al lado de Termini, a las 16:25.
  - Las comidas siguen a las paradas.
  - Cuenta como cambio: sale la varita y lo devuelve todo.
- **La ventana.** Foto del punto, «LLEGADA · MAR 13 OCT», el título y el vuelo con «Editar». Con vuelo, eliges Fiumicino o Ciampino; sin vuelo, salen los dos.
  - Resumen con todas las formas de ir (la más cómoda primero), la estación, la consigna, la primera parada, «Tu última tarde, sin prisas» y «Tu última hora».
  - Traslados, tal cual.
  - Tips con título en negrita.
  - Cada precio lleva su fuente y la fecha.
- **Por medio.** Avión, tren, autobús, ferry, crucero (un ferry de un día) y coche, con su icono, sus textos, su hora clave y su contenido. En coche, sin hora clave: «OJO CON LA ZTL», y sin Traslados. La vuelta puede ir en otro medio que la ida.
- **Datos.**
  - `data/dias/roma/_llegada.json`, con fuente y fecha de cada precio.
  - Revisión en `docs/LLEGADAS_ROMA.html` (`node scripts/destino/llegadas.mjs roma`), con la barra de cada medio con y sin reserva, las tres pestañas y los precios con sus fuentes.

**Al comprobar los precios en las webs oficiales cambié cuatro cosas de los textos que había:**
- El billete Minigruppi (4 × 40 €) no vale en la mayoría de los Leonardo Express: lo he quitado.
- En el Leonardo, los niños de 4 a 11 años viajan gratis, uno por adulto que paga.
- El taxi de Ciampino son 40 € (no 30).
- Italia y España tienen ahora controles temporales en las fronteras aéreas, así que el tip dice «lleva el DNI» en vez de «no hay control de pasaportes».

**Arreglos que salieron al probar:**
- Las fichas a pantalla completa del día (parada, comida, llegada) se abrían encerradas en la tarjeta o por debajo de la cabecera. Ahora van en el body (regla 359).
- Al borrar el día 1, la etiqueta «Audiencia papal» se pasaba al jueves. Ahora va con su fecha (regla 360).
- San Clemente quedaba a las 12:30, justo cuando cierra. Ahora la visita entera tiene que caber en un tramo abierto (regla 361).

| | |
|---|---|
| Llegada sin vuelo | [llegada_sin_vuelo.jpg](capturas_ui/llegada_sin_vuelo.jpg) |
| Llegada con vuelo: «Llegas después» y «Ajustar» | [llegada_con_vuelo.jpg](capturas_ui/llegada_con_vuelo.jpg) |
| Vuelta sin vuelo y despedida | [vuelta_sin_vuelo.jpg](capturas_ui/vuelta_sin_vuelo.jpg) |
| Vuelta con vuelo: «Ya te has ido» | [vuelta_ya_te_has_ido.jpg](capturas_ui/vuelta_ya_te_has_ido.jpg) |
| Vuelta con vuelo: la barra | [vuelta_con_vuelo.jpg](capturas_ui/vuelta_con_vuelo.jpg) |
| Vuelta ajustada | [vuelta_ajustada.jpg](capturas_ui/vuelta_ajustada.jpg) |
| Ventana: Resumen (llegada, sin vuelo) | [ficha_llegada_resumen.jpg](capturas_ui/ficha_llegada_resumen.jpg) |
| Ventana: Resumen (vuelta, última tarde) | [ficha_vuelta_resumen.jpg](capturas_ui/ficha_vuelta_resumen.jpg) |
| Ventana: Traslados | [ficha_traslados.jpg](capturas_ui/ficha_traslados.jpg) |
| Ventana: Tips | [ficha_tips.jpg](capturas_ui/ficha_tips.jpg) |
| Primer día eliminado: el nuevo día 1 hereda llegada y alojamiento | [dia1_eliminado_llegada.jpg](capturas_ui/dia1_eliminado_llegada.jpg) |

- **Lo que no está.** El traslado privado sigue con el enlace de afiliado pendiente («#»), como antes.
- **Qué falta para usar la vuelta en otro medio.** La app ya lo sabe pintar, pero el formulario todavía no pregunta por el medio de la vuelta: falta ese campo.

# Retoques de las partes 1 y 2 (29 de septiembre de 2026)

Regla 362 en INVARIANTES. Capturas con **v4** a 375 px; el ordenador no cambia.

1. **La excursión nunca el día de llegada ni el de vuelta.** No salen en «¿Qué día la haces?» ni llevan «¿Prefieres una excursión este día?». Si el día de la oferta (D5C) es uno de ellos, se propone el día completo más cercano. En 4 días salen el 2 y el 3, y propone el 3.
2. **La comida en móvil.** «COMIDA · 13:15 – 14:20» en una línea, el restaurante en 18 px y dos líneas como mucho, y «Cambiar» más pequeño.
3. **«De camino» en móvil.** La etiqueta en una línea y el nombre entero (dos líneas si hace falta).
4. **Los botones del mapa y del presupuesto.** Hay espacio debajo de la lista, así que nunca tapan el «···» del último día. Llevan iconos de línea en vez de emojis.
5. **El mapa en español.** Mapbox en el idioma de la app (`APP_LANGUAGE`), en todos los destinos.
6. **v4 en local.** `ROUTE_ENGINE=v4` en tu `.env.local` y las capturas rehechas con v4.
7. **Las líneas del mapa con todos los días**, más gruesas (5 px) y con borde blanco.
8. **La tarjeta «Roma · fechas» en móvil.** Una línea («Roma · 13 – 16 oct»), el nombre en 20 px y 38 px de alto.
9. **Escala compacta en móvil (<480 px).**
   - Títulos de parada en 17 px, restaurante en 18, mono en 11 y textos de apoyo en 12.
   - La franja de la foto es más estrecha.
   - Los títulos van en dos líneas como mucho.
10. **El día abierto, sin la línea de color** de la izquierda: dentro, el color solo en los números y los pines. El día cerrado conserva su franja, y el número del día va neutro (oscuro) en todos.
11. **Revisión final con v4.** Los 35 viajes (las 5 fechas normales y los 30 del cierre), con horas de 5 en 5, están en [revision/REVISION_V4_FINAL.md](revision/REVISION_V4_FINAL.md) (`node scripts/destino/revisionV4Final.mjs`).
    - La auditoría no da ningún aviso, y el recuento de la Parte D sale a 0 en todo.
    - Las filas de tiempo libre del script redondeaban a 15 min; ahora van de 5 en 5, como la app.
    - Solo hay horas que no acaban en 0 o 5 en el atardecer, que es la hora real del sol.

**De paso:** la cabecera de cada tramo («TARDE · 14:30») redondeaba a cuartos, y la primera parada era a las 14:25. Ahora va de 5 en 5.

| | |
|---|---|
| Días cerrados: número neutro, iconos de línea y la tarjeta del mapa en una línea | [dias_cerrados_v4.jpg](capturas_ui/dias_cerrados_v4.jpg) |
| Día abierto sin línea de color; mapa en español | [dia_abierto_sin_linea.jpg](capturas_ui/dia_abierto_sin_linea.jpg) |
| «De camino» y tarjeta de parada compacta | [de_camino_movil.jpg](capturas_ui/de_camino_movil.jpg) |
| Comida en móvil | [comida_movil.jpg](capturas_ui/comida_movil.jpg) |
| El «···» del último día, libre | [ultimo_dia_botones.jpg](capturas_ui/ultimo_dia_botones.jpg) |
| Final de la lista | [final_lista_botones.jpg](capturas_ui/final_lista_botones.jpg) |
| «¿Qué día la haces?» sin llegada ni vuelta | [excursion_sin_llegada_vuelta.jpg](capturas_ui/excursion_sin_llegada_vuelta.jpg) |

# Repaso del diseño (PROMPT_UI_REPASO)

## 1 · Avisos de fechas: un aviso, un tema (regla 376)

Antes, el motor juntaba en una sola tarjeta por día lo automático (los cierres) y lo curado, con el título del curado.
Ahora va una tarjeta por tema: primero los cierres, con sus días en el título, y después lo informativo.

Avisos de Roma que he separado o cambiado de título:
- **Primer domingo de mes.** Antes: «Primer domingo de mes · Museos gratis», con los cierres de los Vaticanos dentro.
  Ahora son dos avisos: «Domingo 6 y martes 8 · Museos Vaticanos cerrados» y «Domingo 6 · El Coliseo y los museos del
  Estado, gratis», este con el icono de la entrada.
- **Cualquier día con un cierre y una fecha curada** (Año Nuevo, Reyes, Pasquetta, 1 de mayo, San Pedro, Ferragosto,
  la Inmaculada, Navidad): el cierre sale aparte, con su título («… · Museos Vaticanos cerrados»). Luego va la fiesta,
  con su `contexto`, que ya no habla de cierres.
- El icono del cierre pasa a ser un calendario tachado.

## 2 · Fuera «Sal de Roma un día» (regla 377)

Ya no está la tarjeta del final de la lista ni el banner de la oferta. Queda solo el enlace pequeño al final del día de
la oferta. El componente (`TripExcursionCard.tsx`) se queda en el repo, sin usar, por si sirve para la versión discreta.

## 3-14 · El resto del repaso (reglas 378-385)

3. **La varita, siempre a la vista**, encima del mapa, haya cambios o no. Sin cambios, dice «Tu ruta está tal como te la
   preparamos». Con el mapa plegado en el móvil, va en la columna de botones: presupuesto abajo, mapa encima y varita
   arriba, a 12 px, y la lista deja sitio debajo.
4. **Barra de llegada:** 50 px hasta «MAÑANA».
5. **Cifras del día:** tres en fila, separadas por una línea fina, con el número en Instrument Serif y la palabra en mono:
   «13 PARADAS | 10,6 KM A PIE | 7 H 30 DE ACTIVIDAD». Sin iconos.
6. **«De camino»:** del ancho de las paradas, con 16 px arriba y abajo.
7. **Cabeceras de tramo:** 50 px encima y 12 debajo.
8. **Comida y cena:** 50 px encima y 50 debajo.
9. **La ventana de llegada y vuelta:** lleva arriba el mapa del viaje entero, en vez de la foto.
10. **Todos los días se mueven**, también llegada y vuelta, con sus fechas por posición. Si al moverlo una parada cae en
    un día en que cierra, sale la marca roja.
11. **Tarjeta de parada:** hora, nombre, horario y tiempo, y etiquetas. «Reserva…» pasa a Entradas y «Por dentro/fuera»
    a Resumen. Solo se queda lo rojo.
12. **Bus y metro** como la fila de andar: «Bus 115 · 20 min», «Rutas» y «+ Añadir parada».
13. **El aperitivo** es una tarjeta: copa, foto del barrio al anochecer, hora, nombre, tiempo y etiqueta. Las ideas van
    en su ficha.
14. **La cena cuenta desde el bloque de justo antes** (el aperitivo), y pone «Justo al lado» en vez de «0 min andando».

Pendiente: las capturas a 375 px. El panel del navegador estaba oculto y no deja comprobarlo a la vista.

# Repaso del diseño, 2.ª tanda (PROMPT_UI_REPASO_2)

1. **Cabecera y barra de abajo** (0ec91b8, regla 386).
   - Arriba: la bombilla (tips) y la varita, siempre igual. Sin cambios, la varita dice «Tu ruta está tal como te la
     preparamos».
   - Abajo, la píldora oscura con 5 iconos: nuevo viaje, presupuesto, perfil con MIS VIAJES, mapa y reservas con «!».
   - Arriba quedan Hoy, Ruta, Días y Explorar. Ya no hay botones flotantes ni «Mostrar mapa».
2. **La nota de temporada, en la ventana de los avisos** (23dcf5c, regla 387).
   - Es la primera tarjeta, con el título «Invierno en Roma».
   - En el sitio del dibujo lleva una franja con el degradado y el efecto de su época: nieve, sol poniéndose, pétalos u
     hojas. Con «reducir movimiento», quieta.
   - Sin avisos de fechas, la ventana sale solo con ella. Fuera de la pestaña Días.
3. **Los tips del viaje** (f2244b3, regla 388). Al tocar la bombilla se abre una ventana a pantalla completa.
   - Cabecera oscura: «8 cosas que un romano te diría» y «Lo que ojalá te hubieran contado».
   - Cada tip en una tarjeta: número grande, etiqueta de color, título y texto. El de los turnos lleva «Ver entradas de
     tu viaje ›», que abre Reservas.
   - Los datos están en `data/dias/roma/_tips.json`, cada uno con su fuente y la fecha de comprobación (29-9-2026):
     - Trevi: fontanaditrevi.roma.it;
     - nasoni: Acea;
     - vestimenta: basilicasanpietro.va;
     - reserva obligatoria de la Borghese: galleriaborghese.cultura.gov.it;
     - bus 64: ATAC.
4. **La tasa de Trevi, según el día** (128b0fd, regla 389). La web oficial lo confirma: 2 €, de 9:00 a 22:00, y los
   lunes y viernes desde las 11:30. Además, algunos lunes desde las 14:00 (12 y 26 oct, 9 y 23 nov, 7 y 21 dic).
   - Los textos curados admiten `variables` por día. Un lunes a las 9:30, la parada ya dice «bajas sin pagar: la tasa
     empieza a las 11:30».
   - Sin fechas, el texto cuenta la excepción. Lo he comprobado con el motor, un día por cada caso.
5. **Tarjeta de parada** (ef67a6f, regla 390).
   - «Revisita» y «Por tu experiencia» vuelven como etiquetas.
   - El paseo nocturno y «El tour acaba en…» van arriba del Resumen de la ficha.
   - «Añadida por ti», fuera.

Pendiente: capturas a 375 px. El panel del navegador seguía oculto (los clics no avanzan), así que hay que mirarlo en el
móvil. Lo más importante:
- la ventana de avisos, con la franja de temporada;
- la bombilla;
- las etiquetas nuevas.
