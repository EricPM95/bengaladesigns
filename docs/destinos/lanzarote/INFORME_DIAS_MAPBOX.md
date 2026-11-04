# Lanzarote · los días del borrador 2 medidos con Mapbox (LZ1, 3-nov-2026)

Cada día de `DIAS_CURADOS_LANZAROTE.md` se ha recorrido **desde las 6 zonas de alojamiento** con la tabla de coche de Mapbox (`data/pipeline_v2/travel/lanzarote_coche.json`, sin tráfico). **No se ha cambiado ningún día:** esto solo dice qué cabe y qué no.

**Cómo se ha medido.** El día empieza en el primer sitio: se sale de casa para llegar a su turno u hora de apertura (15 min antes en Timanfaya y la Cueva). A cada tramo se le suma el rato de aparcar de `_paradas.json`. Las visitas duran lo que dice `LANZAROTE_SITIOS.md`. «Coche» es solo conducir (ida, tramos y vuelta); el tope es 3 h. Invierno, atardecer a las 18:05. La comida debe empezar antes de las 15:00. Las horas son las de Canarias.

**Ojo con la precisión:** 12 de las 43 paradas llevan una coordenada aproximada (`verificar` en `_paradas.json`; sobre todo las bodegas de La Geria, Caletón Blanco, Las Grietas, la Ciudad Estratificada, los Helechos y la Marina Rubicón). Sirve para tiempos de ±3 minutos, no para guiar a nadie.

## Resumen

| Día | Puerto del Carmen | Playa Blanca | Costa Teguise | Arrecife | El norte | El interior |
|---|---|---|---|---|---|---|
| D1 · Fuego y mar: el sur volcánico | 2 h 10 min ✅ | 1 h 59 min ✅ | 2 h 32 min ✅ | 2 h 22 min ✅ | 2 h 56 min ✅ | 2 h 06 min ✅ |
| D1 · Fuego y mar: el sur volcánico (sin los opcionales) | 2 h 09 min ✅ | 1 h 58 min ✅ | 2 h 31 min ✅ | 2 h 21 min ✅ | 2 h 55 min ✅ | 2 h 05 min ✅ |
| D1 · variante Volcanes (Volcán del Cuervo) | 2 h 11 min ✅ | 2 h 00 min ✅ | 2 h 33 min ✅ | 2 h 23 min ✅ | 2 h 57 min ✅ | 2 h 07 min ✅ |
| D2 · El norte de Manrique | 2 h 14 min ✅ | 2 h 51 min ✅ | 1 h 50 min ✅ | 1 h 54 min ✅ | 1 h 15 min ✅ | 1 h 56 min ✅ |
| D2 · sábado (mercado de Haría) | 2 h 13 min ✅ | 2 h 52 min ✅ | 1 h 46 min ✅ | 1 h 55 min ✅ | 1 h 07 min ✅ | 2 h 03 min ✅ |
| D2 · viaje de 2 días (con la Fundación) | 2 h 08 min ✅ | 2 h 49 min ✅ | 1 h 44 min ✅ | 1 h 49 min ✅ | 1 h 35 min ✅ | 1 h 58 min ✅ |
| D2 · al revés (la Cueva a primera hora) | 2 h 16 min ✅ | 2 h 53 min ✅ | 1 h 52 min ✅ | 1 h 55 min ✅ | 1 h 17 min ✅ | 1 h 58 min ✅ |
| D2 · viernes con Noches de Jameos (opcional) | 2 h 16 min ✅ | 2 h 55 min ✅ | 1 h 48 min ✅ | 1 h 56 min ✅ | 1 h 09 min ✅ | 2 h 06 min ✅ |
| D3 · Manrique en casa: Tahíche, Teguise y Arrecife | 1 h 55 min ⚠️1 | 2 h 38 min ⚠️1 | 1 h 40 min ⚠️1 | 1 h 30 min ⚠️1 | 2 h 04 min ⚠️1 | 1 h 53 min ⚠️1 |
| D3 · Manrique en casa: Tahíche, Teguise y Arrecife (sin los opcionales) | 1 h 28 min ✅ | 2 h 11 min ✅ | 1 h 13 min ✅ | 1 h 03 min ✅ | 1 h 37 min ✅ | 1 h 26 min ✅ |
| D3 · domingo (mercadillo de Teguise) | 1 h 23 min ✅ | 2 h 01 min ✅ | 1 h 08 min ✅ | 58 min ✅ | 1 h 27 min ✅ | 1 h 11 min ✅ |
| D3 · con Arte (LagOmar, sin el Castillo) | 1 h 37 min ⚠️1 | 2 h 20 min ⚠️1 | 1 h 22 min ⚠️1 | 1 h 12 min ⚠️1 | 1 h 46 min ⚠️1 | 1 h 35 min ⚠️1 |
| D4 · Papagayo y Playa Blanca | 2 h 22 min ✅ | 1 h 23 min ✅ | 2 h 44 min ✅ | 2 h 36 min ✅ | 3 h 09 min ⚠️1 | 2 h 32 min ✅ |
| D5 · Volcanes y Famara | 1 h 59 min ✅ | 2 h 27 min ✅ | 2 h 03 min ✅ | 1 h 59 min ✅ | 2 h 21 min ✅ | 1 h 40 min ✅ |
| D5 · Volcanes y Famara (sin los opcionales) | 1 h 21 min ✅ | 1 h 49 min ✅ | 1 h 25 min ✅ | 1 h 21 min ✅ | 1 h 43 min ✅ | 1 h 02 min ✅ |
| DG · La Graciosa (con coche hasta Órzola) | 1 h 39 min ✅ | 2 h 18 min ✅ | 1 h 13 min ✅ | 1 h 20 min ✅ | 33 min ✅ | 1 h 29 min ✅ |

