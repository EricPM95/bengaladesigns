# Fuera los ritmos: una sola ruta (30 de septiembre de 2026)

Hay una sola ruta: la que era «completo». Todo lo de «tranquilo» queda apagado, no borrado. Regla nueva: 403.

## 1. Textos cambiados

| Dónde | Antes | Después |
|---|---|---|
| Formulario, lista de pasos | Origen y destino · Transporte · Fechas · Compañía · **Ritmo** · Experiencias · Lugares | Sin «Ritmo». Seis pasos en vez de siete |
| Formulario, contador | «1/7» … «7/7» | «1/6» … «6/6» |
| Formulario, pantalla de ritmo | «05 — Ritmo · ¿Qué ritmo quieres?», con Completo y Tranquilo | No sale |
| Formulario, experiencias | «06 — Experiencias» | «05 — Experiencias» |
| Formulario, lugares | «07 — Lugares» | «06 — Lugares» |
| Formulario, etiquetas de arriba | «Completo» o «Tranquilo» | No sale |
| Resumen del formulario | Fila «Ritmo: Completo / Tranquilo» | Sin esa fila |
| Resumen, mientras genera | «Ajustando al ritmo elegido…» | «Poniendo las horas de cada día…» |
| Pantalla de carga | «Ajustando tu ritmo» | «Poniendo las horas» |
| Explorar, por qué un lugar no entra | «No entra con tu ritmo tranquilo desde Roma.» | «No entra en el día viniendo desde Roma.» |
| Parada que no cupo | «No había hueco en el horario del día con el ritmo elegido.» | «No había hueco en el horario del día.» |
| Parada que no cupo, sugerencia | «Prueba a moverla a otro día, o a subir el ritmo del viaje en el cuestionario.» | «Prueba a moverla a otro día, o quita otra parada para hacerle sitio.» |
| Aviso de madrugón | «Hoy toca madrugar un poco. Sabemos que elegiste ir con calma, pero hoy merece la pena empezar a las {hora}: así te da tiempo a ver {lugar} sin prisas. El resto del día sigue a tu ritmo.» | «Hoy toca madrugar un poco: merece la pena empezar a las {hora}, así te da tiempo a ver {lugar} sin prisas.» |
| Aviso de madrugón en invierno (dos variantes) | «…para que lo veas con tranquilidad. El resto del día sigue a tu ritmo.» | «…para que lo veas con tranquilidad.» |
| Banner de tranquilo (`context_banners.tranquilo`) | «Hemos preparado tu ruta con calma…» | Ya no sale. Se queda en el JSON, marcado sin uso |
| `pace_texts` y `pace_stats` | Textos y cifras de la pantalla de ritmo | Ya no se usan. Se quedan en el JSON, marcados sin uso |

**Nuevo:** las paradas opcionales llevan la etiqueta «Opcional» en su tarjeta, con el estilo de las demás.

**El PDF y el enlace para compartir:** no he encontrado ninguno que hable de ritmo; no hay nada que cambiar.

**Se quedan**, porque no hablan de elegir un ritmo: «Viajo solo y a mi ritmo», «Un hotel distinto cada noche, a tu ritmo», «Buen ritmo — puedes revisar el resto del día…» y la nota de temporada.

## 2. Motor

- El motor recibe siempre el ritmo único. El servidor lo fuerza en cada petición, venga lo que venga.
- Un viaje guardado con «tranquilo» se abre igual. Si se regenera, sale con la ruta única.
- Comprobado: pedir «tranquilo» da exactamente la misma ruta que «completo».

## 3. Días que empiezan fuera de 8:00-9:30

Ninguno empieza antes de las 8:00. Después de las 9:30 empiezan estos, y no los he tocado:

