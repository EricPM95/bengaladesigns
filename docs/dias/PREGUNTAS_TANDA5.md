# Preguntas de la Tanda 5

Lo que he decidido yo mientras trabajaba. Todo se cambia con una línea de datos o de regla; dime y lo cambio.

1. **Museos en el pool con 1 día.** Mañana = la de «Con reserva de los Museos» del D0-medio hasta la comida; tarde = la del D0 desde Piazza Navona. Está como regla provisional (versión `con_museos` del D0). Dime cómo quieres que quede y lo escribes en el documento.
2. **Coliseo reservado en 1 día.** El D0 no trae orden de «entrada reservada». El motor pone el Coliseo a la hora reservada (9:00 en la página de simulación), con su «Llegada a…» antes, y el resto corre con los márgenes. No hay tabla escrita para ese caso: ¿quieres escribirla?
3. **Restaurante de recambio.** «Restaurante de verdad» = campo `tipo_local` en el dato (`restaurante` o `pizzeria`; 67 sitios marcados por mí a partir de su descripción). Hornos, comida rápida y bares de vinos no valen. Revisa la lista de `tipo_local` en `roma.json`.
4. **Mismo restaurante, sin recambio.** Si no hay ninguno a menos de 10 min, va el escrito aunque se repita y queda apuntado (hoy ocurre 2 veces: Da Enzo al 29 en 6 días con «quedarme en Roma», 1 y 3 de enero).
5. **Huecos de más de 30 min que se quedan.** Son 124 casos (en la prueba como `hueco_con_aviso`): ningún colchón con contenido ni comida puede alargarse sin pasar de su tope, y una calle, puente o plaza no se alarga. Se dejan, y el motor lo apunta. Ejemplo: Puente Sant'Angelo acaba a las 19:35 y L'Arcangelo es a las 20:30.
6. **Imprescindible «de camino».** Quedan 8 de los 654: Plaza de San Pedro el 25 de diciembre con Free Tour de mañana. Ahí no hay nada de nivel más bajo que quitar. Los dejo con aviso.
7. **Escalera Santa.** Va en la parada de San Juan de Letrán con la foto de Letrán. El archivo `dia_escalera_santa.jpg` queda sin usar (la prueba lo lista como «sin registrar»): ¿lo borro?
8. **Excursión de medio día en 6 días.** Si el día de la excursión no tiene paradas de nivel 1 o 2 por la tarde, sale «tarde libre» (como antes). Lo dejo así.
9. **La media jornada del D5 en 4 días** se ofrece también desde el botón del autobús (hoja «¿En qué día?»): llama al motor, que recalcula la tarde desde las 16:00.
10. **Página de simulación.** Los 6 viajes de 1 día están en `VIAJES_3_6_MOTOR.html` (39 viajes). La 2,5 días tiene 77 diferencias sin causa respecto a la simulación vieja (antes 64): vienen de las reglas nuevas (restaurantes, huecos), no de un fallo; la simulación vieja no se ha tocado.
