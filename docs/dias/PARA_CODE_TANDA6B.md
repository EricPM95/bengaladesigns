# Para Code · Tanda 6b: lo que falla en el motor de listas

He revisado `VIAJES_LISTAS.html`, el informe, la prueba y tus preguntas. La forma nueva funciona: el orden de las listas se respeta, las reservas van a su hora con su «Llegada a…», los restaurantes cambian a su alternativa y las nocturnas no se repiten. Pero salen cuatro fallos que tu prueba no ve. **Si tu prueba dice 0 y aquí hay un caso, primero se arregla la prueba**, y en el informe explicas por qué no lo vio.

## Cómo trabajar

- **Nada de parches:** cada arreglo, en su regla y para todos los destinos.
- `DIAS_ROMA_PARADAS.md` no se toca.
- `PROGRESO_TANDA6B.md` con una línea por bloque, y TERMINADO al final.
- Al acabar, `INFORME_TANDA6B.md` en palabras sencillas.
- **Commits locales por bloques. No hagas push.**

## 1. Se entra en sitios que aún están cerrados

**Lo que pasa:**
- **D1:** la Iglesia del Gesù, por dentro hacia las 15:25, con el aviso «Abre a las 16:00».
- **D4:** Santa Maria del Popolo, por dentro hacia las 15:15, con «Abre a las 16:00».

Pasa en todos los viajes de 2 días o más, y tu prueba de «nada cerrado» da 0: seguramente mira el día o la franja, no la hora de llegada.

**La regla:** con la hora orientativa de llegada, si un sitio por dentro aún no ha abierto, o cierra antes de que acabe la visita:
- si se espera **15 min o menos**, se espera;
- si no, **pasa a por fuera o de camino** (la fachada), con su aviso «Abre a las 16:00». **Nunca se cambia el orden.**
- Si no se ve desde fuera, pasa a «Si te sobra tiempo».

**La prueba:** 0 visitas por dentro con la llegada fuera de su horario.

## 2. La comida, nunca detrás de una visita larga con hora fija

**Lo que pasa:** en el viaje de 3 días con reservas, D2, los Museos son a las 14:00.
- El día empieza a las 11:30.
- La comida es a las 17:10.
- La cena es a las 21:35, con 162 min de más.

**La regla:**
- **La comida, antes:** si una hora fija empieza entre las 12:30 y las 15:00 y dura más de 1 hora, la comida va antes, **entre las 12:00 y las 12:30**, en la zona de la hora fija y pegada a su «Llegada a…».
- **La mañana se llena con lo que está cerca:** lo de la mañana que cabe antes va antes. Si aún queda más de 1 hora libre, se adelantan las paradas que van **después** de la hora fija y están cerca (a 15 min andando o menos del sitio de la hora fija). Van en su mismo orden, y solo si no hacen zigzag.
- **El día nunca empieza más tarde por una reserva.** Empieza a su hora (9:00, o 7:30 si abre con Trevi «sin gente»), y la mañana se llena por este orden, siempre con las comprobaciones de siempre:
  1. lo que va antes en la lista;
  2. lo cercano que va después;
  3. si aún sobra más de 1 hora, sitios cercanos del destino que no salgan en el viaje y estén abiertos.
- Si la reserva es antes de que empiece el día, el día empieza antes.
- **Quita** del motor «el día empieza más tarde» (punto 3.3 de la Tanda 6).

Para ese D2 tiene que quedar más o menos así:
- **Mañana, desde las 9:00:**
  - la Plaza de San Pedro y la Basílica;
  - de camino, la Conciliazione;
  - el Castillo por fuera y el Puente.
- **Comida:** hacia las 12:30, en el Borgo, de vuelta hacia el Vaticano.
- **Hora fija:** «Llegada a…» a las 13:30 y Museos a las 14:00.
- **Tarde:** bus o taxi a Trastevere, con la Isla Tiberina, Santa Maria in Trastevere y el Janículo.
- **Cena:** a su hora.

**La prueba:**
- 0 comidas después de una visita con hora fija que empieza antes de las 15:00;
- 0 días que empiezan más tarde de su hora por una reserva;
- caso de prueba: el Coliseo reservado a las 11:00 en el D1. Por la mañana, el Foro y Palatino desde las 9:00, el Arco, «Llegada a…» y el Coliseo a las 11:00; después, los Fori Imperiali, el Campidoglio, el Altar y la comida en el Gueto.

