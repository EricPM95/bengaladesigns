# PROMPT — Ajustes tras revisar las 20 rutas

> **Qué he visto en `docs/REVISION_20_RUTAS.md`:** las rutas están bien hechas: buen orden, sin horas muertas, cierres bien resueltos. Lo que falla es **lo que lee el viajero** y unos pocos detalles de horas.
> **Archivo:** `docs/roma_por_que.json` (los textos "Por qué aquí" de cada parada).
> **Cómo:** en orden, commit por parte y **sin push**. **No reimportes los días curados:** solo añade lo de aquí encima de lo que ya tienes.
> **Reglas de siempre:** todo general, reglas nuevas en INVARIANTES, textos de tú a tú y ningún precio (tampoco "gratis").

---

## Parte A — Lo que lee el viajero

1. **"Por qué aquí" genérico.** En unas 270 filas sale "Uno de los imprescindibles de Roma.", "Te pilla de camino a la cena: merece la parada." o "Pasas por aquí de camino: no hace falta pararse.". Además está mal usado: Santa Maria in Trastevere a las 16:15 no está "de camino a la cena".
   - Añade a cada parada de los días curados y de sus variantes un campo `por_que`, con los textos de `docs/roma_por_que.json`. Cómo se aplica viene explicado en el propio archivo.
   - La app enseña `por_que`. Si una parada no lo tiene, el texto genérico solo sirve de reserva, y `validar.mjs` avisa de que falta.
2. **Las notas internas se ven.** En la columna salen cosas que son instrucciones para nosotros:
   - "Antes de las 18:00; si ya cerró, de paso."
   - "Callejear: aquí va todo el tiempo que sobre antes del atardecer (…), nunca arriba en el monte."
   - "Primer turno."
   - "Se sale por el lado del Campidoglio."

   La `nota` es **interna** y no se enseña nunca. Al viajero le llega `por_que`, más los avisos (cerrado, madrugón, turno).
3. **"Gratis" (cambia la regla, decisión del usuario):** al viajero le gusta saber que algo es de entrada libre, así que **se puede decir cuando suma**, dentro de una frase con valor ("…y la entrada es gratis: una joya que mucha gente se salta"). Ya va así en `roma_por_que.json` para las iglesias y basílicas que en `ticket_info` son gratis. Lo que sigue prohibido: **cifras y precios** fuera de la pestaña Tickets. Y "gratis" suelto en notas internas no sale nunca (las notas no se enseñan). Apúntalo en INVARIANTES en lugar de la regla antigua "ni gratis".
4. **Janículo → cena:** "15 min cuesta abajo" no cuadra con los 21 min que dice la ruta. El texto nuevo ya dice "unos 20 min".

---

## Parte B — Horas y tramos

1. **"Por el camino" que dura 20 min** (20 casos: Largo Argentina, Fuente de las Tortugas, Plaza Colonna). El sobrante del redondeo a cuartos de hora se está metiendo ahí. Un "Por el camino" dura **10 min como mucho**. El sobrante pasa a la siguiente parada de verdad, o a esperar su hora. Lo que merece más de 10 min (la Fontana de Trevi, un monumento) nunca va "por el camino": es una parada.
2. **Del Free Tour a la comida salen 25 min andando** (Supplizio). El tramo se mide desde el punto de salida del tour (Plaza de España) y tiene que medirse desde donde **acaba** (Piazza Navona).
   - Añade `ends_at` a `default_free_tour`, con su nombre y sus coordenadas, en todos los destinos. Lo curamos nosotros: las APIs de actividades suelen dar el punto de encuentro como dato, pero el final solo viene en el texto de la descripción. Si algún día la API lo trae como dato, se usa ese.
   - Dentro del acordeón del Free Tour, una línea para el viajero: "El tour acaba en Piazza Navona: te hemos buscado la comida por esa zona para que aproveches el día." (decisión del usuario).
3. **Miércoles en el día del sur de Roma (rutas 11 y 12):** las catacumbas cierran, y de la comida a la Via Appia salen 64 min andando. El bus pertenece **al tramo**, no a la parada: si una parada con `traslado` se salta, la siguiente hereda su transporte ("🚌 Bus 118, unos 25 min" hasta la Via Appia).
4. **El Circo Máximo, estirado a 105 min** (rutas 11 y 12, verano). Es un prado: no aguanta tanto.
   - Añade a las paradas un tope de estirado: `estirar_max` en minutos.
   - Circo Máximo: 30 como mucho (decisión del usuario: es un prado). Via Appia Antica: 150, porque en bici da para mucho.
   - Si sobra más, lo absorbe la otra parada estirable del día, o sale como "Tiempo libre" con nombre antes del atardecer.

---

## Parte C — 2 de junio y las fechas "por verificar" (decisión del usuario)

1. **Regla nueva para `fechas_especiales` con `verificar: true`:** el aviso **sí sale**, con prudencia: "es posible que…", "suele…" y "compruébalo en su web oficial". Antes decíamos que no salían; el usuario prefiere avisar aunque no sepamos lo exacto, porque ya es un valor que no da ninguna otra app. La frase final sigue siendo "Hemos…". Cambia esto también en lo que hayas hecho de `PROMPT_AVISO_FECHAS.md`, y vuelve a copiar `docs/roma_fechas_especiales.json`, que ya lleva el cambio.
2. **2 de junio:** `horario_especial.confirmado: "probable"`. Con "probable", el motor **evita poner el Coliseo y el Foro por la mañana** si puede mover el día (D1 a otra fecha del viaje). Si no puede, los deja por la tarde. El aviso dice: *"Fiesta de la República: por la mañana hay desfile en Via dei Fori Imperiali y es posible que el Coliseo y el Foro no abran hasta la tarde (compruébalo en su web oficial). Hemos puesto su visita otro día para ir sobre seguro."*
3. Vale para cualquier destino: "probable" significa "evítalo si puedes y avisa con prudencia".

---

## Parte D — Comprobación

1. Vuelve a generar `docs/REVISION_20_RUTAS.md`.
2. Al final, un recuento:
   - filas con "Por qué aquí" genérico (tiene que ser 0);
   - notas internas que se ven (0);
   - "gratis" fuera de Tickets (0);
   - "Por el camino" de más de 10 min (0);
   - tramos de más de 25 min andando sin transporte (0).
3. Barrido otra vez: tiene que seguir con 765 de 768 limpios.
4. Commit y **sin push**.
