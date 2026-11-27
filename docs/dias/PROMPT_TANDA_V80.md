Hola. TANDA V80: EL DÍA DE EXCURSIÓN EN HOY, PASO A PASO (POR TU CUENTA Y ORGANIZADA), Y LA EXCURSIÓN CANCELADA. Tanda corta, **con pruebas**. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v80.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `TODO_IGUAL` (en Descargas, la versión de hoy; descomprímelo en `docs/diseno/proyecto/`, encima, sin borrar), la página **«Día de excursión en HOY»** (EX1-EX8). Design es un prototipo:
- **las fotos y los textos de ejemplo no se copian:** en Pompeya y Florencia los consejos dicen «no hay fuentes en la isla» y «caminos de arena»; en EX8 (Lanzarote) salen sitios de Roma. Van los datos reales de cada excursión.
- **«Aquí ganas 2 pedazos»** en EX4 sale en una franja azul: va la pieza que ya usa la tarjeta de la parada.

**Hoy** un día de excursión en HOY es solo un título y una tarjeta «Excursión del día · La Graciosa» (`TodayExcursion` / `esDiaDeExcursion`). Y los datos del día ya tienen casi todo: `data/dias/lanzarote/listas.json`, día `DG`:
- `partes` (el coche a Órzola, el ferry de las 10:00 de Líneas Romero, la comida, la playa);
- `vuelta` (el último barco, por temporada);
- `en_la_isla` y `sin_coche`.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. Dos tipos de excursión
- **Organizada** (con una empresa: Civitatis u otra) o **por tu cuenta** (ferry, tren, bus o coche).
- **Cómo lo sabe la app:**
  - una reserva de excursión organizada en RESERVAS → organizada;
  - billetes de transporte unidos a la excursión (V76), o nada → por tu cuenta;
  - al leer la reserva que sube el viajero, si es de una empresa o lleva recogida → organizada.
- **Mientras no haya nada guardado,** manda lo habitual de esa excursión: un campo nuevo `modo_habitual` en sus datos (`organizada` | `por_tu_cuenta`). Pompeya, organizada; La Graciosa, Florencia y Nápoles, por tu cuenta; las demás, dímelo en DECISIONES con tu propuesta.

## 2. Por tu cuenta (EX1, EX2, EX3, EX5, EX6)
- **La tarjeta de la excursión** (como la de llegada, V62):
  - foto real, «EXCURSIÓN · VIE 27»;
  - las cajas SALIDA (hora y desde dónde), FERRY / TREN (hora y puerto o estación; «falta billete» si falta) y VUELTA («Último barco 17:00», de `vuelta` según la fecha).
- **Debajo, los consejos (V77), con la X:** cerrados, no vuelven ese día en ese viaje (`avisosUnaVez`).
- **Los pasos de logística,** cada uno su tarjeta, sacados de `partes` (los traslados) y de los billetes:
  - coche o transporte hasta la salida;
  - transporte de ida;
  - «Tu tiempo en…»;
  - transporte de vuelta;
  - «Vuelta a tu alojamiento».
- **El paso de ahora:** «PASO 1 · AHORA» (el número siempre), con sus botones: [Cómo llegar] / [Ya he llegado]; en un ferry o tren, [He embarcado] (y el billete con su QR, o «Aún no tienes el billete del ferry» con [Añadir tu reserva], V75-V76).
- **Los hechos,** apagados con su ✓.
- **«Tu tiempo en La Graciosa»: ideas, no órdenes,** sin [He terminado]:
  - las 3 mejores playas (o sitios) con su foto pequeña y [Cómo llegar]: busca las reales, con la fuente en DECISIONES;
  - **los restaurantes, solo una línea sin botón** («En Caleta de Sebo hay bares y restaurantes junto al puerto»);
  - la nota de `en_la_isla`;
  - los tres botones (qué ver, escuchar y cámara), **solo los que tengan contenido** (regla V69: nunca un botón que no hace nada; dime qué historias faltan).
- **Cuándo se da el transporte por hecho:**
  1. con el GPS (está en la isla o en el destino del tren);
  2. con [He embarcado];
  3. **sin las dos, pasada la hora más el trayecto,** se da por hecho y en su paso queda «¿No has cogido este barco? [Cambiar la hora]» (recalcula los pasos y el aviso).
  - **Nunca se supone el ÚLTIMO de vuelta:** si a esa hora el GPS sigue en la isla, sigue el aviso.
- **El aviso del último barco o tren** (EX3), en la fila roja de siempre (`FilaDeAviso`): «El último barco sale a las 17:00 · te quedan 45 min» [Cómo llegar al puerto]. Desde 1 h 30 antes.