✅ = cabe sin ningún aviso. ⚠️N = N avisos (abajo, en cada día).

## D1 · Fuego y mar: el sur volcánico

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 59 min (Playa Blanca) a 2 h 56 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:32 | 2 h 10 min | 2 h 50 min | 19:38 | — |
| Playa Blanca | 08:32 | 1 h 59 min | 2 h 39 min | 19:27 | — |
| Costa Teguise | 08:21 | 2 h 32 min | 3 h 12 min | 19:49 | — |
| Arrecife | 08:26 | 2 h 22 min | 3 h 02 min | 19:44 | — |
| El norte | 08:11 | 2 h 56 min | 3 h 36 min | 20:03 | — |
| El interior | 08:41 | 2 h 06 min | 2 h 46 min | 19:43 | — |

Recorrido desde El norte (la zona con más coche):

- 08:11 sales de casa (54 min de coche hasta el primer sitio).
- 09:15 llegas a **Montañas del Fuego (Timanfaya, Islote de Hilario)** (entras a las 09:30); visita de 1 h 30 min hasta las 11:00 (turno de las 09:30).
  - coche 23 min (17 km) a La Geria y sus bodegas (parada en Stratvs)
- 11:28 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 1 h 00 min hasta las 12:28 (mirador de los hoyos de viña y parada corta en una bodega).
  - coche 6 min (1.6 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
- 12:39 llegas a **Bodega La Geria (LZ-30 km 19, bar La Cepa)** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (La Cepa), hacia las 13:15).
  - coche 21 min (16.5 km) a Salinas de Janubio (mirador)
- 14:41 llegas a **Salinas de Janubio (mirador)**; visita de 20 min hasta las 15:01.
  - coche 14 min (12.5 km) a Playa de Montaña Bermeja (LZ-703)
- 15:20 llegas a **Playa de Montaña Bermeja (LZ-703)**; visita de 15 min hasta las 15:35 (opcional).
  - coche 2 min (0.9 km) a Los Hervideros
- 15:42 llegas a **Los Hervideros**; visita de 30 min hasta las 16:12.
  - coche 3 min (2.7 km) a El Golfo y el Charco de los Clicos
- 16:20 llegas a **El Golfo y el Charco de los Clicos**; visita de 1 h 00 min hasta las 18:10 (hasta el atardecer).
- 18:10 llegas a **El Golfo y el Charco de los Clicos**; cena de 1 h 00 min hasta las 19:10 (cena en El Golfo).
- 19:10 vuelves a casa: 53 min de coche; llegas hacia las 20:03.

## D1 · Fuego y mar: el sur volcánico (sin los opcionales)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 58 min (Playa Blanca) a 2 h 55 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:32 | 2 h 09 min | 2 h 44 min | 19:38 | — |
| Playa Blanca | 08:32 | 1 h 58 min | 2 h 33 min | 19:27 | — |
| Costa Teguise | 08:21 | 2 h 31 min | 3 h 06 min | 19:49 | — |
| Arrecife | 08:26 | 2 h 21 min | 2 h 56 min | 19:44 | — |
| El norte | 08:11 | 2 h 55 min | 3 h 30 min | 20:03 | — |
| El interior | 08:41 | 2 h 05 min | 2 h 40 min | 19:43 | — |

