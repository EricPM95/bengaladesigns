Hola. Sí, vale subir la Cúpula, el Trastevere, el Castillo y la Galería: se quedan en su puesto. TANDA 10O2: lo que queda de la 10O, después de revisar tu informe y tus capturas. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10O2.md e inclúyelo en tu commit.
- La foto de la Terraza del Altar de la Patria es de Eric: se queda como está (apúntalo como su autor).
- El orden de la lista y la foto de la Cúpula, como los has dejado.

## 1. La hoja para añadir un sitio
- **Fuera la casilla «Minutos · ¿Cuánto tiempo quieres visitarlo?»** (con el 120). Es un número a mano que no pide nadie: el tiempo de cada sitio ya está en roma.json (`duration_minutes`), y la app lo usa por dentro. Dime si algo dependía de ella.

## 2. La API: no enseñar datos de más de 4 horas
- Si la API falla y lo guardado tiene más de 4 horas, **no lo enseñes**: la app hace lo de hoy, con nuestros datos de roma.json. Lo que pidió el proveedor es no guardar más de 4 horas, y enseñar algo caducado es guardarlo.

## 3. La prueba
- La batería rápida y `pruebaJutrip`. Si `pruebaJutrip` o `pruebaRevisionLargos` fallan solo al correr con las demás y solas pasan, dilo y sigue: se arreglan más adelante.
- Añade a `pruebaTanda10O`: la hoja de añadir sin la casilla de minutos; con la API caída y lo guardado de más de 4 h, salen nuestros datos.
- La captura nueva de la hoja, en `docs/dias/REPASO_10O.html`.

## 4. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10O2».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
