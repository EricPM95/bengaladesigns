Hola. TANDA 11B, pequeña: TRES ARREGLOS DE LA TANDA 11. **Toca el motor.** Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA11B.md e inclúyelo en tu commit.
- Nada de parches: reglas del motor o datos, que valgan para todas las rutas y para los destinos siguientes.

## 1. La Galería Borghese cerrada en 42 rutas (lo más importante)
- **Lo que pasa:** en los viajes de 3 a 6 días que empiezan en **sábado o domingo**, «Centro histórico y Villa Borghese» cae en **lunes** y la Galería sale «Cerrado este día» con «No hay otro día de tu viaje en que se pueda ir». **No es verdad.** Ejemplo, 4 días desde el sábado 14-nov-2026 (combinación A): hoy sale sábado Vaticano, domingo Roma antigua, **lunes Villa Borghese**, martes Basílicas. Lo correcto: **sábado Roma antigua, domingo Villa Borghese, lunes Vaticano, martes Basílicas**: no cierra nada, el Vaticano va en medio y Roma antigua el día 1. Cumple todas las reglas de la Parte A.
- **Primero, dime por qué pasa.** Claude cree que el motor cuenta la Galería como algo «que se ve por fuera» (porque el parque de Villa Borghese sigue abierto) y le da poco peso al cierre (punto 10). Si es eso, está mal: la Galería se visita por dentro y con reserva; su cierre pesa como un cierre entero. El «pesa poco» es solo para lo que de verdad se ve bien por fuera (una iglesia, el Castillo de Sant'Angelo).
- **Arréglalo como regla:** un museo, una galería o un sitio con entrada que se visita por dentro cuenta como cierre entero al elegir el orden de los días, aunque al lado haya un parque o una plaza abiertos. Mira si hay otros sitios en la misma situación y dímelo.
- Di cuántas rutas cambian (en las 126 y en las 210) y cuántas siguen con algo cerrado, y por qué.

## 2. El «Qué ha cambiado» de la página de las 126 rutas
- Hoy marca «avisos» en todas, porque cambió cómo se escriben los avisos. Así no sirve para que Eric revise solo lo cambiado.
- Rehazlo comparando con la página de **antes de la Tanda 11** (la del commit `b7b05999`), contando como cambio de avisos solo lo que cambia de verdad (un aviso que sale o se va), no el formato. En las dos páginas (126 y 210), y después de los arreglos de esta tanda.

## 3. Datos
- **Santa Maria in Aracoeli:** las fuentes no coinciden (italia.it: todos los días de 7:00 a 19:00; museionline.info: todos los días de 9:00 a 18:00; en turismoroma.it solo están las misas). Pon lo que cumplen las dos: **todos los días de 9:00 a 18:00**, con la nota «horario orientativo» en el dato.
- **«¿Te lo organizamos? Roma desde arriba» en el día en blanco: no lo hagas.** El día en blanco se queda con la hoja «Ya has visto lo mejor de Roma» y [Elegir mis sitios], como del 7.º en adelante. Roma desde arriba se queda en los datos, sin salir.
- Quita esa propuesta de NOTAS_REVISION_RUTAS.md (C8) y de REGLAS_PARA_DESTINOS.md si está, con una línea: «Roma desde arriba no se ofrece en el día en blanco (Eric, 22-oct)».

## 4. La prueba
- **Toca el motor:** la batería rápida, la muestra de 60 fechas, push, y después las 365 con `_correr6y5.mjs procesos=12`.
- Prueba nueva que falle con el motor de ahora y pase con el nuevo: en los viajes de 3 a 6 días que empiezan en sábado o en domingo, la Galería Borghese nunca cae en lunes si hay otro orden que cumpla las reglas.
- Las dos páginas, de nuevo, con su JSON.

## 5. El informe
Añádelo a docs/dias/INFORME_TANDA11_RUTAS.md, en un apartado «11B»: por qué pasaba lo de la Borghese, qué regla has cambiado, cuántas rutas cambian y si has encontrado otros sitios como este.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