## 3. Organizada (EX4)
- **La tarjeta,** con las cajas RECOGIDA, DURACIÓN y TRANSPORTE:
  - RECOGIDA: «En el hotel» o «Punto de encuentro: …», con la hora solo si la trae la reserva;
  - TRANSPORTE: «Incluido» / «No incluido».
  - **De dónde salen:** de la ficha de la actividad en Civitatis (el apartado «Incluido», el punto de encuentro; el `GET` de la actividad de la V70) o de la reserva leída. Si no se sabe, la caja no sale. Nada inventado.
- **La reserva con su QR** y los consejos con su X.
- **Como la tarjeta de la parada:**
  - «Aquí ganas X pedazos», solo si los hay, con la pieza de siempre;
  - qué ver, escuchar y cámara, solo con contenido;
  - **[He terminado] de punta a punta;**
  - **sin [Necesito más tiempo] ni «Saltar parada».**
- **Colección y Reto del día,** solo si hay pedazo, como siempre.

## 3b. Sin «¿Qué hago ahora?» en NINGÚN día de excursión (Eric)
**¿Qué hago ahora? no sale nunca en un día de excursión:** ni en EX1-EX6, ni en el «AL VOLVER» de EX4, ni en el día libre de la cancelada (EX7, EX8). La excursión tiene su plan.
- **Al volver** (organizada: tras [He terminado]; por tu cuenta: tras la vuelta al alojamiento), en «Al acabar el día» (V73), **en lugar de ¿Qué hago ahora?**, el bloque del §4 SIN su título:
  - arriba, una frase: «¿Te queda tiempo y quieres seguir visitando? Aquí tienes ideas cerca de ti.»;
  - tus Lugares pendientes, 3 o 4 ideas cerca y [Ver en Explorar].
- **Una sola pieza para los dos** (cancelada y al volver).

## 4. Excursión cancelada (EX7, EX8)
- **Un enlace pequeño al final de la tarjeta:** «¿Se ha cancelado la excursión?».
- **Al pulsarlo:**
  - la tarjeta pasa a gris, «EXCURSIÓN CANCELADA · Hoy no hay excursión: tienes el día libre»;
  - abajo, el aviso con [Deshacer] («Excursión cancelada»).
- **Debajo, «Tu día libre en Roma»** (o en Lanzarote):
  - **Lugares pendientes,** el bloque de siempre, con [Otro día] y [+ A hoy];
  - 3 o 4 ideas cerca (de EXPLORAR, reales, del destino), con [Ver en Explorar];
  - **sin ¿Qué hago ahora?** (el dibujo lo lleva: no se pone).
  - **Por tu cuenta,** arriba (justo debajo de «Excursión cancelada», antes de los pendientes), **[Hacer La Graciosa otro día]** (EX8). Organizada, no.
    - Al pulsarlo, la hoja de cambiar días de la V69 (E1, EX8b): **intercambia los días** (la excursión pasa a ese día y lo de ese día pasa a hoy), una tarjeta por día con su foto y `CuadradoFecha`, [Cambiar los días] y [Dejarlo como está], con [Deshacer] después.
    - **El nombre de cada día, su título de DÍAS** («Norte de Lanzarote»), nunca la lista de sus paradas.
    - **El texto, sin repetir el título y sin suponer el motivo:** título «Hacer La Graciosa otro día»; texto «Te proponemos hacer La Graciosa el domingo 29 y hoy lo que tenías ese día.». (En el dibujo pone dos veces «Hoy no hay barco»: no se copia.)
    - Sin ningún día con el que cambiarla (es el último día), el botón no sale.
- **No se borra nada:** la reserva sigue en RESERVAS.
- **«Cerca de ti»** (gasolineras, aparcar, baños, comer…: el bloque de siempre del destino) sale en el día libre de la cancelada y al volver de la excursión, como en un día normal. Durante la excursión, solo si hay datos de ese sitio; si no, no sale.

## 5. Pruebas
- **Escribe `pruebaV80`:**
  - La Graciosa por tu cuenta: los pasos salen de los datos; el ferry por GPS, por botón y por hora; el último barco no se supone; el aviso, 1 h 30 antes;
  - Pompeya organizada: cajas y botones, sin «Saltar»;
  - cancelar y [Deshacer];
  - Florencia en tren.
- **Pásalas:** `pruebaV80`, `pruebaV76`, `pruebaV68`, `pruebaV36` (si tocas algo que pregunte a Supabase) y `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO:** captura en modo iPhone al lado de EX1-EX8, con datos reales. Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
