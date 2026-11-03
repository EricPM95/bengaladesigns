# Lanzarote · los días del borrador 2 medidos con Mapbox (LZ1, 3-nov-2026)

Cada día de `DIAS_CURADOS_LANZAROTE.md` se ha recorrido **desde las 6 zonas de alojamiento** con la tabla de coche de Mapbox (`data/pipeline_v2/travel/lanzarote_coche.json`, sin tráfico). **No se ha cambiado ningún día:** esto solo dice qué cabe y qué no.

**Cómo se ha medido.** El día empieza en el primer sitio: se sale de casa para llegar a su turno u hora de apertura (15 min antes en Timanfaya y la Cueva). A cada tramo se le suma el rato de aparcar de `_paradas.json`. Las visitas duran lo que dice `LANZAROTE_SITIOS.md`. «Coche» es solo conducir (ida, tramos y vuelta); el tope es 3 h. Invierno, atardecer a las 18:05. La comida debe empezar antes de las 15:00. Las horas son las de Canarias.

**Ojo con la precisión:** 12 de las 43 paradas llevan una coordenada aproximada (`verificar` en `_paradas.json`; sobre todo las bodegas de La Geria, Caletón Blanco, Las Grietas, la Ciudad Estratificada, los Helechos y la Marina Rubicón). Sirve para tiempos de ±3 minutos, no para guiar a nadie.

## Resumen

| Día | Puerto del Carmen | Playa Blanca | Costa Teguise | Arrecife | El norte | El interior |
|---|---|---|---|---|---|---|
| D1 · Fuego y mar: el sur volcánico | 2 h 13 min ✅ | 2 h 02 min ✅ | 2 h 35 min ✅ | 2 h 25 min ✅ | 2 h 59 min ✅ | 2 h 09 min ✅ |
| D1 · Fuego y mar: el sur volcánico (sin los opcionales) | 2 h 09 min ✅ | 1 h 58 min ✅ | 2 h 31 min ✅ | 2 h 21 min ✅ | 2 h 55 min ✅ | 2 h 05 min ✅ |
| D1 · variante Volcanes (Volcán del Cuervo) | 2 h 13 min ✅ | 2 h 02 min ✅ | 2 h 35 min ✅ | 2 h 25 min ✅ | 2 h 59 min ✅ | 2 h 09 min ✅ |
| D2 · El norte de Manrique | 2 h 14 min ✅ | 2 h 51 min ✅ | 1 h 51 min ✅ | 1 h 54 min ✅ | 1 h 15 min ✅ | 1 h 56 min ✅ |
| D2 · sábado (mercado de Haría) | 2 h 13 min ✅ | 2 h 52 min ✅ | 1 h 47 min ✅ | 1 h 55 min ✅ | 1 h 07 min ✅ | 2 h 03 min ✅ |
| D2 · viaje de 2 días (con la Fundación) | 2 h 08 min ✅ | 2 h 49 min ✅ | 1 h 45 min ✅ | 1 h 49 min ✅ | 1 h 35 min ✅ | 1 h 58 min ✅ |
| D2 · al revés (la Cueva a primera hora) | 2 h 16 min ✅ | 2 h 52 min ✅ | 1 h 52 min ✅ | 1 h 55 min ✅ | 1 h 17 min ✅ | 1 h 57 min ✅ |
| D2 · viernes con Noches de Jameos (opcional) | 2 h 16 min ✅ | 2 h 54 min ✅ | 1 h 48 min ✅ | 1 h 56 min ✅ | 1 h 09 min ✅ | 2 h 05 min ✅ |
| D3 · Manrique en casa: Tahíche, Teguise y Arrecife | 1 h 49 min ⚠️1 | 2 h 32 min ⚠️1 | 1 h 34 min ⚠️1 | 1 h 24 min ⚠️1 | 1 h 58 min ⚠️1 | 1 h 47 min ⚠️1 |
| D3 · Manrique en casa: Tahíche, Teguise y Arrecife (sin los opcionales) | 1 h 30 min ✅ | 2 h 13 min ✅ | 1 h 15 min ✅ | 1 h 05 min ✅ | 1 h 39 min ✅ | 1 h 28 min ✅ |
| D3 · domingo (mercadillo de Teguise) | 1 h 22 min ✅ | 2 h 00 min ✅ | 1 h 07 min ✅ | 57 min ✅ | 1 h 26 min ✅ | 1 h 10 min ✅ |
| D3 · con Arte (LagOmar, sin el Castillo) | 1 h 38 min ⚠️1 | 2 h 21 min ⚠️1 | 1 h 23 min ⚠️1 | 1 h 13 min ⚠️1 | 1 h 47 min ⚠️1 | 1 h 36 min ⚠️1 |
| D4 · Papagayo y Playa Blanca | 2 h 22 min ✅ | 1 h 23 min ✅ | 2 h 44 min ✅ | 2 h 36 min ✅ | 3 h 09 min ⚠️1 | 2 h 32 min ✅ |
| D5 · Volcanes y Famara | 1 h 33 min ✅ | 2 h 01 min ✅ | 1 h 37 min ✅ | 1 h 33 min ✅ | 1 h 55 min ✅ | 1 h 14 min ✅ |
| D5 · Volcanes y Famara (sin los opcionales) | 1 h 19 min ✅ | 1 h 47 min ✅ | 1 h 23 min ✅ | 1 h 19 min ✅ | 1 h 41 min ✅ | 1 h 00 min ✅ |
| DG · La Graciosa (con coche hasta Órzola) | 1 h 39 min ✅ | 2 h 18 min ✅ | 1 h 13 min ✅ | 1 h 20 min ✅ | 33 min ✅ | 1 h 29 min ✅ |