Recorrido desde El norte (la zona con más coche):

- 08:11 sales de casa (54 min de coche hasta el primer sitio).
- 09:15 llegas a **Montañas del Fuego (Timanfaya, Islote de Hilario)** (entras a las 09:30); visita de 1 h 30 min hasta las 11:00 (turno de las 09:30).
  - coche 23 min (17 km) a La Geria y sus bodegas (parada en Stratvs)
- 11:28 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 1 h 00 min hasta las 12:28 (mirador de los hoyos de viña y parada corta en una bodega).
  - coche 6 min (1.6 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
- 12:39 llegas a **Bodega La Geria (LZ-30 km 19, bar La Cepa)** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (La Cepa), hacia las 13:15).
  - coche 21 min (16.5 km) a Salinas de Janubio (mirador)
- 14:41 llegas a **Salinas de Janubio (mirador)**; visita de 20 min hasta las 15:01.
  - coche 15 min (13.4 km) a Los Hervideros
- 15:21 llegas a **Los Hervideros**; visita de 30 min hasta las 15:51.
  - coche 3 min (2.7 km) a El Golfo y el Charco de los Clicos
- 15:59 llegas a **El Golfo y el Charco de los Clicos**; visita de 1 h 00 min hasta las 18:10 (hasta el atardecer).
- 18:10 llegas a **El Golfo y el Charco de los Clicos**; cena de 1 h 00 min hasta las 19:10 (cena en El Golfo).
- 19:10 vuelves a casa: 53 min de coche; llegas hacia las 20:03.

## D1 · variante Volcanes (Volcán del Cuervo)

**En sencillo:** cabe desde las 6 zonas. El coche va de 2 h 00 min (Playa Blanca) a 2 h 57 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:32 | 2 h 11 min | 2 h 51 min | 19:38 | — |
| Playa Blanca | 08:32 | 2 h 00 min | 2 h 40 min | 19:27 | — |
| Costa Teguise | 08:21 | 2 h 33 min | 3 h 13 min | 19:49 | — |
| Arrecife | 08:26 | 2 h 23 min | 3 h 03 min | 19:44 | — |
| El norte | 08:11 | 2 h 57 min | 3 h 37 min | 20:03 | — |
| El interior | 08:41 | 2 h 07 min | 2 h 47 min | 19:43 | — |

Recorrido desde El norte (la zona con más coche):

- 08:11 sales de casa (54 min de coche hasta el primer sitio).
- 09:15 llegas a **Montañas del Fuego (Timanfaya, Islote de Hilario)** (entras a las 09:30); visita de 1 h 30 min hasta las 11:00.
  - coche 20 min (14.1 km) a Volcán del Cuervo (aparcamiento junto a la LZ-56)
- 11:25 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 12:55.
  - coche 5 min (4.3 km) a La Geria y sus bodegas (parada en Stratvs)
