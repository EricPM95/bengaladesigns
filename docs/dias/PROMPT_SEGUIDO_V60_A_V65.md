Hola. ESTA NOCHE HACES SEIS TANDAS SEGUIDAS, UNA DETRÁS DE OTRA: V60, V61, V62, V63, V64 y V65. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

## Dónde están
En mis Descargas, cada una en su archivo:
- `PROMPT_V60_CIVITATIS_Y_HORA_RECOMENDADA.md`
- `PROMPT_V61_REORGANIZAR.md`
- `PROMPT_V62_LA_LLEGADA_EN_HOY.md`
- `PROMPT_V63_ARREGLOS_DE_HOY_Y_DIAS.md`
- `PROMPT_V64_RESERVAS_DOCUMENTOS_Y_TARJETAS.md`
- `PROMPT_V65_ENTRADAS_Y_EXCURSIONES_EN_GRUPO.md`

Y el Design: **`TODO_IGUAL`** (la versión de esta noche; la V60 lo descomprime encima, sin borrar nada).

**Antes de empezar, comprueba que están los 6 y `TODO_IGUAL`.** Si falta alguno, dímelo y no empieces.

## Cómo
- **Por orden, una a una.** Para cada tanda:
  1. la lees entera;
  2. la haces entera;
  3. haces su REPASO;
  4. la subes a main y compruebas producción, como dice cada una.

  Después, la siguiente. **Nunca dos a la vez** ni mezcladas.
- **Las reglas de siempre valen para todas:**
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**.
- **Nota en la rama `estado`** (`_estado_seguido.md`) al empezar, **cada 30 minutos** y al terminar cada tanda: en qué tanda vas y qué punto. En las V52-V58 no la subiste: esta noche sí.
- **Si una tanda se atasca** (algo que no sabes resolver o que pide una decisión mía): apúntalo en su DECISIONES, deja ese punto a medias sin romper nada y **sigue con lo siguiente**.
- **Si una tanda no se puede subir** (la app no compila o producción no carga): no la subas, explícalo y **para ahí**.
- Modo rápido: sin pruebas, solo `npm run build` y capturas.

## Al final de todo: el repaso para Eric, como el de la V52-V58
1. **`docs/dias/CHECKLIST_V60_V65.md`:**
   - **cada punto y subpunto de cada tanda, uno por línea**, con ✅ hecho (y dónde se ve), 🟡 a medias (qué falta) o ❌ no hecho (por qué);
   - al final, «**Decisiones pendientes de Eric**», juntas, sin repetir, cada una en una frase con su pregunta.
2. **`docs/dias/REPASO_V60_V65.html`:** una sola página que se abra sola sin internet ni servidor (las capturas dentro):
   - arriba, el resumen (cuántos ✅, 🟡 y ❌);
   - después, tanda por tanda, cada punto con su captura en modo iPhone al lado de su dibujo y, debajo, en palabras sencillas, qué ha cambiado.

Súbelos a main con la última tanda.

Cuando acabe todo, dime en el mensaje final, en palabras sencillas:
- qué tandas se han subido;
- cuántos puntos ✅, 🟡 y ❌;
- lo más importante que tengo que mirar yo.

**No apagues el PC.** Al final, reinicia el api-server.
