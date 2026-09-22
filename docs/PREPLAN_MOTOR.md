# Pre-planificación: cómo el motor nuevo reparte un viaje

Diseño de la fase que resuelve el invariante 20 (*un día por llamada, sin estado compartido*). Es lo
que hay que aprobar antes de escribir el motor.

---

## El problema

`buildDayBlockV2` construye UN día por llamada y no recuerda nada entre llamadas. Pero casi todas
las decisiones interesantes son del viaje entero: en qué día va el Vaticano, dónde cae la Galería
Borghese que el viajero eligió, qué mirador se reserva para después de cenar, qué no se repite.

La solución no es guardar estado: es que **el reparto entero sea una función pura** del viaje, que
cada llamada recalcula completa y de la que solo usa su día. Si dos llamadas calculan cosas
distintas, salen duplicados y huecos — así es como se perdió "Plaza Colonna" dos veces el mismo
viaje.

```
preplan(destData, totalDays, pace, hasFreeTour, pool, experiencias,
        imprescindiblesOn, fechaInicio)  →  Map<día, AsignaciónDelDía>
```

Sin I/O, sin aleatoriedad, sin `Date.now()`. Cuesta milisegundos sobre 67 lugares: recalcularlo
siete veces no se nota, y es lo que ya hacen hoy `planMustIncludePlacement` y `assignNightExperiences`.

---

## Paso 0 — De lugares a UNIDADES

El motor no reparte lugares, reparte unidades indivisibles. **67 lugares → 57 unidades.**

- Un `group` del JSON es **una** unidad, con su orden interno (`group_order`): `roma_antigua_core` =
  Coliseo + Foro + Arco (210 min); `vaticano_core` = Museos + San Pedro + Plaza (285 min).
- Un lugar con `contained_in` se pliega dentro de la unidad de su contenedor.
- Todo lo demás es una unidad de uno.

Esto resuelve tres reglas de golpe, sin escribirlas: Coliseo y Foro **no pueden** acabar en días
distintos, el orden interno de un grupo **no puede** alterarse, y "una visita larga por día" se mide
por unidad, no por lugar.

Cada unidad lleva: `zona`, `minutos`, `nivel` (el más bajo de sus miembros), `closed_on` (unión),
`esLarga` (> 90 min y no es el Free Tour) y `coords`.

**Hay 5 unidades largas en Roma**: vaticano_core (285), roma_antigua_core (210), Galería Borghese
(120), Bioparque (120), Museos Capitolinos (120). Con una por día, verlas todas exige 5 días — en un
viaje de 3 solo caben 3, y cuáles lo decide la cascada. Esto es una consecuencia real del diseño,
no un efecto colateral.

---

## Paso 1 — Presupuesto de tiempo (de dónde sale el número de paradas)

`MODE_CONFIG`, un objeto por modo. Nunca `if (modo === 'completo')` con lógica aparte.

| | completo | tranquilo |
|---|---|---|
| mañana | 08:00 → 13:00 (300 min) | 10:00 → 13:00 (180 min) |
| comida | 60 min, ventana 13:00-14:00 | igual |
| tarde | 14:00 → 20:00 (360 min) | 14:00 → 19:30 (330 min) |
| cena | ventana 20:00-21:00 | ventana 19:30-20:30 |
| extra por visita | 0 | +15 min |
| niveles de relleno | 1 + 2 + 3 | 1 + 2 |
| suelo de fin de día | 18:00 | 16:00 |

Cada parada consume `duración (+extra) + trayecto (~10) + pérdida por redondeo (~12)`. Con eso:

- **completo**: 660 min útiles ÷ ~67 min por parada ≈ **9,8 paradas** → cuadra con el objetivo 8-10.
- **tranquilo**: 510 ÷ ~82 ≈ **6,2 paradas** → cuadra con 5-7.

Es decir: el redondeo a :30 y los objetivos de paradas **no se contradicen**, salen del mismo
cálculo. Se volverá a medir con el motor real y se ajusta el objetivo, no el redondeo.