## 3. Volver a una hora fija también es zigzag

**Lo que pasa:** viaje de 3 días, D1, con el Coliseo reservado a las 12:00. La ruta queda:
1. Arco y Foro;
2. **Plaza del Campidoglio**;
3. vuelta al **Coliseo** (más de 1 km);
4. otra vez al **Altar de la Patria**, al lado del Campidoglio.

Es un zigzag. Tu pregunta 18 dice que volver a una hora fija no cuenta: **no vale**.

**La regla:** antes de la hora fija solo va lo que **no aleja** del sitio de la hora fija: más de unos 300 m hacia otra zona a la que luego se vuelve. Lo que aleja va **después** de la hora fija, en el mismo orden.

En este D1:
- **Antes:** el Arco y el Foro y Palatino. El Foro tiene la entrada al lado del Coliseo.
- **Después:** «Llegada a…», el Coliseo a las 12:00, Fori Imperiali, Campidoglio, Altar y comida en el Gueto.

**La prueba:** el zigzag cuenta también cuando la vuelta es a una parada con hora fija.

## 4. Lo que va «de camino» no pasa a «Si te sobra tiempo»

**Lo que pasa:** sale «Si te sobra tiempo: Plaza Venecia (5 min)» y «Via della Conciliazione (5 min)». Lo que va de camino no ocupa tiempo: pasas por delante.

**La regla:**
- un «de camino» no se quita para que quepa una franja;
- solo desaparece si la ruta ya no pasa por allí, y entonces no va a ningún sitio;
- «Si te sobra tiempo» lleva solo paradas.

## 5. Pequeños

- **Avisos de temporada fuera de su temporada:** las Termas de Caracalla llevan «En invierno cierra pronto» en julio. Cada aviso de temporada, solo en sus fechas.
- **La Galería Borghese** sale hacia las 10:50, y no es un turno de verdad. Sus turnos son cada 2 horas: 9:00, 11:00, 13:00, 15:00 y 17:00. Sin reserva puesta por el viajero, se coge el **turno real más cercano** a donde cae, y lo de alrededor se coloca con la regla de la hora fija.

- **Fotos:** `auditarFotos.mjs` y `fotosRevision.mjs` aún leen las tablas viejas. Apúntalos a `listas.json`. En el informe, la lista de paradas sin foto.
- **Restaurantes repetidos:** en el informe, los 28 casos de 6 días sin recambio, con el día y la zona. Yo busco una tercera opción para cada zona.

## 6. El documento ha cambiado (6-oct-2026, tarde)

En los días de los viajes de 1 y 1,5 días sobraban 3 o 4 horas por la tarde. Ahora entran por dentro los sitios gratis o baratos que ya estaban en la ruta:

- **D0:** la Basílica de San Pedro, por dentro (en vez de la fachada), y el Panteón, por dentro.
- **D0-medio, la tarde:** la Basílica, por dentro.
- **D1-corto:**
  - el Panteón, por dentro;
  - después del Ponte Sisto, se sube por Via Garibaldi al Mirador del Janículo;
  - se baja a Santa Maria in Trastevere, por dentro, antes de cenar.

**Minutos nuevos, mejor pasarse que quedarse corto** (regla 3 del documento, en todos los días): un imprescindible, la primera vez que sale en el viaje, lleva tiempo para verlo, hacer fotos y vídeos.

| Cómo se visita | Minutos | Sitios |
|---|---|---|
| Por fuera, los grandes | ~45 | Coliseo, Trevi, Navona, Plaza de San Pedro, Plaza de España |
| Por fuera, los demás | ~30 | Altar, Castillo, Campidoglio, el Foro desde la terraza |
| Por dentro | ~1 h como mínimo | Basílica de San Pedro, y lo grande |
| Por dentro, los pequeños | ~45 | Panteón, Altar |

Las excepciones están escritas en la regla. **Trevi «sin gente» también lleva ~45**, y el día que empieza con ella empieza a las **7:30**, no a las 8:00: el D3, el D4 y la mañana del DT-medio. Esto cambia tu pregunta 1 de la Tanda 6.

