Hola. TANDA V75: «+ AÑADIR UNA RESERVA» EN RESERVAS. CUALQUIER RESERVA (TREN, AUTOBÚS, FERRY, OTRA) Y LOS TRES ICONOS DE CADA TARJETA. Tanda corta, **con pruebas de lo que guarda y borra**. Empieza SOLO cuando la V74 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v75.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `TODO_IGUAL` (en Descargas, la versión de hoy; descomprímelo en `docs/diseno/proyecto/` encima, sin borrar), la página **«Añadir una reserva»** (R1a-R12, D1-D2). Design es un prototipo:
- **el botón para añadir es SOLO el ancho de R1a.** El + dorado junto al título que sale en las demás pantallas NO se pone;
- **las ruedas de hora** del dibujo tienen números raros («10:-15», «9:60»): se usa la rueda que ya existe (`HojaDeHora`, regla V55);
- **R12 solo enseña el orden de los iconos:** cada tarjeta mantiene su forma de hoy;
- **«Útil para el viaje»** (seguro, eSIM…) no se toca;
- **la tarjeta oscura de arriba de RESERVAS** («Estás en Lanzarote · Jueves 26 · día 1 de 4») no sale en el dibujo pero **se queda**, como está; el botón ancho va debajo de «X de N reservas listas»;
- las hojas de Vuelo, Alojamiento, Entrada, Excursión y Coche son las de siempre: R7b es solo para ver que se abre «Tu vuelo de vuelta», no un diseño nuevo;
- los datos (Fred. Olsen, 50 €…) son de ejemplo.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. El botón y la hoja (R1a, R2)
- **«+ Añadir una reserva»,** botón ancho de borde dorado (`BOTON_CLARO`), justo debajo de la tarjeta «X de N reservas listas».
- **La hoja «Añade una reserva»** (R2):
  - la frase;
  - la cuadrícula de 9: Vuelo, Tren, Autobús, Ferry, Coche de alquiler, Alojamiento, Entrada, Excursión o tour, Otra;
  - los iconos, los que ya usan los bloques de RESERVAS (`BloqueReservas.tsx`, `iconoDeMedio`).
- **Vuelo, Alojamiento, Entrada, Excursión y Coche abren SU hoja de siempre** y se guardan donde siempre. La hoja solo reparte; no hay una segunda forma de guardar un vuelo.

## 2. El vuelo en un viaje de un solo destino (R7a, R7b)
- **Solo un vuelo de ida y uno de vuelta.** Si ya está la ida y elige «Vuelo», se abre directamente «Tu vuelo de vuelta».
- **Si ya están los dos,** la hoja «Ya tienes tus vuelos. ¿Quieres cambiar alguno?» con [Cambiar la ida] (dorado) y [Cambiar la vuelta] (blanco), lado a lado.
- **Alojamientos, varios sí** (hay gente que cambia de hotel).
- **En un multidestino, nada de esto cambia.**

## 3. Tren, Autobús, Ferry y Otra (R3-R4, R3g, R3h)
- **Ferry:** naviera, de qué puerto a qué puerto.
- **Tren y autobús:** compañía, estación de salida y de llegada; **en el tren**, coche y asiento (opcionales).
- **En los tres:**
  - el día: todos los días del viaje, deslizando, con los botones de día de siempre;
  - la hora de salida y la de llegada (opcional), con la rueda;
  - localizador (opcional) y precio (opcional).
- **Otra:** nombre, día, hora, lugar (opcional), localizador (opcional) y precio (opcional).
- **En grupo,** el segundo paso «Casi lista» de siempre (`BloqueDinero`):
  - «¿A qué cuenta lo sumamos?»;
  - «¿Para quién es?»;
  - «¿Quién la ha pagado?».
  - El botón del primer paso dice [Siguiente].
  - El precio entra en el presupuesto y en los gastos como cualquier reserva (regla V46).
- **Primero se guarda, después se sube** (regla V45): la hoja no pide el billete; la tarjeta guardada lleva «+ Sube tu billete».
- **Cómo se guarda:** amplía la reserva que ya existe (`Reservation` en `src/lib/bookings.ts`) con los tipos nuevos, y guárdala donde se guardan las demás. El documento, donde van los demás (`billetes_personales`).
  - **Si necesitas una tabla nueva,** sigue la regla de CLAUDE.md: `empezar_de_cero`, su `COMPROBAR_<n>.sql`, `pruebaTanda10J` y el comentario de cada cuánto pregunta y cuánto baja. Con migración nueva, **para antes de aplicarla y dímelo**: las migraciones las aplica Eric.

## 4. Un bloque por tipo nuevo (R6)
- **Un tipo nuevo crea su bloque, igual que los demás:** el icono sobre el mismo fondo, el nombre («Ferry», «Tren», «Autobús», «Otras reservas») y «1 guardado» / «2 guardados».
- **Va al final de la lista,** antes de «Útil para el viaje». Sin ninguno guardado, el bloque no sale.
- **Dentro,** la tarjeta de billete de siempre (`TarjetaBillete.tsx`: NAVIERA/COMPAÑÍA, PUERTO/ESTACIÓN, horas, ruta) y «+ Sube tu billete».
- **No cuentan en «X de N reservas listas»:** ese contador es de lo que la app recomienda reservar.

## 5. Los tres iconos de TODAS las tarjetas y borrar (R12, D1, D2)
- **Arriba a la derecha de cada tarjeta guardada, de izquierda a derecha:** el QR (dorado si está, gris con «+» si falta), el lápiz y la papelera.
  - Vale para todas: vuelo (cada tramo), alojamiento, entradas, excursiones, coche, ferry, tren, autobús y otra.
  - **La papelera ya no va abajo.** Quita la fila de abajo donde iba: la tarjeta queda más corta.
  - **Actualiza la regla V53-4 de CLAUDE.md:** «papelera arriba a la derecha, después del QR y el lápiz».
- **Al tocar la papelera,** la hoja de abajo de D1-D2:
  - el texto según lo que sea: «¿Seguro que quieres eliminar tu vuelo de ida?», «tu alojamiento», «tu entrada del Coliseo», «tu excursión a La Graciosa», «tu ferry a La Graciosa», «tu tren a Florencia», «tu reserva de Tour en kayak»…;
  - debajo, «Se borrará de tus reservas y no se puede deshacer.»;
  - [Cancelar] y [Sí, eliminar], lado a lado.
  - **Usa la confirmación de borrar que ya exista** (regla 10N8); si no hay, como D1.
  - Borrar hace lo mismo que la papelera de hoy (también el gasto).

## 5b. Un PDF grande de varias páginas
Hoy un PDF de más de 4,5 MB se manda como imagen de la página 1: en «Subir todas a la vez» (V65) solo se lee la primera. **Que se lean todas las páginas:** cada página por separado, reducida si hace falta. Sigue contando como UNA lectura (V70).

## 6. Pruebas (esta vez sí, de lo que se guarda)
- Escribe **`pruebaV75`**, en Roma y en Lanzarote:
  - guardar un ferry, un tren y otra, cada uno en su bloque y en su día;
  - borrarlos con la hoja;
  - el vuelo: con la ida puesta, «Vuelo» abre la vuelta; con las dos, sale la hoja de cambiar;
  - el contador no cambia con las extras;
  - en grupo, el gasto se reparte.
- **Pásalas:** `pruebaV75`, las de reservas que ya existan, `pruebaV36` (si tocas algo que pregunte a Supabase) y `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO:** captura en modo iPhone al lado de su dibujo de R1a, R2, R3, R3h, R6, R7a, R12 y D1, más un caso en Lanzarote. Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
