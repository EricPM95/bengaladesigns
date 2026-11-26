Hola. TANDA V72: LOS LOGROS MÁS BONITOS. LA FICHA EN GRANDE DE UNA COLECCIÓN, UNA MEDALLA O UN LOGRO, LA PÁGINA DEL DESTINO Y LAS TARJETAS DE «LOGROS DE VIAJERO». Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V71 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v72.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/`, la página **«Ficha Logros en Grande»**:
- P1-P2: la página del destino;
- F1-F5, F2b y F3b: la ficha;
- L1-L2: las tarjetas de «Logros de viajero».

Design es un prototipo:
- **los huecos de foto son de mentira:** van las fotos reales;
- **los sitios, fechas, grados, números y líneas son los de verdad**, nunca los del dibujo («10 PAÍSES VISITADOS» en F5 es de mentira).

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. La ficha en grande (F1-F5, F2b, F3b): UNA pieza para todo
- **Al tocar una colección o una medalla** en la página del destino, sube la ficha (F1-F4).
  - Hoy la colección abre una lista al final de la página, lejos de donde se toca (`abierta` en `PaginaDeDestino.tsx`).
  - Hoy la medalla no abre nada.
- **La ficha:**
  - arriba, el emblema de la colección en grande, con sus pedazos (o la medalla en grande, F3), el nombre y cuánto lleva;
  - **«Lo conseguido»:** foto real, nombre y fecha;
  - **«Lo que falta»:**
    - la foto real en gris, como en la lista de hoy (`ListaDeColeccion.tsx`);
    - el día si está en la ruta («En tu ruta · viernes 27») o «Sin día en tu viaje»;
    - **[Cómo llegar]** si es de la ruta de hoy, como en «Una colección por dentro».
  - **La medalla (F3):** el grado y lo que falta para el siguiente («Te faltan 2 imprescindibles para el oro»), con las cuentas reales de `sellos` en `data/logros/<destino>.json`.
- **El botón de la vitrina** («Llevar a mi vitrina» / «En tu vitrina»), arriba a la derecha, solo si está ganado: el mismo camino que hoy (`ElegirHueco`).
- **[Compartir] y [Volver a ver]** en lo ganado (F2b, F3b). **«Es tu título»** solo en los logros de viajero (F5).
- **La misma ficha en «Todos mis logros»** (`FichaHoja.tsx`, F5), con todo lo que ya hace hoy: [Compartir], [Volver a ver], «Es tu título».
- **La ficha sustituye a «Una colección por dentro»** (`ColeccionPorDentro.tsx`). «Ver la colección ›» y todo lo que la abría abren ahora la ficha. Una sola forma de ver una colección.
- **Los Emblemas Ocultos no salen nunca en la ficha.**

## 2. La página del destino (P1-P2)
- **No se quita nada.** Como P1-P2, con la foto REAL arriba y la tarjeta con su barra tal cual.
- **«Medallas de ciudad»** (con su ✓ / +, `PinDeVitrina`) y **«Colecciones»**, con la barrita de avance de P1 debajo de cada una.
- **El bloque «Emblemas secretos» al final se queda** (los ganados y los «?»).

## 3. «Logros de viajero» en «Todos mis logros» (L1-L2)
- **Fuera el círculo de color** de alrededor de cada medalla. **La medalla, un poco más grande que en L1-L2** (Eric: alrededor de un 15 % más), llenando mejor la tarjeta sin que la tarjeta cambie de tamaño ni se corte el nombre.
- **El + y el ✓, iguales**, en la misma esquina.
- **Las que aún no tienes:** «2 de 3» y la barrita, como en las colecciones, sacado de lo que hoy dibuja el círculo gris (`TodosLista.tsx`, `avance`). Las que no se cuentan por pasos, solo el nombre.
- **«Exclusivos» (Roma 2026, Pionero…), más grandes,** como en el dibujo, con su ✓ / +.
- **Las tarjetas de los destinos de arriba (Lanzarote, Roma…) NO se tocan:** se quedan exactamente como están hoy. En el dibujo salen más cortas solo porque a Design no le cabían; eso no se copia.
- «Las 7 maravillas», igual que ahora.

## 3b. El panel «Tus logros / Reclamar con tus fotos» tapa HOY
En `pruebaTandaHOY1_B` (K4, foto sin conexión) ese panel tapa HOY y la cámara no se abre. **Trátalo como un fallo de la app, no de la prueba:** que nunca tape HOY ni la cámara. Arréglalo y deja `pruebaTandaHOY1_B` en 0 fallos.

## 3c. Reglas nuevas para CLAUDE.md (por lo que pasó en la V69 y la V71)
- **Un agente nunca hace `git stash`, `git restore` ni `git checkout` de archivos,** ni cierra los Chrome de prueba de otro agente. Para capturas «antes», usa una copia aparte (`git worktree`) o `git show <commit>:<archivo>`.
- **El script de subida incluye TODO lo cambiado** (`src/`, `server/`, `shared/`, `data/`…): `shared/` estuvo sin subir de la V58 a la V70. Antes del push, `git status` limpio.

## 4. Sin pruebas
- Pasa solo `pruebaTandaHOY1_B` (por el §3b) y `pruebaJutrip`. Antes de subir: `npm run build` sin errores.
- **El REPASO, corto:** captura en modo iPhone al lado de su dibujo de P1, P2, F1-F5, F2b, F3b, L1 y L2, con datos reales de Lanzarote y de Roma.
- Qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