| Día | Empieza | Cuándo | Motivo |
|---|---|---|---|
| Roma Antigua con Free Tour (D1-FT) | 09:50 | 25 de diciembre | El Coliseo y el Foro cierran; se ven por fuera y no hace falta madrugar |
| Vaticano (D2) | 10:00 | 1 de mayo | Los Museos cierran; el Castillo va por la tarde |
| Vaticano (D2) | 11:00 | 25 de diciembre | Los Museos cierran; la mañana es de la bendición del Papa |
| Trevi, Borghese y Popolo (D4), con Free Tour | 10:05 | 1 de enero | La Borghese y el Castillo cierran; mañana más corta |
| Trevi, Borghese y Popolo (D4), con Free Tour | 10:15 | 25 de diciembre | Igual |
| Días con excursión de medio día (D6 y D7) | 16:00-16:30 | Todo el año | La mañana es la excursión; la ciudad empieza por la tarde |

**«El 1 de enero no antes de las 10:00 tras la Nochevieja»** (PROMPT_ROMA_FIN_DE_ANO) **no está hecho.** Ese prompt no me había llegado; lo he visto ahora en el archivo. Hoy el 1 de enero el Coliseo empieza a las 8:30.

## 4. Pruebas

| Prueba | Antes (solo completo) | Después (ruta única) |
|---|---|---|
| 365 fechas, avisos | 49 | **44** |
| — informativos | 22 | 22 |
| — de verdad | 27 | 22 |
| Navidad | 0 | **0** |
| 56 viajes frente al motor anterior | 5 mejor, 51 igual, 0 peor | 5 mejor, 51 igual, 0 peor |

- El total con los dos ritmos era 83. Ahora son 44, porque la prueba ya solo pasa una ruta: 6.180 viajes en vez de 10.560.
- Comparando completo con completo, caso a caso: 0 nuevos y 5 arreglados.
- Los 5 arreglados no son de quitar los ritmos, sino de los retoques de esta tanda: la cena con 81 min de espera del 16 de agosto de 2027, las dos esperas de 21 min del 14 de agosto, el descanso del 1 de mayo y la comida justa del 31 de octubre de 2027.
- De los 44 que quedan: 22 informativos (un sitio de pago cerrado todo el viaje), 11 idas y vueltas por la misma zona, 10 ratos libres largos y 1 llegada 5 min tarde.

## 5. Lo que se podría borrar

No he borrado nada. Cuando digas, esto es lo que sobra:

**Código de la app**
- `src/components/trazo/StepPace.tsx`: la pantalla de ritmo.
- `src/lib/destinationTextsApi.ts`: solo servía a esa pantalla.
- `src/components/questionnaire/Questionnaire.tsx`: el cuestionario antiguo, con su selector de ritmo. Ya no se usaba antes de esto.
- `src/components/route/DayItinerary.tsx` y `IntensitySlider.tsx`: hablan de ritmo y no están conectados.
- `PACE_LABEL` en `src/lib/explorePool.ts`.

**Servidor y motor**
- El ritmo tranquilo en `shared/routeEngine/modes.js` (`MODES_V3.tranquilo`) y en `server/engine/modeConfig.js`.
- Las ramas de tranquilo en `writtenTrip.js` (32 menciones), `curatedTrip.js` (29), `blockTrip.js`, `planTrip.js`, `shortTrip.js` y `server/engine/index.js`.
- El endpoint `/api/destination-texts` y el script `scripts/destino/paceStats.mjs`.

**Datos**
- En `roma.json`: `context_banners.tranquilo`, `pace_texts` y `pace_stats`.
- En los días escritos: las variantes `tranquilo` de D1, D1-FT, D2, D3, D4, D4M, D5 y D5C, las horas `tranquilo` de las paradas con hora fija, y `nombre_tranquilo`.
- En la base de datos, la columna del ritmo de la caché de rutas sigue ahí; ahora siempre guarda el mismo valor.

**Reglas**
- 118, 138, 169, 175, 234, 353, 366, 367 y 368 están marcadas «sin uso» en INVARIANTES.