✅ = cabe sin ningún aviso. ⚠️N = N avisos (abajo, en cada día).

## D1 · Fuego y mar: el sur volcánico

**En sencillo:** cabe desde las 6 zonas. El coche va de 2 h 02 min (Playa Blanca) a 2 h 59 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:32 | 2 h 13 min | 2 h 53 min | 19:38 | — |
| Playa Blanca | 08:32 | 2 h 02 min | 2 h 42 min | 19:27 | — |
| Costa Teguise | 08:21 | 2 h 35 min | 3 h 15 min | 19:49 | — |
| Arrecife | 08:26 | 2 h 25 min | 3 h 05 min | 19:44 | — |
| El norte | 08:11 | 2 h 59 min | 3 h 39 min | 20:03 | — |
| El interior | 08:41 | 2 h 09 min | 2 h 49 min | 19:43 | — |

Recorrido desde El norte (la zona con más coche):

- 08:11 sales de casa (54 min de coche hasta el primer sitio).
- 09:15 llegas a **Montañas del Fuego (Timanfaya, Islote de Hilario)** (entras a las 09:30); visita de 1 h 30 min hasta las 11:00 (turno de las 09:30).
  - coche 22 min (16.5 km) a La Geria y sus bodegas (parada en Stratvs)
- 11:27 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 1 h 00 min hasta las 12:27 (mirador de los hoyos de viña y parada corta en una bodega).
  - coche 7 min (2.2 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
- 12:39 llegas a **Bodega La Geria (LZ-30 km 19, bar La Cepa)** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (La Cepa), hacia las 13:15).
  - coche 21 min (16.5 km) a Salinas de Janubio (mirador)
- 14:41 llegas a **Salinas de Janubio (mirador)**; visita de 20 min hasta las 15:01.
  - coche 3 min (2.3 km) a Playa de Montaña Bermeja (LZ-703)
- 15:09 llegas a **Playa de Montaña Bermeja (LZ-703)**; visita de 15 min hasta las 15:24 (opcional).
  - coche 16 min (14 km) a Los Hervideros
- 15:45 llegas a **Los Hervideros**; visita de 30 min hasta las 16:15.
  - coche 3 min (2.7 km) a El Golfo y el Charco de los Clicos
- 16:23 llegas a **El Golfo y el Charco de los Clicos**; visita de 1 h 00 min hasta las 18:10 (hasta el atardecer).
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
  - coche 22 min (16.5 km) a La Geria y sus bodegas (parada en Stratvs)
