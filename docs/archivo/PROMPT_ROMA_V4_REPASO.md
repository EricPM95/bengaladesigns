# Roma v4: repaso de los 35 viajes

He repasado a mano, como un local, `REVISION_V4_FINAL.md`. Muy buen trabajo: las horas de 5 en 5, los atardeceres y las noches quedan redondos. Quedan estos retoques.

Hazlos en orden, commit por parte y sin push. Todo con reglas generales, a INVARIANTES. Al terminar, vuelve a pasar la prueba de las 365 fechas y los 56 viajes (igual o mejor) y regenera `REVISION_V4_FINAL.md`.

1. **Del Arco de Constantino al Foro no se cuentan los 9 min andando.** Pasa en todos los viajes: el Arco acaba a las 10:20, el Foro empieza a las 10:20 y la fila dice «9 min andando». Lo mismo de la Plaza de España a Trinità dei Monti (6 min).
   - Revisa ese dato: del Arco a la entrada del Foro por la Via Sacra hay unos 3-5 min.
   - Regla: la hora de una parada siempre es la anterior + su duración + el paseo. Añade a la auditoría un aviso cuando no cuadre.
2. **Ida y vuelta en el D1, junto al Panteón.** Ahora: Minerva → Elefantino → San Luigi → Panteón → Navona. Pasas por delante del Panteón, vas a San Luigi y vuelves.
   - Orden bueno: Minerva → Elefantino → Panteón → San Luigi → Navona.
3. **Comidas de 120-125 min en ritmo completo** (Nonna Betta y Giggetto, en D1 y D1-FT): más largas que en tranquilo.
   - Regla: la comida, como mucho 90 min en completo y 105 en tranquilo. Lo que sobra pasa a la tarde.
4. **Madrugones en tranquilo.**
   - Coliseo a las 9:00 (viaje 14) y a las 8:45 (viaje 35, día 2).
   - Puente Sant'Angelo y Castillo a las 8:45 (viaje 35, día 3).
   - Regla: en tranquilo, la primera parada nunca antes de las 10:00. Coge el turno del Coliseo de las 10:00-10:30.
5. **El D1 en tranquilo está igual de cargado que en completo** (viaje 14: 19 bloques, y acaba en la Plaza de España a las 23:20).
   - Marca como opcionales, solo para tranquilo:
     - el Gesù;
     - la Fuente de las Tortugas;
     - la segunda nocturna.
   - Una sola nocturna en tranquilo.
6. **En tranquilo, las opcionales no vuelven nunca.** En el D4M de primavera (viaje 14, 17 de abril) han vuelto Santa María la Mayor, Letrán, San Pietro in Vincoli y los Mercados de Trajano, y además Monti 95 min. Es justo lo que queríamos evitar.
   - Regla: en tranquilo, el rato que sobra va a Monti (hasta 120 min) y al aperitivo (hasta 90), nunca a las opcionales.
7. **El orden de las basílicas en el D4M es de ida y vuelta.** Ahora: Santa María la Mayor → Letrán (20 min) → San Pietro in Vincoli (22 min, de vuelta).
   - Orden bueno: metro A de Spagna a San Giovanni → Letrán → Santa María la Mayor → San Pietro in Vincoli → Mercados de Trajano → Monti.
   - Así la comida queda cerca de Spagna, y cada tramo va hacia delante.
8. **Huecos antes de las nocturnas.** Hay 9 casos de 25-35 min sin nada, y otros tantos de 16-20:
   - Mercados de Trajano → 30 min → Coliseo de noche;
   - Via dei Fori Imperiali → 35 min → Coliseo de noche;
   - Santa Maria del Popolo o la Terraza del Pincio → 30 min → Plaza de España de noche;
   - Borgo Pio → 25 min → Puente Sant'Angelo de noche.

   Además, «Tarde libre» de 115 min en el D5C de invierno en tranquilo (viaje 35, 17 de diciembre, de 17:55 a 19:50).
   - Regla: ningún rato de más de 20 min sin nombre.
   - En invierno, la nocturna va nada más oscurecer, y lo que sobra hasta la cena es el aperitivo con su nombre, 90 min como mucho.
   - Si aun así sobra, la cena se adelanta (nunca antes de las 19:30).
9. **Comida lejos de la Galería Borghese:**
   - Sgarro Bistrot, a 22 min andando (viajes 5, 12 y 18);
   - Edy, a 19 min (viaje 35).

   Regla de siempre: la comida y su alternativa, a 15 min andando como mucho de la parada de antes. Busca uno cerca de la Galería (Pinciana, Via Veneto o el Parioli de al lado).
10. **La cena en Trattoria Monti, a 20 min andando de los Foros.** También a 15 min como mucho, o una de la zona.
11. **Duraciones no redondas en los aperitivos y paseos** (43, 53, 57, 64, 79, 89 min). También de 5 en 5.

Informe corto en `docs/INFORME_ROMA_V4.md`, con los números nuevos.
