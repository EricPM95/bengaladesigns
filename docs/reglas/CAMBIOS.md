# Cambios en las reglas de las rutas

El diario de `docs/REGLAS_RUTAS.md`. Una regla nueva entra en su sitio **quitando la que contradiga**, y se apunta aquí con su fecha y con quién la pidió. Lo más nuevo, arriba.

## 2026-10-05 — Las reglas que faltan (33 a 37)

Encargo del usuario, a partir del informe del 4 de octubre. Lo escrito a mano sale y lo hacen las reglas.

| Regla nueva | Qué cambia en los datos y el motor | Reglas |
|---|---|---|
| Antes de añadir, se mira si cabe | `fitCuts` recorta en el orden de la 2; lo protegido no se toca; alargar un paseo no quita paradas | 33 |
| Pool con entrada con hora | `entradas` de D0 (Museos Vaticanos, Galería Borghese) | 34 |
| 1 día: el pool entra siempre | `insertByZone` sustituye la mitad del día más cercana a su zona | 35 |
| La comida no se estira | quitadas las dos ramas de `freeTime.js` que alargaban la comida | 36, 14 |
| Hora límite de la noche | `noche_limite` en `roma.json`; la cena junto a la nocturna, tramo en bus o taxi | 37 |
| Quitado a mano | el `si_pool` del Castillo en D2, la Basílica del 24 y 31 de diciembre por día, en D0 la cena de 75 min, las paradas de noche de 20 min, la cena en Monti y el Campo de' Fiori de 80 min | 12, 33, 37 |

## 2026-10-04 (noche) — Reglas, no casos

Encargo del usuario: cada fallo se arregla aplicando una regla de `REGLAS_RUTAS.md` o corrigiendo un dato; nada para una fecha, un día o un sitio concreto.

| Regla nueva o aclarada | Dónde |
|---|---|
| Lo marcado en el pool va por dentro si se puede entrar (también el Castillo), antes de su última entrada; sin sitio escrito, en el día de su zona | 12 |
| Por fuera no depende del horario del sitio (salvo recinto que cierra); la prueba no mira la última entrada ahí | 25 |
| Choque con un cierre: adelantar, acortar, por fuera, quitar; un imprescindible nunca se quita; la reserva del viajero con el sitio cerrado se queda y avisa | 1 |
| Un sitio va en el día de su zona; si otro día, un paseo o un «De camino» lo muestra, sale de ahí (por `muestra`) | 5 |
| La cena, entre lo último de la tarde y la nocturna (a 15 min de las dos); en verano, «Descanso a la sombra» hasta las 16:30 | 15, 21 |
| Experiencias: una lista ordenada por destino (`experiencias_lista`); el motor mete lo que cabe según los días, en el día de su zona | 13 |
| Roma: el viaje de 1 día (D0) sale por las mismas reglas con y sin Free Tour y con y sin pool; el camino viejo (`short_trips`) deja de usarse en Roma | 11 |

## 2026-10-04 (tarde) — Respuesta del usuario al informe

| Qué cambia | Reglas |
|---|---|
| Un paseo no enseña lo que el día ya es parada (se compara por `muestra`, también el de a mitad de día). «El Borgo iluminado» ya no nombra el Castillo ni Conciliazione. | 5, 7 |
| El pool va en el día más cercano a su zona (las Termas de Caracalla, al día del Aventino, D5C). | 12 |
| El texto de la Via dei Fori Imperiali sirve a cualquier hora. | 21 |
| «Iluminado» de noche: el Puente y el Castillo (18-nov, 19:50) con su foto de noche. Ya estaba; comprobado. | 21 |
| Los sitios que se llenan: solo Fontana de Trevi y Plaza de España. | 17 |
| La prueba no cuenta como `hora_no_10` lo pegado en el tiempo (la parada que no puede ir antes de que acabe la anterior con su paseo, o la que va antes de una hora fija). | 22 |
| El viaje de 1 día (sin Free Tour ni pool) es el día escrito `D0`: antes, `short_trips`. La noche (`noche_despues_de_cenar`) va siempre después de cenar. Cena junto a lo último (el Borgo), no en el Tridente (regla 15). | 11, 15 |
| Las reglas sustituidas salen de los ficheros vivos y van a `docs/historico/INVARIANTES_V3.md` (que entra en git). | 30–32 |