- 11:27 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 1 h 00 min hasta las 12:27 (mirador de los hoyos de viña y parada corta en una bodega).
  - coche 7 min (2.2 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
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

**En sencillo:** cabe desde las 6 zonas. El coche va de 2 h 02 min (Playa Blanca) a 2 h 59 min (El norte).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:32 | 2 h 13 min | 2 h 53 min | 19:38 | — |
| Playa Blanca | 08:32 | 2 h 02 min | 2 h 42 min | 19:27 | — |
| Costa Teguise | 08:21 | 2 h 35 min | 3 h 15 min | 19:49 | — |
| Arrecife | 08:26 | 2 h 25 min | 3 h 05 min | 19:44 | — |
| El norte | 08:11 | 2 h 59 min | 3 h 39 min | 20:03 | — |
| El interior | 08:41 | 2 h 09 min | 2 h 49 min | 19:43 | — |

Recorrido desde El norte (la zona con más coche):

- 08:11 sales de casa (54 min de coche hasta el primer sitio).
- 09:15 llegas a **Montañas del Fuego (Timanfaya, Islote de Hilario)** (entras a las 09:30); visita de 1 h 30 min hasta las 11:00.
  - coche 21 min (14.6 km) a Volcán del Cuervo (aparcamiento junto a la LZ-56)
- 11:26 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 12:56.
  - coche 5 min (4.3 km) a La Geria y sus bodegas (parada en Stratvs)
- 13:06 llegas a **La Geria y sus bodegas (parada en Stratvs)**; visita de 30 min hasta las 13:36 (mirador, camino de la comida).
  - coche 7 min (2.2 km) a Bodega La Geria (LZ-30 km 19, bar La Cepa)
- 13:48 llegas a **Bodega La Geria (LZ-30 km 19, bar La Cepa)**; comida de 1 h 15 min hasta las 15:03.
  - coche 21 min (16.5 km) a Salinas de Janubio (mirador)
- 15:29 llegas a **Salinas de Janubio (mirador)**; visita de 20 min hasta las 15:49.
  - coche 15 min (13.4 km) a Los Hervideros
- 16:09 llegas a **Los Hervideros**; visita de 30 min hasta las 16:39.
  - coche 3 min (2.7 km) a El Golfo y el Charco de los Clicos
- 16:47 llegas a **El Golfo y el Charco de los Clicos**; visita de 1 h 00 min hasta las 18:10.
- 18:10 llegas a **El Golfo y el Charco de los Clicos**; cena de 1 h 00 min hasta las 19:10.
- 19:10 vuelves a casa: 53 min de coche; llegas hacia las 20:03.

## D2 · El norte de Manrique

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 15 min (El norte) a 2 h 51 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:12 | 2 h 14 min | 2 h 42 min | 17:51 | — |
| Playa Blanca | 08:49 | 2 h 51 min | 3 h 19 min | 18:05 | — |
| Costa Teguise | 09:25 | 1 h 51 min | 2 h 19 min | 17:41 | — |
| Arrecife | 09:21 | 1 h 54 min | 2 h 22 min | 17:40 | — |
| El norte | 09:45 | 1 h 15 min | 1 h 43 min | 17:25 | — |
| El interior | 09:17 | 1 h 56 min | 2 h 24 min | 17:38 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (0.9 km) a Cueva de los Verdes
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
| Costa Teguise | 09:25 | 1 h 47 min | 2 h 12 min | 17:09 | — |
| Arrecife | 09:21 | 1 h 55 min | 2 h 20 min | 17:13 | — |
| El norte | 09:45 | 1 h 07 min | 1 h 32 min | 16:49 | — |
| El interior | 09:17 | 2 h 03 min | 2 h 28 min | 17:17 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (0.9 km) a Cueva de los Verdes
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
| Costa Teguise | 09:25 | 1 h 45 min | 2 h 15 min | 17:22 | — |
| Arrecife | 09:21 | 1 h 49 min | 2 h 19 min | 17:22 | — |
| El norte | 09:45 | 1 h 35 min | 2 h 05 min | 17:32 | — |
| El interior | 09:17 | 1 h 58 min | 2 h 28 min | 17:27 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:49 sales de casa (66 min de coche hasta el primer sitio).
- 10:00 llegas a **Jameos del Agua**; visita de 1 h 00 min hasta las 11:00.
  - coche 3 min (0.9 km) a Cueva de los Verdes
- 11:08 llegas a **Cueva de los Verdes** (entras a las 11:30); visita de 50 min hasta las 12:20.
  - coche 14 min (9.8 km) a Mirador del Río
- 12:44 llegas a **Mirador del Río**; visita de 45 min hasta las 13:29.
  - coche 20 min (9.6 km) a Haría y la Casa-Museo César Manrique
- 13:54 llegas a **Haría y la Casa-Museo César Manrique**; comida de 1 h 15 min hasta las 15:09 (comida en Haría, sin Casa-Museo).
  - coche 28 min (25.1 km) a Fundación César Manrique (Tahíche)
- 15:42 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 17:12 (entrar hacia las 16:00 (taquilla hasta las 17:00)).
- 17:12 vuelves a casa: 38 min de coche; llegas hacia las 17:50.

## D2 · al revés (la Cueva a primera hora)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 17 min (El norte) a 2 h 52 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:28 | 2 h 16 min | 2 h 44 min | 17:02 | — |
| Playa Blanca | 08:06 | 2 h 52 min | 3 h 20 min | 17:16 | — |
| Costa Teguise | 08:42 | 1 h 52 min | 2 h 20 min | 16:52 | — |
| Arrecife | 08:38 | 1 h 55 min | 2 h 23 min | 16:51 | — |
| El norte | 09:01 | 1 h 17 min | 1 h 45 min | 16:36 | — |
| El interior | 08:34 | 1 h 57 min | 2 h 25 min | 16:49 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:06 sales de casa (64 min de coche hasta el primer sitio).
- 09:15 llegas a **Cueva de los Verdes** (entras a las 09:30); visita de 50 min hasta las 10:20.
  - coche 4 min (1.3 km) a Jameos del Agua
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

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 09 min (El norte) a 2 h 54 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:28 | 2 h 16 min | 2 h 41 min | 23:57 | — |
| Playa Blanca | 08:06 | 2 h 54 min | 3 h 19 min | 00:13 | — |
| Costa Teguise | 08:42 | 1 h 48 min | 2 h 13 min | 23:43 | — |
| Arrecife | 08:38 | 1 h 56 min | 2 h 21 min | 23:47 | — |
| El norte | 09:01 | 1 h 09 min | 1 h 34 min | 23:23 | — |
| El interior | 08:34 | 2 h 05 min | 2 h 30 min | 23:52 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:06 sales de casa (64 min de coche hasta el primer sitio).
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

**En sencillo:** desde ninguna zona sale limpio. El coche va de 1 h 24 min (Arrecife) a 2 h 32 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 49 min | 2 h 29 min | 21:39 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |
| Playa Blanca | 09:10 | 2 h 32 min | 3 h 12 min | 21:57 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |
| Costa Teguise | 09:45 | 1 h 34 min | 2 h 14 min | 21:34 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |
| Arrecife | 09:45 | 1 h 24 min | 2 h 04 min | 21:24 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |
| El norte | 09:35 | 1 h 58 min | 2 h 38 min | 21:48 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |
| El interior | 09:39 | 1 h 47 min | 2 h 27 min | 21:41 | llega tarde a casa_museo_del_campesino: entra a las 17:21 y la última entrada es a las 17:10 |

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
  - coche 8 min (4.5 km) a Ciudad Estratificada (Rofera de Teseguite, LZ-404)
- 16:36 llegas a **Ciudad Estratificada (Rofera de Teseguite, LZ-404)**; visita de 25 min hasta las 17:01 (opcional).
  - coche 15 min (11.2 km) a Casa-Museo del Campesino (Mozaga)
- 17:21 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 18:11 (cierra a las 18:00).
  - coche 15 min (9 km) a Arrecife: Charco de San Ginés y el paseo
- 18:36 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 20:06 (al caer la tarde, con las luces del Charco).
- 20:06 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 21:21.
- 21:21 vuelves a casa: 36 min de coche; llegas hacia las 21:57.

## D3 · Manrique en casa: Tahíche, Teguise y Arrecife (sin los opcionales)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 05 min (Arrecife) a 2 h 13 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 30 min | 2 h 00 min | 20:25 | — |
| Playa Blanca | 09:10 | 2 h 13 min | 2 h 43 min | 20:43 | — |
| Costa Teguise | 09:45 | 1 h 15 min | 1 h 45 min | 20:20 | — |
| Arrecife | 09:45 | 1 h 05 min | 1 h 35 min | 20:10 | — |
| El norte | 09:35 | 1 h 39 min | 2 h 09 min | 20:34 | — |
| El interior | 09:39 | 1 h 28 min | 1 h 58 min | 20:27 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 09:10 sales de casa (45 min de coche hasta el primer sitio).
- 10:00 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 11:30.
  - coche 12 min (12 km) a Jardín de Cactus (Guatiza)
- 11:47 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 12:47.
  - coche 15 min (11 km) a Teguise (villa, aparcamiento a la entrada del pueblo)
- 13:07 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; comida de 1 h 15 min hasta las 14:22 (comida en Teguise (La Cantina), hacia las 13:00).
- 14:22 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 1 h 30 min hasta las 15:52 (el casco y el Palacio Spínola por fuera).
  - coche 10 min (7.6 km) a Casa-Museo del Campesino (Mozaga)
- 16:07 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 16:57 (cierra a las 18:00).
  - coche 15 min (9 km) a Arrecife: Charco de San Ginés y el paseo
- 17:22 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 18:52 (al caer la tarde, con las luces del Charco).
- 18:52 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 20:07.
- 20:07 vuelves a casa: 36 min de coche; llegas hacia las 20:43.

## D3 · domingo (mercadillo de Teguise)

**En sencillo:** cabe desde las 6 zonas. El coche va de 57 min (Arrecife) a 2 h 00 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:17 | 1 h 22 min | 1 h 57 min | 20:14 | — |
| Playa Blanca | 08:57 | 2 h 00 min | 2 h 35 min | 20:32 | — |
| Costa Teguise | 09:27 | 1 h 07 min | 1 h 42 min | 20:09 | — |
| Arrecife | 09:27 | 57 min | 1 h 32 min | 19:59 | — |
| El norte | 09:22 | 1 h 26 min | 2 h 01 min | 20:23 | — |
| El interior | 09:31 | 1 h 10 min | 1 h 45 min | 20:16 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:57 sales de casa (48 min de coche hasta el primer sitio).
- 10:00 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 2 h 00 min hasta las 12:00 (antes del gentío de las 11:00).
- 12:00 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida en Teguise).
  - coche 15 min (11 km) a Jardín de Cactus (Guatiza)
