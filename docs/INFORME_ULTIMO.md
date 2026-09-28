# Cierre de Roma (28 de septiembre de 2026)

Todo en commits y **sin subir**. Revisiones nuevas: `docs/REVISION_CIERRE_ROMA.md` (tus 30 viajes, con `scripts/destino/revisionCierre.mjs`) y `docs/REVISION_20_RUTAS.md` (las 26 rutas), las dos con la auditoría nueva. Barrido: **765 de 768** (los 3 de Ferragosto, como siempre). Reglas 316-321 en INVARIANTES.

## Huecos: cuántos había y cuántos quedan

Contados con la auditoría nueva (tiempo libre desde 30 min, hueco desde 20, paseos por encima de su máximo, "por fuera" con tiempo):

| | Antes | Ahora |
|---|---|---|
| Tus 30 viajes | 38 (hueco 10, libre 16, paseo largo 10, por fuera con tiempo 2) | **3** |
| Las 26 rutas | 28 (hueco 10, libre 11, paseo largo 7) | **7** |

También quedan a 0 el restaurante repetido (antes 4 y 2) y "por la mañana" por la tarde (antes 28 y 23).

## Qué ha rellenado cada hueco

**Tus 30 viajes:**
- **Ara Pacis:**
  - D4M en domingo, tras el Pincio: viajes 2, 4, 19, 22, 26 y 29, día 3 (en el viaje 19, día 2).
  - D4 de días largos: viajes 10 y 12 (día 3) y 25 (día 2).
  - D4 con Free Tour, entre el Popolo y el Pincio: viajes 13 y 21.
  - D4 tranquilo en domingo: viaje 18, día 4.
- **Galería Nacional de Arte Moderno:** después del parque (viajes 10 y 12, día 3).
- **Porta Pinciana:** viajes 13 y 21 (antes de la Terraza); viaje 18 (antes de la Galería).
- **Jardines del Pincio y «Via Margutta y Via del Babuino»:** viaje 18, día 4 (el paso d, con nombre).
- **Monti:** vuelve antes de los Foros (viaje 22, día 3; tu 3 de septiembre).
- **Letrán:** viaje 27, día 3 (tu 12 de noviembre). Además, «Roma iluminada desde los Foros» pasa de 5 a 20 min.
- **Mercados de Trajano:** viaje 17, día 3, antes de los Foros.
- **Castillo por dentro:** viajes 16 y 24 (día 2).
- **San Pietro in Vincoli por dentro:** viajes 2, 4, 26 y 29 (punto 4).
- **Tempietto por dentro:** viaje 6, día 2 (punto 3).

**Las 26 rutas:**
- **Ara Pacis:** rutas 4, 22, 24 y 25 (día 2 o 3), 11 y 15 (día 2).
- **Porta Pinciana:** rutas 3 y 15.
- **Jardines del Pincio y Galería Nacional de Arte Moderno:** ruta 7, día 2 (el 1 de mayo el Ara Pacis cierra).
- **Mercados de Trajano:** ruta 23.
- **Isla Tiberina:** rutas 4 y 24, día 3.
- **Iglesia del Gesù por dentro:** ruta 11, día 5.
- **San Luigi dei Francesi por dentro:** ruta 16.

## a) Qué he cambiado

1. **Una regla de relleno.** Los pasos:
   - a) por dentro lo que iba por fuera;
   - b) lo suyo que se quedó fuera o que iba detrás del atardecer;
   - c) lo siguiente de la zona que no está en el viaje, por nivel, abierto y de camino (cada tramo, 15 min como mucho);
   - d) tiempo libre, con nombre si sus ideas son paseos.
   
   Lo añadido lleva su texto, nunca "Te pilla de camino".
2. **Miércoles:** Museos Vaticanos → Borgo Pio → Puente y Castillo por dentro → comida a las 13:00 → Plaza, Cúpula y Basílica → Santa Maria in Trastevere → Janículo al atardecer.
   - La Basílica reabre **hacia las 12:30** los miércoles de audiencia, según las guías que he consultado; sigue con esa nota.
3. **Janículo por la hora:**
   - Se sube andando con el Tempietto por dentro si se llega antes de las 17:30. En tu 6 de marzo: Tempietto a las 17:00, Janículo a las 18:00, con el sol a las 18:07.
   - El Tempietto dura 20 min. En la subida, Trastevere 20 min; se vuelve de noche.
4. **San Pietro in Vincoli:** antes de dejar algo "ya ha cerrado", el día prueba a cambiarlo con la parada de al lado.
5. **D4 en domingo:** Galería → Parque → Popolo y la iglesia → Pincio. La auditoría nueva (punto 7), tal como la pediste.

## b) Lo que no se ha podido o se ha hecho distinto

- **Commits:** los puntos 1 a 4 van en un solo commit del motor. Tocan las mismas funciones y no se pueden separar limpios. La auditoría va aparte.
- **La espera antes del atardecer y la de la Galería:** hasta 30 min cuentan como margen, no como hueco (se llega a la hora dorada o a recoger la entrada). Sin esa excepción saldrían unos 20 de 21-27 min.
- **Tiempo libre con nombre de paseo:** vale hasta 60 min.
- **D4 en domingo de mayo a julio** (ruta 11, día 2; viaje 18, día 4). El sol se pone a las 20:40 y la Galería del domingo va a las 14:00:
  - 45 min libres después de comer;
  - 71 min con nombre antes de la Terraza, en la ruta 11.

  Ya no queda nada cerca sin ver. Es la pregunta 1.
- **D4 con Free Tour a finales de mayo** (ruta 15 y viaje 13): 40-45 min antes de la Terraza. La GNAM cierra a las 19:00 y no cabe.
- **Trastevere de 100 min** (máximo 90) en el D1-FT de junio y julio (ruta 2 y viaje 17). El Tempietto cierra a las 18:00 y el sol va a las 20:48: meterlo obliga a subir y bajar. En verano sigue por fuera.
- **Otros que quedan:**
  - viaje 3, día 4: 27 min antes de Santa Maria del Popolo, que abre a las 16:30;
  - ruta 10, día 2: 21 min antes de la Plaza de España;
  - ruta 11, día 5: 34 min antes del Campidoglio;
  - 29 min andando de la comida a la Galería (ruta 11).
- **El miércoles pierde el barrio de Trastevere** como parada de la tarde. Queda Santa Maria in Trastevere y Trastevere de noche.
- **Tu mensaje de las entradas** (Panteón con Free Tour, Castillo en 4-5 días, museos de pago, título de D3, aviso en la auditoría): lo hago ahora, en la siguiente tanda.

## c) Preguntas

1. **D4 en domingo de verano, sin Free Tour.**
   - A) Dejarlo con el paseo con nombre (hasta 70 min).
   - B) Galería a las 15:00 y el Ara Pacis por la mañana, comiendo a las 13:00.
   - C) Añadir una parada nueva al día (por ejemplo, la Villa Medici).

   **Recomiendo B**: acorta la espera de después de comer y la del Pincio a la vez.
2. **El margen antes del atardecer y de la Galería:** ¿te vale hasta 30 min? Recomiendo sí.