- 13:05 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 30 min hasta las 13:35 (mirador, camino de la comida).
  - coche 6 min (1.6 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
- 13:46 llegas a **Bodega La Geria (LZ-30 km 19, bar La Cepa)**; comida de 1 h 15 min hasta las 15:01.
  - coche 21 min (16.5 km) a Salinas de Janubio (mirador)
- 15:27 llegas a **Salinas de Janubio (mirador)**; visita de 20 min hasta las 15:47.
  - coche 15 min (13.4 km) a Los Hervideros
- 16:07 llegas a **Los Hervideros**; visita de 30 min hasta las 16:37.
  - coche 3 min (2.7 km) a El Golfo y el Charco de los Clicos
- 16:45 llegas a **El Golfo y el Charco de los Clicos**; visita de 1 h 00 min hasta las 18:10.
- 18:10 llegas a **El Golfo y el Charco de los Clicos**; cena de 1 h 00 min hasta las 19:10.
- 19:10 vuelves a casa: 53 min de coche; llegas hacia las 20:03.

## D2 · El norte de Manrique

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 15 min (El norte) a 2 h 51 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:12 | 2 h 14 min | 2 h 42 min | 17:51 | — |
| Playa Blanca | 08:49 | 2 h 51 min | 3 h 19 min | 18:05 | — |
| Costa Teguise | 09:26 | 1 h 50 min | 2 h 18 min | 17:41 | — |
| Arrecife | 09:21 | 1 h 54 min | 2 h 22 min | 17:40 | — |
| El norte | 09:45 | 1 h 15 min | 1 h 43 min | 17:25 | — |
| El interior | 09:17 | 1 h 56 min | 2 h 24 min | 17:38 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (1 km) a Cueva de los Verdes
- 11:08 llegas a **Cueva de los Verdes** (entras a las 11:30); visita de 50 min hasta las 12:20 (turno de las 11:30 (⚠️ los turnos reales)).
  - coche 14 min (9.8 km) a Mirador del Río
- 12:44 llegas a **Mirador del Río**; visita de 45 min hasta las 13:29.
  - coche 20 min (9.6 km) a Haría y la Casa-Museo César Manrique
- 13:54 llegas a **Haría y la Casa-Museo César Manrique**; comida de 1 h 15 min hasta las 15:09 (comida en Haría (Tacande), hacia las 13:45).
- 15:09 llegas a **Haría y la Casa-Museo César Manrique**; visita de 1 h 30 min hasta las 16:39 (pueblo y Casa-Museo (taquilla hasta las 17:00)).
  - coche 13 min (6.3 km) a Mirador de los Helechos (valle de las Mil Palmeras)
- 16:55 llegas a **Mirador de los Helechos (valle de las Mil Palmeras)**; visita de 15 min hasta las 17:10.
- 17:10 vuelves a casa: 55 min de coche; llegas hacia las 18:05.

## D2 · sábado (mercado de Haría)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 07 min (El norte) a 2 h 52 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:12 | 2 h 13 min | 2 h 38 min | 17:22 | — |
| Playa Blanca | 08:49 | 2 h 52 min | 3 h 17 min | 17:38 | — |
| Costa Teguise | 09:26 | 1 h 46 min | 2 h 11 min | 17:09 | — |
| Arrecife | 09:21 | 1 h 55 min | 2 h 20 min | 17:13 | — |
| El norte | 09:45 | 1 h 07 min | 1 h 32 min | 16:49 | — |
| El interior | 09:17 | 2 h 03 min | 2 h 28 min | 17:17 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (1 km) a Cueva de los Verdes
- 11:08 llegas a **Cueva de los Verdes** (entras a las 11:30); visita de 50 min hasta las 12:20.
  - coche 15 min (11.3 km) a Haría y la Casa-Museo César Manrique
- 12:40 llegas a **Haría y la Casa-Museo César Manrique** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (mercado y comida, hacia las 12:35 (el mercado cierra a las 14:30)).
- 14:15 llegas a **Haría y la Casa-Museo César Manrique**; visita de 1 h 00 min hasta las 15:15 (Casa-Museo hasta las ~15:50).
  - coche 21 min (10.2 km) a Mirador del Río
- 15:46 llegas a **Mirador del Río**; visita de 45 min hasta las 16:31 (hacia las 16:10, última entrada 16:40).
- 16:31 vuelves a casa: 67 min de coche; llegas hacia las 17:38.

## D2 · viaje de 2 días (con la Fundación)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 35 min (El norte) a 2 h 49 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:12 | 2 h 08 min | 2 h 38 min | 17:32 | — |
| Playa Blanca | 08:49 | 2 h 49 min | 3 h 19 min | 17:50 | — |
| Costa Teguise | 09:26 | 1 h 44 min | 2 h 14 min | 17:22 | — |
| Arrecife | 09:21 | 1 h 49 min | 2 h 19 min | 17:22 | — |
| El norte | 09:45 | 1 h 35 min | 2 h 05 min | 17:32 | — |
| El interior | 09:17 | 1 h 58 min | 2 h 28 min | 17:27 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (1 km) a Cueva de los Verdes
- 11:08 llegas a **Cueva de los Verdes** (entras a las 11:30); visita de 50 min hasta las 12:20.
  - coche 14 min (9.8 km) a Mirador del Río
- 12:44 llegas a **Mirador del Río**; visita de 45 min hasta las 13:29.
  - coche 20 min (9.6 km) a Haría y la Casa-Museo César Manrique
- 13:54 llegas a **Haría y la Casa-Museo César Manrique**; comida de 1 h 15 min hasta las 15:09 (comida en Haría, sin Casa-Museo).
  - coche 28 min (25.1 km) a Fundación César Manrique (Tahíche)
- 15:42 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 17:12 (entrar hacia las 16:00 (taquilla hasta las 17:00)).
- 17:12 vuelves a casa: 38 min de coche; llegas hacia las 17:50.

## D2 · al revés (la Cueva a primera hora)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 17 min (El norte) a 2 h 53 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:28 | 2 h 16 min | 2 h 44 min | 17:02 | — |
| Playa Blanca | 08:05 | 2 h 53 min | 3 h 21 min | 17:16 | — |
| Costa Teguise | 08:42 | 1 h 52 min | 2 h 20 min | 16:52 | — |
| Arrecife | 08:38 | 1 h 55 min | 2 h 23 min | 16:51 | — |
| El norte | 09:01 | 1 h 17 min | 1 h 45 min | 16:36 | — |
| El interior | 08:33 | 1 h 58 min | 2 h 26 min | 16:49 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:05 sales de casa (65 min de coche hasta el primer sitio).
- 09:15 llegas a **Cueva de los Verdes** (entras a las 09:30); visita de 50 min hasta las 10:20.
  - coche 4 min (1.2 km) a Jameos del Agua
- 10:29 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:29.
  - coche 16 min (10.6 km) a Mirador del Río
- 11:55 llegas a **Mirador del Río**; visita de 45 min hasta las 12:40.
  - coche 20 min (9.6 km) a Haría y la Casa-Museo César Manrique
- 13:05 llegas a **Haría y la Casa-Museo César Manrique**; comida de 1 h 15 min hasta las 14:20.
- 14:20 llegas a **Haría y la Casa-Museo César Manrique**; visita de 1 h 30 min hasta las 15:50.
  - coche 13 min (6.3 km) a Mirador de los Helechos (valle de las Mil Palmeras)
- 16:06 llegas a **Mirador de los Helechos (valle de las Mil Palmeras)**; visita de 15 min hasta las 16:21.
- 16:21 vuelves a casa: 55 min de coche; llegas hacia las 17:16.

## D2 · viernes con Noches de Jameos (opcional)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 09 min (El norte) a 2 h 55 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:28 | 2 h 16 min | 2 h 41 min | 23:57 | — |
| Playa Blanca | 08:05 | 2 h 55 min | 3 h 20 min | 00:13 | — |
| Costa Teguise | 08:42 | 1 h 48 min | 2 h 13 min | 23:43 | — |
| Arrecife | 08:38 | 1 h 56 min | 2 h 21 min | 23:47 | — |
| El norte | 09:01 | 1 h 09 min | 1 h 34 min | 23:23 | — |
| El interior | 08:33 | 2 h 06 min | 2 h 31 min | 23:52 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:05 sales de casa (65 min de coche hasta el primer sitio).
- 09:15 llegas a **Cueva de los Verdes** (entras a las 09:30); visita de 50 min hasta las 10:20.
  - coche 14 min (9.8 km) a Mirador del Río
- 10:44 llegas a **Mirador del Río**; visita de 45 min hasta las 11:29.
  - coche 20 min (9.6 km) a Haría y la Casa-Museo César Manrique
- 11:54 llegas a **Haría y la Casa-Museo César Manrique** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15.
- 14:15 llegas a **Haría y la Casa-Museo César Manrique**; visita de 1 h 30 min hasta las 15:45.
  - coche 18 min (11.7 km) a Jameos del Agua
- 16:08 llegas a **Jameos del Agua** (entras a las 18:30); visita de 4 h 45 min hasta las 23:15 (visita al atardecer, cena (18:30-20:30) y concierto (22:30-23:15); se vuelve de noche).
- 23:15 vuelves a casa: 58 min de coche; llegas hacia las 00:13.

## D3 · Manrique en casa: Tahíche, Teguise y Arrecife

**En sencillo:** desde ninguna zona sale limpio. El coche va de 1 h 30 min (Arrecife) a 2 h 38 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 55 min | 2 h 35 min | 21:45 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |
| Playa Blanca | 09:10 | 2 h 38 min | 3 h 18 min | 22:03 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |
| Costa Teguise | 09:45 | 1 h 40 min | 2 h 20 min | 21:40 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |
| Arrecife | 09:45 | 1 h 30 min | 2 h 10 min | 21:30 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |
| El norte | 09:35 | 2 h 04 min | 2 h 44 min | 21:54 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |
| El interior | 09:39 | 1 h 53 min | 2 h 33 min | 21:47 | llega tarde a casa_museo_del_campesino: entra a las 17:28 y la última entrada es a las 17:10 |

Recorrido desde Playa Blanca (la zona con más coche):

- 09:10 sales de casa (45 min de coche hasta el primer sitio).
- 10:00 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 11:30.
  - coche 12 min (12 km) a Jardín de Cactus (Guatiza)
- 11:47 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 12:47.
  - coche 15 min (11 km) a Teguise (villa, aparcamiento a la entrada del pueblo)
- 13:07 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; comida de 1 h 15 min hasta las 14:22 (comida en Teguise (La Cantina), hacia las 13:00).
- 14:22 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 1 h 30 min hasta las 15:52 (el casco y el Palacio Spínola por fuera).
  - coche 6 min (2.4 km) a Castillo de Santa Bárbara (volcán Guanapay)
- 16:03 llegas a **Castillo de Santa Bárbara (volcán Guanapay)**; visita de 20 min hasta las 16:23 (opcional, por fuera).
  - coche 12 min (7.2 km) a Ciudad Estratificada (Rofera de Teseguite, LZ-404)
- 16:40 llegas a **Ciudad Estratificada (Rofera de Teseguite, LZ-404)**; visita de 25 min hasta las 17:05 (opcional).
  - coche 18 min (13.8 km) a Casa-Museo del Campesino (Mozaga)
- 17:28 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 18:18 (cierra a las 18:00).
  - coche 14 min (8.9 km) a Arrecife: Charco de San Ginés y el paseo
- 18:42 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 20:12 (al caer la tarde, con las luces del Charco).
- 20:12 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 21:27.
- 21:27 vuelves a casa: 36 min de coche; llegas hacia las 22:03.

## D3 · Manrique en casa: Tahíche, Teguise y Arrecife (sin los opcionales)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 03 min (Arrecife) a 2 h 11 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 28 min | 1 h 58 min | 20:23 | — |
| Playa Blanca | 09:10 | 2 h 11 min | 2 h 41 min | 20:41 | — |
| Costa Teguise | 09:45 | 1 h 13 min | 1 h 43 min | 20:18 | — |
| Arrecife | 09:45 | 1 h 03 min | 1 h 33 min | 20:08 | — |
| El norte | 09:35 | 1 h 37 min | 2 h 07 min | 20:32 | — |
| El interior | 09:39 | 1 h 26 min | 1 h 56 min | 20:25 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 09:10 sales de casa (45 min de coche hasta el primer sitio).
- 10:00 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 11:30.
  - coche 12 min (12 km) a Jardín de Cactus (Guatiza)
- 11:47 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 12:47.
  - coche 15 min (11 km) a Teguise (villa, aparcamiento a la entrada del pueblo)
- 13:07 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; comida de 1 h 15 min hasta las 14:22 (comida en Teguise (La Cantina), hacia las 13:00).
- 14:22 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 1 h 30 min hasta las 15:52 (el casco y el Palacio Spínola por fuera).
  - coche 9 min (7.5 km) a Casa-Museo del Campesino (Mozaga)
- 16:06 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 16:56 (cierra a las 18:00).
  - coche 14 min (8.9 km) a Arrecife: Charco de San Ginés y el paseo
- 17:20 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 18:50 (al caer la tarde, con las luces del Charco).
- 18:50 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 20:05.
- 20:05 vuelves a casa: 36 min de coche; llegas hacia las 20:41.

## D3 · domingo (mercadillo de Teguise)

**En sencillo:** cabe desde las 6 zonas. El coche va de 58 min (Arrecife) a 2 h 01 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:17 | 1 h 23 min | 1 h 58 min | 20:15 | — |
| Playa Blanca | 08:57 | 2 h 01 min | 2 h 36 min | 20:33 | — |
| Costa Teguise | 09:27 | 1 h 08 min | 1 h 43 min | 20:10 | — |
| Arrecife | 09:27 | 58 min | 1 h 33 min | 20:00 | — |
| El norte | 09:22 | 1 h 27 min | 2 h 02 min | 20:24 | — |
| El interior | 09:31 | 1 h 11 min | 1 h 46 min | 20:17 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:57 sales de casa (48 min de coche hasta el primer sitio).
- 10:00 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 2 h 00 min hasta las 12:00 (antes del gentío de las 11:00).
- 12:00 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida en Teguise).
  - coche 15 min (11 km) a Jardín de Cactus (Guatiza)
