# Para Code · Tanda 6m: la tarjeta de cada entrada en RESERVAS

**Empieza cuando esté subida la 6l** (ya lo está: 56ebabf). No cambia cómo se montan los días.

**El diseño está en `docs\diseno\reservas\`:**
- `Entrada Tarjeta.dc.html`: el prototipo de Claude Design. Se abre en el navegador; se puede tocar «Reservar entrada», «Añádela» y «Cambiar».
- `Entrada_Tarjeta.png`: las cuatro tarjetas.
- `Entrada_Tarjeta_hora.png`: la hoja de la hora.

**Del diseño se copia lo visual,** es decir, cómo se ve. **Los datos y las reglas son los nuestros.** En el diseño todo es de ejemplo: los Museos, las 14:00, las horas de 8:00 a 18:00 de media en media hora.

## Cómo trabajar
- `PROGRESO_TANDA6M.md`, `PREGUNTAS_TANDA6M.md` e `INFORME_TANDA6M.md`.
- Commits locales por bloques.
- **Cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. La tarjeta de cada entrada (RESERVAS)
Para todas las entradas de RESERVAS: Coliseo, Museos, Galería, Panteón, Free Tour…

**Sin reservar** (como en el diseño, panel de color rosa):
- **Arriba:**
  - «ENTRADA · Día 1» sin fechas;
  - «ENTRADA · Mar 12 ene» con fechas.
- **El nombre entero,** sin «…». Si no cabe, en dos líneas.
- **El botón grande [Reservar entrada]:**
  - abre el enlace de compra de ese sitio en otra pestaña;
  - antes, un aviso corto abajo: «Abriendo la tienda de entradas…»;
  - en el Free Tour, el botón dice [Reservar Free Tour];
  - nunca el nombre del proveedor.
- **Al lado, en pequeño:** «¿Ya la tienes? **Añádela**», que abre la hoja de la hora (punto 2).
- **Fuera:** el «Añadir» gris de ahora y la línea «Mejor hora este día».

**Reservada** (panel y borde en verde, como en el diseño):
- **Arriba,** «ENTRADA · Día 1» o «ENTRADA · Mar 12 ene».
- **El nombre.**
- **Debajo:** «✓ Reservada · 14:00 · **Cambiar**».
- Ya no sale «Reservar entrada».

## 2. La hoja de la hora («Añádela» y «Cambiar»)
**Como en el diseño:**
- arriba, en pequeño, «¿A QUÉ HORA ES TU ENTRADA?»;
- el nombre del sitio;
- el día;
- **una sola rueda** de horas, con la elegida resaltada en blanco en el centro;
- el botón **[Guardar · 14:00]**, que cambia con la hora.

**Las horas de la rueda son las de verdad de cada sitio,** de la apertura a la última entrada de ese día:
- **la Galería,** cada hora, más la de las 17:45 (está en el documento);
- **el Free Tour,** sus cinco horas como botones (10:00, 12:00, 15:00, 17:00 y 21:00), como en la 6k;
- **los demás** (el Coliseo, los Museos…), de 15 en 15 min, para que quepa cualquier hora que ponga su entrada.

**Fuera de la hoja:** la fila «Mejor hora este día» de la 6k.

**Debajo de la rueda,** dos cosas pequeñas que el diseño no trae y hacen falta:
- **«¿Es para otro día? Cambiar el día»:** abre la lista de días de la 6k, con «· aquí está ahora». Si elige otro día, se aplica lo de la 6k: se cambian los dos días enteros.
- **«Rellenar desde el email o el PDF»:** abre lo que ya existe («Pegar email» y «Captura o PDF»), sin cambiarlo.

**Al guardar,** lo de siempre:
- la reserva queda fija a su hora y el día se ajusta (regla 4);
- si la hora no tiene día escrito, la hoja de la regla 17 (6k).

## 3. Eliminar una reserva (dentro de «Cambiar»)
- **Abajo del todo de la hoja de «Cambiar,** en rojo y en texto, sin botón grande: **«Eliminar reserva»**.
- **Al tocarlo,** se pregunta en la misma hoja: «¿Quitamos tu reserva de {sitio}? Tu entrada no se cancela: solo deja de estar en la app.» [Eliminar] · [Cancelar].
- **Al eliminar:**
  - la tarjeta vuelve a «sin reservar»;
  - **el día se queda donde está** (no se mueve nada), y la parada vuelve a su lista normal, sin hora fija;
  - si la reserva tenía un aviso en la campana, se va.
- **Solo dentro de «Cambiar».** En ningún otro sitio.

## 4. Fuera «Mejor hora este día» en toda la app
Quien añade su reserva ya tiene su hora en la entrada que ha comprado. Fuera en estos tres sitios:
- la hoja de la hora;
- la tarjeta de RESERVAS;
- la ficha de cada sitio.

**Se queda la hoja de la regla 17** (la que propone otras dos horas cuando la hora elegida no tiene día escrito): es otra cosa y sigue haciendo falta.

## 5. Una respuesta a la 6l
**La Trinità dei Monti del medio día de tarde** (que llega 25 min antes de abrir y viene de un sitio a 10 min): **no se cambia la regla 7.** Va por fuera. Se ve sobre todo por fuera, y ese medio día casi no sale.

## 6. Pruebas
**Las de siempre, a 0 fallos:** 6g, 6h, 6i, 6j, 6k, 6l y `pruebaListas`.

**A mano, a 375 px y en el ordenador, con y sin fechas:**
- las tarjetas sin reservar y reservadas, con un nombre largo;
- [Reservar entrada], que abre el enlace y saca el aviso;
- «Añádela» → la rueda con las horas del Coliseo, de los Museos y de la Galería ese día → [Guardar];
- «Cambiar» → otra hora;
- «Cambiar» → «Cambiar el día» → se cambian los dos días;
- «Cambiar» → «Eliminar reserva» → [Eliminar], y el día se queda como estaba;
- el Free Tour, con sus cinco botones;
- 0 «Mejor hora este día» en la app.

Al final, **reinicia el api-server.**
