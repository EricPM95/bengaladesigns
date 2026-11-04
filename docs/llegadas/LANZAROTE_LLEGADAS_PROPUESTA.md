# Lanzarote · el día de llegada y el día de vuelta (propuesta, 4-nov-2026)

**Qué es esto.** Una propuesta para que el primer día y el último de un viaje a Lanzarote salgan bien. Hasta ahora el día 1 es siempre el sur volcánico entero (Timanfaya, La Geria, El Golfo), saliendo del aeropuerto, llegues a la hora que llegues. Aquí van:

1. qué sale hoy;
2. los números de la «hora útil»;
3. el día de llegada por franjas de hora y por zona;
4. qué día va segundo;
5. el día de vuelta;
6. el viaje de Eric con sus vuelos reales (y tres ejemplos de llegada);
7. qué hay que cambiar y los riesgos.

**No he cambiado nada del repositorio.** He ejecutado el motor de verdad para ver qué sale hoy, y he medido las propuestas con la misma tabla de coche (Mapbox), los mismos ratos de aparcar y los mismos horarios que usa el motor. Las referencias para el programador (archivo:línea) van todas juntas al final.

**Reglas de Eric que mandan** (las del encargo, con los cambios que ha mandado mientras lo hacía):

- **Hora útil** = aterrizaje + **45 min** para salir con el equipaje (siempre) + **1 h** para recoger el coche (siempre, si es de alquiler) + el trayecto en coche del aeropuerto a la zona + **1 h** para instalarse.
- El día de llegada se llena con cosas **cercanas y ligeras**. Nunca se queda vacío si hay luz.
- Hay tres **días imprescindibles enteros**: el sur volcánico (D1), el norte de Manrique (D2) y La Graciosa (DG). Van **siempre en un día entero que empieza por la mañana**. Nunca van el día de llegada ni el de vuelta.
- **Tope de 3 h de coche al día.** No hay paseo nocturno: el día acaba con el atardecer y la cena cerca del alojamiento.

---

## 1. Qué sale HOY el día 1 (motor ejecutado, domingo 8-nov, Costa Teguise, con pase y coche de alquiler)

Hoy el motor solo cuenta **45 min** desde que aterrizas hasta que sales del aeropuerto con el coche. No cuenta el equipaje aparte, ni el trayecto a la zona, ni la hora para instalarse. Sale **directo del aeropuerto a Timanfaya** y mueve el turno de Timanfaya a la primera hora a la que llegas.

| Aterrizas | Qué sale hoy | ¿Funciona? |
|---|---|---|
| **08:25** (el vuelo real de Eric) | Sale del aeropuerto a las 09:18. Timanfaya a las **10:15** (turno movido). La Geria a las 12:13. Come a las 13:24 en Bodegas Rubicón. Janubio, Montaña Bermeja y Los Hervideros. El Golfo de 16:44 al atardecer (18:04). Llega a casa a las 18:48. 2 h 20 de coche. | Cabe, pero **rompe la regla**: el día imprescindible más largo, el día de llegada, sin pasar por el alojamiento. Además hay que comprar la entrada de Timanfaya para las 10:15. |
| **10:00** | Timanfaya a las **11:45**. La Geria a las 13:43. **Come a las 14:54**, justo antes del límite de las 15:00. Janubio, Los Hervideros. El Golfo a las 17:53 (el sol se pone a las 18:04). Quita Montaña Bermeja. Casa a las 19:17. | Cabe a duras penas. Rompe la regla y tienes la maleta todo el día en el maletero. |
| **14:30** | Timanfaya a las **16:15**, cuando **la última entrada es a las 15:45**. Come **a las 19:24**. El Golfo **a las 22:23**, de noche. Cena **a las 00:02**. Casa a las 23:47. | **Imposible.** Sale con dos avisos («pasada la última entrada», «después del atardecer»), pero el día se enseña igual. |
| **19:00** | Timanfaya a las **20:45**. Comida a las 23:54. El Golfo a las 02:53. Cena a las 04:32. | **Imposible.** Igual que el anterior. |

Más cosas que hace hoy:

- **Los días siguientes** siguen la tabla de siempre:
  - con 5 días (4 noches): lunes D2, martes D3, miércoles La Graciosa;
  - con 6 días: además, el jueves D4.
- **El día de vuelta** no lo hace el motor: **sale vacío**. La app pone una tarjeta «Vuelta desde Lanzarote» sin nada dentro, aunque el vuelo sea a las 19:40.
- **La cena «cerca de tu alojamiento»** propone siempre el primer restaurante de la lista de la zona, sin mirar el día. En Costa Teguise es **SeBE**, que **cierra sábado y domingo** y el miércoles solo da comidas. Hoy se lo propondría a Eric el domingo y el miércoles.

---

## 2. Los números de la hora útil

| Parte | Minutos | De dónde sale |
|---|---|---|
| Salir del aeropuerto con el equipaje | **45** (siempre) | Regla de Eric (4-nov) |
| Recoger el coche de alquiler | **60** (siempre). Con coche propio, 0 | Regla de Eric (4-nov). Hoy el código usa 45 (alquiler) y 20 (propio) |
| Instalarse (ponerse cómodo, algo de compra) | **60** | Regla de Eric |
| Trayecto del aeropuerto (ACE) a la zona | según la zona (tabla de abajo) | Matriz de coche de Mapbox, sin tráfico |

