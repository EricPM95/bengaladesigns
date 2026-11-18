Hola. TANDA V6: VER LO QUE HAS GANADO, CON SUS ANIMACIONES (18-nov). Va ya, después de la V5. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v6.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.

**Buena noticia de la V5:** Eric subió 3 fotos originales desde su iPhone con [Reclamar con tus fotos] y las 3 se detectaron bien (ubicación, fecha y cámara). El iPhone no quita los datos.

**Lo que no le gusta:** al acabar, el resumen («Has ganado 4 pedazos y 1 emblema») solo tiene [Ver todo en Logros] y no se ve ninguna animación. Lo bonito de conseguir algo es verlo.

## 1. Al acabar de reclamar
- **El botón dorado del resumen:** **[Ver lo que has ganado]** (en vez de [Ver todo en Logros]). Al tocarlo, empiezan las animaciones (punto 2).
- **Fuera el límite de «más de 6 → Ver todo en Logros».** Con el punto 2 ya no salen tantas pantallas.
- **Al terminar la última animación, o al tocar [Saltar todo],** se abre la hoja «Tus logros en …» con todo ya puesto.

## 2. La fila de momentos, agrupada (cambia la regla de la V3)
Vale para TODO: al reclamar con fotos, con la cámara, con un Visto y con «Yo también estaba» cuando exista.
1. **Una sola pantalla con TODAS las colecciones que avanzan** sin completarse: cada insignia rellenando a la vez su trozo nuevo, con su nombre y «3 de 7» debajo.
   - Con la pantalla de pedazo de Design (`Logros Momentos`), con las insignias en fila o en cuadrícula si son muchas.
   - Hasta ahora era una pantalla por colección: ahora, todas juntas.
2. **Cada colección que se COMPLETA,** su animación de colección completa, sola, en su pantalla.
3. **Cada emblema oculto,** su escena (con su frase de suspense la primera vez), sola, en su pantalla.
4. **Después, si lo hay, el SELLO,** solo.
5. **Y lo último, lo del viajero:**
   - **los puntos de experiencia y la subida de nivel o de rango, juntos en una pantalla** (sustituye al cartel «+EXP» y a la pantalla suelta de subida de nivel):
     - sale la barra de nivel y se llena con lo ganado («+120 EXP»);
     - si llega al siguiente nivel, en la misma pantalla la barra se completa y salta «¡Subes a nivel 3 · Explorador!»;
     - si no llega: «Te faltan 80 EXP para el nivel 3».
     - Un Visto que solo da EXP, sin nada más, sigue con el cartel pequeño de 4 segundos, como ahora;
   - **el marco de viajero nuevo,** si lo hay, en su pantalla;
   - **el reto completado,** si lo hay, en su pantalla.

- **Arriba, en todas, [Saltar todo]:** cierra la fila entera y lleva a la hoja de logros.
- **Cada pantalla, con su X o [Seguir],** como ahora.
- **El orden (Eric):** colecciones que avanzan → colecciones completas → emblemas ocultos → sello → lo del viajero (EXP, nivel, marco, reto).
- **La EXP:** ya no va como línea dentro de la primera pantalla; va al final, en lo del viajero.

## 3. La prueba
- `pruebaJutrip`, `pruebaV3`, `pruebaV5` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV6`,** con 5 fotos que dan:
  - pedazos en 3 colecciones, sin completar ninguna;
  - 1 colección completa;
  - 1 emblema.

  **Sale esto:** 1 pantalla con las 3 insignias, luego la colección completa, luego el emblema, luego el sello (si lo hay), luego la EXP y la subida de nivel en una pantalla y, al final, la hoja de logros. Con [Saltar todo] en la primera, directo a la hoja de logros.
- **También:** un Visto que da 2 pedazos de 2 colecciones distintas sale en 1 pantalla, no en 2.
- **En el REPASO:**
  - capturas de móvil de la pantalla con varias insignias, de la colección completa, del emblema y de la hoja de logros del final;
  - tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
