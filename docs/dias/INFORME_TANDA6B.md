# Informe de la Tanda 6b

Todo está hecho y comprobado. No he hecho push. Lo que he decidido yo está en `PREGUNTAS_TANDA6B.md` (23 puntos).

## Qué ha cambiado

1. **Sitios aún cerrados al llegar.** Si al llegar el sitio no ha abierto, se espera hasta 15 min; si no, va por fuera o de camino con «Abre a las…»; si no se ve desde fuera, pasa a «Si te sobra tiempo». El orden no cambia. Un imprescindible la primera vez nunca se pierde: va por fuera.
2. **Comida y horas fijas.** La comida ya no cae después de una visita larga con hora fija: va antes (entre las 12:00 y las 12:30), cerca de ella. La mañana se llena con lo que iba antes, luego lo cercano que iba después y, si queda más de 1 h libre, sitios abiertos cercanos. El día ya no empieza más tarde por una reserva. Si lo que iba antes no cabe, ahora se quita lo menos importante (a «Si te sobra tiempo») y, si aún no basta, la comida se hace más corta (45 o 30 min), en vez de llegar tarde a la reserva (esto último lo he arreglado al final: el Coliseo a las 16:00 llegaba 72 y 82 min tarde).
3. **Volver a una hora fija cuenta como zigzag.** El Foro se entra por el lado del Coliseo.
4. **«De camino» nunca va a «Si te sobra tiempo»** ni se quita para que quepa otra cosa.
5. **Avisos y fotos.** «En invierno cierra pronto» solo de noviembre a febrero; cierre de San Pedro solo el mes que toca; Galería Borghese con turnos reales cada 2 h (9, 11, 13, 15, 17), el más cercano si no hay reserva. Los scripts de fotos leen `listas.json`.
6. **Documento nuevo**, pasado otra vez por el convertidor sin tocarlo: minutos nuevos, D0/D0-medio/D1-corto, Trevi sin gente y día a las 7:30. En RUTA y DÍAS ya no hay hora por parada: solo la franja con su hora y las horas fijas. HOY ofrece «Vas bien de tiempo» / «Vas justo» con sugerencias, en lugar de «Voy con retraso».
7. **Cena de verano a las 20:00.** Nocturna imprescindible solo si el taxi es de 15 min o menos.
8. **Textos en positivo** («Para otro momento», «Lo ves por fuera, sin perder tiempo») y tarjeta de descanso.

## Resultado de la prueba entera

125.925 viajes (todas las duraciones, 365 fechas, Free Tour, medios días, reservas, pool, lluvia): **0 fallos**.

## Por qué la prueba vieja no veía los 4 fallos

- **Cerrado:** comprobaba el día o la franja, no la hora de llegada.
- **Comida y hora fija / día que empieza tarde:** no se comprobaban.
- **Zigzag:** dejaba pasar volver a una hora fija.
- **«De camino» en «Si te sobra tiempo»:** no se comprobaba.
- **Reserva tarde:** solo se apuntaba como información, y no era un fallo. Ahora lo es (salvo el caso de abajo). Así salió a la luz el Coliseo a las 16:00.

Todas esas comprobaciones existen ya y fallan si se repite el problema.

## Días que no caben enteros sin reserva, cierre ni pool

**Ninguno** (ver `INFORME_TANDA6B_DATOS.md`). No he cambiado nada para que quepan.

## Restaurantes repetidos

Sin nada añadido, ninguno. Solo si el viajero reserva el Coliseo a las 12:00 en viajes de 6 días (la comida va en el Barrio Judío y no hay recambio):
- 6 días con Free Tour · D1-FT · Giggetto al Portico d'Ottavia · Barrio Judío · 49 fechas.
- 6 días · D1 · Nonna Betta · Barrio Judío · 4 fechas.

## Sitios sin foto

Via del Babuino, Via Veneto, Terraza de Largo Gaetana Agnesi, Mirador de San Pietro in Montorio, Colle Oppio.

## Límites conocidos

- **Free Tour de mañana + Museos a las 14:00 el mismo día:** no caben la comida y el tour; se llega tarde a los Museos y queda apuntado (es el único caso que la prueba admite).
- La entrada del Foro por el lado del Coliseo es una coordenada aproximada, por revisar.
- La pantalla no la he probado a mano en el móvil: eso lo pruebas tú (pregunta 25).
- Verificado: tsc sin errores, servidor reiniciado y peticiones reales a `/api/rebuild-day`, `/api/adjust-day` (retraso, cansado, justo) y `/api/check-time` responden bien. `VIAJES_LISTAS.html` regenerado.
