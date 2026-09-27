# PROMPT — Aviso de fechas especiales al entrar en la ruta

> **Qué es:** cuando el viajero genera su ruta y entra en ella por primera vez, si su viaje cae en un festivo, en un día de cierre o en una fecha con algo especial, le sale una **ventana con el diseño de la app** que se lo cuenta y le dice qué hemos hecho por él. Por ejemplo: "Los Museos Vaticanos cierran los domingos: hemos puesto tu visita el lunes para que no te los pierdas", o "1 de noviembre, Todos los Santos: …".
> **Por qué:** el motor ya hace este trabajo (mueve días, enseña por fuera, cambia comidas), pero el viajero no se entera. Contárselo le da valor a la app: se nota que alguien ha pensado en su viaje.
> **Archivo:** `docs/roma_fechas_especiales.json` (fechas curadas de Roma, con fuentes).
> **Cómo:** en orden, commit por parte, **sin push**. Esto va **antes** de generar las 20 rutas de revisión, para que salgan con sus avisos.
> **Reglas de siempre:** todo general (sirve para cualquier destino), reglas nuevas en INVARIANTES, textos de tú a tú y **ningún precio** (tampoco "gratis").

---

## Parte A — Qué avisos salen

Hay dos tipos, y los dos salen en la misma ventana.

### 1. Automáticos: los que salen del propio motor
El motor ya sabe lo que ha cambiado por un cierre. Solo hay que guardarlo y contarlo. Guarda en la salida del viaje una lista `date_notices` con, por cada caso:
- **Día movido:** un día curado no podía ir en su fecha (`no_en` o cierre de una joya) y el motor lo cambió de orden.
  > "Los Museos Vaticanos cierran los domingos. Hemos puesto tu visita el **lunes 12** para que no te los pierdas."
- **Por fuera:** un imprescindible está cerrado ese día y se enseña desde fuera.
  > "El 25 de diciembre el Coliseo cierra por Navidad. Te lo enseñamos por fuera y hemos ajustado el día para que no pierdas tiempo."
- **Cerrado todo el viaje:** no hay forma de verlo por dentro.
  > "Los Museos Vaticanos cierran el 14 y el 15 de agosto (Ferragosto), que son los días de tu viaje. Los tienes en 'No te dio tiempo' por si cambias de fechas."
- **Horario cambiado:** un día con horario especial (ver 2), por ejemplo el Coliseo, que el 2 de junio abre más tarde.
  > "El 2 de junio el Coliseo abre más tarde por el desfile: hemos pasado tu visita a la tarde."
- **Audiencia de los miércoles** (si el viaje lleva D2 en miércoles):
  > "Los miércoles por la mañana el Papa da audiencia en la Plaza de San Pedro: hemos puesto la Basílica después de comer, cuando ya ha abierto."

- **Fines de semana (solo imprescindibles y joyas):** si el viaje tiene sábado o domingo y eso ha cambiado algo de un imprescindible, se avisa. Ejemplos:
  > "Los domingos los Museos Vaticanos cierran. Hemos puesto tu visita el **lunes 12** para que no te los pierdas."
  > "El sábado el Panteón deja de vender entradas a las 16:00 por la misa: lo tienes nada más comer."
  > "El domingo por la mañana el Panteón tiene misa: hemos puesto tu visita por la tarde."
  > "El último domingo de mes los Museos Vaticanos abren solo por la mañana y hay muchísima gente: hemos puesto tu visita otro día."
  Solo si el motor **ha hecho algo** por ese día de la semana. Nunca un aviso genérico de "el fin de semana hay más gente".

**No hace falta avisar** de cosas pequeñas que no cambian la ruta (una iglesia de nivel 3 que sale de paso). Solo joyas, imprescindibles, lo del pool y los días movidos.

### 2. Curados: las fechas especiales del destino
Añade a `roma.json` el bloque `fechas_especiales` con el contenido de `docs/roma_fechas_especiales.json`. El formato va explicado en el propio archivo.
- `fecha` en MM-DD, o `easter`, `easter+1`, `easter-2` (la misma lógica que `closed_dates`). `hasta` para rangos.
- **Solo sale si `verificar` es false o no existe.** Las marcadas `verificar: true` no se enseñan hasta que el usuario las confirme con su fuente de ese año.
- `sugerencia`: una parada con hora (la Girandola, el rayo de sol del Panteón). Solo se cuenta en el texto de la tarjeta ("si puedes, pásate hacia las 12:00"); no hay botón y no se mete sola en la ruta.
- `horario_especial`: horarios distintos ese día (el Coliseo el 2 de junio). El motor los usa **solo si `confirmado: true`**. Van por delante de `by_period` y por detrás de `closed_dates`.
- Si el mismo día hay un aviso automático y uno curado (el 29 de junio: Vaticano cerrado y Girandola), se juntan en una sola tarjeta: primero lo que hemos hecho, luego lo que hay que ver.

