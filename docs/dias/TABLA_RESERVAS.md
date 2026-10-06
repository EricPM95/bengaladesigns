# Tabla de reservas (sitio × día × hora)

Generada por `scripts/destino/tablaReservas.mjs`. Cada celda dice cómo sale esa reserva con las listas escritas (regla 17):

- **lista** = el tramo tiene lista escrita en el documento; **normal** = el día normal; **sin lista** = el documento no lo escribe: al meter la reserva la app avisa y propone otra hora, y si el viajero insiste se aplica la regla 4 y queda apuntado; **no cabe** = una combinación que no cabe (Free Tour de mañana + Museos antes de las 13:30; excursión de medio día + Coliseo a las 16:00).
- Después, lo que hace el motor de verdad: «a su hora» o los minutos de retraso, y las notas de la prueba (imprescindible movido, comida tarde…).

## D0 · Coliseo

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | **lista** | coliseo_por_la_manana | a su hora
8:30 | **lista** | coliseo_por_la_manana | a su hora
9:00 | **lista** | coliseo_por_la_manana | a su hora
9:30 | **lista** | coliseo_por_la_manana | a su hora
10:00 | **lista** | coliseo_por_la_manana | a su hora
10:30 | **lista** | coliseo_por_la_manana | a su hora
11:00 | **lista** | coliseo_por_la_manana | a su hora
11:30 | **lista** | coliseo_por_la_manana | a su hora
12:00 | **lista** | coliseo_por_la_manana | a su hora
12:30 | **lista** | coliseo_12_30_14_00_manana | a su hora · comida_tarde
13:00 | **lista** | coliseo_12_30_14_00_manana | a su hora · comida_tarde
13:30 | **lista** | coliseo_13_30_14_00 | a su hora · comida_tarde
14:00 | **lista** | coliseo_13_30_14_00 | a su hora · comida_tarde
14:30 | **lista** | coliseo_14_30_15_30 | a su hora · comida_tarde
15:00 | **lista** | coliseo_14_30_15_30 | a su hora · comida_tarde
15:30 | **lista** | coliseo_14_30_15_30 | a su hora
16:00 | sin_lista |  | a su hora · sin_lista
16:30 | sin_lista |  | a su hora · sin_lista
17:00 | sin_lista |  | a su hora · sin_lista
17:30 | sin_lista |  | a su hora · sin_lista
18:00 | sin_lista |  | a su hora · sin_lista

## D1 · Coliseo

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | normal |  | a su hora
8:30 | normal |  | a su hora
9:00 | normal |  | a su hora
9:30 | normal |  | a su hora
10:00 | normal |  | a su hora
10:30 | **lista** | coliseo_10_30_11_00 | a su hora
11:00 | **lista** | coliseo_10_30_11_00 | a su hora
11:30 | **lista** | coliseo_11_30_12_00 | a su hora · comida_tarde
12:00 | **lista** | coliseo_11_30_12_00 | a su hora
12:30 | **lista** | coliseo_mediodia | a su hora · comida_tarde
13:00 | **lista** | coliseo_mediodia | a su hora
13:30 | **lista** | coliseo_mediodia | a su hora
14:00 | **lista** | coliseo_mediodia | a su hora
14:30 | **lista** | coliseo_mediodia | a su hora
15:00 | **lista** | coliseo_mediodia | a su hora
15:30 | **lista** | coliseo_tarde | a su hora
16:00 | **lista** | coliseo_tarde | a su hora
16:30 | **lista** | coliseo_tarde | a su hora
17:00 | **lista** | coliseo_tarde | a su hora
17:30 | **lista** | coliseo_tarde | a su hora
18:00 | **lista** | coliseo_tarde | a su hora

## D2 · Museos Vaticanos y Capilla Sixtina

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | normal |  | a su hora
8:30 | normal |  | a su hora
9:00 | normal |  | a su hora
9:30 | normal |  | a su hora · comida_tarde
10:00 | **lista** | museos_media_manana | a su hora
10:30 | **lista** | museos_media_manana | a su hora
11:00 | **lista** | museos_media_manana | a su hora
11:30 | **lista** | museos_media_manana | a su hora · comida_tarde
12:00 | **lista** | museos_media_manana | a su hora · comida_tarde
12:30 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:00 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:30 | sin_lista |  | a su hora · sin_lista
14:00 | sin_lista |  | a su hora · sin_lista
14:30 | sin_lista |  | a su hora · sin_lista
15:00 | **lista** | museos_tarde | a su hora
15:30 | **lista** | museos_tarde | a su hora
16:00 | **lista** | museos_tarde | a su hora
16:30 | **lista** | museos_tarde | a su hora
17:00 | **lista** | museos_tarde | a su hora
17:30 | **lista** | museos_tarde | a su hora
18:00 | **lista** | museos_tarde | a su hora

