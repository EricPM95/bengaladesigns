# DECISIONES V58 (25-nov-2026)

Eric no contestó durante la tanda: todo lo que pedía decisión suya se queda aquí. NADA de lo de abajo se ha cambiado salvo lo que dice «Hecho».

## 1. Minutos de visita de Lanzarote (punto 6): tabla para que Eric decida
**No se ha cambiado ningún minuto.** De dónde salen:
- **Minutos «de datos»:** `data/pipeline_v2/lanzarote.json › places[].duration_minutes` (y el máximo `min_max`), puestos a mano en LZ1/LZ2.
- **Minutos del plan:** el día escrito (`data/dias/lanzarote/listas.json`) puede fijar otro con `min` en la fila de la parada, y el motor de coche (`shared/routeEngine/cocheTrip.js`) puede **alargar** una parada: las filas con `hasta_atardecer: true` duran hasta 5 min después de la puesta de sol (así salen los 139 min de El Golfo: 15:50 → 18:09 con el sol a las 18:04 el 10-nov) y la parada anterior a una comida «adelantable» se alarga hasta 45 min para no dejar una hora muerta (día de llegada).
- Los 240 min de Papagayo y los 20 y 15 de Salinas de Janubio y Montaña Bermeja son **exactamente los de los datos** (no los toca el motor).

| Sitio | Min hoy (datos) | Máx | Horario | Min que sale en el plan (día escrito) | Propuesta |
|---|---|---|---|---|---|
| Montañas del Fuego (Timanfaya) | 90 | 90 | 09:00-15:45 | D1: 90 min | Dejarlo como está. |
| Jameos del Agua | 60 | 60 | 10:00-18:00 | D2: 60 min | Dejarlo como está. |
| Cueva de los Verdes | 50 | 50 | 09:30-16:45 | D2: 50 min | Dejarlo como está. |
| Mirador del Río | 45 | 45 | 10:00-17:00 | D2: 45 min | Dejarlo como está. |
| Fundación César Manrique | 90 | 90 | 10:00-17:30 | D3: 90 min | Dejarlo como está. |
| El Golfo y el Charco de los Clicos | 45 | 45 | sin horario | D1: (datos) hasta el atardecer | Quitar «hasta el atardecer» de la fila del día 2: la visita pasaría a sus 45 min (o 60 con el atardecer opcional). Hoy el motor la alarga hasta 5 min después de la puesta de sol (139 min el 10-nov). |
| La Geria y sus bodegas | 60 | 90 | 10:00-19:00 | D1: 60 min | Dejarlo como está. |
| Playas de Papagayo | 240 | 480 | 09:00-19:00 | D4: (datos) | Dejar 240 min si el viajero quiere playa; proponer 180 min por defecto y que el resto sea libre (máximo 480). |
| Caletón Blanco | 120 | 180 | sin horario | — | Dejarlo como está. |
| Jardín de Cactus | 60 | 60 | 10:00-17:00 | D3: 60 min | Dejarlo como está. |
| Los Hervideros | 30 | 30 | sin horario | D1: 30 min | Dejarlo como está. |
| Salinas de Janubio | 20 | 20 | sin horario | D1: 20 min | Subir a 30 min (aparcar + foto + paseo corto); 20 min es parada de foto. |
| Teguise (villa) | 90 | 120 | sin horario | D3: 60 min | Dejarlo como está. |
| Haría y la Casa-Museo César Manrique | 90 | 90 | 10:00-17:30 | D2: 60 min; D2: 60 min | Dejarlo como está. |
| Casa-Museo del Campesino | 50 | 50 | 10:00-18:00 | D3: 50 min | Dejarlo como está. |
| Caleta de Famara y Playa de Famara | 90 | 120 | sin horario | D5: 90 min; D5: (datos) hasta el atardecer | Dejarlo como está. |
| Arrecife: Charco de San Ginés y el paseo | 90 | 90 | sin horario | D3: 60 min | Dejarlo como está. |
| Castillo de San José (MIAC) | 60 | 60 | 11:00-18:00 | — | Dejarlo como está. |
| LagOmar | 60 | 60 | 10:00-18:00 | — | Dejar 60 min; los 105 min del día de vuelta salen de rellenar la mañana hasta la hora de salir. |
| Ermita de las Nieves | 20 | 20 | sin horario | D5: 20 min opcional | Dejarlo como está. |
| Mirador de Guinate | 20 | 20 | sin horario | — | Dejarlo como está. |
| Ciudad Estratificada (Rofera de Teseguite) | 25 | 25 | sin horario | D3: 25 min opcional | Dejarlo como está. |
| Playa de Montaña Bermeja | 15 | 20 | sin horario | D1: 15 min opcional | Dejar 20 min (su propio máximo) o dejarla opcional; 15 min es solo llegar y mirar. |
| Las Grietas (Montaña Blanca) | 40 | 45 | sin horario | D3: 40 min opcional | Dejarlo como está. |
| Mirador del Bosquecillo (Risco de Famara) | 20 | 20 | sin horario | — | Dejarlo como está. |
| Mirador de Haría | 20 | 20 | sin horario | — | Dejarlo como está. |
| Mirador de los Helechos | 15 | 15 | sin horario | D2: 15 min | Dejarlo como está. |
| Castillo de Santa Bárbara | 30 | 45 | sin horario | D3: 30 min opcional | Dejarlo como está. |
| Punta Mujeres y Arrieta (La Garita) | 90 | 90 | sin horario | — | Dejarlo como está. |
| Playa de La Garita | 90 | 90 | sin horario | — | Dejarlo como está. |
| Playa Blanca y el Faro de Pechiguera | 90 | 90 | sin horario | D4: 45 min; D4: 45 min hasta el atardecer | Dejarlo como está. |
| Puerto del Carmen (Puerto Viejo) | 60 | 60 | sin horario | — | Dejarlo como está. |
| Volcán del Cuervo | 75 | 90 | sin horario | D5: 75 min | Dejarlo como está. |
| Caldera Blanca | 180 | 180 | sin horario | — | Dejar 180 min (ruta andando de ida y vuelta). |


