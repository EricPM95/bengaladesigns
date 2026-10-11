# Preguntas de la Tanda 6y2

## Para decidir
1. **`pool_lista` no es la lista de imprescindibles de EXPLORAR** (que no tiene lista: ordena por «me gusta», nivel y orden editorial). Hoy la ruta a mano ordena «Añadir parada» por `pool_lista` y, detrás, nivel 1. ¿Qué prefieres: `pool_lista`, el nivel 1 (11 lugares, incluida la Plaza de San Pedro), o los dos juntos?
2. **Fotos:** elige de `FOTOS_ROMA_CANDIDATAS.html` o pon las tuyas. La Cripta de los Capuchinos necesita foto tuya; Via dei Coronari y Borgo Pio no tienen buenas candidatas.
3. **«Excursión a Tívoli»** (sale una gruta de Nápoles de Wikipedia) y **«Excursión a Pompeya y Sorrento»** (Unsplash, sin confirmar). ¿Las añado a las rechazadas y a la página de candidatas?
4. **Las 6 fotos equivocadas de `_fotos_wikimedia.json`:** ¿las quito de ese fichero o las dejo (ya no salen)?
5. **Los sitios sin foto añadidos desde el explorador** salen ahora como recuadro neutro, no con una foto de stock al azar. ¿Bien?
6. **La barra de pasos:** 5 pasos hasta elegir, que crece a 7 con «hazla por mí». ¿O prefieres ver siempre 7 hasta elegir «a mano»?
7. **«Pasarlas a otro día»** (al cambiar fechas): van al día anterior más cercano que se queda. ¿Quieres un selector de día?
8. **Si el día que recibe las paradas ya tiene su comida o cena elegida**, la del día quitado se pierde. ¿Lo dejo así o la añado igualmente?
9. **Si hay que quitar el primer o el último día con paradas**, se pregunta con el mismo texto. ¿Bien?
10. **Quitar la reserva del Free Tour a mano:** la parada se queda en el día. ¿Debe quitarse también?
11. **El aviso de la reserva fuera de su día también en nuestra ruta?** Hoy solo en la ruta a mano (en la nuestra el motor ya coloca cada entrada y sus excepciones tienen aviso propio).
12. **«Reorganizar» con una reserva de tarde:** lo libre de la mañana va antes y lo libre de la tarde después, sin mezclar. ¿Quieres que mande también la cercanía entre lo libre?
13. **La comida en «Reorganizar»** va donde menos mezcla de mañana y tarde hay. ¿Otra regla?
14. **Los puntos de las zonas del alojamiento** son de mi conocimiento de Roma, sin contrastar con el mapa: si alguna zona te parece mal situada, se cambia el número en `roma.json`.

## Para mirar (no cambia nada hasta que lo digas)
- «Pasarlo» y «Añadirlo» van en masculino también con sitios femeninos («la Galería Borghese»), tal como pediste.
- La parada del Free Tour añadida a mano lleva la foto de relleno (no pido la real de la Piazza Navona).
- La clasificación del destino no se ha movido de sitio: el paso de Transporte la necesita en los dos caminos.
- `LandingScreen.tsx` es código antiguo que ya no se monta y sigue lanzando las sugerencias.