- 14:35 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 15:35 (hacia las 14:30).
  - coche 12 min (12.1 km) a Fundación César Manrique (Tahíche)
- 15:52 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 17:22 (hacia las 15:45, taquilla hasta las 17:00).
  - coche 9 min (6 km) a Arrecife: Charco de San Ginés y el paseo
- 17:41 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 00 min hasta las 18:41.
- 18:41 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 19:56.
- 19:56 vuelves a casa: 36 min de coche; llegas hacia las 20:32.

## D3 · con Arte (LagOmar, sin el Castillo)

**En sencillo:** desde ninguna zona sale limpio. El coche va de 1 h 13 min (Arrecife) a 2 h 21 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 09:35 | 1 h 38 min | 2 h 13 min | 21:38 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Playa Blanca | 09:10 | 2 h 21 min | 2 h 56 min | 21:56 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Costa Teguise | 09:45 | 1 h 23 min | 1 h 58 min | 21:33 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| Arrecife | 09:45 | 1 h 13 min | 1 h 48 min | 21:23 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| El norte | 09:35 | 1 h 47 min | 2 h 22 min | 21:47 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |
| El interior | 09:39 | 1 h 36 min | 2 h 11 min | 21:40 | llega tarde a casa_museo_del_campesino: entra a las 17:20 y la última entrada es a las 17:10 |

