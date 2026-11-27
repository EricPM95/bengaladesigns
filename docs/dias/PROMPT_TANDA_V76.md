Hola. TANDA V76: UNIR UNA RESERVA A LO QUE YA EXISTE (EXCURSIÓN, LLEGADA, VUELTA), LAS ESCALAS DEL VUELO Y CÓMO SALE TODO EN HOY. Tanda corta, **con pruebas**. Empieza SOLO cuando la V75 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v76.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/`, «Añadir una reserva»: R5, R8, R8b, R9, R10, R11, R11a, R11b, R11c. Design es un prototipo:
- **R11a y R11b redibujan a su manera** la tarjeta de llegada y la de vuelta. **NO se copian:** se quedan la de llegada (V62, `TarjetaDeLlegada.tsx`) y la de vuelta (V70) tal cual, y **solo se añade la fila del tren** con su QR;
- el + dorado junto a «Reservas» no se pone (solo el botón ancho de la V75).

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. Unir a una excursión (R5, R9)
- **Si un ferry, tren o autobús cae el día de una excursión de la ruta** (`excursionesDeLaRuta`), antes de guardar sale «¿Es para tu excursión a La Graciosa?», con el billete debajo y [Sí, unirlo a la excursión] (dorado) y [No, guardarlo aparte] (blanco), lado a lado.
- **Si se une:**
  - cuenta como la reserva de esa excursión: «Isla La Graciosa» pasa a hecha en «X de N reservas listas»;
  - se ve dentro de su ficha en «Excursiones y actividades», no en un bloque aparte;
  - ida y vuelta pueden ser dos billetes.
- **HOY, la tarjeta de la excursión (R9):**
  - **yendo por su cuenta,** «SALIDA · Órzola»; «RECOGIDA» solo en una excursión organizada;
  - debajo, una fila por billete: «Ferry de las 10:00 desde Órzola» y «Ferry de vuelta · 17:30 · Falta tu billete», cada uno con su QR dorado, o gris con «+» si falta (al tocar el gris, RESERVAS a subirlo; regla V62);
  - [Cómo llegar].
- **La tarjeta «Al acabar el día»** (Mañana, V73) dice entonces «Sales a las 10:00 · Ferry desde Órzola».

## 2. Unir a la llegada o a la vuelta (R11, R11a-c)
- **Un tren o autobús el día de llegada o el de vuelta** pregunta antes de guardar:
  - en la llegada, «¿Es para ir del aeropuerto a tu alojamiento?» con [Sí, unirlo a mi llegada] y [No, guardarlo aparte], lado a lado;
  - en la vuelta, «¿Es para ir al aeropuerto?».
- **En RESERVAS (R11c),** dentro de «Llegada y vuelta», debajo de su vuelo: la tarjeta de billete con la etiqueta «TREN AL CENTRO» / «TREN AL AEROPUERTO» y sus tres iconos.
- **HOY, la llegada (V62):** se añade solo la fila «Leonardo Express · 14:35 · Fiumicino → Termini» con su QR.
- **HOY, la vuelta (V70):**
  - la caja AEROPUERTO dice «Leonardo Express · 17:05»;
  - debajo, la fila con su QR;
  - **la hora de SALIR sale de la hora de ese tren** (`datosDeLaSalida`: el tiempo del alojamiento a la estación, no al aeropuerto).
- **Regla V62 (HOY = RESERVAS):** los datos se leen de la reserva, nunca se copian.

## 3. Una reserva extra en su día (R10)
- **Un ferry, tren, autobús u «Otra» no unido** sale en HOY y en DÍAS en su día, en su sitio por la hora: tarjeta con SALE / LLEGA y la fila con su QR.
- **Si choca con paradas de ese día,** el aviso de arriba de siempre (`FilaDeAviso`): «Revisa las horas · Ferry a Fuerteventura · choca con una parada» [Ver]. Al guardar, la hoja A1 «Revisa las horas» de la V69.
- **La app NO reorganiza el día sola** (decisión de Eric: para más adelante).

## 4. Las escalas (R8, R8b)
- **En la hoja «Tu vuelo»,** «+ Añadir escala» añade un tramo: compañía, número, hora de salida y de llegada (con la rueda), de dónde a dónde.
- **En RESERVAS,** cada tramo es su tarjeta («IDA · 1 DE 2», «IDA · 2 DE 2») con **su propia tarjeta de embarque y su QR**, y sus tres iconos.
- **El motor y HOY usan la llegada del ÚLTIMO tramo** (la de la ida) y la salida del PRIMERO (la de la vuelta).
  - La tarjeta de llegada de HOY enseña el último tramo.
  - El QR de HOY es el del tramo que toca a esa hora.
- **Un viaje ya creado sin escalas** no cambia nada.

## 5. Pruebas
- Escribe **`pruebaV76`**:
  - el ferry unido a La Graciosa (cuenta como hecha; HOY enseña las dos filas; Mañana dice «Sales a las 10:00»);
  - el Leonardo Express unido a la vuelta (SALIR sale del tren);
  - un ferry no unido que choca (sale el aviso, el día no se mueve);
  - un vuelo con escala (la ruta empieza tras el último tramo).
- **Pásalas:** `pruebaV76`, `pruebaV75`, las de llegada y vuelta que existan, la de la V68 y `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO:** capturas en modo iPhone al lado de R5, R8b, R9, R10, R11a, R11b y R11c, en Roma y en Lanzarote. Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