## 2026-10-04 — La hoja de reglas aprobada (V2) y su puesta en marcha

Pedido por el usuario a partir de `docs/INFORME_REGLAS_RUTAS.md`. La hoja es `docs/archivo/REGLAS_RUTAS_V2.md`; pasa a `docs/REGLAS_RUTAS.md` con la ficha de cada regla.

| Parte | Qué cambia | Reglas |
|---|---|---|
| 1 | Reproducido el error del Castillo (18-20 nov, 3 días, con Free Tour): el día del Vaticano, Castillo por fuera a las 19:50 y «El Puente y el Castillo iluminados» a las 20:15. | 5, 6 |
| 2 | Cinco expresiones rotas arregladas (`nocturna_repite`, `foto_repetida` en la prueba y en el motor, `plaza_despues`, la tarjeta de excursión). `tour_repite` solo cuenta lo que sale **después** del tour. | 6, 8 |
| 3 | Un `id` por sitio (106 ids), `site_id` y `muestra` en cada parada, la prueba compara por `id`, `validar.mjs` cruza los datos. | 0, 5, 31 |
| 4.1 | Viniendo de San Pedro, el Castillo (por fuera) va antes que el Puente. Dato: `approach_lado`. 17 cambios en los días de Roma. | 18 |
| 4.2 | Los huecos: hasta 30 min se estira la parada de antes si es de las que se disfrutan con calma; más de 30, un sitio de camino o el paseo; antes de una entrada, margen (hasta 60); antes del atardecer, el paseo del mirador. | 20 |
| 4.3 | Un solo camino para «iluminado»: solo con foto de noche del lugar; cuenta como su nocturna; si no, parada normal con foto de día. Una parada de noche se funde con la que la precede si enseña el mismo sitio. | 6, 21 |
| 4.4 | El pool contra un imprescindible de pago: si por fuera se ve bien, entra el extra y el imprescindible va por fuera; si no (Museos Vaticanos), el extra va a «No incluido». Sin avisos. | 3 |
| 4.5 | Campo propio `hora_tipo` (`reserva` / `turno` / `orientativa`) en los días escritos (83 horas). | 2 |
| 4.6 | La comida: de 45 a 90 min; unos 30 con una hora fija de verdad detrás. | 14 |
| 4.7 | Verano solo en julio y agosto, de 14:00 a 16:30. | 21 |
| 4.8 | Cada paseo, una vez por viaje si queda otro; si no queda, puede volver otro día, nunca el mismo. | 7 |
| 5 | Ficheros: `REGLAS_RUTAS.md` manda; `INVARIANTES_MOTOR.md` en solo lectura; lo vivo, en `INVARIANTES_TECNICO`, `_PANTALLA` y `_DATOS`; lo muerto, en `historico/INVARIANTES_V3.md`. | 30–32 |
| 6 | La prueba imprime una línea por regla y mira lo que no miraba: viajes sin fechas, de 1 día y con una reserva por franja; reglas 2, 9, 10, 13, 17, 21, 22 y 25. | 30 |

**Reglas de INVARIANTES que quedan sin efecto con estos cambios:** ver la línea «Sustituye a» de cada ficha de `REGLAS_RUTAS.md`. En particular la **416** (la nocturna puede volver a un sitio visto esa tarde): borrada de hecho; manda la **462**.

**Cosas de la hoja que hoy no se cumplen o no se comprueban** (se dicen en cada ficha): vuelos, trenes y barcos (R-2, R-28, R-29); medio día (R-11); excursiones (R-27); «una nocturna cada noche» (R-6); los 15 min andando a la comida y la cena (R-14, R-15).