### Cuándo salen
- **Con fechas exactas:** todos los que caigan en los días del viaje.
- **Solo con mes:** no sabemos qué día de la semana es, así que solo salen los de temporada (el mercadillo navideño en diciembre) y las fechas fijas del mes con la frase "Si tu viaje coincide con el 29 de junio: …". Nunca los de día de la semana.

---

## Parte B — Cómo se ve (con el diseño de la app)

Usa los colores, tipografías, radios y sombras del diseño que ya tiene la app (el de Claude Design, "Trazo"). Nada de estilos nuevos sueltos.

1. **Cuándo:** la **primera vez** que el viajero abre su ruta, si hay al menos un aviso. Una sola vez por ruta (guárdalo con la ruta; si regenera la ruta y cambian los avisos, vuelve a salir).
2. **La ventana:**
   - Fondo con desenfoque suave sobre la ruta y una tarjeta centrada (en móvil, hoja que sube desde abajo).
   - Arriba, **un icono grande e ilustrado** según el tipo (`icono` del JSON: fiesta, religioso, fuegos, luz, navidad, bandera, música, calma, y uno de "cierre resuelto" para los automáticos). Iconos propios del diseño, no emojis.
   - **Título** corto ("1 de noviembre · Todos los Santos") y el **texto** de 2-3 líneas.
   - **Un solo botón: "¡Entendido!"** (decisión del usuario). Nada de "Ver en mi ruta" ni "Añadir a mi ruta".
   - Si hay más de un aviso: tarjetas deslizables con puntitos, como mucho 3. Si hay más, la tercera dice "y 2 más" y los lista.
   - Encabezado de la ventana: "Hemos preparado tu viaje para estas fechas".
   - Animación de entrada suave; respeta "reducir movimiento".
3. **Después:** en la cabecera del día afectado queda una **etiqueta pequeña** con el icono y el nombre (por ejemplo "Todos los Santos", con el icono del diseño). Al tocarla, vuelve a salir su tarjeta.
4. **Textos:** de tú a tú, 35 palabras como mucho. Nunca asustan ni dan precios.
5. **Regla de oro (decisión del usuario):** todo aviso **acaba con lo que hemos hecho nosotros**, en primera persona del plural: "Hemos puesto…", "Hemos movido…", "Hemos preparado…", "Hemos ajustado…". Así el viajero sabe que la ruta la hemos optimizado nosotros para sus fechas. Primero el dato ("Los domingos los Museos Vaticanos cierran.") y al final la frase con "Hemos…" ("Hemos puesto tu visita el lunes 12 para que no te los pierdas."). Vale también para los avisos curados de `fechas_especiales`: si alguno no acaba así, reescríbelo con esta forma y apúntalo para que el usuario lo revise.

---

## Parte C — Kit de nuevo destino
- Plantilla de `fechas_especiales` en el kit, con `verificar: true` por defecto.
- `validar.mjs`: avisa de fechas con `verificar: true` (lista para revisar) y de `horario_especial` sin fuente.

---

## Parte D — Comprobación
1. Pasa estos viajes y copia en un .md los avisos que salen en cada uno, con su texto:
   - 2 días desde el domingo 26 de septiembre de 2027 (Vaticano en domingo → movido)
   - 3 días desde el viernes 24 de diciembre de 2027 (Navidad)
   - 2 días desde el viernes 13 de agosto de 2027 (Ferragosto, cerrado todo el viaje)
   - 3 días desde el martes 1 de junio de 2027 (2 de junio y audiencia del miércoles)
   - 3 días desde el viernes 26 de marzo de 2027 (Pascua y Pasquetta)
   - 2 días sin fechas, mes de diciembre (solo los de temporada)
2. Una captura de la ventana en móvil y en ordenador.
3. Commit y **sin push**.

**Después de esto**, genera las 20 rutas de revisión (el mensaje que ya tienes), añadiendo en la cabecera de cada ruta los avisos de fecha que salen.