Aviso de escala: `vaticano_core` son 285 de los 300 minutos de una mañana en completo. Un día de
Vaticano es el Vaticano y poco más — eso es correcto, pero conviene verlo escrito.

---

## Paso 2 — Esqueleto de días

Para cada día de contenido (recordatorio: `contentDays = días - 1`, el último es la vuelta):

- **tipo**: excursión / libre / normal, según `day_pattern` + `destination_config`
  (Roma: `core_days: 4`, `max_auto_days: 7`).
  - día ≤ `core_days` → solo contenido nuevo
  - `core_days` < día ≤ `max_auto_days` → `permiteRepetición = true`
  - día > `max_auto_days` → **día en blanco**, el motor no genera nada
- **día de la semana**, si el viaje trae fechas (para `closed_on`)
- **zona por defecto de cada franja**:
  1. si existe reparto curado para esta duración → sus zonas
  2. si no (días 6-7, destinos nuevos) → por `zone_priority`

### `zone_priority` propuesto para Roma

No me lo invento: sale de mirar en qué día usa cada zona el reparto curado de las cuatro duraciones.

| zona | prioridad | por qué |
|---|---|---|
| centro_historico | 1 | día 1 en el curado, 20 lugares |
| roma_antigua | 1 | día 1 en el curado, 16 lugares |
| vaticano | 2 | día 2 en el curado |
| trastevere | 3 | nunca es zona de franja: es el `evening_block` y la zona de cena |
| villa_borghese | 3 | día 4 en el curado, 6 lugares |
| aventino | 4 | día 4 en el curado, 4 lugares |
| testaccio | 4 | día 5 en el curado, 3 lugares |
| esquilino, san_giovanni, nomentano, appia | 5 | 1-2 lugares cada una; **decidiste que fueran solo pool**, no ruta automática |

Consecuencia que conviene tener delante: fuera del curado, a Roma le quedan **10 lugares en 5
zonas**. Los días 5-7 no se pueden llenar de contenido nuevo aunque quisiéramos — por eso
`core_days: 4` y por eso la repetición a partir de ahí no es un parche, es la única salida.

---

## Paso 3 — La cascada, con desalojo

```
para cada nivel en [pool, experiencias, nivel1*, nivel2, nivel3]:
    para cada unidad (orden determinista: nivel, luego group_order, luego nombre):
        día = mejorDíaPara(unidad)
        si no cabe en ninguno → a la bolsa de sobrantes
```

`*` nivel1 se salta entero si el viajero apagó "Imprescindibles".

**`mejorDíaPara(unidad)`** descarta días donde `closed_on` choca con el día de la semana, y días que
ya tienen una visita larga si esta lo es (con 2+ días). Del resto, puntúa:

- `+1000` si la franja ya está en la zona de la unidad
- `+200` si es una zona adyacente (centros de zona a menos de ~1,5 km)
- `−150 × (nºdía)` **solo para el pool** → así lo elegido va lo antes posible (invariante 7)
- `+50` si la franja coincide con su `best_time` — bonus de desempate, nunca requisito
- `−300` si la franja se pasa de su presupuesto

**Desalojo** (invariante 8): si la mejor franja no tiene hueco y la unidad es del pool, se expulsan
unidades de nivel estrictamente inferior hasta que quepa. Las expulsadas **vuelven a la cola** y se
recolocan en la pasada siguiente. Cada unidad puede ser desalojada una sola vez, para que no haya
bucles.

> **Necesito que decidas una cosa aquí.** Si el pool pide un día que solo tiene sitio expulsando un
> nivel 1 (p. ej. el Coliseo), mi propuesta es: **el nivel 1 se mueve a otro día, nunca se cae del
> viaje** (invariante 10). Solo se perdería en un viaje de 1 día, donde no hay a dónde moverlo — y
> ahí manda el pool, que es lo que el viajero eligió a mano.

