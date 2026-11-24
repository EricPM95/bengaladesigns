Hola. TANDA V48: HOY Y EL DÍA DE LLEGADA (tanda corta, MODO RÁPIDO). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v48.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí:** nada que funcione se quita.

**Dibujos: `PARA_CODE.zip`, en mis Descargas** (el Design más reciente). Descomprímelo en `docs/diseno/proyecto/` (sustituye lo que haya). **Design es un prototipo:** de cada dibujo se copia SOLO lo que este prompt describe; los textos, las fechas y lo que no se menciona son de ejemplo, y lo que hoy funciona se queda. En esta tanda solo se usa `Billete QR.dc.html` (punto 1). La tarjeta de la parada ya está como se pidió en la V47: no la toques.

## 1. El billete con QR no está (ni en DÍAS ni en HOY)
En la V45 dijiste que lo hiciste «sin verlo en pantalla», y Eric no lo ve: en DÍAS, con el vuelo puesto, sale la tarjeta de antes («LLEGADA · BARCELONA → ROMA · BCN 08:30 → FCO 11:15», con [Ver]); en HOY, el día de llegada empieza en «Parada 1 de 3», sin billete. Si ya está en el código, averigua por qué no sale. **Exactamente así** (`Billete QR.dc.html`, Q1 a Q4):
- **Dónde:** en DÍAS, en el sitio de la tarjeta de llegada de hoy (el primer día) y en el de la vuelta (el último). En HOY, arriba del día de llegada, antes de la primera parada; y el día de vuelta, donde hoy sale «Llegada al aeropuerto».
- **Cómo:** billete blanco con una raya azul fina a la izquierda y el avión en un círculo azul; arriba, «LLEGADA · VUELO {número}» (o «VUELTA · VUELO {número}»); las dos horas grandes con la línea de puntos y el avión en medio, y debajo los códigos (BCN, FCO). Para tren, bus o barco, su icono y su nombre.
- **El QR, arriba a la derecha:** dorado si la tarjeta de embarque está guardada (abre el código a pantalla completa); gris con «+» si no (lleva a RESERVAS, al vuelo).
- **La franja de abajo:** «✓ Tarjeta de embarque guardada» o «+ Añade tu tarjeta de embarque» (lo mismo que el QR), y a la derecha la fecha corta («mar 24 nov»).
- **Lo que no se pierde:** al tocar el resto del billete se abre la ficha de llegada de siempre, con «Cómo llegar desde el aeropuerto». Sin número de vuelo, «LLEGADA · {aeropuerto}». Sin pase, como hoy (con candado).
- Una captura de DÍAS y otra de HOY, con y sin tarjeta.

## 2. El día de llegada, demasiado corto
Con aterrizaje a las 11:15 en Fiumicino, el día se queda en 3 paradas y 3 h 20. Con el traslado y la maleta se empieza hacia las 13:00: la tarde debería ir llena hasta la cena. Mira por qué se queda en 3 y **que no dependa de la hora a la que se mira** (Eric lo miró el mismo día, a las 18:30).

## 3. Los avisos de HOY con la hora ya pasada
- **Museos Vaticanos a las 18:20:** hoy «A este ritmo llegarías cuando ya han cerrado», con la última entrada (18:00) ya pasada. Tiene que decir **«Hoy ya no puedes entrar a los Museos Vaticanos: la última entrada era a las 18:00»**, y [Ver solución] propone pasarlos a otro día.
- **«Hoy ya no da tiempo a todo»:**
  - **cuándo sale:** al abrir HOY cuando han pasado **1 h 30 desde la hora prevista de la primera parada del día** y no se ha hecho ninguna (ya no «después de las 13:00»). Así no sale el día de llegada antes de empezar. Una vez al día;
  - **una sola hoja cada vez:** hoy sale encima de «Navidad en Roma». Primero la de Navidad y, al cerrarla, esta;
  - **un free tour no tiene «entrada»:** «Tu Free Tour por Roma de las 10:00 ya ha pasado». «Tu entrada…» solo con entradas.

## 4. EXPLORAR › la ficha de un lugar
La barra «Escuchar historia» tapa el botón dorado de añadir a la ruta (Eric, Plaza del Campidoglio). Que el botón de añadir se vea entero y se pueda pulsar, con la hoja a media altura y entera, en 375 px.

## 5. Sin pruebas
- **No pases pruebas ni escribas una nueva** (esta noche hay una tanda solo para eso).
- **Antes de subir:** `npm run build` sin errores, y una captura en modo iPhone de cada punto.
- **El REPASO, corto:** esas capturas, qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