- 14:35 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 15:35 (hacia las 14:30).
  - coche 13 min (12.1 km) a Fundación César Manrique (Tahíche)
- 15:53 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 17:23 (hacia las 15:45, taquilla hasta las 17:00).
  - coche 9 min (6 km) a Arrecife: Charco de San Ginés y el paseo
- 17:42 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 00 min hasta las 18:42.
- 18:42 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 19:57.
- 19:57 vuelves a casa: 36 min de coche; llegas hacia las 20:33.

## D3 · con Arte (LagOmar, sin el Castillo)

**En sencillo:** desde ninguna zona sale limpio. El coche va de 1 h 12 min (Arrecife) a 2 h 20 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 37 min | 2 h 12 min | 21:37 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Playa Blanca | 09:10 | 2 h 20 min | 2 h 55 min | 21:55 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Costa Teguise | 09:45 | 1 h 22 min | 1 h 57 min | 21:32 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Arrecife | 09:45 | 1 h 12 min | 1 h 47 min | 21:22 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| El norte | 09:35 | 1 h 46 min | 2 h 21 min | 21:46 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| El interior | 09:39 | 1 h 35 min | 2 h 10 min | 21:39 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |

Recorrido desde Playa Blanca (la zona con más coche):

- 09:10 sales de casa (45 min de coche hasta el primer sitio).
- 10:00 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 11:30.
  - coche 12 min (12 km) a Jardín de Cactus (Guatiza)
