Hola. Un añadido pequeño a la API de Civitatis (parte 1). Detrás del mismo interruptor apagado. No toques el motor de rutas.

## La hora recomendada, encima de «Reservar»
- «Reservar» sigue yendo directo a Civitatis, como ahora.
- Encima del botón, en cada entrada con horas (Coliseo, Vaticanos…), una etiqueta verde pequeña con la hora que le recomendamos:
  «Te recomendamos reservar a las 11:00»
- Cuál es: de las horas libres de ese día en el calendario de la API, la que mejor encaja con su ruta. Es decir, la más cercana a la hora a la que su ruta lleva esa parada; si hay dos igual de cerca, la más temprana. El día es el de esa parada en su ruta.
- Si en esa hora quedan 10 plazas o menos, se añade con el número real: «Te recomendamos reservar a las 11:00 · Últimas 3 plazas».
- Si ese día no queda ninguna hora libre: «Ese día no quedan plazas». Y si otro día de su viaje sí tiene, se dice: «El miércoles 21 sí hay». Solo con días de su viaje.
- Sin fechas, sin la API, o si la actividad no tiene horas fijas: no sale nada.
- El calendario se pide al abrir la pestaña Entradas (sin la caché de una hora), para que las plazas estén al día.
- El verde ya lo usamos para lo reservado («Reservada ✓ · Fijada»): usa el mismo verde, pero que la etiqueta se lea claramente como recomendación y no como algo ya reservado (por ejemplo, con un icono de bombilla o de reloj, no el ✓).
- Es provisional: la pantalla buena la dibujará Design.

## La prueba
No toca el motor: la batería rápida, y añade a `pruebaCivitatis1` los casos: hora recomendada (la más cercana, el empate), con pocas plazas, día sin plazas con otro día que sí, día sin plazas sin alternativa, y sin fechas.

## El informe
Corto, en docs/dias/INFORME_CIVITATIS_1.md (añádelo al final): qué has hecho y cómo se ve.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