**Trayecto del aeropuerto a cada zona** (matriz de coche) y la hora útil que sale:

| Zona | ACE → zona | Zona → ACE | Hora útil = aterrizaje + … | Aterrizas 10:00 | Aterrizas 14:30 | Aterrizas 19:00 |
|---|---|---|---|---|---|---|
| Puerto del Carmen | 12 min | 12 min | **2 h 57** | 12:57 | 17:27 | 21:57 |
| Playa Blanca | 31 min | 36 min | **3 h 16** | 13:16 | 17:46 | 22:16 |
| Costa Teguise | 15 min | 16 min | **3 h 00** | 13:00 | 17:30 | 22:00 |
| Arrecife | 10 min | 12 min | **2 h 55** | 12:55 | 17:25 | 21:55 |
| El norte | 29 min | 30 min | **3 h 14** | 13:14 | 17:44 | 22:14 |
| El interior | 19 min | 18 min | **3 h 04** | 13:04 | 17:34 | 22:04 |

- **Con coche propio** (sin recogida), 1 h menos en todas las zonas.
- **Eric** (aterriza a las 08:25, coche de alquiler, Costa Teguise): 08:25 + 45 + 60 + 15 + 60 = **11:25**.
- Los tiempos de Mapbox salen algo más largos que los de rome2rio de `_llegada.json` (Costa Teguise 15 frente a 13; Playa Blanca 31 frente a 28). Propongo usar los de Mapbox, que son los mismos que usa el resto de la ruta.
- **Sin pase**, la app no sabe en qué zona duermes. Propuesta: usar la zona más lejana (Playa Blanca, 3 h 16), como hace la ruta gratis con el coche.

**Atardeceres** (los calcula `sunset.js` con la hora de Canarias):

| Fecha | Atardecer |
|---|---|
| 8-nov | 18:04 |
| 12-nov | 18:02 |
| 15-dic | 17:59 |
| 15-ene | 18:19 |
| 20-mar | 19:06 |
| 15-abr | 20:21 |
| 21-jun | 20:56 |
| 15-jul | 20:55 |
| 15-ago | 20:35 |
| 15-sep | 20:00 |
| 15-oct | 19:25 |

---

## 3. El día de llegada, por franjas de hora útil y por zona

### La idea

Igual que en Roma: **la hora útil solo elige la fila de una tabla**, y cada fila es una lista escrita. El motor después la mide con el coche, los horarios y el atardecer, y quita lo opcional si no cabe.

| Fila | Hora útil (noviembre) | Qué lleva el día de llegada |
|---|---|---|
| **A** | antes de las 11:00 | Un **día cercano casi entero**, que no es imprescindible: el D3 «Manrique en casa» (en Playa Blanca, el D4). Ese día ya no se repite en el viaje. |
| **B** | 11:00 a 13:59 | **Medio día cercano con comida.** Lo esencial del D3 (Fundación + Teguise o Cactus + Arrecife al caer la tarde). En Playa Blanca, la tarde del D4. Si la hora útil es después de las 13:30, empieza por «Comida cerca de tu alojamiento». |
| **C** | 14:00 hasta 1 h antes del atardecer (noviembre: 17:00; verano: ~19:55) | **Una o dos paradas ligeras** cerca + el atardecer + la cena cerca. Con hora útil antes de las 14:45, primero «Comida cerca de tu alojamiento». |
| **D** | de 1 h a 30 min antes del atardecer (noviembre: 17:00-17:34) | **Solo el atardecer** (o «al caer la tarde») de tu zona + la cena cerca. |
| **E** | desde 30 min antes del atardecer hasta las 21:59 | **Solo la cena cerca** del alojamiento. Sin paradas. |
| **F** | 22:00 o más tarde | **Sin ruta y sin cena.** La compra de la hora extra hace de cena. Sale la tarjeta de llegada y ya. |

**Qué día cuenta como «hecho».** En las filas A y B, el D3 (o el D4 en Playa Blanca) **cuenta como hecho** y su hueco lo ocupa el siguiente día de la tabla. Lo que se quede sin ver de ese día pasa al día de vuelta o a «Si te sobra tiempo». **La Fundación (joya del D3) nunca se pierde**: si el día de llegada no la lleva, el D3 sigue en el viaje.

### Las paradas por zona (de nuestros datos, con su tiempo en coche desde la zona)

Ninguna es del D1, del D2 ni de La Graciosa. **Haría, el Mirador del Río, La Geria, El Golfo y Timanfaya quedan fuera a propósito.**

**Costa Teguise**
- **A:** el D3 desde las 11:00: Fundación (10 min) → Jardín de Cactus → comida en Teguise → Teguise → Campesino → Charco de San Ginés. 1 h 13 de coche. Se quitan los tres opcionales (Santa Bárbara, Ciudad Estratificada y Las Grietas).
  - **En domingo, el D3 de domingo:** Teguise con el mercadillo (9:00-14:00) → comida en Teguise → Cactus → Fundación → Charco.
