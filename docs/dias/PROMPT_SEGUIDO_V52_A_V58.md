Hola. HOY HACES SIETE TANDAS SEGUIDAS, UNA DETRÁS DE OTRA: V52, V53, V54, V55, V56, V57 y V58. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## Dónde están
En mis Descargas, cada una en su archivo:
- `PROMPT_V52_CERRADOS_SONIDOS_Y_EMBLEMA.md`
- `PROMPT_V53_TODO_IGUAL.md`
- `PROMPT_V54_AVISOS_Y_ENTRADAS.md`
- `PROMPT_V55_HOJAS_IGUALES.md`
- `PROMPT_V56_ARREGLOS_PEQUENOS.md`
- `PROMPT_V57_VUELTA_EXCURSION_Y_PROBADOR.md`
- `PROMPT_V58_LO_DE_LOS_VIAJEROS.md`

Y el Design más reciente: `TODO_IGUAL` (lo usan la V53 y la V54).

**Antes de empezar, comprueba que están los 7 y `TODO_IGUAL`.** Si falta alguno, dímelo y no empieces.

## Cómo
- **Por orden, una a una.** Lees la tanda entera, la haces entera, haces su REPASO, la subes a main y compruebas producción, como dice cada una. Después, la siguiente. **Nunca dos a la vez** ni mezcladas.
- Cada tanda manda en lo suyo; las reglas de siempre valen para todas:
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**.
- **Nota en la rama `estado`** (`_estado_seguido.md`) al empezar, cada 30 minutos y al terminar cada tanda: en qué tanda vas y qué punto.
- **Si una tanda se atasca** (algo que no sabes resolver o que pide una decisión mía):
  - apúntalo en su DECISIONES;
  - deja ese punto a medias, sin romper nada;
  - **sigue con lo siguiente**. No te quedes parado esperándome.
- **Si una tanda no se puede subir** (la app no compila o producción no carga): no la subas, explícalo y **para ahí**. Las siguientes dependen de ella.
- Modo rápido, como dice cada una: sin pruebas, solo `npm run build` y capturas.

## Al final de todo: el repaso para Eric, como el de anoche
**1. `docs/dias/CHECKLIST_V52_V58.md`:** **cada punto de cada tanda, uno por línea**, con:
- ✅ **hecho** (y dónde se ve);
- 🟡 **a medias** (qué está hecho y qué falta);
- ❌ **no hecho** (por qué).

Que no falte ningún punto de ningún prompt. Si un prompt tiene subpuntos, cada subpunto en su línea.

Al final, «**Decisiones pendientes de Eric**»: juntas, sin repetir, cada una en una frase con su pregunta.

**2. `docs/dias/REPASO_V52_V58.html`:** una sola página, que se abra sola en el navegador **sin internet y sin servidor** (las capturas dentro de la página, no enlazadas):
- arriba, el resumen: cuántos puntos ✅, 🟡 y ❌;
- después, tanda por tanda: cada punto con su captura en modo iPhone (antes y después cuando lo pida el prompt) y, debajo, en palabras sencillas, qué ha cambiado.

Súbelos a main con la última tanda.

Cuando acabe todo, dime en el mensaje final, en palabras sencillas: qué tandas se han subido, cuántos puntos ✅, 🟡 y ❌, y lo más importante que tengo que mirar yo. **No apagues el PC.** Al final, reinicia el api-server.
