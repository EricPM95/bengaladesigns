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