- **B** (medido con hora útil 12:30): Fundación 12:45 → comida en Teguise 14:30 (La Cantina) → Teguise → Charco de 16:57 a 18:09. 50 min de coche.
  - Con hora útil 13:30: comida cerca → Fundación 15:00 → Charco a las 16:49.
- **C:** Castillo de San José, el museo de arte contemporáneo (9 min; abre de 11:00 a 18:00; no está en ningún día) → Charco de San Ginés (9 min) al caer la tarde. 31 min de coche.
- **D:** Charco de San Ginés (13 min + 10 de aparcar). Arrecife mira al este: no se ve el sol caer al mar, pero sí las luces del Charco.
- **Cena:**
  - SeBE: lunes, martes, jueves y viernes; **cerrado sábado y domingo**.
  - La Bohemia: de jueves a martes; **cierra el miércoles**.
  - Villa Toledo: de martes a domingo; **cierra el lunes**.

**Arrecife**
- **A** y **B:** igual que Costa Teguise (Fundación a 10 min). 40-63 min de coche.
- **C:** Castillo de San José (8 min) → Charco (9 min). 20 min de coche.
- **D:** el Charco (3 min).
- **Verano:** la Playa del Reducto (5 min) antes del Charco.
- **Cena:**
  - Lilium: de martes a sábado.
  - Naia: de martes a domingo.
  - Malecón: de miércoles a lunes.

**Puerto del Carmen**
- **A:** el D3 (Fundación a 20 min). 1 h 28 de coche.
- **B:** Fundación → comida en Teguise → Teguise → Puerto Viejo al caer la tarde. Llegas al Puerto Viejo justo después del atardecer: no es una parada de atardecer, vale igual. Sin el Campesino.
- **C:** Las Grietas (12 min; solo de día, sin viento ni lluvia, por pista de tierra) → Puerto Viejo (14 min). 31 min de coche.
- **D:** Puerto Viejo de Puerto del Carmen (5 min; no está en ningún día).
- **Cena:**
  - La Carmencita: de lunes a viernes.
  - El Cangrejo Rojo: de lunes a sábado.
  - Lomo Alto: todos los días.

**Playa Blanca**
- **A:** el D4: Papagayo (19 min + 20 de aparcar) → comida en Marina Rubicón → paseo marítimo → Faro de Pechiguera al atardecer. 1 h 14 de coche.
- **B:** comida en Marina Rubicón (7 min) → un rato corto en Papagayo (hasta las 16:15 en noviembre) → paseo → Faro al atardecer. 1 h 13 de coche.
- **C:** paseo marítimo → Faro de Pechiguera (12 min) al atardecer: aquí sí se ve el sol caer al mar. 24 min de coche.
- **D:** el Faro.
- **Cena:**
  - Primario Gastrobar: de miércoles a domingo.
  - La Tapita.
  - La Cubierta: todos los días.
- Si después el viaje lleva el D4, ese día no repite el faro: alarga la playa, como en verano.

**El norte**
- **A:** el D3 empezando por el Cactus (9 min), y al final Arrieta en lugar del Charco (que queda a 27 min de vuelta).
- **B:** Cactus (9 min) → comida en Teguise → Fundación → Arrieta al caer la tarde. 58 min de coche.
- **C:** Jardín de Cactus (9 min; última entrada 16:30) → Arrieta y Punta Mujeres (9 min). 22 min de coche.
- **D:** Arrieta y Punta Mujeres (5 min).
- **Verano:** las piscinas de Punta Mujeres o La Garita (4 min; sin socorrista).
- El norte mira al este y no tiene atardecer sobre el mar. Si se quiere uno, el Mirador de Guinate (13 min; no está en ningún día) mira a La Graciosa con la última luz.
- **Cena:**
  - La Tegala (Haría): todos los días menos el miércoles, hasta las 22:00.
  - Volcán de la Corona: horario sin confirmar.
  - El Charcón: sin confirmar si abre por la noche.

**El interior**
- **A:** el D3 (Campesino a 6 min, Teguise a 14 min). Si el viaje no lleva el D5, termina con el atardecer en Famara en lugar del Charco.
- **B:** Teguise (14 min) → comida en Teguise → Campesino → Caleta de Famara al atardecer. 1 h 01 de coche.
- **C:** Casa-Museo del Campesino (6 min; hasta las 18:00) → Caleta de Famara al atardecer (17 min). 44 min de coche.
- **D:** Famara (21 min + 5 de aparcar): con hora útil hasta las 17:34, llegas antes del sol.
- Famara es del D5, que solo entra en viajes de 6 días o más (o con Volcanes). Si el viaje lleva el D5, la fila C y la D se quedan en el Campesino y Teguise.
- **Cena:**
  - El Barquillo: de miércoles a domingo.
  - Casa Cejas (Teguise): horario sin confirmar.
  - En Famara: Sol (hasta las 22:00; el domingo, hasta las 21:30) o El Risco (hasta las 21:30).

**Verano** (atardecer ~20:35-20:56). La fila C llega hasta ~19:55, así que una llegada a las 14:30 (hora útil ~17:30) es fila C y no D. Se añade un rato de playa:

