Hola. TANDA 10S11: LOS FALLOS QUE VENÍAN DE ANTES (NOCHE DEL DÍA 5 Y PANTALLAS 6Y5), LA CÚPULA Y EL DÍA DE VUELTA SIN PASE (2-nov). Va después de la 10S10 (ya hecha). Si tocas el motor, la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S11.md e inclúyelo en tu commit. Acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.
- Las reglas de siempre (`docs/REGLAS_DE_LA_APP.md`, `CLAUDE.md`); las nuevas, añádelas ahí.
- **Rápida:** 4 agentes, un servidor, hasta 2 Chrome. Solo las pruebas de lo tocado y `pruebaJutrip`. Dime al empezar cuánto calculas. Nota de estado (`_estado_10s11.md`) a la rama `estado` cada 30 minutos. No apagues el PC.

## 1. `noche_d5` (pruebaTanda6g)
- En unos 487 de 4.526 viajes de 5 días o más, la noche del día 5 no lleva «Panteón y Piazza Navona», que es lo que pide la prueba. Pasa también con el código de antes de la 10R, así que viene de atrás.
- **Averigua por qué** y dímelo en sencillo, con 2 o 3 viajes de ejemplo (fechas, días, qué lleva esa noche). Dos casos:
  - **si el motor está mal**, arréglalo (muestra de 60 fechas: lo que cambie, solo esa noche, y explícame cada cambio);
  - **si la prueba pide algo que ya no es la regla** (por ejemplo, por una decisión de Eric posterior), no la cambies todavía: dime qué decisión es y espera.

## 2. Los 4 fallos de `pruebaFase6y5_pantallas`
- Uno por uno: qué comprueba, por qué falla y si el fallo es de la app o de la prueba. Si es de la app, arréglalo. Si la prueba se quedó vieja por una decisión de Eric, ponla al día con «antes → ahora → decisión de Eric (fecha)». Si dudas, pregúntame.

## 3. La tabla de horarios (10S10)
- **La Cúpula de San Pedro pasa a «solo por dentro»** (Eric, 1-nov). El resto, como está.

## 4. El día de vuelta (Eric, 1-nov, con captura)
- Hoy, sin pase y con la vuelta a las 18:05, el día de vuelta sale casi vacío: el billete, la franja oscura «Tu día de vuelta · Con el Pase Roma…» y «Fin del viaje. Arrivederci, Roma.». Parece que le escondemos el día. **Fuera la franja oscura** (como en el día de llegada, 10S10) y, en su lugar, una tarjeta:
  - **con la hora del vuelo:**
    > **Hoy vuelves a casa**
    > Tu vuelo sale de Ciampino a las 18:05. Te recomendamos estar en el aeropuerto 2 horas antes: hasta las 15:00, más o menos, el día es tuyo.
    > ¿Quieres aprovecharlo? Añade lo que te quedó por ver.
    > [+ Añadir lugares] [Explorar]
    > (línea del pase, con su candado) Con el Pase Roma, te preparamos este día con lo que te queda por ver, a tiempo para tu vuelo.

    «Hasta las 15:00» = la hora de salida − 2 h − el trayecto hasta el aeropuerto (desde su zona; sin zona, desde el centro), redondeado hacia abajo al cuarto de hora. Si no queda tiempo, solo «Hoy vuelves a casa» y que es día de irse con calma, sin [+ Añadir lugares];
  - **sin la hora del vuelo:**
    > **Hoy vuelves a casa**
    > Aún no sabemos a qué hora sale tu vuelo. Añádelo y te diremos hasta qué hora tienes el día libre.
    > [Añadir tu vuelo] (→ RESERVAS › Llegada y vuelta)
    > Mientras tanto, añade lo que te quedó por ver.
    > [+ Añadir lugares] [Explorar]
    > (línea del pase, con su candado) Con el Pase Roma, al poner tu vuelo te preparamos este día con lo que te queda por ver.

    Sustituye a «Añade tu vuelo de vuelta y ajustamos tu día» (sin pase prometía algo que no hace).
- **Con pase:** la línea sin candado («Pon tu vuelo y te preparamos este día…» sin vuelo; con vuelo, si el día sigue vacío porque dijo «Ahora no», el botón «Reorganizar» de siempre).
- **Tren, autobús o barco:** «tu tren», «tu autobús», «tu barco», con su estación o puerto. **En coche:** sin la parte del vuelo.
- [+ Añadir lugares] añade al día de vuelta, con lo de siempre (primera del día). [Explorar] abre EXPLORAR.
- Igual en HOY ese día, si aplica.

## 5. La prueba
- `pruebaTanda10S11`: el día de vuelta sin pase con vuelo a las 18:05 (sin franja oscura, «hasta las 15:00» o lo que dé el cálculo, los dos botones, la línea del pase), sin vuelo («Aún no sabemos…» y [Añadir tu vuelo] a RESERVAS), con vuelo muy pronto (sin [+ Añadir lugares]), en tren; la Cúpula en «solo por dentro»; `pruebaTanda6g` y `pruebaFase6y5_pantallas` en 0 fallos (o lo que quede pendiente de Eric, explicado). Más `pruebaJutrip`.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10S11.html`.

## 6. El informe
En «10S11» de `INFORME_TANDA10B.md`, en palabras sencillas, con la lista de comprobación DE ESTA TANDA al final y arriba de `REPASO_10S11.html`.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