- 11:47 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 12:47.
  - coche 15 min (11 km) a Teguise (villa, aparcamiento a la entrada del pueblo)
- 13:07 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; comida de 1 h 15 min hasta las 14:22.
- 14:22 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 1 h 30 min hasta las 15:52 (hasta las 15:30).
  - coche 6 min (2.6 km) a LagOmar (Nazaret)
- 16:03 llegas a **LagOmar (Nazaret)**; visita de 1 h 00 min hasta las 17:03 (⚠️ cierra a las 18:00).
  - coche 12 min (8.5 km) a Casa-Museo del Campesino (Mozaga)
- 17:20 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 18:10.
  - coche 14 min (8.9 km) a Arrecife: Charco de San Ginés y el paseo
- 18:34 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 20:04.
- 20:04 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 21:19.
- 21:19 vuelves a casa: 36 min de coche; llegas hacia las 21:55.

## D4 · Papagayo y Playa Blanca

**En sencillo:** cabe sin avisos desde Puerto del Carmen, Playa Blanca, Costa Teguise, Arrecife, El interior; desde las demás hay avisos. El coche va de 1 h 23 min (Playa Blanca) a 3 h 09 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 07:57 | 2 h 22 min | 3 h 11 min | 20:29 | — |
| Playa Blanca | 08:21 | 1 h 23 min | 2 h 12 min | 19:54 | — |
| Costa Teguise | 07:47 | 2 h 44 min | 3 h 33 min | 20:41 | — |
| Arrecife | 07:50 | 2 h 36 min | 3 h 25 min | 20:36 | — |
| El norte | 07:34 | 3 h 09 min | 3 h 58 min | 20:53 | el coche suma 3 h 09 min: pasa del tope de 3 h por 9 min |
| El interior | 07:52 | 2 h 32 min | 3 h 21 min | 20:34 | — |