| Zona | Playa |
|---|---|
| Arrecife y Costa Teguise | el Reducto |
| Playa Blanca | Papagayo, que cierra la barrera a las 19:00 |
| El norte | Punta Mujeres o La Garita |
| El interior | Famara, para pasear (bandera roja: no es de baño) |

La cena, después del atardecer: hacia las 21:15-21:30.

---

## 4. Qué día va el segundo y cómo cambia el reparto

**Propuesta de reglas** (cambian las de `listas.json › reparto.prioridades`):

1. **El día 1 es el de llegada.** Con hora (pase y vuelo), sale de la tabla del apartado 3.
2. **El primer día entero (el día 2) es el D1, Timanfaya.** Hoy la regla dice «el día 1 es el D1, siempre»: pasa a decir «el primer día entero».
3. **Qué días entran.** Se coge la lista de la tabla para esa duración (`por_dias`) y se le quita el día que ya hizo la llegada (D3, o D4 en Playa Blanca, si es fila A o B). Con lo que queda se llenan los días enteros. **Si sobra alguno, se recorta el último de la lista**, como ahora.
4. **Domingo.** Si el día de llegada cae en domingo y es fila A o B, ese día lleva el **D3 de domingo** (el mercadillo). Si el domingo es el día 3 o más tarde, es del D3, como ahora. Si el domingo es el día 2, va el D1 (gana la regla 2).
5. **Sábado.** El D2, salvo el día de llegada, el día 2 y el último día entero. El D2 nunca el último.
6. **Viernes.** Si el D2 cae en viernes, puede llevar las Noches de Jameos. **El día de vuelta nunca**, porque la cena va de 18:30 a 20:30 y el concierto acaba a las 23:15.
7. **La romería de Los Dolores.** Ese sábado no va el D1. Si es el día 2, el D1 se cambia con el día 3.
8. **Vuelta con tarde libre** (vuelo a las 17:00 o más tarde). Si el D3 sigue en el viaje (porque la llegada fue fila C a F), **el D3 corto va el día de vuelta**: Fundación, Cactus y comida en Teguise están a 12-20 min del aeropuerto. Así entra el siguiente día de la tabla (por ejemplo, La Graciosa).
9. **Llegada muy tarde** (fila F). El día 2 sigue siendo el D1, pero eso es **salir a las 7:51** desde Costa Teguise para el turno de Timanfaya de las 9:00. **Pregunta para Eric:** ¿el día después de una llegada de noche se pone Timanfaya más tarde (la variante «tranquilo», a las 11:00, que el motor aún no tiene) o se cambia el D1 con el D2 (Jameos a las 10:00, salir a las 9:26)?

**Ejemplos.** Viaje de 5 días (4 noches), del domingo 8 al jueves 12 de noviembre:

| Llegada | Domingo 8 | Lunes 9 | Martes 10 | Miércoles 11 | Jueves 12 (vuelta) |
|---|---|---|---|---|---|
| Fila A o B | llegada con el D3 de domingo | D1 | D2 | La Graciosa | vuelta |
| Fila C a F, vuelo a las 17:00 o más tarde | llegada ligera | D1 | D2 | La Graciosa | D3 corto + vuelo |
| Fila C a F, vuelo antes de las 17:00 | llegada ligera | D1 | D2 | D3 | vuelta (La Graciosa se queda fuera) |

**Viajes cortos:**
- **Con 2 días de ruta** (llegada + 1 día entero), el día entero es el D1. El norte (D2) se queda fuera, y su variante de «2 días» ya no aplica.
- **Con 1 día de ruta** (2 días · 1 noche), solo hay día de llegada y vuelta.

---

## 5. El día de vuelta

**Hora límite** = hora del vuelo − **2 h** en el aeropuerto − **30 min** para repostar y devolver el coche − el trayecto de la última parada al aeropuerto.

- La maleta va en el maletero desde que dejas el alojamiento, así que se va directo de la última parada al aeropuerto.
- Desde la zona, hay que salir **2 h 42** antes del vuelo en Puerto del Carmen y Arrecife, **2 h 46** en Costa Teguise, **2 h 48** en el interior, **3 h 00** en el norte y **3 h 06** en Playa Blanca.
- Hoy `_llegada.json` pone 165 min para todas las zonas. Para Playa Blanca y el norte se queda corto.
- **Duda:** Eric ha subido la recogida del coche a 1 h. Para devolverlo dejo los 30 min del documento. ¿Se queda así?

**Las paradas de la última mañana**, por zona: las cercanas, de camino al aeropuerto. Ninguna es del D1, el D2 o La Graciosa. Entre paréntesis, los minutos en coche hasta el aeropuerto.

| Zona | Paradas de la última mañana |
|---|---|
| Costa Teguise y Arrecife | Fundación (12), Castillo de San José (12), Charco (10), Reducto (8), LagOmar (19), Cactus (23), Teguise (20) |
| Puerto del Carmen | Puerto Viejo (13), Las Grietas (9), Campesino (14), Fundación (12) |
| Playa Blanca | Papagayo (43), paseo y Marina Rubicón (36-41). De camino, el Puerto Viejo de Puerto del Carmen (13) |
| El norte | Arrieta y Punta Mujeres, Cactus (23), Fundación (12) |
| El interior | Campesino (14), Las Grietas (9), Fundación (12), Teguise (20) |