**Sobre «el día 2 acaba después de que cierre»:** El Golfo **no tiene horario en los datos** (es una costa abierta), así que lo único que «cierra» es la puesta de sol, y la visita acaba 5 min después. Si Eric quiere que acabe justo al ponerse el sol (o antes), hay que cambiar `sol + 5` por `sol` en `cocheTrip.js` (línea de `st.sol`) o quitar el `hasta_atardecer`. No lo he tocado porque son minutos.

## 2. Ninguna visita acaba después de que cierre el sitio (HECHO)
- **Motor de coche (Lanzarote, `cocheTrip.js › medirDia`):** cada paso lleva ahora su hora de cierre (`cierre`). Si por la hora de llegada (o por «hasta el atardecer») la visita acabaría más tarde, se recorta hasta el cierre y se apunta `recortada_por_cierre_min`. Si ya se entra con el sitio cerrado, sale como problema del día (`tipo: 'cierre'`), igual que ya salían `ult` (última entrada) y `turno`.
- **Motor de Roma y demás (`listasTrip.js`):** ya mira, antes de dejar una visita «por dentro», que no cierre antes de que acabe (tanda 11, punto 13): no hacía falta tocarlo. Con el viaje de prueba de Lanzarote (6 días) ninguna visita con horario acaba después de cerrar (`docs/dias/V58_capturas/_log_lanza_despues.json › visitas_tras_cierre: []`).
- Pendiente de decidir: si, en vez de acortar la visita, debe moverse a otra hora u otro día (hoy acorta).

## 3. «Hora de comer» sin restaurantes (punto 6)
- **Jueves (Marina Rubicón o Playa Blanca): HECHO.** Causa: los dos restaurantes de esa comida (Liken y Brisa Marina) llevaban `dias_sin_confirmar: true` y el motor apagaba cualquier restaurante con esa marca. Liken tiene horario en los datos (todos los días de 12:00 a 23:00, Lanzarote3, septiembre de 2025) y solo el lunes está en duda: ahora `dias_sin_confirmar` puede ser una lista de días (`[1]` = lunes) y Liken sale todos los días menos el lunes (`abreEseDia` en `cocheTrip.js`; `data/dias/lanzarote/_restaurantes.json`). Brisa Marina («sin confirmar») sigue sin salir: no se inventa.
- **Viernes (día de vuelta, Arrecife): NO se puede arreglar sin inventar.** Los datos no tienen lista de comida para el día de vuelta (`V_comida`), solo cenas por zona (Arrecife tiene 3). **Decide Eric:** o se escribe esa lista, o se usan las cenas de Arrecife también como comida (sus horarios no se han mirado para el mediodía).
- Aviso: Liken, Tacande, El Risco, etc. no tienen coordenadas en los datos (`_restaurantes_coords.json` solo trae las que Mapbox confirmó), así que salen en la lista de opciones del día pero HOY no los pone como «recomendado» con mapa. No se han inventado coordenadas. La tarjeta «Hora de comer» de DÍAS lleva a «Ver restaurantes», que busca restaurantes cercanos en vivo con Mapbox (esa búsqueda no se ha tocado).

