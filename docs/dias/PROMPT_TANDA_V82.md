Hola. TANDA V82: «TODOS MIS LOGROS» NUEVO, SUS FICHAS, LAS MARAVILLAS, LOS EXCLUSIVOS Y LA TARJETA PARA PRESUMIR. Tanda corta, **con pruebas de logros**. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v82.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** el zip de Design de hoy (el `TODO_IGUAL` más nuevo de Descargas; descomprímelo en `docs/diseno/proyecto/`, encima, sin borrar).
- **Manda la página «Todos mis logros nuevo».**
- **Quedan viejas** «Ficha Logros en Grande» y, en «Piezas/Mi Vitrina», las marcadas VIEJA (T1, T2, «A», TR). No se usan.
- **En esa página hay dos P1 y dos P2.** Arriba, «P1 · Las 7 maravillas» y «P2 · Exclusivos». Más abajo, en «Colecciones y medallas», «P1 · Lanzarote» y «P2 · Roma»: **a estas dos las llamamos D1 y D2.**

**Design es un prototipo: se copia solo el diseño.** Los textos, los nombres de los botones y las reglas son los nuestros. Los logros, las medallas, los dibujos, los números y las fotos, los reales. Errores del dibujo que no se copian:
- «Lanzarote 2026» con el dibujo del Probador;
- la medalla de «Roma 2026» que dice 2027 (mira si el dibujo real dice 2027: si es así, dímelo);
- monedas en color que no cuadran con la lista;
- exclusivos repetidos en P3b;
- banderas o colecciones de otro destino.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. La página «Todos mis logros» (N1)
Copia N1 de arriba abajo, en `TodosMisLogros` / `TodosLista`:
- **la cabecera nueva,** con el botón «Presumir de mi colección», que abre la tarjeta del §5;
- **«Logros de viajero», más grandes,** en una fila que se desliza, con la tercera tarjeta asomando;
- **cada logro que cuenta, con «1 de 4» y la barrita debajo** (en el dibujo falta la barrita; ponla igual que en N3);
- **las 7 maravillas** y **los exclusivos al final**, y debajo otra vez «Presumir de mi colección» (el mismo botón y el mismo nombre arriba y abajo).
- **Los números,** los mismos en N1 y en la tarjeta del §5 (salen de la misma cuenta).

## 2. Las fichas, una forma por tipo
- **N2, la ficha azul:** para **exclusivos, maravillas y emblemas ocultos.**
- **N2b y N2c, la ficha clara:** para **los logros de viajero y lo demás** (N2b sin conseguir, con la medalla en gris; N2c conseguido).
- **F1-F4, las fichas de colección y de medalla de destino:** debajo, todo lo que se consigue con ella, como en el dibujo.
- **Los mismos botones con los mismos nombres en todas:**
  - [Compartir] y [Volver a ver] abajo;
  - «Usar como mi título» / «Es tu título ✓» (solo en los logros que pueden ser título);
  - **la vitrina, SIEMPRE arriba a la derecha, como pastilla:** «+ Llevar a mi vitrina» / «✓ En tu vitrina» (como F2 y F3). En N2 y N2c el dibujo la pone abajo: **va arriba.**
- **La vitrina solo se ofrece en lo CONSEGUIDO.** Nada a medias ni sin ganar, tampoco en las colecciones de D1 y D2: el dibujo pone el «+» en colecciones a medias, y eso no se copia.
- **Con la vitrina llena (3),** «Llevar a mi vitrina» abre `ElegirHueco` para elegir cuál se cambia.
- **Una sola pieza por tipo de ficha:** `FichaGrande`, `FichaHoja`, `FichaDeLogro` y `FichaDeColeccion` pasan a estas formas. No dejes dos fichas distintas para lo mismo. Dime en el REPASO qué pieza queda para cada tipo.

## 3. «Mi colección» (N3)
En `MiColeccion`: el fondo azul noche de la vitrina (no granate: el granate es solo del pasaporte), con las páginas por grupo («El tiempo, 2 de 5») y la barrita en cada logro.

## 4. Las 7 maravillas (P1, P1b, P1c) y los exclusivos (P2, P2b)
- **Maravillas:**
  - en color, solo las conseguidas; las demás, en silueta, y en la lista «Conseguida» o «Por ver»;
  - **con las 7, la animación completa (`FinalSieteMaravillas`) solo la PRIMERA vez** que se abre después de conseguir la séptima. Las demás veces, un brillo suave y [Volver a ver] (P1c).
- **Exclusivos:**
  - el texto «Solo se consiguen una vez: son tuyos para siempre»;
  - salen **los tuyos** y **los que aún se pueden ganar,** en silueta, con cómo se consiguen y hasta cuándo («Visita Roma en 2026 · Hasta el 31 de diciembre»);
  - **nunca los que ya no se pueden ganar.**

## 5. La tarjeta para presumir (P3, P3b)
- Arriba, **la medalla de las maravillas, la primera, si tienes al menos una.**
- Después **todos tus exclusivos en filas de 3 o 4;** la tarjeta crece hacia abajo.
- El resumen de números, los mismos que en N1.
- Botón [Compartir mi colección].

## 6. Las páginas de cada destino (D1 Lanzarote, D2 Roma)
En `PaginaDeDestino`: la tarjeta de la medalla y **las colecciones en 2 columnas, más grandes,** como D1 y D2. Los emblemas, con su dibujo real. El «+» de la vitrina, solo en lo conseguido (§2).

## 7. Reglas que no cambian
- **Las medallas que cuentan, SIEMPRE «la que toca»** por el total (la función de la V79), también en todas estas pantallas.
- **Nunca la palabra «sello»** en los textos (solo en el pasaporte): siempre «medalla».
- **Un solo botón dorado** por pantalla. El «+» naranja pequeño de los exclusivos sí se queda.

## 8. Pruebas
- **Escribe `pruebaV82`:**
  - la vitrina solo en lo conseguido (una colección a medias no la ofrece);
  - con la vitrina llena se abre `ElegirHueco`;
  - la animación de las 7 maravillas, una sola vez;
  - un exclusivo cerrado no sale y uno abierto sale en silueta;
  - los mismos números en N1 y en la tarjeta para presumir.
- **Pásalas:** `pruebaV82`, `pruebaV79`, `pruebaLogros1`, `pruebaLogros2`, `pruebaV35A_logros` y `pruebaJutrip`. `npm run build` sin errores, y el peso de la primera carga, dentro del límite del finde.
- **El REPASO, corto:** captura en modo iPhone al lado de su dibujo de N1 (arriba, medio y abajo), N2, N2b, N2c, N3, P1, P1c, P2b, P3, F1, F3, D1 y D2. Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