Recorrido desde Playa Blanca (la zona con más coche):

- 09:10 sales de casa (45 min de coche hasta el primer sitio).
- 10:00 llegas a **Fundación César Manrique (Tahíche)**; visita de 1 h 30 min hasta las 11:30.
  - coche 12 min (12 km) a Jardín de Cactus (Guatiza)
- 11:47 llegas a **Jardín de Cactus (Guatiza)**; visita de 1 h 00 min hasta las 12:47.
  - coche 15 min (11 km) a Teguise (villa, aparcamiento a la entrada del pueblo)
- 13:07 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; comida de 1 h 15 min hasta las 14:22.
- 14:22 llegas a **Teguise (villa, aparcamiento a la entrada del pueblo)**; visita de 1 h 30 min hasta las 15:52 (hasta las 15:30).
  - coche 6 min (2.7 km) a LagOmar (Nazaret)
- 16:03 llegas a **LagOmar (Nazaret)**; visita de 1 h 00 min hasta las 17:03 (⚠️ cierra a las 18:00).
  - coche 12 min (8.5 km) a Casa-Museo del Campesino (Mozaga)
- 17:20 llegas a **Casa-Museo del Campesino (Mozaga)**; visita de 50 min hasta las 18:10.
  - coche 15 min (9 km) a Arrecife: Charco de San Ginés y el paseo
