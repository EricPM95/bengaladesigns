Hola. HOY HACES CINCO TANDAS SEGUIDAS, UNA DETRÁS DE OTRA: V72, V73, V74, V75 y V76. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## Dónde están
En mis Descargas:
- `PROMPT_V72_LOGROS_FICHA_Y_PAGINAS.md`;
- `PROMPT_V73_HOY_AL_ACABAR_EL_DIA.md`;
- `PROMPT_V74_DECISIONES_DE_ERIC.md`;
- `PROMPT_V75_ANADIR_UNA_RESERVA.md`;
- `PROMPT_V76_UNIR_RESERVAS_Y_ESCALAS.md`;
- y el Design **`TODO_IGUAL`**, la versión de hoy.

**Antes de empezar:**
- comprueba que están los 5 y `TODO_IGUAL`;
- comprueba que `TODO_IGUAL` trae las páginas «Ficha Logros en Grande», «Hoy Al Acabar» y «Añadir una reserva»;
- descomprímelo en `docs/diseno/proyecto/`, **encima, sin borrar nada**.

Si falta algo, dímelo y no empieces.

## Cómo
- **Por orden, una a una.** Lees la tanda entera, la haces entera, haces su REPASO, la subes a main y compruebas producción, como dice cada una. Después, la siguiente. Nunca dos a la vez.
- **La V75 y la V76 van con pruebas** (tocan lo que se guarda). Si la V75 no queda bien, **para ahí**: la V76 depende de ella.
- **Migraciones:** todas aplicadas hasta la 0095. Si una tanda necesita una nueva, **para antes de aplicarla y dímelo**.
- **Lo que dejaste sin subir** (las páginas de Design de `docs/diseno/proyecto/` y `docs/dias/capturas_jutrip/hoy2b_reto_3_4.jpg`) se sube con la V72.
- **Las reglas de siempre:**
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**.
- **Los agentes, nunca:** `git stash`, `git restore` o `git checkout` de archivos, ni cerrar los Chrome de otro agente (ver V72 §3c).
- **La nota en la rama `estado`** (`_estado_seguido.md`) al empezar, cada 30 minutos y al terminar cada tanda.
- **Si un punto se atasca:** apúntalo en su DECISIONES, déjalo a medias sin romper nada y sigue con lo siguiente.
- **Si una tanda no se puede subir:** para ahí y explícalo.

## Al final de todo
- **`docs/dias/CHECKLIST_V72_V76.md`:**
  - cada punto, uno por línea, con ✅, 🟡 o ❌ y por qué;
  - al final, «Decisiones pendientes de Eric», juntas y sin repetir, cada una en una frase con su pregunta y **tu propuesta**.
- **`docs/dias/REPASO_V72_V76.html`:** una sola página que se abra sola sin internet ni servidor (las capturas dentro):
  - arriba, el resumen;
  - después, tanda por tanda, cada punto con su captura en modo iPhone al lado de su dibujo y, debajo, en palabras sencillas, qué ha cambiado.

Súbelos a main con la última tanda.

En el mensaje final, en palabras sencillas:
- qué tandas se han subido;
- cuántos puntos ✅, 🟡 y ❌;
- lo más importante que tengo que mirar yo;
- **todo lo que hayan dicho los agentes en sus informes que sea un riesgo o un posible fallo de la app**, aunque no se haya arreglado.

**No apagues el PC.** Al final, reinicia el api-server.
