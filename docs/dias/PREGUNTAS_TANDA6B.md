# Preguntas de la Tanda 6b

Lo que he decidido yo mientras arreglaba el motor y pasaba el documento nuevo. Se cambia con un dato (`data/dias/roma/_destino.json › franjas`, `listasVariantes.mjs`, `listasNombres.json`) salvo lo que diga lo contrario.

## Hora fija, mañana y comida

1. **«Cerca» al llenar la mañana.** El documento dice «a 15 min andando o menos del sitio de la hora fija». Con tu propio ejemplo no sale: la Plaza de San Pedro está a 20 min andando de los Museos, el Castillo a 29. Lo he medido así: cada parada, a 15 min o menos de la anterior que se adelanta, y todas a 30 min o menos de la hora fija (`cerca_andar_min` 15, `cerca_max_min` 30). Con eso sale tu D2 con los Museos a las 14:00 (San Pedro, Basílica, Conciliazione, Castillo y Puente por la mañana, comida a las 12:18 en el Borgo, «Llegada a…» a las 13:30).
2. **La comida antes de la hora fija** va lo más tarde que deja la hora fija y nunca antes de las 12:00 ni después de las 12:30 como inicio. Si 60 min no caben (un Free Tour de mañana y los Museos a las 14:00 el mismo día), pruebo con 45 y con 30. Si ni así, la comida se queda donde está y la hora fija se llega tarde, apuntado en el registro (`reserva_tarde`).
3. **La comida de antes, en la zona de la hora fija.** Si el restaurante escrito queda a más de 12 min andando de la hora fija, va un restaurante de verdad (restaurante o pizzería) a 10 min o menos de ella y que no haya salido en el viaje; el motivo queda en el registro.
4. **Qué se adelanta y qué no.** Antes de la hora fija va lo que iba antes en la lista y cabe; después, lo cercano que iba detrás (en su orden); después, sitios cercanos del destino abiertos que el viaje no lleve en ningún día (a 450 m o menos, de 10 a 30 min). Lo que, adelantado, haría volver sobre los pasos pasa a «Si te sobra tiempo»: gana el reparto que menos deja fuera (una parada fuera cuenta como 2; una hora libre antes de la hora fija, como 1).
5. **El orden.** Con una hora fija, la comida y la propia hora fija pueden cambiar de sitio respecto a la lista (el ejemplo del D2 lo pide); el resto, no.
6. **El Foro Romano se entra por el lado del Coliseo.** He añadido a `roma.json` una `entrada` del Foro (41,8895 · 12,4890, aproximada, por revisar) y el motor la usa para saber si algo es un zigzag. Con ella, Arco → Foro → Coliseo ya no es una vuelta. Aun así, el Foro (90 min) no cabe antes de un Coliseo a las 11:00 si el día empieza a las 9:00 y el Arco va delante: queda Arco y una parada cercana, y el Foro después. Tu ejemplo pone el Foro primero y el Arco después de él: eso cambia el orden de la lista y no lo hago.
7. **El día nunca empieza más tarde por una reserva.** Dos excepciones que no son por una reserva: el lunes sin Galería del D4 (el documento dice «el día empieza más tarde»: 9:30) y el miércoles de audiencia (el documento pone la Plaza de San Pedro «desde las 12:30»). Si lo primero del día es una hora fija, el día «empieza» a esa hora y no se inventa nada antes.
8. **D0 a las 9:00.** He quitado el 9:30 que dejé en la Tanda 5: la tanda dice que el día empieza a las 9:00 (o a las 7:30 con Trevi «sin gente»).

## Cierres a la hora de llegada