## D3 · Museos Vaticanos y Capilla Sixtina

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | no_cabe |  | a su hora · sin_lista
8:30 | no_cabe |  | a su hora · sin_lista, comida_tarde
9:00 | no_cabe |  | a su hora · sin_lista, comida_tarde
9:30 | no_cabe |  | a su hora · sin_lista, comida_tarde
10:00 | no_cabe |  | llega 343 min tarde · reserva_tarde, sin_lista
10:30 | no_cabe |  | llega 313 min tarde · reserva_tarde, sin_lista
11:00 | no_cabe |  | llega 283 min tarde · reserva_tarde, sin_lista
11:30 | no_cabe |  | llega 253 min tarde · reserva_tarde, sin_lista
12:00 | no_cabe |  | llega 223 min tarde · reserva_tarde, sin_lista
12:30 | no_cabe |  | llega 193 min tarde · reserva_tarde, sin_lista
13:00 | no_cabe |  | llega 163 min tarde · reserva_tarde, sin_lista
13:30 | **lista** | museos_13_30_14_30 | a su hora · comida_tarde
14:00 | **lista** | museos_13_30_14_30 | a su hora
14:30 | **lista** | museos_13_30_14_30 | a su hora
15:00 | normal |  | a su hora
15:30 | normal |  | a su hora
16:00 | normal |  | a su hora
16:30 | normal |  | a su hora
17:00 | normal |  | a su hora
17:30 | normal |  | a su hora
18:00 | normal |  | a su hora

## D4 · Galería Borghese

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | **lista** | galeria_9 | a su hora
8:30 | **lista** | galeria_9 | a su hora
9:00 | **lista** | galeria_9 | a su hora
9:30 | **lista** | galeria_9 | a su hora
10:00 | **lista** | galeria_9 | a su hora
10:30 | normal |  | a su hora
11:00 | normal |  | a su hora
11:30 | normal |  | a su hora
12:00 | sin_lista |  | a su hora · sin_lista, comida_tarde
12:30 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:00 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:30 | sin_lista |  | a su hora · sin_lista
14:00 | sin_lista |  | a su hora · sin_lista
14:30 | **lista** | galeria_tarde | a su hora · comida_tarde
15:00 | **lista** | galeria_tarde | a su hora
15:30 | **lista** | galeria_tarde | a su hora
16:00 | **lista** | galeria_tarde | a su hora
16:30 | **lista** | galeria_tarde | a su hora
17:00 | **lista** | galeria_tarde | a su hora
17:30 | **lista** | galeria_tarde | a su hora
18:00 | **lista** | galeria_tarde | a su hora

## D1-corto · Coliseo

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | sin_lista |  | a su hora · sin_lista
8:30 | sin_lista |  | a su hora · sin_lista
9:00 | sin_lista |  | a su hora · sin_lista
9:30 | sin_lista |  | a su hora · sin_lista
10:00 | sin_lista |  | a su hora · sin_lista
10:30 | sin_lista |  | a su hora · sin_lista
11:00 | sin_lista |  | a su hora · sin_lista
11:30 | sin_lista |  | a su hora · sin_lista
12:00 | sin_lista |  | a su hora · sin_lista
12:30 | sin_lista |  | a su hora · sin_lista
13:00 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:30 | sin_lista |  | a su hora · sin_lista
14:00 | sin_lista |  | a su hora · sin_lista
14:30 | sin_lista |  | a su hora · sin_lista
15:00 | sin_lista |  | a su hora · sin_lista
15:30 | sin_lista |  | a su hora · sin_lista
16:00 | sin_lista |  | a su hora · sin_lista
16:30 | sin_lista |  | a su hora · sin_lista
17:00 | sin_lista |  | a su hora · sin_lista
17:30 | sin_lista |  | a su hora · sin_lista
18:00 | sin_lista |  | a su hora · sin_lista

## D1-FT · Coliseo

Hora | Clase | Lista | En el motor
--- | --- | --- | ---
8:00 | sin_lista |  | a su hora · sin_lista
8:30 | sin_lista |  | a su hora · sin_lista
9:00 | sin_lista |  | a su hora · sin_lista
9:30 | sin_lista |  | a su hora · sin_lista
10:00 | sin_lista |  | a su hora · sin_lista
10:30 | sin_lista |  | a su hora · sin_lista
11:00 | sin_lista |  | a su hora · sin_lista
11:30 | sin_lista |  | a su hora · sin_lista
12:00 | sin_lista |  | a su hora · sin_lista
12:30 | sin_lista |  | a su hora · sin_lista
13:00 | sin_lista |  | a su hora · sin_lista, comida_tarde
13:30 | sin_lista |  | a su hora · sin_lista
14:00 | sin_lista |  | a su hora · sin_lista
14:30 | sin_lista |  | a su hora · sin_lista
15:00 | sin_lista |  | a su hora · sin_lista
15:30 | sin_lista |  | a su hora · sin_lista
16:00 | sin_lista |  | a su hora · sin_lista
16:30 | sin_lista |  | a su hora · sin_lista
17:00 | sin_lista |  | a su hora · sin_lista
17:30 | sin_lista |  | a su hora · sin_lista
18:00 | sin_lista |  | a su hora · sin_lista