Recorrido desde El norte (la zona con más coche):

- 07:34 sales de casa (66 min de coche hasta el primer sitio).
- 09:00 llegas a **Playas de Papagayo (aparcamiento de la cala Papagayo)**; visita de 4 h 30 min hasta las 13:30 (toda la mañana, pista de tierra y 3 € por coche).
  - coche 25 min (10.3 km) a Marina Rubicón (comida y cena)
- 14:03 llegas a **Marina Rubicón (comida y cena)**; comida de 1 h 15 min hasta las 15:18 (comida (Liken), hacia las 14:00).
  - coche 6 min (2.4 km) a Playa Blanca (paseo marítimo)
- 15:32 llegas a **Playa Blanca (paseo marítimo)**; visita de 1 h 00 min hasta las 16:32 (paseo marítimo).
  - coche 12 min (5.7 km) a Faro de Pechiguera
- 16:49 llegas a **Faro de Pechiguera**; visita de 1 h 00 min hasta las 18:10 (atardecer en el faro).
  - coche 15 min (5.9 km) a Marina Rubicón (comida y cena)
- 18:33 llegas a **Marina Rubicón (comida y cena)**; cena de 1 h 15 min hasta las 19:48 (cena en Marina Rubicón).
- 19:48 vuelves a casa: 65 min de coche; llegas hacia las 20:53.

