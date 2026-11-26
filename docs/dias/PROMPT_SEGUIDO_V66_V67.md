Hola. DOS TANDAS MÁS PARA ESTA NOCHE: V66 y V67. **No interrumpas lo que estás haciendo:** termina primero la V65 y el repaso final de la V60-V65 (`CHECKLIST_V60_V65.md` y `REPASO_V60_V65.html`), súbelo, y DESPUÉS sigue con estas dos. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo.

## Dónde están
En mis Descargas:
- `PROMPT_V66_HOY_RESPUESTAS_Y_EMBLEMA.md`
- `PROMPT_V67_DATOS_VIAJEROS_Y_CATALOGO.md`
- el Design **`TODO_IGUAL`**, la versión más nueva: la V66 lo vuelve a descomprimir encima, sin borrar nada, porque trae páginas nuevas (el Emblema Oculto y el atardecer).

Antes de empezar la V66, comprueba que están los dos prompts y que `TODO_IGUAL` trae las páginas «El Emblema Oculto» y «El atardecer». Si falta algo, dímelo y no empieces.

## Cómo
- **Por orden:** V66 entera (con su REPASO, subida a main y comprobada en producción) y después la V67. Nunca las dos a la vez.
- **Las reglas de siempre:**
  - 2 agentes como mucho, 1 Chrome, un servidor;
  - ninguna prueba toca el Supabase de producción;
  - nunca escribas ni enseñes una clave;
  - no abras los `.env*`;
  - push sin --force;
  - **no apagues el PC ni programes el apagado**.
- **La nota en la rama `estado`** (`_estado_seguido.md`), cada 30 minutos, diciendo en qué tanda vas.
- **Si una tanda se atasca:** apúntalo en su DECISIONES, déjalo a medias sin romper nada y sigue.
- **Si una tanda no se puede subir:** para ahí y explícalo.
- **Modo rápido:** sin pruebas, solo `npm run build` y capturas.

## Al final
- **`docs/dias/CHECKLIST_V66_V67.md`:**
  - cada punto, uno por línea, con ✅, 🟡 o ❌ y por qué;
  - al final, «Decisiones pendientes de Eric».
- **El catálogo de avisos de la V67** (`CATALOGO_AVISOS.html`) hace de página de capturas: que se abra solo, sin internet.

En el mensaje final, en palabras sencillas:
- qué tandas se han subido (de la V60 a la V67);
- cuántos puntos ✅, 🟡 y ❌;
- lo más importante que tengo que mirar.

**No apagues el PC.** Al final, reinicia el api-server.
