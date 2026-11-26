Hola. HOY HACES CUATRO TANDAS SEGUIDAS, UNA DETRÁS DE OTRA: V68, V69, V70 y V71. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## Dónde están
En mis Descargas:
- `PROMPT_V68_RESERVAS_Y_DIAS_URGENTE.md`;
- `PROMPT_V69_HOJAS_DE_RESERVAS_Y_REORGANIZAR.md`;
- `PROMPT_V70_VUELTA_Y_RESPUESTAS.md`;
- `PROMPT_V71_EMBLEMA_Y_LOGROS.md`;
- y el Design **`TODO_IGUAL`**, la versión de hoy. La V69 lo descomprime encima, sin borrar nada.

**Antes de empezar, comprueba que están los 4 y `TODO_IGUAL`, y que `TODO_IGUAL` trae la página «Emblema Oculto · Al acercarte».** Si falta alguno, dímelo y no empieces.

## Cómo
- **Por orden, una a una.** Lees la tanda entera, la haces entera, haces su REPASO, la subes a main y compruebas producción, como dice cada una. Después, la siguiente. Nunca dos a la vez.
- **La V68 es la importante:** va con pruebas. Si no queda bien, **para ahí** y explícalo: las otras dependen de ella.
- **Las reglas de siempre:**
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**.
- **La nota en la rama `estado`** (`_estado_seguido.md`) al empezar, cada 30 minutos y al terminar cada tanda.
- **Si un punto se atasca:** apúntalo en su DECISIONES, déjalo a medias sin romper nada y sigue con lo siguiente.
- **Si una tanda no se puede subir:** para ahí y explícalo.

## Al final de todo
- **`docs/dias/CHECKLIST_V68_V71.md`:**
  - cada punto, uno por línea, con ✅, 🟡 o ❌ y por qué;
  - al final, «Decisiones pendientes de Eric», juntas y sin repetir, cada una en una frase con su pregunta.
- **`docs/dias/REPASO_V68_V71.html`:** una sola página que se abra sola sin internet ni servidor (las capturas dentro):
  - arriba, el resumen;
  - después, tanda por tanda, cada punto con su captura en modo iPhone al lado de su dibujo y, debajo, en palabras sencillas, qué ha cambiado.

Súbelos a main con la última tanda.

En el mensaje final, en palabras sencillas:
- qué tandas se han subido;
- **qué tanda rompió lo de las reservas en otro día y por qué** (lo de la V68);
- cuántos puntos ✅, 🟡 y ❌;
- lo más importante que tengo que mirar yo.

**No apagues el PC.** Al final, reinicia el api-server.
