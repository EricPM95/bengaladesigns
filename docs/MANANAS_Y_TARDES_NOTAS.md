# Mañanas y tardes tipo — notas

## Ajustes (PROMPT_AJUSTES_BLOQUES.md) — Parte A, respuestas aplicadas (2026-09-26)

- Bloques reimportados de `docs/roma_mananas_tardes_tipo.json`: `vaticano_trastevere` rehecho (Puente → Trastevere por el río → … → Janículo), `centro_barroco` y `campidoglio_ghetto` reversibles, `monti_basilicas` solo tras Roma Antigua. Nuevos campos: `paseo`, `antes_del_atardecer`, `reversible`, `por_dentro`. `principios_local` actualizado.
- Restaurantes de Prati importados (`docs/roma_restaurantes_prati.json`) e Il Sorpasso a `meal: "ambos"`. Lo que traía `_verificar`:
  - **Dal Toscano**: martes a domingo 12:30-15:00 y 20:00-23:15; lunes cerrado (web oficial). Coordenada **aproximada** (el centro de Via Germanico; OpenStreetMap no tiene el número 58), marcada `coordinates_approx`. Revisar.
  - **L'Arcangelo**: la web oficial solo publica el horario de verano, lunes a sábado 19:00-22:30, sin mediodía, y vacaciones del 10 al 31 de agosto. Queda como `cena` (el origen decía `ambos`). Coordenadas de OpenStreetMap.
  - **Osteria dell'Angelo**: el Touring Club dice "siempre abierto", sin horas. Queda como `cena`. Coordenadas de OpenStreetMap.
- Barrios de cena: Testaccio no salía porque Osteria Fernanda ("Trastevere / Testaccio") solo contaba para Trastevere y se quedaba en 2 restaurantes. Ahora cuenta para los dos. Vaticano sale con los de Prati. `validar.mjs` avisa si un bloque nombra un barrio sin restaurantes (hoy, ninguno).
- El Castillo, por fuera desde el Puente, salvo pool.
- `planTrip.js` y `verifyPlanTrip` marcados legacy. Sus 4 fallos, anotados en la pregunta 8 de abajo.

**Pregunta nueva:** L'Arcangelo, ¿abre a mediodía en invierno? Si es así, pasa a `ambos`.

## Decisiones sobre las preguntas (2026-09-26)

### 1. Tardes a más de 20 min de donde acaba la mañana: excepción explícita

- Las parejas que el JSON declara compatibles (`encaja_despues_de`) se quedan. El límite de 20 min solo vale para lo que el motor decide por su cuenta (encaje por cercanía).
- Si el traslado pasa de 25 min andando, el día lo avisa (`transfer_notice`, bajo el título del día en la app): "Traslado de ~X min: mejor en …". Cómo moverse sale del bloque (`traslados[acaba_en]`, nuevo en el formato); sin dato, "bus o metro".
- Las de más de 35 min, revisadas en transporte:

| Pareja | A pie | Transporte | Decisión |
|---|---|---|---|
| `vaticano_por_la_tarde` tras el Free Tour (Navona → Museos Vaticanos) | 38 min | bus 492 desde Senato, 16-21 min (cada 20 min); taxi unos 19 min | Baja de 20: **se queda**, con aviso |
| `letran_celio` tras el centro (Navona → San Juan de Letrán) | 46 min | taxi 7-19 min según el tráfico; bus 87 desde Rinascimento, 28 min | En taxi baja de 20: **se queda**, con aviso (el bus no baja de 20) |

  Fuentes: rome2rio (Piazza Navona → Museos Vaticanos, → San Juan de Letrán y → Santa Maria della Vittoria) y Mapbox Directions en coche (`driving-traffic`, con el tráfico del momento de la consulta).
- Con aviso también, al pasar de 25 min:
  - `bernini_trevi` tras el centro (29 min a pie): bus 492 hasta Largo di Santa Susanna, unos 20-23 min, o taxi, 5-10 min;
  - `letran_celio` tras la Roma Antigua (27 min a pie): taxi, unos 10 min, o bus 87.