- 18:35 llegas a **Arrecife: Charco de San Ginés y el paseo**; visita de 1 h 30 min hasta las 20:05.
- 20:05 llegas a **Arrecife: Charco de San Ginés y el paseo**; cena de 1 h 15 min hasta las 21:20.
- 21:20 vuelves a casa: 36 min de coche; llegas hacia las 21:56.

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

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 14 min (El interior) a 2 h 01 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:39 | 1 h 33 min | 1 h 48 min | 19:47 | — |
| Playa Blanca | 08:24 | 2 h 01 min | 2 h 16 min | 20:00 | — |
| Costa Teguise | 08:28 | 1 h 37 min | 1 h 52 min | 19:40 | — |
| Arrecife | 08:32 | 1 h 33 min | 1 h 48 min | 19:40 | — |
| El norte | 08:17 | 1 h 55 min | 2 h 10 min | 19:47 | — |
| El interior | 08:42 | 1 h 14 min | 1 h 29 min | 19:31 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:24 sales de casa (31 min de coche hasta el primer sitio).
- 09:00 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 10:30 (temprano, sin sombra).
  - coche 28 min (18.1 km) a Ermita de las Nieves
- 11:03 llegas a **Ermita de las Nieves**; visita de 30 min hasta las 11:33 (opcional).
  - coche 12 min (5.6 km) a Caleta de Famara y Playa de Famara
- 11:50 llegas a **Caleta de Famara y Playa de Famara** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (El Risco), hacia las 13:30).
- 14:15 llegas a **Caleta de Famara y Playa de Famara**; visita de 1 h 30 min hasta las 15:45 (calles de arena y paseo por la playa).
- 15:45 llegas a **Caleta de Famara y Playa de Famara**; visita de 30 min hasta las 18:10 (atardecer).
- 18:10 llegas a **Caleta de Famara y Playa de Famara**; cena de 1 h 00 min hasta las 19:10.
- 19:10 vuelves a casa: 50 min de coche; llegas hacia las 20:00.

## D5 · Volcanes y Famara (sin los opcionales)

**En sencillo:** cabe desde las 6 zonas. El coche va de 1 h 00 min (El interior) a 1 h 47 min (Playa Blanca).

| Zona | Sale | Coche total | Con aparcar | Vuelve a casa (hacia) | Avisos |
|---|---|---|---|---|---|
| Puerto del Carmen | 08:39 | 1 h 19 min | 1 h 29 min | 19:47 | — |
| Playa Blanca | 08:24 | 1 h 47 min | 1 h 57 min | 20:00 | — |
| Costa Teguise | 08:28 | 1 h 23 min | 1 h 33 min | 19:40 | — |
| Arrecife | 08:32 | 1 h 19 min | 1 h 29 min | 19:40 | — |
| El norte | 08:17 | 1 h 41 min | 1 h 51 min | 19:47 | — |
| El interior | 08:42 | 1 h 00 min | 1 h 10 min | 19:31 | — |

