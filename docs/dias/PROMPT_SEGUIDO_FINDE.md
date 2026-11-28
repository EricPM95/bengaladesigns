Hola. ESTE FIN DE SEMANA HACES CINCO TANDAS SEGUIDAS (V77, V78, V79, V80 y V81) Y, AL FINAL, EL FIN DE SEMANA DE PRUEBAS. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## Dónde están
En mis Descargas:
- `PROMPT_V77_DECISIONES_V72_V76.md`;
- `PROMPT_V78_CAMARA_Y_PUNTOS_DE_FOTO.md`;
- `PROMPT_V79_CERRAR_MI_VIAJE.md`;
- `PROMPT_V80_DIA_DE_EXCURSION.md`;
- `PROMPT_V81_RETOQUES.md`;
- `PROMPT_FINDE_PRUEBAS.md`;
- y el Design **`TODO_IGUAL`**, la versión de hoy.

**Antes de empezar:**
- comprueba que están los 6 y `TODO_IGUAL`;
- comprueba que `TODO_IGUAL` trae las páginas «Consejos del día», «Día de excursión en HOY» y la nueva VL7 («Resumen de tu viaje a Roma») de «La vuelta en HOY»;
- descomprímelo en `docs/diseno/proyecto/`, encima, sin borrar nada.

Si falta algo, dímelo y no empieces.

## Cómo
- **Por orden, una a una: V77, V78, V79, V80, V81.** Lees la tanda entera, la haces entera, haces su REPASO, la subes a main y compruebas producción, como dice cada una. Después, la siguiente. Nunca dos a la vez.
- **Si una tanda con pruebas no queda bien,** para esa y pasa a la siguiente solo si no depende de ella. Apúntalo.
- **Después, `PROMPT_FINDE_PRUEBAS.md`, sobre TODO lo anterior ya subido.** Su «Paso 0» (la V77) ya estará hecho: sáltalo y empieza por el Paso 1, el barrido de 365.
- **Migraciones:** todas aplicadas hasta la 0095. Si una tanda necesita una nueva, **para antes de aplicarla y dímelo**.
- **Las reglas de siempre:**
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**;
  - los agentes nunca hacen `git stash`, `git restore` ni `git checkout` de archivos.
- **La nota en la rama `estado`** (`_estado_finde.md`) al empezar, cada 30 minutos y al terminar cada tanda y cada paso.

## Al final de todo
- **`docs/dias/CHECKLIST_V77_V81.md`:**
  - cada punto con ✅, 🟡 o ❌ y por qué;
  - al final, «Decisiones pendientes de Eric», juntas y sin repetir, con su pregunta y tu propuesta.
- **`docs/dias/REPASO_V77_V81.html`:** una sola página que se abra sola sin internet, con las capturas al lado de sus dibujos.
- Lo del finde de pruebas (`INFORME_FINDE.md`, `REPASO_FINDE.html`), como dice su prompt.

En el mensaje final, en palabras sencillas:
- qué tandas se han subido;
- cuántos puntos ✅, 🟡 y ❌;
- lo del finde de pruebas: barrido, velocidad y Supabase;
- todo lo que hayan dicho los agentes que sea un riesgo o un posible fallo;
- y lo más importante que tengo que mirar yo.

**No apagues el PC.** Al final, reinicia el api-server.
