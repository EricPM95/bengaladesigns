Hola. Tarea de revisión (sin cambiar la app): LAS RUTAS DE ROMA TAL CUAL SALEN EN LA APP, EN UNA PÁGINA PARA REVISARLAS. Como la VIAJES_REVISION.html de la Tanda 7, pero nueva y más clara. No toques el motor de rutas ni ningún dato: solo sacar y enseñar.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_REVISION_RUTAS.md e inclúyelo en tu commit.
- Mira cómo hiciste docs/dias/VIAJES_REVISION.html (scripts/destino/viajes20Lib.mjs y sus generadores) y úsalo como punto de partida.

## 1. Qué rutas
- **Días:** 2, 3 y 4.
- **Experiencias:** las 6 combinaciones que deja elegir la app. Imprescindibles va siempre y se eligen otras dos:
  - A: Arte y Museos + Barrios y Sabores (la base);
  - B: Naturaleza y Vistas + Barrios y Sabores;
  - C: Arte y Museos + Naturaleza y Vistas;
  - D: Free Tour + Arte y Museos;
  - E: Free Tour + Barrios y Sabores;
  - F: Free Tour + Naturaleza y Vistas.
- **Día de inicio:** de lunes a domingo, en la semana del 9 al 15 de noviembre de 2026.
- **Sin vuelos, sin alojamiento y sin monumentos elegidos a mano.** Con 4 días, el día 4 en Roma.
- Son 126 rutas.

## 2. Tal cual la app
- Sácalas con la misma petición que hace la app al crear el viaje (lo que manda el formulario al servidor) y por el mismo camino del servidor. No con una función suelta del motor: lo que ve el viajero, con las capas de fechas, los nombres que enseña, los avisos y todo lo que añade el servidor.
- Si la app hace más de una petición (por ejemplo, un día a la vez), hazlas igual.
- Con el servidor de este PC, con el código de ahora.

## 3. Qué tiene que decir cada parada
- **El nombre exactamente como sale en la app**, en DÍAS. Si el día escrito le da otro título (por ejemplo «Reloj de agua del Pincio» frente a «Parque de Villa Borghese»), enséñalo al lado, marcado, para que Eric vea dónde no coinciden.
- **Cuánto tiempo:** los minutos de la visita.
- **Por qué va ahí:** en palabras sencillas, la razón de que esté en ese día y en ese sitio del día. Por ejemplo: «a primera hora para que no haya cola», «cierra los domingos», «está al lado de la anterior», «la pide la experiencia Arte y Museos», «la añade el Free Tour», «lo pide el día escrito». Sácalo de lo que ya sabe el motor (el orden del día escrito, sus motivos, los cierres, las experiencias), sin inventar. Si no hay una razón guardada, que diga «lo pide el día escrito».
- **El trayecto hasta la siguiente**, como en la app: «8 min andando», «Bus 23», «Taxi».
- Las comidas y las cenas, con su restaurante.
- Los avisos que salen en la app en esa parada (cerrado ese día, reserva, pago de la Fontana de Trevi…).
- **Sin horas:** las paradas ya no llevan hora en la app. Solo el orden.

Y de cada día: su nombre, el plan «Si llueve» y lo que el día deja fuera («No te dio tiempo»), si lo hay.

## 4. La página
- Una página HTML que se abre sola en el navegador, en docs/dias/RUTAS_REVISION.html, bonita y fácil de leer en el móvil y en el ordenador.
- Arriba, tres selectores: los días, la combinación y el día de inicio. Debajo, los días de esa ruta, uno junto a otro, cada uno con sus paradas en orden.
- **Lo que cambia, a la vista:** en verde lo que entra respecto a la base (A, mismos días y mismo inicio), y al final la lista de lo que sale.
- **Marcas para revisar**, con un color propio cada una:
  - el nombre de la app distinto del título del día escrito;
  - una parada repetida en el mismo viaje;
  - una parada cerrada ese día;
  - un trayecto andando de más de 20 minutos;
  - un día que acaba muy tarde.
- Un resumen arriba con cuántas de cada marca hay en las 126 rutas, y un botón para saltar a la siguiente.
- Además, los datos en docs/dias/RUTAS_REVISION.json (una fila por parada, con todo lo de arriba), para que Claude pueda montar el panel.

## 5. La prueba
- No toca el motor ni los datos: la batería rápida.
- Comprueba que lo que sale en la página es lo mismo que enseña la app para 3 de las rutas. Mira en la app de este PC, por ejemplo, 3 días A empezando el lunes, 2 días D empezando el sábado y 4 días F empezando el domingo, y dime si coincide todo.

## 6. El informe (docs/dias/INFORME_REVISION_RUTAS.md)
En español sencillo:
- cómo lo has sacado;
- cuántas marcas de cada tipo hay;
- los 10 casos más raros que veas;
- si algo no coincide con la app, y por qué.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