Recorrido desde Playa Blanca (la zona con más coche):

- 08:24 sales de casa (31 min de coche hasta el primer sitio).
- 09:00 llegas a **Volcán del Cuervo (aparcamiento junto a la LZ-56)**; visita de 1 h 30 min hasta las 10:30 (temprano, sin sombra).
  - coche 26 min (23 km) a Caleta de Famara y Playa de Famara
- 11:01 llegas a **Caleta de Famara y Playa de Famara** (entras a las 13:00); comida de 1 h 15 min hasta las 14:15 (comida (El Risco), hacia las 13:30).
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

## Tiempos que no cuadran con los documentos

Se han comparado 36 trayectos que traen los documentos (REVISION_BORRADOR_1 y los ⚠️ de los días) con Mapbox. Cuadra = dentro de 5 min o del 20 %. **7 no cuadran:**

- **teguise a cueva de los verdes**: el documento dice 21 min y Mapbox 27 min (22.2 km). Mapbox es más lento. Fuente del documento: rome2rio.
- **mancha blanca a caleta de famara y playa de famara**: el documento dice 20 min y Mapbox 29 min (16.4 km). Mapbox es más lento. Fuente del documento: rome2rio (Tinajo a Famara); la estimación de Cuervo a Famara era 25-30.
- **playa blanca a costa teguise**: el documento dice 36 min y Mapbox 48 min (45.7 km). Mapbox es más lento. Fuente del documento: Wanderlog (poco fiable).
- **casa museo del campesino a la geria y sus bodegas**: el documento dice 20 min y Mapbox 14 min (11.1 km). Mapbox es más rápido. Fuente del documento: La Voz de Lanzarote (Campesino a La Geria por Masdache).
- **teguise a mirador de haria**: el documento dice 35 min y Mapbox 17 min (13.1 km). Mapbox es más rápido. Fuente del documento: La Voz de Lanzarote (por Las Nieves; el directo puede ser menos).
- **caleta de famara y playa de famara a playa de la garita**: el documento dice 25 min y Mapbox 36 min (33.8 km). Mapbox es más lento. Fuente del documento: estimación del documento (⚠️ Famara a La Garita).
- **mancha blanca a montanas del fuego**: el documento dice 7 min y Mapbox 16 min (9.8 km). Mapbox es más lento. Fuente del documento: 4,5 km (MITECO); a 4,5 km serían unos 7 min.

Lectura: en los trayectos largos hacia el norte (Playa Blanca a Jameos, a Mirador del Río, Puerto del Carmen a Órzola) Mapbox sale de 5 a 11 min más lento que rome2rio; por eso los días que rozan el tope de 3 h hay que leerlos con ese margen en contra.

### Todos los trayectos comparados