**Qué lleva el día según la hora del vuelo** (medido desde Costa Teguise, en noviembre):

| Vuelo | Con el coche en la T1 como tarde | Qué lleva |
|---|---|---|
| antes de las 11:00 | antes de las 8:30 | **Solo el traslado.** Antes de las 9:00, el depósito lleno la tarde anterior: la gasolinera del aeropuerto abre a las 7:00. |
| 11:00 a 13:59 | 8:30-11:30 | **Solo el traslado.** Si sobra, un paseo corto. Con vuelo a las 13:00, el Charco de 9:23 a 10:23 llega justo (3 min tarde): mejor dejarlo en «Si te sobra tiempo». |
| 14:00 a 16:59 | 11:30-14:30 | **Una mañana corta, sin comida.** Con vuelo a las 15:00: Cactus de 10:00 a 11:00 → Castillo de San José de 11:25 a 12:10 → T1 a las 12:22. Con vuelo a las 16:00: lo mismo, con 1 h de margen. |
| 17:00 a 18:59 | 14:30-16:30 | **Una mañana con comida.** Con vuelo a las 17:30: LagOmar 10:00 → Castillo de San José 11:20 → comida en el Charco 13:15 → T1 14:40. Si el D3 no se ha hecho: Fundación 10:00 → Cactus 11:47 → comida en Teguise 13:07 → T1 hacia las 15:10. |
| 19:00 a 21:29 | 16:30-19:00 | **Casi un día entero de lo cercano.** Con vuelo a las 20:00: Cactus → Teguise → comida en Teguise 13:00 → Campesino → Las Grietas → T1 16:24, con 1 h de margen. |
| 21:30 o más tarde | 19:00 o más tarde | Lo anterior **más el atardecer cerca del aeropuerto** (el Charco o el Puerto Viejo) y una cena temprana (el Malecón, en el Charco, o Lomo Alto, en Puerto del Carmen). |

**Las otras zonas, ya medidas:**
- **Playa Blanca, vuelo a las 17:00:** Papagayo de 10:09 a 12:09 → comida en Marina Rubicón → T1 14:23. Solo 7 min de margen: con Papagayo hay que salir pronto.
- **Puerto del Carmen, vuelo a las 15:00:** Puerto Viejo → Las Grietas → T1 11:54.
- **El norte, vuelo a las 16:00:** Arrieta → Cactus → T1 12:03.
- **El interior, vuelo a las 16:00:** Campesino → Las Grietas → Fundación → T1 13:32. Pasa 2 min del límite: la Fundación sobra.

---

## 6. Ejemplos completos

### 6.1 El viaje de Eric (vuelos reales)

- **Ida:** aterriza en ACE el **domingo 8-nov a las 08:25**.
- **Vuelta:** el vuelo sale el **viernes 13-nov a las 19:40**.
- Duerme en **Costa Teguise**, con coche de alquiler.
- Son 6 días y 5 noches: 5 días de ruta + el día de vuelta. La tabla para 5 días es D1 · D2 · D3 · La Graciosa · D4.
- **Hora útil:** 08:25 + 45 + 60 + 15 + 60 = **11:25**, fila B.

**Hoy, el motor le daría:**

| Día | Qué le daría |
|---|---|
| Domingo | D1 desde el aeropuerto (Timanfaya a las 10:15) |
| Lunes | D2 |
| Martes | D3 |
| Miércoles | La Graciosa |
| Jueves | D4 (sale de casa a las 7:47) |
| Viernes | **vacío** |

**Con la propuesta:**

**Domingo 8 · día de llegada: «Manrique en casa» con el mercadillo** (fila B, D3 de domingo, que cuenta como hecho)
- 11:25 sales del alojamiento (Teguise está a 18 min, y el domingo se tarda unos 15 min en aparcar).
- 11:58-13:13 **Teguise y el mercadillo** (hasta las 14:00).
- 13:15-14:30 **comida en Teguise**: La Cantina (reservar en domingo; Ikarus abre domingos de 12:00 a 16:00).
- 14:50-15:45 **Jardín de Cactus** (15 min; última entrada 16:30).
- 16:03-17:18 **Fundación César Manrique** (13 min; taquilla hasta las 17:00, cierra a las 17:30).
- 17:37-18:22 **Charco de San Ginés** al caer la tarde (atardecer a las 18:04).
- 18:35 en casa. **1 h 08 de coche.**
- **Cena cerca:** La Bohemia o Villa Toledo. SeBE no: cierra el domingo.
- Si el día se alarga, **lo primero que sale es el Cactus**, que pasa al viernes. Sin él, la Fundación va de 15:00 a 16:30 con calma y el Charco a las 16:49.

