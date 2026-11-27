Hola. TANDA V78: QUÉ SITIO CUENTA CUANDO HACES UNA FOTO, Y LOS «PUNTOS DE FOTO» DESDE DONDE SE VE UN SITIO DE LEJOS. Tanda corta, **con pruebas** (toca cómo se ganan pedazos y emblemas). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v78.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## Lo que pasa hoy (`server/logros/cerca.js`)
- **La foto de la CÁMARA de la app** cuenta para UN sitio (`sitioDeFotoLibre`): el que tiene emblema por ganar y, si no, el más cercano.
- **La de la GALERÍA** cuenta para TODOS los del radio (`sitiosDeFotoLibre`, V5).
- **La misma foto en el mismo sitio da cosas distintas** según cómo se suba. Y desde Via dei Fori Imperiali, mirando el Coliseo, la foto puede ir al Foro (estás dentro de su radio de 350 m y fuera del de 250 m del Coliseo).

## 1. Una sola regla para la cámara y la galería (decisión de Eric)
Al HACER la foto (o con la hora y el lugar de la foto de la galería), en este orden:
1. **Si entre los sitios posibles está la parada que le toca ahora en HOY** (y tiene algo por ganar), cuenta **solo esa**. Al final de Via dei Fori, con el Coliseo como parada, solo el Coliseo: ni el Foro ni el Vittoriano.
2. **Si no está su parada** (va por libre, o su parada ya está ganada):
   - **dentro del radio normal** de uno o varios sitios: cuentan **todos los que tengan algo por ganar**;
   - **en un punto de foto lejano** (§2): solo el sitio de ESE punto.
3. **Lo ya ganado nunca cuenta.**
4. **La ubicación se mira al hacer la foto,** no al abrir la cámara. Al abrir la cámara no se pregunta nada.

- **La parada de ahora la manda la app** al servidor con la foto (la de HOY; una foto de la galería de otro día, sin parada).
- **Una foto sin nada que ganar** va al álbum, sin ningún aviso.
- El radio de «has llegado» (la hoja del emblema al llegar, el Visto) **no cambia**.

## 2. Los puntos de foto (desde donde se ve un sitio de lejos)
- **Un campo nuevo en los datos de logros de cada destino** (`data/logros/<destino>.json`), por sitio: `puntos_de_foto`. Cada uno lleva su lat/lng, un radio pequeño (50-150 m), su nombre («Via dei Fori Imperiali», «Mirador del Colle Oppio») y la fuente.
- **Desde un punto de foto, la foto vale para ese sitio** (§1, 2), pero la app **NO dice «has llegado»** ni salta la hoja del emblema ni «Algo brilla».
- **Los puntos no se inventan.** Busca los reales, desde donde la gente hace esa foto (webs de fotografía, guías oficiales, Google), con la fuente de cada uno.
  - **Roma:** el Coliseo (Via dei Fori Imperiali, Colle Oppio, Largo Gaetana Agnesi…), San Pedro (Via della Conciliazione), el Foro (la terraza del Campidoglio), el Castillo de Sant'Angelo (Ponte Umberto I)… y los que encuentres.
  - **Lanzarote:** los miradores desde donde se ve un sitio de la ruta.
- **NO los metas en los datos todavía:** ponlos en `docs/dias/PUNTOS_DE_FOTO_PROPUESTOS.md` (sitio, punto, coordenadas, radio, fuente y un enlace al mapa) para que Eric los apruebe. El código queda listo y probado con 2 puntos de ejemplo en las pruebas, no en los datos reales.

## 3. Pruebas
Escribe `pruebaV78`, en Roma y en Lanzarote:
- foto en el radio del Coliseo y del Foro con el Coliseo como parada de HOY → solo el Coliseo;
- la misma foto sin parada → los dos (si los dos tienen algo por ganar);
- el Coliseo ya ganado → solo el Foro;
- foto en un punto de foto de ejemplo → solo su sitio, sin «has llegado»;
- la misma foto por cámara y por galería → lo mismo;
- foto sin nada que ganar → nada, sin aviso.

Pasa `pruebaV78`, las de logros (`pruebaLogros1`, `pruebaLogros2`, `pruebaV35A_logros`), `pruebaV36` (si tocas algo que pregunte a Supabase) y `pruebaJutrip`. `npm run build` sin errores.

**El REPASO, corto:**
- el caso de Via dei Fori antes y después;
- la lista de puntos propuestos (cuántos por destino);
- qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