## D5 · Volcanes y Famara

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 40 min (El interior) a 2 h 27 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:38 | 1 h 59 min | 2 h 14 min | 19:47 | — |
| Playa Blanca | 08:23 | 2 h 27 min | 2 h 42 min | 20:00 | — |
| Costa Teguise | 08:27 | 2 h 03 min | 2 h 18 min | 19:40 | — |
| Arrecife | 08:31 | 1 h 59 min | 2 h 14 min | 19:40 | — |
| El norte | 08:16 | 2 h 21 min | 2 h 36 min | 19:47 | — |
| El interior | 08:41 | 1 h 40 min | 1 h 55 min | 19:31 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:23 sales de casa (32 min de coche hasta el primer sitio).
- 09:00 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 10:30 (temprano, sin sombra).
  - coche 35 min (27.9 km) a Ermita de las Nieves
- 11:10 llegas a **Ermita de las Nieves**; visita de 30 min hasta las 11:40 (opcional).
  - coche 30 min (23.4 km) a Caleta de Famara y Playa de Famara
- 12:15 llegas a **Caleta de Famara y Playa de Famara** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (El Risco), hacia las 13:30).
- 14:15 llegas a **Caleta de Famara y Playa de Famara**; visita de 1 h 30 min hasta las 15:45 (calles de arena y paseo por la playa).
- 15:45 llegas a **Caleta de Famara y Playa de Famara**; visita de 30 min hasta las 18:10 (atardecer).
- 18:10 llegas a **Caleta de Famara y Playa de Famara**; cena de 1 h 00 min hasta las 19:10.
- 19:10 vuelves a casa: 50 min de coche; llegas hacia las 20:00.

## D5 · Volcanes y Famara (sin los opcionales)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 02 min (El interior) a 1 h 49 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:38 | 1 h 21 min | 1 h 31 min | 19:47 | — |
| Playa Blanca | 08:23 | 1 h 49 min | 1 h 59 min | 20:00 | — |
| Costa Teguise | 08:27 | 1 h 25 min | 1 h 35 min | 19:40 | — |
| Arrecife | 08:31 | 1 h 21 min | 1 h 31 min | 19:40 | — |
| El norte | 08:16 | 1 h 43 min | 1 h 53 min | 19:47 | — |
| El interior | 08:41 | 1 h 02 min | 1 h 12 min | 19:31 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:23 sales de casa (32 min de coche hasta el primer sitio).
- 09:00 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 10:30 (temprano, sin sombra).
  - coche 27 min (23.6 km) a Caleta de Famara y Playa de Famara
- 11:02 llegas a **Caleta de Famara y Playa de Famara** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (El Risco), hacia las 13:30).
- 14:15 llegas a **Caleta de Famara y Playa de Famara**; visita de 1 h 30 min hasta las 15:45 (calles de arena y paseo por la playa).
- 15:45 llegas a **Caleta de Famara y Playa de Famara**; visita de 30 min hasta las 18:10 (atardecer).
- 18:10 llegas a **Caleta de Famara y Playa de Famara**; cena de 1 h 00 min hasta las 19:10.
- 19:10 vuelves a casa: 50 min de coche; llegas hacia las 20:00.

## DG · La Graciosa (con coche hasta Órzola)

**En sencillo:** cabe desde las 6 zonas. El coche va de 33 min (El norte) a 2 h 18 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:46 | 1 h 39 min | 1 h 49 min | 18:20 | — |
| Playa Blanca | 08:23 | 2 h 18 min | 2 h 28 min | 18:36 | — |
| Costa Teguise | 08:59 | 1 h 13 min | 1 h 23 min | 18:07 | — |
| Arrecife | 08:55 | 1 h 20 min | 1 h 30 min | 18:10 | — |
| El norte | 09:19 | 33 min | 43 min | 17:47 | — |
| El interior | 08:51 | 1 h 29 min | 1 h 39 min | 18:15 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:23 sales de casa (72 min de coche hasta el primer sitio).
- 09:45 llegas a **Órzola (puerto del ferry a La Graciosa)** (entras a las 10:00); visita de 7 h 30 min hasta las 17:30 (ferry de las 10:00; la última vuelta de La Graciosa sale a las 17:00 (invierno) y llega a Órzola hacia las 17:30).
- 17:30 vuelves a casa: 66 min de coche; llegas hacia las 18:36.