- **Cómo se calculan hoy los minutos:** solo a pie. Salen de la matriz del destino (`data/pipeline_v2/travel/roma.json`): rutas de Mapbox Directions `walking`, pedidas una vez por `scripts/buildTravelMatrix.mjs` en los dos sentidos y guardadas. No hay transporte en la matriz.
- **Propuesta para comparar con transporte (sin implementar):**
  - añadir a la matriz un modo `driving` (taxi) con el mismo script (`modes.driving`, Mapbox `driving-traffic`, sumándole unos 5 min de espera). El motor ya lee los modos como dato;
  - para bus y metro, Mapbox no tiene transporte público. Habría que usar una API de transporte (Google Directions `transit`, Navitia o la GTFS de ATAC) solo para las parejas mañana-tarde, que son pocas, y guardarlas en la matriz como `modes.transit`;
  - el aviso diría el mejor de los dos, y `validar.mjs` marcaría en rojo una pareja declarada que no baje de 20 min en ningún medio.

### 2. 2 días, ritmo completo, empezando en sábado: la Plaza de España entra

- Un imprescindible que se ve desde la calle entra de paso (15 min) en el camino a la cena o entre bloques. Para hacerle sitio se recorta en este orden:
  1. el tiempo libre (los rellenos);
  2. el callejeo de un bloque (un barrio, a la mitad, 20 min como mínimo);
  3. una sola parada de paso de menos peso (sin grupo).

  Nunca el orden de un bloque ni su parada principal.
- Probado en tres sábados (24-10-2026, 15-05-2027 y 16-01-2027): en los tres entra la Plaza de España, de paso a las 19:45, camino de la cena. El 24 de octubre se cae una parada de paso (el Elefantino de Bernini).
- Añadido a la revisión como caso 17 (2 días desde el sábado 24 de octubre). "Imprescindibles que se ven desde la calle y faltan": **0**.

### 3. L'Arcangelo: solo cenas

- Solo cenas, todos los días, 19:15-22:45 (el usuario, 2026-09-26: abre todos los días; se quita el cierre del domingo). Sin pendientes.

### Criterio para restaurantes (2026-09-26)

- Son recomendaciones: el viajero comprueba el horario en Google Maps o Apple Maps. Se mantienen los días de cierre que ya están, pero no se dedica más trabajo a verificar horarios.
- Lo que importa es que la dirección y la coordenada sean correctas, para que el enlace al mapa funcione.

### Coordenadas de los restaurantes revisadas (2026-09-26)

- Los 65 restaurantes, geocodificados por su dirección (Mapbox v6) y contrastados con OpenStreetMap (búsqueda del local por nombre). 20 estaban a más de 150 m de su dirección; casi todos, unos 300 m desplazados. Corregidos 18 (más Dal Toscano), cada uno con `coordinates_checked` y su fuente:
  - con el punto del propio local en OpenStreetMap: Taverna Trilussa, Pizzarium, Ai Marmi, Da Remo, Pasticceria Regoli, Freni e Frizioni, Enoteca Ferrara, Ai Tre Scalini, Panella, Ma Che Siete Venuti a Fà y Mordi e Vai;
  - con el portal de Mapbox, porque OpenStreetMap no tiene el local o encuentra otra sucursal: Da Enzo al 29, SantoPalato, Neve di Latte, Otaleg, Faro, Osteria Fernanda (estaba a casi 1 km) y Trapizzino.
  - Direcciones corregidas: Ma Che Siete Venuti a Fà → "Via Benedetta, 25" (ponía "Via di Benedetta"); Mordi e Vai → box 15 del Mercado de Testaccio, Via Beniamino Franklin 12e.
- **Duda:** Trecca - Cucina di Mercato. Tenemos "Via di Porta Cavalleggeri 126" (zona Vaticano), pero OpenStreetMap lo sitúa en Via Alessandro Severo 222 (Ostiense, a casi 6 km). No lo he tocado: ¿cuál es la buena?

### Dal Toscano: coordenada corregida