**Lunes 9 · D1, el sur volcánico** (motor ejecutado, desde Costa Teguise)
- Sal de casa a las **7:51** para el turno de Timanfaya de las **9:00** (compra la entrada por internet).
- Timanfaya 9:00 → La Geria 10:58.
- Comida a las 13:15 en Bodega La Geria (el lunes abre). **Hay un hueco muerto** de casi 1 h 15 entre las 11:58 y las 13:15: ver riesgos.
- Janubio 14:56 → Montaña Bermeja 15:35 → Los Hervideros 15:57 → El Golfo de 16:35 al atardecer (18:04).
- Casa a las 18:48. **2 h 32 de coche.**
- **Cena:** SeBE o La Bohemia. Villa Toledo cierra el lunes.

**Martes 10 · D2, el norte de Manrique** (motor)
- Sal a las 9:26.
- Jameos 10:00 → Cueva 11:30 (turno) → Mirador del Río 12:44.
- Comida en Haría a las 13:54 (Tacande).
- Haría 15:09 → Casa-Museo 16:14 → Mirador de los Helechos 17:30.
- Casa a las 18:16. **1 h 50 de coche.**
- **Cena:** SeBE, La Bohemia o Villa Toledo.

**Miércoles 11 · La Graciosa** (motor)
- Sal a las 8:44 hacia Órzola (36 min + 10 de aparcar). Ferry de las 10:00.
- Comida en Caleta de Sebo: **El Veril**, porque Casa Enriqueta cierra martes y miércoles. Hoy el motor no pone comida en este día.
- La última vuelta, a las **17:00** (horario de noviembre). Casa a las 18:06.
- **Cena:** Villa Toledo. SeBE el miércoles solo da comidas y La Bohemia cierra.

**Jueves 12 · D4, Papagayo y Playa Blanca** (motor)
- Papagayo → comida en Marina Rubicón a las 14:00 (Liken) → paseo de Playa Blanca 15:29 → Faro de Pechiguera al atardecer (18:02).
- Casa a las 19:03. **2 h 32 de coche.**
- El motor dice que salgas a las **7:47** para estar en Papagayo cuando abre la barrera (9:00). En noviembre sobra: **propongo salir hacia las 9:00** (ver cambios).
- **Cena:** SeBE, La Bohemia o Villa Toledo.

**Viernes 13 · vuelta a las 19:40**
- Hay que tener el coche en la T1 como tarde a las **17:10**, para estar en el aeropuerto a las 17:40. Maleta en el maletero.
- 10:02-11:02 **LagOmar** (17 min).
- 11:21-12:11 **Castillo de San José**, el museo de arte contemporáneo.
- 13:15-14:30 **comida en Arrecife**: Lilium da comidas el viernes de 13:30 a 15:00; si no, Tasca La Raspa, en el Charco, abre todos los días.
- 14:51-15:41 **Casa-Museo del Campesino** (el D3 de domingo no lo lleva).
- 15:57-16:37 **Las Grietas** (de día; mira el viento).
- 16:46 en la T1: **24 min de margen**. 1 h 13 de coche.
- Si el Cactus no entró el domingo, va aquí en lugar de LagOmar.
- **Noches de Jameos** (este viernes las hay): **no caben**, porque empiezan a las 18:30 y el vuelo es a las 19:40. Solo serían posibles durmiendo el viernes en la isla.

### 6.2 Tres llegadas de ejemplo

Domingo 8-nov, Costa Teguise, 5 días (4 noches). Para el día de vuelta (jueves 12) supongo un vuelo a las 18:00: coche en la T1 a las 15:30.

**Aterrizas a las 10:00 → hora útil 13:00 (fila B)**

- **Domingo**, el D3 de domingo corto:
  - 13:33 comida en Teguise, con el mercadillo alrededor (acaba a las 14:00);
  - 14:48 paseo por Teguise;
  - 15:38-17:08 Fundación;
  - 17:27-18:12 Charco;
  - 18:25 en casa (50 min de coche);
  - cena en La Bohemia o Villa Toledo.
- **Lunes:** D1.
- **Martes:** D2.
- **Miércoles:** La Graciosa.
- **Jueves, vuelta:** Cactus 10:00 → Castillo de San José 11:25 → comida en el Charco hacia las 13:00 → T1 hacia las 14:30.

**Aterrizas a las 14:30 → hora útil 17:30 (fila D)**

- **Domingo:**
  - 17:53-18:43 Charco de San Ginés, con las luces (el sol se pone a las 18:04);
  - 18:56 en casa (26 min de coche);
  - cena cerca: La Bohemia o Villa Toledo.
  - El Castillo de San José ya no cabe: cierra a las 18:00.
- **Lunes:** D1.
- **Martes:** D2.
- **Miércoles:** La Graciosa.
- **Jueves, vuelta:** el D3 corto. Fundación 10:00 → Cactus 11:47 → comida en Teguise 13:07 → un rato por Teguise → T1 hacia las 15:10.
- **Con un vuelo antes de las 17:00:** el miércoles va el D3 entero y La Graciosa se queda fuera.

**Aterrizas a las 19:00 → hora útil 22:00 (fila F)**

- **Domingo:** sin ruta y sin cena. La compra de la hora extra hace de cena; La Bohemia y Villa Toledo cierran hacia las 22:30, según datos de 2023.
- **Lunes:** D1, saliendo a las **7:51**. Es la pregunta del apartado 4, punto 9.
- **Martes:** D2.
- **Miércoles:** La Graciosa.
- **Jueves, vuelta:** el D3 corto, como en el ejemplo anterior.