Después de colocar, **la zona de cada franja se recalcula a partir de lo que ha caído dentro**. Así
es como el pool hace que Villa Borghese suba al día 1 sin que "zone_priority" tenga que saberlo.

---

## Paso 4 — Comidas y noches

- **Comida**: zona = donde está el viajero al entrar en la ventana 13:00-14:00.
- **Cena**: zona = la de la última unidad de la tarde, con un empujón hacia las zonas que tienen
  `meal_zones` buenas (Trastevere, Centro, Monti, Testaccio, Barrio Judío). El bloque de tarde debe
  **terminar llevándote** a un sitio donde se cene bien, no dejarte en el Aventino a las 19:30.
- **Experiencia de noche**: de `night_experiences`, la que case con la zona de cena. Determinista
  por día, sin repetir ninguna en el viaje.

### Miradores de doble uso

Propongo **no** añadir `night_variant` a `places`, sino tres entradas nuevas en `night_experiences`,
que es el catálogo que ya existe y ya tiene toda la maquinaria (hueco de las 21:30, marca
`is_night_experience`, deduplicado):

| entrada | `zone` (la cena que la activa) | de día |
|---|---|---|
| Janículo de noche | trastevere | Mirador del Janículo |
| Pincio de noche | villa_borghese | Terraza del Pincio |
| Puente Sant'Angelo de noche | vaticano | Puente Sant'Angelo |

En los tres casos la zona de cena que la activa **es la zona del propio mirador**, así que no hace
falta un campo `night_zone` aparte.

> **Segunda decisión que necesito.** Hoy la regla es la contraria a la que pides: si un lugar se ha
> visitado de día, su versión nocturna queda **bloqueada** (`assignNightExperiences`). Para estos
> tres quieres justo lo opuesto — día y noche son complementarias. Propongo un campo
> `allow_same_day: true` en esas tres entradas, y que la regla de bloqueo siga aplicando a las otras
> cuatro (Coliseo, Fontana, Plaza de España, Panteón). ¿Correcto, o prefieres que todas las
> nocturnas puedan repetir?

---

## Paso 5 — Comprobaciones antes de construir

La pre-planificación no devuelve nada hasta pasar por aquí:

1. Toda unidad del pool está colocada, o queda registrada con el motivo exacto.
2. Toda experiencia elegida tiene representación real en el núcleo de algún día (invariante 12).
3. Ningún día por debajo del suelo de fin (18:00 completo / 16:00 tranquilo). El que no llega se
   rellena con niveles 2-3 de zonas cercanas; si aun así sobra hueco, se marca
   `candidatoExcursiónMedioDía`.
4. Ninguna unidad larga comparte día con otra.
5. Ningún lugar repetido entre días, salvo revisita explícita en días con `permiteRepetición`.

---

## Paso 6 — Construir el día (ya por llamada)

Cada llamada recalcula el preplan, coge su día y solo entonces:

1. **Orden dentro de la franja**: vecino más cercano desde el punto de entrada. Si la franja venía
   del reparto curado, se **respeta su orden** como semilla — está medido: reordenar el núcleo
   curado por geografía daba rutas PEORES (25,74 km frente a 23,79 km).
2. **Horas**: `fin = inicio + duración + trayecto`, y la siguiente empieza en `roundUpToSlot(fin)`.
   Excepción de encadenado: si el trayecto es ≤ 3 min, la siguiente empieza sin redondear y el
   redondeo se aplica al salir del grupo.
3. **Clamp de apertura**: ninguna parada antes de que abra (invariante 2), con el parser multi-tramo.
4. **Comidas** en su ventana, **experiencia de noche** a las 21:30.
5. Devuelve **exactamente el mismo formato que hoy** — la UI no se entera de nada.

---

## Lo que NO cambia

El contrato de entrada/salida, los catálogos del JSON, la UI entera, los endpoints. Solo se sustituye
lo que hay entre `buildDayBlockV2(...)` y el objeto que devuelve.