- Dirección de su web oficial: Via Germanico 58/60, 00192 Roma. Geocodificada con Mapbox (v6, precisión de portal): **41.9078, 12.4575** (antes, el centro de Via Germanico, a unos 300 m).
- Los centros de los barrios de cena de Prati y Vaticano dependen de él. Con los de Monti y Testaccio (que cambiaron al contar las etiquetas dobles), no estaban en la matriz: recalculados (`scripts/buildTravelMatrix.mjs`, incremental).

### Medios días sin tipo: por qué salen (sin cambiar nada todavía)

Los 4 son **tardes**. En cada caso, las once tardes del JSON quedan descartadas por estas razones:

| Viaje | Día | Mañana | Por qué no entra ninguna tarde |
|---|---|---|---|
| 6 (3 días, sept., Arte) | 3 | `centro_temprano` | Tras "centro" solo encajan `centro_barroco` y `tridente_pincio` (las excluye la propia mañana: repiten Panteón/Navona y España), `bernini_trevi` y `villa_borghese_pincio` (piden 4 días), `letran_celio` (pide 5), `trastevere_a_fondo` (su ancla, Trastevere, ya salió el día 2 con `vaticano_trastevere`) y `vaticano_por_la_tarde` (el Vaticano ya es una mañana del viaje). |
| 8 (3 días, mayo, tranquilo, Naturaleza) | 3 | `centro_temprano` | Lo mismo que el viaje 6. |
| 15 (6 días, mayo, sin experiencias) | 5 | `caracalla_aventino` | Tras "aventino" encajan `centro_barroco` (el Panteón ya salió el día 3), `campidoglio_ghetto` (usada el día 1), `trastevere_a_fondo` (Trastevere ya salió el día 2) y `aventino_testaccio` (la excluye la propia mañana: es el mismo Aventino). |
| 16 (7 días, sept., Arte + Naturaleza) | 3 | `borghese` | Tras "villa_borghese" encajan `tridente_pincio` (su ancla, la Plaza de España, va en la mañana del día 5), `villa_borghese_pincio` (la excluye la mañana: la misma Galería) y `bernini_trevi`. Esta última sí entraba en el primer reparto, pero la reparación del viaje se la pasa al día 5, porque es la única tarde que encaja tras la mañana del centro, y el día 3 se queda sin nada. `monti_basilicas` ya no encaja tras la Borghese desde el cambio del JSON. |