**Sin horas en las paradas** (regla 3; quita el punto 8 de la Tanda 6):
- en RUTA y DÍAS no sale ningún «hacia las 10:35» en las paradas;
- solo la franja con su hora: «Mañana · 9:00–14:00», «Tarde · 15:00–19:30», «Cena · 20:00»;
- y las horas fijas: reservas, turnos y el Free Tour.

Los minutos siguen dentro del motor, para saber si cabe y para HOY.

**HOY: «Vas bien de tiempo» y «Vas justo»** (regla 15). Cada vez que el viajero marca «Visto», el motor compara la hora real con lo que le queda de la franja (las paradas que faltan, con sus minutos y los trayectos):
- **Sobran más de 45 min:** «Vas bien de tiempo».
  - Si era la última parada antes de comer o cenar: «¿Vas ya al restaurante o quieres ver algo más?».
  - Si va antes al restaurante, la franja siguiente empieza antes y se vuelve a calcular.
- **Le falta tiempo:** «Vas justo. ¿Dejamos {lo de menos importancia} para si te sobra tiempo?» (la pirámide). El viajero decide. Sustituye al botón «Voy con retraso». «Estoy cansado» y la lluvia se quedan.
- **Si no,** no sale nada.

**Las sugerencias de «Vas bien de tiempo»:**
- primero lo de «Si te sobra tiempo» de ese día;
- luego, sitios del destino cerca de lo que le queda por recorrer, o a 5 min o menos de donde está;
- **abiertos** a la hora a la que llegaría y con tiempo de verlos antes de que cierren;
- que no hayan salido ya en el viaje;
- que **no sean de otro día del viaje**, o con el aviso «Lo tienes el día {n}»;
- con las comprobaciones de siempre;
- nunca se añaden solas: el viajero pulsa «Añadir».

Vuelve a pasar `DIAS_ROMA_PARADAS.md` por el convertidor.

Si el mismo sitio ya va por dentro otro día del viaje, la regla de siempre: la segunda vez va por fuera o de camino.

## 7. Respuestas a PREGUNTAS_TANDA6.md

Todo lo que no sale aquí, vale como lo hiciste.

- **3:** la cena en verano (de mayo a septiembre), **a las 20:00**, no a las 20:30. En invierno, a las 19:30.
- **18:** no. Ver el punto 3.
- **20:** sí, la nocturna imprescindible, aunque sea con taxi, siempre que el taxi sea de **15 min o menos**. Si es más, va la nocturna escrita del día.
- **25:** lo pruebo yo en el móvil.

## 8. Días con cabeza: mejor que sobre (regla 5 del documento)

Preferimos que la app diga «Vas bien de tiempo, ¿quieres añadir algo?» a que diga «hemos quitado…». El viajero no tiene que sentirse frustrado.

- **Textos:** en ningún sitio de la app sale «hemos eliminado», «hemos quitado» ni «no cabía». Lo que no entra va a «Si te sobra tiempo», con textos en positivo: «Si te da tiempo», «Para otro momento».
- **Cambia** «Hemos ajustado tu día para que no pierdas lo importante» por «Tu día, con lo importante primero». Revisa todos los textos.
- **Tarjeta de descanso** (regla 12 del documento, para todos los destinos): si la tarde acaba más de 1 h antes de la cena y el día tiene noche, entre la última parada y la cena sale «Llevas todo el día caminando: relájate, que después de cenar te llevamos a ver {la noche del día}». El nombre de la noche sale del dato del día, por ejemplo «la Fontana de Trevi y la Plaza de España iluminadas». Sin noche: «… aprovecha para descansar antes de cenar». Debajo, si va bien de tiempo, «¿Quieres ver algo más?» con las sugerencias de HOY.
- **En el informe:** la lista de los días que, **sin reserva, sin cierre y sin pool**, no caben enteros con los minutos nuevos. Pon el día, la franja, cuántos minutos se pasa y qué pasaría a «Si te sobra tiempo».
  - No cambies nada para que quepan: los acorto yo en el documento.
  - Lo normal tiene que ser que un día escrito quepa entero.

## 9. Pruebas y páginas

1. La prueba entera, con las comprobaciones nuevas de los puntos 1 a 4.
2. Regenera `VIAJES_LISTAS.html`.
3. Reinicia el api-server.