---

## 7. Qué hay que cambiar, y los riesgos

### En sencillo

1. **Calcular la hora útil:** 45 + 60 (alquiler) + trayecto a la zona + 60.
2. **Un día de llegada nuevo («LL»)**, escrito en `listas.json` con sus filas A a F y sus listas por zona, como Roma.
3. **El reparto** debe saber que el primer día es de llegada: el D1 pasa al día 2 y el día que ya hizo la llegada sale de la lista.
4. **El día de vuelta con paradas.** Hoy no existe para Lanzarote.
5. **Las cenas, según el día de la semana.** Hoy propone restaurantes cerrados.
6. **Tocar las pruebas** que dan por hecho que Timanfaya se mueve de turno el día de llegada.

### Riesgos y cosas por confirmar

- **Las cifras de la llegada** (45 + 60 + 60) son de Eric y valen para todos. La de devolver el coche (30 min) es todavía una propuesta. Los tiempos de Mapbox son **sin tráfico**.
- **El alojamiento a las 11:25.** Lo normal es que la habitación aún no esté lista. La «hora para instalarse» será dejar las maletas y hacer la compra. Si no se pueden dejar, van en el maletero: el aviso de la maleta tiene que salir también el día de llegada.
- **Aparcar en Teguise el domingo:** 15 min según nuestros datos ⚠️. Y el mercadillo acaba a las 14:00: con hora útil después de las 13:15, apenas se ve.
- **La Fundación va justa** en las filas B: taquilla hasta las 17:00 y cierra a las 17:30. Si se entra después de las 16:00, la visita se acorta.
- **Restaurantes:** varios horarios son de 2023 (La Bohemia, Villa Toledo, Naia, Malecón, Lomo Alto…). Para el viaje de Eric, conviene confirmar La Bohemia y Villa Toledo antes del domingo.
- **Las Grietas:** pista de tierra, sin aparcamiento oficial, solo de día y sin viento. Está en la llegada (fila C de Puerto del Carmen) y en la vuelta.
- **El D1 tiene un hueco muerto** de ~1 h 15 entre La Geria (acaba a las 11:58) y la comida (13:15), porque la comida tiene hora fija. No es de la llegada, pero lo verá Eric el lunes.
- **El D4 sale a las 7:47 desde Costa Teguise** porque el motor quiere estar en Papagayo cuando abre (9:00). En noviembre no tiene sentido.
- **La Graciosa no lleva comida** en el motor. El miércoles, Casa Enriqueta cierra.
- **Sin pase** no sabemos la zona. Propongo usar la más lejana para la hora útil (en Roma, la llegada con horas es solo del pase). **Decisión de Eric:** ¿la ruta gratis con hora de vuelo también tiene día de llegada, o se queda como hoy?
- **Preguntas para Eric:**
  1. Después de una llegada de noche, ¿Timanfaya más tarde, o el D2 antes que el D1?
  2. ¿El D3 corto va el día de vuelta cuando el vuelo es a las 17:00 o más tarde, para que entre La Graciosa?
  3. ¿Añadimos una parada «paseo de Costa Teguise»? Hoy la zona no tiene ninguna parada propia: hay que sacar su aparcamiento de Google Maps, como pide Eric.

---

## Para el programador (referencias)

**Qué sale hoy y por qué**
- `server/engine/cocheDay.js:38-39`:
  - `llegadaMin = hora + 45` (alquiler) o `+ 20` (propio). No cuenta el equipaje, el trayecto a la zona ni la hora para instalarse.
  - La llegada no mira `pase`.
- `shared/routeEngine/cocheTrip.js`:
  - `:211-219` (`medirDia`): con `llegadaMin`, el origen es `aeropuerto_ace` y el primer turno se mueve de 15 en 15 min sin mirar `last_entry`. Por eso sale Timanfaya a las 16:15 o 20:45: solo queda el aviso `ult` de `:245`, y el día se enseña igual.
  - `:308`: el `origenLlegada` sale del aeropuerto.
  - `:442`: `recoger_coche_min: 45` fijo.
  - `:447`: `llegada_aeropuerto`.
- `cocheTrip.js:53-77` (`diasDelViaje`):
  - `bloqueado = new Set([0])` y D1 siempre en el índice 0.
  - Domingo en `:70`, sábado en `:71`, «D2 nunca el último» en `:73-75`.
- `cocheTrip.js:84-103` (`variantesDelDia`): no hay ningún día «LL». La variante `tranquilo` del D1 tiene `pendiente_motor: true` (`listas.json:96-105`).
- `server/engine/cocheDay.js:24-25`: si `dayNumber > contentDays`, devuelve `null`. Entonces `server/engine/index.js:257-260` sigue por el camino de Roma, que tampoco lo monta (`:345-350` solo con `plan.vuelta` del motor de listas). Al final queda el día vacío de `src/lib/tripDays.ts:16-32` (`appendReturnLegDay`).
- `cocheTrip.js:418` y `:424`: la cena coge `restZona.slice(0,3)` y el primero (SeBE) sin mirar el día de la semana. `_restaurantes.json › cenas_por_zona` solo tiene `horario` en texto.
- `cocheTrip.js:484` (`excursionDia`): `meals: []`. La Graciosa sale sin comida.
- `cocheTrip.js:210` y `:242`: el primer paso espera a `abre`. Por eso el D4 sale a las 7:47 (Papagayo, ventana `09:00-19:00` en `lanzarote.json`).
- `cocheTrip.js:196` y `:244`: la comida con `hora_aprox` fija espera. De ahí el hueco del D1 (`listas.json:49`, `"13:15"`).