## 4. Alojamiento (punto 1)
- **Hecho:** una sola respuesta, `alojamientoCubierto` (`src/lib/tuAlojamiento.ts`): hay hotel puesto en la estancia. La zona sola NO cuenta (antes, de pago y con un destino, sí contaba en el contador de RESERVAS pero no en su tarjeta).
- HOY: con el hotel puesto (aunque sin dirección) no lo pide, enseña «Volver al alojamiento · {hotel}» (sin [Cómo llegar] mientras no haya dirección) y la caja de minutos dice «Desde el alojamiento». Solo con la zona: lo sigue pidiendo y dice «Desde Costa Teguise» (la zona). Sin nada: «Desde el centro».
- Los dos casos pasan también con un viaje normal (el viajero escribe el hotel sin dirección: es opcional): no era cosa del viaje de prueba. `__rutaPrueba` y `__rutaLanzarote` ponen hotel y zona con los mismos campos que la app (`accommodationSelections`, `route.accommodationZone`).
- Duda para Eric: «Desde el alojamiento» cuenta los minutos desde el centro de la zona cuando no hay dirección (es la mejor medida disponible).

## 5. Cabecera de RESERVAS (punto 2)
- «Domingo 18 · día 2 de 3»: el día del viaje en el que estás y cuántos días de ruta tiene (sin contar el día de la vuelta a casa; por eso un viaje de 6 días dice «de 5»).
- «4 de 7 reservas listas»: cada cosa que se reserva cuenta UNA (llegada y vuelta, alojamiento, coche, **cada entrada**, cada excursión, seguro, eSIM si hace falta). El total es lo que enseñan las fichas y los bloques de abajo. Antes «Entradas 1/3» contaba como una sola ficha sin hacer; ahora sus 3 entradas cuentan (1 de 3 hechas).

## 6. Los artículos (punto 5)
- Regla general (`contraer` en `src/lib/articulos.ts`): «a el» → «al», «de el» → «del». Y `lugarCon('a'|'de'|'en', nombre)` pone la preposición con el artículo que dicen los DATOS (`data/logros/articulos.json`, que ya tenía Roma y Lanzarote): «en el Coliseo», «en Montserrat» (sin artículo).
- Antes solo Roma entraba en la tabla; ahora la tabla junta todos los destinos. Los sitios que no están en la tabla se siguen adivinando por la terminación, solo donde ya se hacía (`aDestino`, `conArticulo`), pero primero mira los datos.
- Revisado: en `data/`, `src/`, `server/` y `shared/` no hay ningún texto escrito con «a el» ni «de el» (solo frases construidas al vuelo, que ahora pasan por la regla en las de «Tu entrada…»). **Pendiente:** el aviso de abajo dice «Tu Coliseo, el domingo 18» (el nombre de la reserva sin «entrada»): no se ha tocado porque no estaba en el encargo.

## 7. Kilómetros en coche (punto 6)
En un día en coche la cabecera dice «64,3 km en coche» (la ida desde el alojamiento + los tramos entre paradas + la vuelta, con los km del motor de coche) y «0,4 km a pie» solo si hay tramos a pie (dos filas seguidas en el mismo aparcamiento). Los «23,8 km» que vio Eric eran la suma de los trayectos de ejemplo del conector (no los del motor). Un día en coche sin ningún tramo a pie no enseña la columna «km a pie».

## 8. Probado y no probado (modo rápido)
Sin pruebas. Las pruebas viejas que podrían fallar por esto (no se han pasado, habría que actualizarlas): las que comprueban «Pon tu alojamiento…» con solo el hotel puesto, la cabecera de RESERVAS («x de y listo», «2 de 3») y el texto «Tu entrada a el Coliseo».
