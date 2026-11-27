Hola. TANDA V81: RETOQUES QUE HA VISTO ERIC EN EL IPHONE (RESERVAS, DÍAS Y AJUSTES). Tanda corta, MODO RÁPIDO (salvo el §2: orden en el día, pasa las pruebas del motor). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v81.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. RESERVAS: las fichas del contador «X de N reservas listas»
En **columnas iguales: 3 si caben en una línea; si no, 2** (una rejilla que se adapta al ancho). Nombres enteros, sin cortarlos ni partirlos en dos líneas. Hoy cada ficha mide distinto.

## 2. DÍAS: la tarjeta de una reserva extra (otra, ferry, tren, autobús; V75-V76)
Eric guardó una «Otra» el día 29 a las 19:30 y en DÍAS:
- el borde casi no se veía;
- el nombre y la hora salían dos veces (la caja «A LAS 19:30» y la fila «… · A las 19:30»);
- la caja sola dejaba un hueco a la derecha;
- **y salía DESPUÉS de la cena.**

**Cómo tiene que ser:**
- **Como el dibujo R13 / R13b** de «Añadir una reserva» (ya está en `TODO_IGUAL`):
  - el borde que se vea;
  - el nombre una vez, con la etiqueta de su tipo («OTRA», «FERRY», «TREN»);
  - las cajas A LAS, HASTA y LUGAR, las que haya; si solo hay una, de punta a punta;
  - abajo, la fila del documento sin repetir nombre ni hora: «Tu reserva» con su QR (dorado, o gris con «+»).
- **En su sitio por la hora:** una reserva a las 19:30 va ANTES de la cena, y la cena pasa detrás. Sin hora de fin, cuenta 1 hora. Si choca con una parada, el «Revisa las horas» de siempre (V69). La app no reorganiza el día sola.
- **En la hoja de «Otra», un campo opcional «Hasta las…»,** con la rueda de hora de siempre (`HojaDeHora`).
- Pasa `pruebaV76` (añádele este caso: la cena detrás de una reserva a las 19:30), `pruebaV75` y `pruebaJutrip`.

## 2b. «Casi lista» de ferry, tren, autobús y otra (V75), en grupo
Comprueba que usa las piezas de siempre y, si no, arréglalo:
- «¿Para quién es?» y «¿Quién la ha pagado?» con **`PersonasCuadradas`** (cuadrado con inicial y nombre, azul con ✓ dorado o blanco, **repartidos a todo el ancho**), nunca pastillas como las de R3h;
- la línea de abajo, coherente con lo elegido: con «Mi cuenta» no puede decir «Va a la cuenta conjunta».

## 3. Las hojas con un campo de texto y el teclado del iPhone
**En Ajustes › Moneda** (y País): al escribir la primera letra en el buscador, la hoja se encoge y se esconde detrás del teclado del iPhone. Solo se ve una franja con el título.

**Arreglo para TODAS las hojas con un campo de texto** (moneda, país, «+ Añadir una reserva», nombres, notas…):
- la hoja se coloca **encima del teclado** (con `visualViewport`), nunca detrás;
- **no cambia de alto al filtrar:** la lista de resultados se desliza dentro;
- el título y el buscador se ven siempre.

Usa una sola pieza para todas (la de las hojas de siempre), no un arreglo en cada una. Compruébalo en modo iPhone con el teclado abierto (Safari en iOS si puedes) y dime en el REPASO qué hojas has mirado.

## 4. Sin más pruebas
Las del §2 y `pruebaJutrip`. `npm run build` sin errores.

**El REPASO, corto:** captura en modo iPhone de:
- las fichas del contador;
- la reserva «Otra» antes de la cena, en DÍAS y en HOY;
- la hoja de la moneda con el teclado abierto y una letra escrita.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