| Trayecto | Documento (min) | Mapbox (min · km) | ¿Cuadra? | Fuente del documento |
|---|---|---|---|---|
| puerto del carmen → orzola puerto de la graciosa | 43 | 49 · 49.7 | sí | rome2rio |
| playa blanca → jameos del agua | 55 | 66 · 64.9 | sí | rome2rio |
| playa blanca → mirador del rio | 68 | 73 · 71.2 | sí | rome2rio |
| teguise → cueva de los verdes | 21 | 27 · 22.2 | **NO** (+6) | rome2rio |
| casa museo del campesino → teguise | 7 | 10 · 7.6 | sí | rome2rio (dato de taxi) |
| mancha blanca → caleta de famara y playa de famara | 20 | 29 · 16.4 | **NO** (+9) | rome2rio (Tinajo a Famara); la estimación de Cuervo a Famara era 25-30 |
| volcan del cuervo → caleta de famara y playa de famara | 25-30 | 26 · 23 | sí | estimación del documento (D5) |
| caleta de famara y playa de famara → costa teguise | 25 | 30 · 24 | sí | rome2rio |
| playa blanca → costa teguise | 36 | 48 · 45.7 | **NO** (+12) | Wanderlog (poco fiable) |
| costa teguise → jardin de cactus | 17 | 17 · 12.1 | sí | Wanderlog |
| jardin de cactus → arrecife charco de san gines y el paseo | 20 | 19 · 17.5 | sí | blog |
| el golfo y el charco de los clicos → salinas de janubio | 10-15 | 11 · 10.3 | sí | blog («menos de 15 min», no 10) |
| salinas de janubio → playa blanca y el faro de pechiguera | 12 | 10 · 9.7 | sí | blog |
| salinas de janubio → arrecife charco de san gines y el paseo | 35-40 | 30 · 30.5 | sí | blog |
| casa museo del campesino → la geria y sus bodegas | 20 | 14 · 11.1 | **NO** (-6) | La Voz de Lanzarote (Campesino a La Geria por Masdache) |
| orzola puerto de la graciosa → mirador del rio | 20 | 17 · 10.7 | sí | La Voz de Lanzarote |
| teguise → mirador de haria | 35 | 17 · 13.1 | **NO** (-18) | La Voz de Lanzarote (por Las Nieves; el directo puede ser menos) |
| playa blanca → el golfo y el charco de los clicos | 20 | 23 · 18.2 | sí | Splodz Blogz (blog) |
| el golfo y el charco de los clicos → arrecife charco de san gines y el paseo | 30 | 32 · 31.6 | sí | Splodz Blogz (blog) |
| el golfo y el charco de los clicos → volcan del cuervo | 15-20 | 22 · 20.2 | sí | Splodz Blogz («algo más de 15 min») |
| arrecife → mancha blanca | 20-25 | 29 · 20.4 | sí | Ayuntamiento de Tinajo (Arrecife a Tinajo) |
| playa blanca → mancha blanca | 35-40 | 35 · 29.4 | sí | Ayuntamiento de Tinajo (Playa Blanca a Tinajo) |
| montanas del fuego → la geria y sus bodegas | 25 | 22 · 16.5 | sí | estimación del documento (⚠️ Islote a Stratvs) |
| la geria y sus bodegas → los hervideros | 25 | 22 · 18.8 | sí | estimación del documento (⚠️) |
| la geria y sus bodegas → el golfo y el charco de los clicos | 20 | 18 · 16 | sí | estimación del documento (por la LZ-704) |
| fundacion cesar manrique → jardin de cactus | 12-15 | 12 · 12 | sí | estimación del documento (⚠️) |
| jardin de cactus → teguise | 15 | 15 · 11 | sí | estimación del documento (⚠️) |
| casa museo del campesino → arrecife charco de san gines y el paseo | 15 | 15 · 9 | sí | estimación del documento (⚠️ Mozaga a Arrecife) |
| mirador del rio → haria y la casa museo cesar manrique | 15 | 20 · 9.6 | sí | estimación del documento |
| haria y la casa museo cesar manrique → fundacion cesar manrique | 25 | 28 · 25.1 | sí | estimación del documento (⚠️ Haría a Tahíche) |
| caleta de famara y playa de famara → playa de la garita | 25 | 36 · 33.8 | **NO** (+11) | estimación del documento (⚠️ Famara a La Garita) |
| playa blanca → playas de papagayo | 15-20 | 19 · 8.3 | sí | estimación del documento (por la pista; Mapbox no conoce la pista de tierra) |
| mancha blanca → montanas del fuego | 7 | 16 · 9.8 | **NO** (+9) | 4,5 km (MITECO); a 4,5 km serían unos 7 min |
| aeropuerto ace → puerto del carmen | 10 | 12 · 9.9 | sí | DATOS_CIVITATIS_Y_LLEGADA.md (llegar) |
| aeropuerto ace → costa teguise | 13 | 15 · 13.9 | sí | DATOS_CIVITATIS_Y_LLEGADA.md |
| aeropuerto ace → playa blanca | 28 | 31 · 33 | sí | DATOS_CIVITATIS_Y_LLEGADA.md |
