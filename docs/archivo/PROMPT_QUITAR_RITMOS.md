# Fuera los ritmos: una sola ruta

Decisión: quitamos los ritmos. Medido con el motor, completo y tranquilo daban casi las mismas paradas (≈ 10 al día), y mantener dos ritmos nos obligaba a duplicar textos, variantes y pruebas.

Desde ahora hay **una sola ruta**: la que hoy es «completo». Cada día empieza a la hora escrita, casi siempre entre las 8:00 y las 9:00. Si alguien quiere ir más tranquilo, quita una parada.

Reglas:
- Commit por parte y sin push.
- Reglas generales a INVARIANTES.
- Ningún texto promete algo que la ruta no cumple.
- **Primero se apaga, no se borra.** Los datos y el código de tranquilo se quedan sin usar hasta que yo diga. Al final, pásame una lista de lo que se podría borrar.

## 1. Formulario

- Quita la pantalla de ritmo (`StepPace`) del recorrido del formulario y vuelve a numerar las pantallas siguientes («06 — Experiencias»…).
- Que el resumen del formulario no hable de ritmo.

## 2. Motor

- El motor recibe siempre el ritmo único, el que hoy es completo, venga lo que venga del formulario.
- Las variantes `tranquilo`, `tranquilo_invierno`, `tranquilo_sabado`, etc. de los días escritos se quedan en el JSON, pero no se usan.
- **Viajes ya guardados con «tranquilo»:** que se abran sin romperse. Si se regeneran, salen con la ruta única.
- **Paradas opcionales:** se quedan, y tienen que verse como opcionales en la tarjeta, con su etiqueta «Opcional», para que el viajero sepa qué puede saltarse. Si esa etiqueta no existe, créala con el mismo estilo que las demás.

## 3. Textos

Quita o reescribe todo lo que habla de ritmo:
- `context_banners.tranquilo`;
- `pace_texts`, `pace_stats` y `pace_notices`;
- el resumen del viaje, el PDF y el enlace para compartir;
- cualquier «tu ritmo», «ritmo tranquilo» o «ritmo completo» en pantalla.

Lista cada texto con su antes y su después.

Lo que no habla de ritmo se queda. Por ejemplo, «Hoy toca madrugar… a las {hora}» y la nota de temporada.

## 4. Horas de inicio

- No cambies las horas escritas.
- Lista los días que empiecen antes de las 8:00 o después de las 9:30 (día, fecha y motivo) y pásamelos. No los toques.
- Se mantiene lo del 1 de enero después de Nochevieja: no antes de las 10:00 (PROMPT_ROMA_FIN_DE_ANO).

## 5. Pruebas

- Pasa la prueba de las 365 fechas, los 56 viajes y la de Navidad con la ruta única.
- Compárala con el «completo» de antes: igual o mejor.
- Los avisos totales bajarán mucho porque desaparecen los de tranquilo. Dame también el número solo de completo, antes y después, para comparar lo mismo con lo mismo.

## 6. INVARIANTES

- Marca como «sin uso» las reglas que solo eran de tranquilo. No las borres.
- Añade: «Hay una sola ruta. El viajero la aligera quitando paradas; las opcionales se ven como tales.»

**Informe corto:**
- los textos cambiados;
- los días con hora de inicio fuera de 8:00-9:30;
- los números de las pruebas;
- la lista de lo que se podría borrar.