9. **Espera de 15 min** (`espera_max_min`). Si no, por fuera o de camino (nivel 3, de camino; nivel 1 y 2, por fuera) con «Abre a las…». Si el sitio no se ve desde fuera, «Si te sobra tiempo». **Un imprescindible la primera vez** que no se ve desde fuera (la Basílica de San Pedro un miércoles de audiencia por la mañana) no puede pasar a «Si te sobra tiempo»: va por fuera (la fachada), con su aviso.
10. **Galería Borghese:** he cambiado en `roma.json` los turnos a «cada 2 horas» (9:00, 11:00, 13:00, 15:00 y 17:00). Sin reserva, se coge el turno más cercano a donde cae. Esa hora sale como si fuera una reserva (en negrita), pero es una propuesta: si prefieres otro texto («Turno recomendado»), dímelo.
11. **Avisos de temporada:** «En invierno cierra pronto» solo de noviembre a febrero (`context_banners.meses_invierno`); el cierre de la Basílica de San Pedro (18:30 de octubre a marzo, 19:00 de abril a septiembre) solo el mes que toca.

## «De camino»

12. **Un «de camino» no va a «Si te sobra tiempo» ni se quita para que quepa nada.** Si lo que se quita era adonde iba (el «de camino» justo antes), desaparece con ello y queda en el registro («la ruta ya no pasa por allí»). Para la pirámide no cuentan ni los «de camino», ni el desayuno, ni las paradas de relleno.

## El documento nuevo

13. **Via Garibaldi y «bajada a Trastevere»** (D1-corto): no son sitios de `roma.json`. Las he puesto como paradas «de camino» sobre el Mirador del Janículo («Via Garibaldi: se sube andando», 20 min) y sobre Santa Maria in Trastevere («Bajada a Trastevere», 5 min) para tener su sitio en el mapa. Si quieres lugares propios, hay que darlos de alta.
14. **«El día empieza a las 7:30»** lo leo de la línea de Trevi «sin gente»: D3, D4 y la mañana del DT-medio. Con Free Tour de mañana, el D4 sin Trevi empieza a las 9:00.
15. **Minutos:** los minutos nuevos los uso tal cual; en variantes (D0 al revés, D0-medio con Museos o miércoles, D2 sin Museos) he puesto los mismos números.
16. **Plan de lluvia del D0:** «la Basílica y el Panteón ya van por dentro; el Foro, el Coliseo y Navona, más cortos»: el motor acorta Navona a 30, el Foro a 15 y el Coliseo a 20.

## Noche, cena y descanso

17. **Cena de verano a las 20:00** (de mayo a septiembre) y a las 19:30 el resto. La tarde cabe hasta una hora después de la cena más temprana.
18. **Nocturna imprescindible** solo si el taxi desde la cena es de 15 min o menos (o si está a menos de 1,5 km, que cuento como andando); si no, la nocturna escrita del día. Cambia el D3 (Prati): se queda con «el Puente y el Castillo» cuando Trevi queda lejos.
19. **Tarjeta de descanso:** sale si entre la última parada y la cena hay más de 1 h (contando lo que se anda hasta el restaurante). La frase de la noche sale de `_destino.json › noche_frases` («la Fontana de Trevi iluminada», «Trastevere de noche»…): textos míos, por revisar.
20. **Franjas con hora:** «Mañana» de la primera parada (hacia abajo a la media hora) hasta la comida (hacia arriba); «Tarde» desde el final de la comida hasta la última parada; «Cena» a la hora de cenar, a la media hora más cercana. Es solo lo que se enseña.

## HOY

21. **«Vas bien de tiempo»:** sobran más de 45 min (`vas_bien_min`) hasta el final de la franja. Fin de la mañana: las 14:00; fin de la tarde: la hora de cenar. «Vas justo»: no cabe lo que queda; la parada que se propone dejar es la de menos importancia que se puede quitar sin romper una comprobación.
22. **Sugerencias:** hasta 6; primero lo de «Si te sobra tiempo» del día, luego sitios cerca de lo que queda o a 5 min o menos de donde está, abiertos y con tiempo de verlos. Un sitio que el viaje lleva otro día **posterior** sale con «Lo tienes el día n»; uno que ya se vio, no sale.

## Pruebas

23. **Dos cosas de la prueba que eran demasiado estrictas** y las he corregido (cada una con su causa en `INFORME_TANDA6B.md`): el zigzag antes dejaba pasar volver a una hora fija (ahora cuenta); la comida tarde no cuenta si delante solo hay imprescindibles, «de camino», paradas de relleno o cosas que el viajero eligió.