- **Viajes 6 y 8: lo esperado según los datos.** En viajes de 3 días no hay ninguna tarde para después de la mañana del centro: las que encajan piden 4 o 5 días o las excluye esa mañana. Es el último día, y la tarde improvisada sale con sentido (San Luigi, el Gesù, Campo de' Fiori). Si se quiere evitar, la solución es de datos: permitir `bernini_trevi` en 3 días o añadir una tarde "después del centro" para viajes cortos.
- **Viaje 15: lo esperado.** En 6 días el viaje ya ha gastado todo lo que encaja después del Aventino.
- **Viaje 16: en parte es un fallo.** `tridente_pincio` se descarta solo porque su ancla (la Plaza de España, una plaza que se ve por fuera) va en la mañana de otro día, cuando lo demás de esa tarde (Popolo, Santa Maria del Popolo y el Pincio al atardecer) es nuevo. Como consecuencia, el Pincio y Popolo, que la mañana de la Borghese no llega a hacer, se quedan fuera del viaje. Propuesta (sin aplicar): si el ancla ya vista es un exterior, la tarde vale igual con el ancla de paso, siempre que traiga al menos dos paradas nuevas.

## Ajustes — Parte D, comprobación (2026-09-26)

- `docs/REVISION_RUTAS_ROMA_16.md` regenerada, con el resumen arriba:
  - bloques reordenados: **0**;
  - medios días sin tipo: **4** (la última tarde de los viajes 6 y 8, detrás de "centro_temprano"; el día 5 del 15 y del 16);
  - huecos rojos: **0**;
  - imprescindibles que se ven desde la calle y faltan: **0**.
- Semáforo en verde en enero, abril, julio y octubre, y con las fechas 28 y 30 de marzo de 2027 y 24 y 26 de octubre de 2026. Nuevas casillas: `reorden` (rojo) y `sinTipo` (amarillo).

**Preguntas nuevas:**
1. **Parejas del JSON a más de 20 min.** El prompt dice "nunca una tarde a más de 20 min de donde acaba la mañana", pero varias parejas que el propio JSON declara (`encaja_despues_de`) pasan de 20:
   - `villa_borghese_pincio` tras el centro: 32 min;
   - `bernini_trevi` tras la Borghese y tras el centro: 29 min;
   - `letran_celio` tras la Roma Antigua (27) y tras el centro (46);
   - `vaticano_por_la_tarde` tras el Free Tour: 38 min;
   - `centro_barroco` y `campidoglio_ghetto` desde Testaccio: 23-40 min.

   Las he respetado: el límite de 20 solo se aplica a lo que el motor decide por su cuenta (encaje por cercanía). ¿Las quitas del JSON o las dejas como excepción?
2. **2 días en ritmo completo, desde el sábado 24 de octubre:** los dos días van llenos hasta la cena y la Plaza de España ya no cabe ni de paso (sale en "No incluido"). ¿Te vale en 2 días, o prefieres que ceda algo de un bloque?
3. **Dal Toscano:** coordenada aproximada (el centro de Via Germanico). Hay que ponerla bien.

## Ajustes — Parte C, prueba concreta (2026-09-26)

- **2 días, tranquilo, Free Tour, diciembre (el 15) y con fechas 16-17 de diciembre:** día 1, Free Tour 10:00-12:30, comida a las 13:00, Museos Vaticanos 14:45-17:45, Plaza de San Pedro 18:00-18:30 y **Basílica 18:35-19:50**, cena a las 20:30. Para que quepa, la comida se acorta a 60 min (sin el extra de tranquilo) y el día lo dice: "Hoy la comida es más corta para que te dé tiempo a ver la Basílica de San Pedro". No se quita nada.
- **Miércoles con fechas:** el Vaticano ya no va por la mañana el miércoles si hay otro día (la Basílica no abre hasta las 12:30). Probado con salidas del 14, 15 y 16 de diciembre: el Vaticano cae martes, jueves y jueves, con la Basílica a las 12:05. Si el miércoles es el único día posible (Pascua de 2027: domingo y lunes cerrado), la Basílica va justo después de comer, pegada a la Plaza de San Pedro.

Notas de `docs/PROMPT_MANANAS_Y_TARDES.md`. Reglas en `docs/INVARIANTES_MOTOR.md` (123-130 Parte A, 131-141 Parte B).

## Parte B — resumen

- `roma.json`: `morning_flows` (8), `afternoon_flows` (11) y `flows_formato`, copiados de `docs/roma_mananas_tardes_tipo.json`; fuera `afternoon_flow` (el motor viejo lo saca ahora de las tardes cuya `encaja_despues_de` es una sola zona). `destination_config.size = "grande"`.
- `shared/routeEngine/blockTrip.js` (`planBlockTrip`): el motor v3 lo usa para viajes de 2 días o más cuando el destino tiene `morning_flows`. Los destinos sin bloques siguen con `planTrip`.
- Viajes de 1 día: **se quedan con el sistema antiguo** (`short_trips`). Comparado en 40 casos (2 ritmos × 5 experiencias × 4 meses), con bloques salen peor en 28 e iguales en 12. Con bloques se pierde la Plaza Venecia con el Altar. Con Arte, la mañana del Vaticano le quita el sitio al Coliseo. Y la tarde del centro (`centro_barroco`) no lleva Trevi ni España. 1,5 días todavía no existe en el servidor (llegará con los vuelos).
- `validar.mjs`: sección 9, "Mañanas y tardes tipo".
- Semáforo: casilla amarilla `sinTipo`, con los medios días sin bloque. `--rojos` dice qué viaje pone cada casilla en rojo.

## Datos comprobados (con fuente)

| Dato | Resultado | Fuente |
|---|---|---|
| Basílica de San Pedro, miércoles por la mañana | Cierra a los turistas durante la audiencia general y abre hacia las 12:30. Puesto en `by_day` (`mie: 12:30-20:00`), confianza media: la audiencia se suspende algunas semanas (en julio suele no haber), así que se deja lo prudente todo el año | stpetersbasilica-guide.com/plan-your-visit/st-peters-basilica-opening-hours/, voxcity.com (guía de horarios) |
| Mercado de Testaccio, cierre | Lunes a sábado de 07:00 a 15:30, cerrado el domingo. Ya estaba bien; añadido `hours_audit` | mercatoditestaccio.it/info/ (web oficial) |
| Catacumbas de San Calixto | 09:00-12:00 y 14:00-17:00. Cerradas todos los miércoles (ya estaba). Añadido: cierre el 1 de enero, el domingo de Pascua y el 25 de diciembre; última visita a las 12:00 y taquilla hasta las 16:50. El cierre de un mes en invierno cambia cada año (en 2025, del 15 de enero al 12 de febrero) y no se modela | catacombesancallisto.it/it/orari.php (web oficial) |

## Preguntas abiertas

1. **`vaticano_trastevere`: del Castillo de Sant'Angelo al Janículo hay 32 min andando.** `validar.mjs` lo marca en rojo (máximo 20). Solo pasa con Arte, que es cuando el Castillo entra (`solo_con`); sin Arte, del Puente al Janículo hay 31. ¿Se parte la tarde, se añade una parada intermedia o se acepta como excepción?
2. **Mañanas sin tarde que encaje:** `caracalla_aventino` (acaba en "aventino") y `trastevere_manana` (acaba en "trastevere") no tienen ninguna tarde con ese `encaja_despues_de`. Hoy se elige la tarde que empieza más cerca (20 min, o 30 si no hay ninguna). Desde Testaccio casi nunca hay una, y la tarde sale "sin tipo". ¿Añades tardes que encajen ahí?
3. **La tarde de Monti se queda corta** (`monti_basilicas` después de `borghese`): acaba hacia las 18:00 y cerca de Monti no queda nada que no sea de pago o de otro bloque. El motor lo resuelve cambiando de tarde (replanificando el viaje), pero es el bloque más flojo.
4. **Barrios de cena que no existen:** "Testaccio" y "Vaticano / Borgo o Prati" no tienen restaurantes curados. La cena va al barrio de cena más cercano (Trastevere desde Testaccio). ¿Se curan restaurantes allí?
5. **Castillo de Sant'Angelo por dentro después del Vaticano** (regla A.1: otra de pago por dentro junto a una visita grande, solo si dura 45 min o menos). El bloque lo pone con Arte y el motor lo deja; como dura más de 45 min, la regla lo sacaría. ¿Manda el bloque o la regla?
6. **`trastevere_a_fondo` con `vaticano_trastevere` en el mismo viaje:** la nota dice que entonces la segunda "solo cena en Trastevere". Hoy el ancla (Trastevere) ya está vista y esa tarde no se elige. ¿Te vale así?
7. **2 días, ritmo tranquilo y Free Tour:** el Vaticano va por la tarde (`vaticano_por_la_tarde`) y con la comida de tranquilo (2 h) la Basílica llega justa. En mayo cabe; conviene mirarlo en los meses con menos luz.
8. **`verifyPlanTrip` (el repartidor antiguo) falla en 4 casos**, desde que la Basílica cierra los miércoles por la mañana: 3 días con Free Tour y pool (Testaccio + Vaticanos + Farnesina) empezando el lunes 4 de mayo de 2026. El Vaticano cae en miércoles y el grupo no entra. Roma ya no usa ese repartidor para 2+ días (con bloques, ese mismo viaje sale bien: el Vaticano va por la tarde el lunes, tras el Free Tour). Solo afecta a destinos sin bloques. ¿Se arregla allí o se retira el repartidor cuando todos los destinos tengan bloques?
