# Preguntas abiertas de la Tanda 6y8

(Si las 365 fechas completas, que se lanzan después del push, dieran algún fallo, aparecerá aquí arriba como lo primero de la siguiente tanda. Por ahora no hay ninguno apuntado.)

1. **Dos reservas el mismo día** (por ejemplo el Free Tour y los Museos): el agente primero movió paradas a «Si te sobra tiempo» para que las dos entradas salieran a su hora, y eso chocaba con tu regla 17 («con una reserva no se quita nada»). Elegí la regla 17: con dos reservas del viajero el mismo día el motor no aplica lo de la comida y la cena y manda la lista escrita de siempre; con **una sola** reserva la entrada nunca sale tarde. ¿Vale?
2. **La cena después de las 22:30:** una reserva que acaba después de las 22:15 no deja cenar antes de las 22:30. Como la regla 17 manda, ya no se quita nada por esto: la cena puede salir más tarde de las 22:30 y la prueba lo cuenta aparte («cena imposible»). ¿Lo dejamos así o prefieres otra cosa?
3. **Con los Museos a las 12:00:** la Basílica pasa a después de los Museos si ni con la comida corta cabe antes. El Castillo y el Puente van siempre después de los Museos con esa hora. ¿Bien?
4. **El día de la Galería (5 y 7 días):** con una reserva extra el mismo día, la comida queda después en un 10 % de los casos para no llegar tarde (se apunta en el registro del día).
5. **El turno real de la Galería sin reserva** queda fuera de la regla, salvo que el viajero tenga otra reserva ese día. ¿Lo quieres dentro siempre?
6. **Duraciones:** todos los sitios de Roma con reserva traen `duration_minutes` (Coliseo 90, Museos 180, Galería 120). Si a un sitio de otro destino le falta, el motor usa los minutos de su parada. Hay que revisarlo al meter destinos nuevos.
