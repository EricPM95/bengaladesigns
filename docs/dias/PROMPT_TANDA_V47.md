Hola. TANDA V47: LA TARJETA DE LA PARADA EN HOY, ANTES Y AL LLEGAR (tanda corta). Empieza SOLO cuando la V46 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** sube la nota `_estado_v47.md` a la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave.

**Los dibujos:** el archivo de Design «RETOQUES_V2», en mis Descargas (la tarjeta de «Plaza del Campidoglio» antes de llegar y con «Ya estás aquí»). Cópialo a `docs/diseno/proyecto/` y míralo con capturas. **Solo se cambia lo que se dice aquí:** nada que funcione se quita porque no salga en el dibujo.

## 1. Antes de llegar: tres cajas en una fila
- **HORARIO**, siempre, según la hora real:
  - antes de abrir: «Cerrado ahora · abre a las 9:00»;
  - abierto: «Abierto · cierra a las 16:30»;
  - después del cierre: «Cerrado · abre mañana a las 9:00» (o el próximo día que abra);
  - sin horario (plazas, calles, fuentes): «Abierto» y debajo «Sin horario».
- **A PIE / EN COCHE**, con el texto corto: «Desde el alojamiento» (la primera del día), «Desde el Panteón» (las demás, la parada anterior) o «Desde ti» (con ubicación, en la ruta). Lejos del destino, «—» y «Estás lejos», como en la V44.
- **VISITA**, con el reloj de arena: el tiempo que recomendamos («30 min») y debajo «Lo que recomendamos».
- Debajo de las cajas, el recuadro de la ubicación (si toca), luego la historia, y después [Cómo llegar] y [Cambiar plan].
- Pruébalo con el caso más largo (cerrado ahora) en 375 px de ancho: que quepan las tres sin cortar texto.

## 2. Al llegar («Ya estás aquí»)
- **Las mismas tres cajas**, con A PIE: «Aquí · Ya has llegado».
- **La franja dorada «AQUÍ GANAS 1 PEDAZO»** con el nombre de la colección. **El icono es el trozo de ESE sitio, en color, sobre su círculo blanco** (la pieza suelta, con `InsigniaPartes` y `Piezas/Insignia Pieza`), el mismo que se gana al terminar. Si da trozos de dos colecciones, el de la primera y «y 1 más». Sin hueco que salte (lo de la V46).
- **Tres botones con nombre:** [Qué ver], [Escuchar historia] y [Hacer foto] (este, el dorado). Hoy son tres iconos sin texto.
- Debajo, como ahora: [He terminado], [Necesito más tiempo] y «Saltar parada».

## 3. La prueba (MODO RÁPIDO: es una tanda pequeña, que no pase de una hora)
- **Solo:** `pruebaV47` (corta, 10-20 comprobaciones), `pruebaJutrip` y las de HOY que toquen la tarjeta de la parada (`pruebaV44`, `pruebaV46`). Ni las demás V4x ni la batería.
- **No pongas al día pruebas viejas** que no fallen por esta tanda: apúntalas en DECISIONES y sigue.
- **El REPASO, corto:** una captura de iPhone por punto (antes y después) y la lista de comprobación. Sin más.
- **`pruebaV2Hoy` (1 fallo desde la V46):** busca abajo el aviso «… ya ha cerrado · la tienes en Lugares pendientes». Desde la V44 ese aviso solo informa (no lleva [Deshacer]) y va ARRIBA. Si es eso, pon la prueba al día; si el aviso no sale en ningún sitio, arréglalo.
- **La foto de la parada:** en una captura tuya de la V46 la «Plaza del Campidoglio» llevaba la foto de los Museos Vaticanos. Dime en el REPASO de dónde salió, y añade a `pruebaV47` que cada parada lleva su propia foto.
- **Nueva `pruebaV47`:**
  - las tres cajas a 375 px sin cortar;
  - el horario cambia con la hora (antes de abrir, abierto, después del cierre, sin horario);
  - «Desde» dice el sitio de salida correcto;
  - al llegar sale el trozo del sitio y los tres botones con su nombre.
- **En el REPASO:** capturas en tamaño iPhone, antes y después, y tu lista de comprobación DE ESTA TANDA, en palabras sencillas.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
