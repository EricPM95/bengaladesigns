# REPASO V76 (27-nov): unir una reserva a la excursion, la llegada o la vuelta, y las escalas

Con pruebas: `pruebaV76_a` y `pruebaV76_b` (pura, Roma y Lanzarote), `pruebaV75` (194), `pruebaV74`, `pruebaV68`, `pruebaJutrip` (130), `pruebaPantallas8b` (arranque 261,3 KB), V36, 21 pruebas de reservas y las de llegada y vuelta, todas en 0 fallos. No hizo falta migracion. Capturas (iPhone) junto a su dibujo en `docs/dias/V76_capturas/`.

- ✅ Ferry, tren o autobus el dia de una excursion: «¿Es para tu excursion a La Graciosa?»; unido, cuenta como su reserva, sale dentro de su ficha y en HOY («SALIDA · Orzola» con una fila por billete y su QR). MAÑANA dice «Sales a las 10:00 · Ferry desde Orzola».
- ✅ Tren o autobus el dia de llegada o de vuelta: pregunta, «TREN AL CENTRO / AL AEROPUERTO» en RESERVAS, fila con su QR en HOY y SALIR sale de la hora del tren.
- ✅ Una reserva extra sale en su dia por su hora; si choca con paradas, aviso arriba y hoja «Revisa las horas»; el dia no se mueve solo.
- ✅ Escalas: «+ Añadir escala», una tarjeta por tramo con su QR, y el motor usa la llegada del ultimo tramo y la salida del primero (🟡 sin la rueda por tramo del dibujo; DIAS no enseña las escalas).
- Dos fallos reales hallados al integrar y arreglados: «Revisa las horas» quedaba tapada por la hoja del formulario, y un tren unido a una llegada que sale antes de aterrizar se guardaba sin avisar.
- Sin comprobar: invitados con una cuenta real, subir un archivo real a un billete de escala, el barrido de 365. Cuatro pruebas viejas se actualizaron (la huella dorada de `pruebaTanda7_vuelta` se regrabo). Decisiones: `DECISIONES_V76.md`.
