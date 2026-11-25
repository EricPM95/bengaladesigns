Hola. TANDA V52: LA PARADA CERRADA, LOS SONIDOS QUE FALTAN Y EL EMBLEMA OCULTO AL LLEGAR (tanda corta, MODO RÁPIDO). Empieza SOLO cuando la tanda de pruebas de la noche esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v52.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md).

## 0. Antes de empezar: lo que dejó la noche sin subir
La tanda de la noche dejó unos 1.200 archivos de `docs/dias` cambiados y sin subir. Dime en una línea qué son. Si los generaron las pruebas, déjalos como están en main (`git restore`), sin tocar nada más; si son algo que hay que guardar, súbelos en un commit aparte. No borres nada fuera de eso.

## 1. La parada que ya ha cerrado (decidido por Eric)
- **Hoy la app hace dos cosas a la vez:** a las 22:25 la Basílica de San Pedro se fue sola a «Lugares pendientes» con el aviso de arriba, y el Castillo de Sant'Angelo, también cerrado, salió como «SIGUIENTE PARADA» con [Cómo llegar].
- **Regla nueva, una sola:** lo cerrado (que ya no abre hoy) **NO se manda solo a pendientes**. Sale su tarjeta de siempre, con «Cerrado · Abre mañana a las 9:00» en rojo, y cambian solo estas cosas:
  - la etiqueta de arriba: **«YA HA CERRADO»** en lugar de «SIGUIENTE PARADA»;
  - [Cómo llegar] → **[Pasar a otro día]** (dorado), que abre la hoja de «Pasar a otro día» de siempre;
  - [Cambiar plan] → **[Guardar en pendientes]**;
  - sin el recuadro de la ubicación;
  - la historia se queda.
- Las dos acciones cambian la ruta: aviso abajo con [Deshacer] (regla V44).
- Actualiza la regla de CLAUDE.md (V44: «lo cerrado se va a pendientes») y quita el aviso de arriba «… ya ha cerrado · la tienes en Lugares pendientes», que ya no hace falta.

## 2. El aviso al marcar como visto
«Via della Conciliazione marcada como visto» no concuerda. Sin género: **«Has visto Via della Conciliazione»**. Revisa todos los avisos con «marcado/marcada».

## 3. «Guarda tus recuerdos de {sitio}»
Sale al pulsar [He terminado] en una parada sin haber hecho foto. Que salga **solo en ese caso y una vez por sitio**, y dime en el REPASO dónde está y cuándo sale.

## 4. El emblema oculto, al llegar
Hoy «¡Aquí se esconde un Emblema Oculto!» (`HojaLlegadaOculta`, en `AvisosDeCerca.tsx`) solo sale cuando el servidor dice `juego === 'llegada'` por el GPS: sin ubicación sale tarde o en un momento raro. Tiene que salir **en el momento de llegar**: cuando el GPS detecta que has llegado **o cuando el viajero pulsa [Ya he llegado]**, antes de [He terminado], que es cuando está delante y puede hacer la foto. Una vez por sitio y día.

## 5. Los sonidos que faltan
En el iPhone de Eric (sin silencio: los avisos con [Deshacer] y los logros volando al Perfil sí suenan) **no suenan**: «Y además…» (país, destino, Patrimonio, logros de viajero), el emblema oculto, la barra de experiencia y el dinero volando al presupuesto. Mira qué sonido le toca a cada uno y por qué no suena. **Los que no tengan sonido, añádelos al estudio de sonidos** (como los demás momentos) para que Eric les ponga uno. En el REPASO, la lista: cuáles suenan ya, cuáles has arreglado y cuáles has añadido al estudio.

## 5b. Lo que quedó de la V50
- **El aviso naranja del documento en entradas, excursiones y alojamiento:** hoy esas tarjetas no tienen la línea naranja (solo el vuelo). Ponla también ahí, con «Esta **entrada**…» y «Esta **reserva**…», y [Es correcta].
- **El aviso «Hoy ya no puedes entrar» y su hoja A3** no se vieron en pantalla: con la regla nueva del punto 1, captura cómo queda la tarjeta cerrada de los Museos Vaticanos.

## 5c. «Lo que te llevas de hoy» (el resumen del día, al abrir la app; Eric, 24-nov 22:51)
- **Sale primero vacío** («todavía no has ganado nada hoy» o algo así) y a los 2 segundos se llena. Que no salga hasta tener los datos (o con su hueco y sin ese texto).
- **Los números no cuadran:** «0 · Destino nuevo», cuando en «Y además…» le salió «Tu destino número 2: Roma». Y «1 · Países nuevos» en plural. Las filas a 0 no salen; cada fila, en singular o plural según el número.
- Al volver a entrar no sale otra vez: correcto (una vez). Dime en el REPASO cuándo sale exactamente.

## 6. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores y una captura en modo iPhone de los puntos 1, 2 y 4.
- El REPASO, corto: esas capturas, qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