**Qué cambiar**
1. **Hora útil.** Nuevo módulo puro `shared/routeEngine/cocheLlegada.js`:
   - `horaUtil = aterrizaje + 45 + (alquiler ? 60 : 0) + coche.min('aeropuerto_ace', zona) + 60`;
   - sin zona (o sin pase, si Eric lo decide así), la zona con el ACE → zona más largo;
   - las constantes, a `destination_config.llegada` de `lanzarote.json` (`salir_aeropuerto_min: 45`, `recoger_coche_min: 60`, `instalarse_min: 60`);
   - quitar el 45/20 de `cocheDay.js:38-39` y el 45 de `cocheTrip.js:442`.
2. **Las tablas en `data/dias/lanzarote/listas.json:846`** (hoy `"llegadas": null`):
   - `llegadas.dia1` con las filas A a F por hora útil (los cortes C/D/E, relativos al atardecer: `sol − 60` y `sol − 30`) y, en cada fila, la lista por zona (las 6 zonas + `nose`), como Roma (`data/dias/roma/listas.json › llegadas.dia1`);
   - `llegadas.vuelta` con las filas por hora de vuelo (`solo_traslado`, `manana_corta`, `manana_con_comida`, `dia_cercano`, `dia_cercano_con_atardecer`) y la lista por zona;
   - se puede reutilizar `filaDeLlegada` de `shared/routeEngine/llegadaDia1.js:82-89`.
3. **`medirDia`** (`cocheTrip.js:206`): un parámetro `desdeMin` (salir de la ZONA no antes de la hora útil). En el día LL, el origen ya no es el aeropuerto: se va al alojamiento antes. Y nunca mover un turno más allá de su `last_entry`: si no cabe, la fila es otra.
4. **`diasDelViaje`** (`cocheTrip.js:53`): recibir `{ llegada: { fila, absorbe: 'D3'|'D4'|null } , vuelta: { tardeLibre } }`:
   - `ids[0] = 'LL'`, quitar `absorbe` y recortar a `n − 1` días enteros;
   - D1 en el índice 1, con `bloqueado = {0, 1}`;
   - domingo y sábado desde el índice 2;
   - D3 al día de vuelta si `tardeLibre` y no se absorbió;
   - LL en domingo con fila A o B → el D3 de domingo.
   - Actualizar `listas.json:837-844` («el día 1 es el D1» → «el primer día entero»).
5. **`planCocheDia`:**
   - rama `dayId === 'LL'` (montar los pasos desde la fila y la zona; `comida_al_llegar` como `aplicarOpsLlegada` en `llegadaDia1.js:174-177`);
   - rama de vuelta (`dayNumber === totalDays`) llamada desde `cocheDay.js:25`, que devuelva `is_return_leg` y `return_day` como `index.js:348-349`;
   - hora límite = vuelo − 120 − 30 − `coche.min(últimaParada, 'aeropuerto_ace')`.
6. **`_llegada.json`:** `salir_antes_min: 165` → por zona (Mapbox: 162, 186, 166, 162, 180, 168).
7. **Cenas por día:** añadir `dias_abre` (o `cierra: ['sabado','domingo']`) a cada restaurante de `_restaurantes.json` y filtrar en `cocheTrip.js:418`. Lo mismo en `DG_comida` (y dar comida a `excursionDia`).
8. **El D4 en invierno:** que el primer paso no espere a las 9:00 si es tiempo de playa (por ejemplo, `llegar: 10:00` en invierno).
9. **Pruebas:**
   - `scripts/destino/pruebaTandaLZ2a_A.mjs:190-195` da por hecho que Timanfaya se mueve de turno con llegada a las 11:00; cambia a «el día 1 es LL y el D1 va el día 2»;
   - pruebas nuevas: 6 zonas × filas A a F × noviembre/julio; nunca D1/D2/DG el día de llegada ni el de vuelta; tope de 3 h; ningún sitio después de su última entrada; cena con el restaurante abierto ese día.

**Cómo se ha medido.** Scripts de solo lectura en `/tmp/claude-0/-home-claude/65df8d95-7f50-5904-8e5d-59b6bce90948/scratchpad/agente_lz/`:
- `hoy.mjs`: el motor de verdad, `buildDayBlockV3`;
- `dias.mjs`: `planCocheDia` por día;
- `sim.py`, `esc.py`, `eric2.py` y `vuelta.py`: las propuestas, con la matriz `lanzarote_coche.json`, los ratos de aparcar de `_paradas.json` y los horarios de `lanzarote.json`;
- `sol.mjs`: los atardeceres.
