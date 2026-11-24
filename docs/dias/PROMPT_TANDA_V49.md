Hola. TANDA V49: EL DÍA DE LLEGADA AL REORGANIZAR Y LA EXCURSIÓN EN OTRO DÍA (tanda corta, MODO RÁPIDO). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v49.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí:** nada que funcione se quita.

**Dibujos:** `docs/diseno/proyecto/` (el de `PARA_CODE.zip`). **Design es un prototipo:** se copia SOLO lo que se describe aquí. En esta tanda solo se usa `Entrada Cambio Dias.dc.html` (E1).

## 1. El día de llegada se queda en 3 paradas AL REORGANIZAR (reproducido por Eric)
- **Pasos:** viaje a Roma del 1 al 5 de diciembre, alojamiento en la zona Plaza de España. En RESERVAS, vuelo de ida el martes 1: Barcelona (El Prat) 08:30 → Fiumicino 11:15. En DÍAS, el día 1 sigue con 10 paradas desde la mañana (correcto: sale [Reorganizar]). **Al pulsar [Reorganizar]** queda: Free Tour por Roma (2 h 30) → Panteón → cena → noche, Fontana de Trevi. **Tres paradas.**
- En la V48 probaste el motor suelto y salían 6-7: **reprodúcelo con estos pasos, por el botón**. Llegando al centro hacia las 13:00, la tarde se llena hasta la cena, con la comida si toca.
- **[Reorganizar] vuelve a salir después de usarlo:** Eric lo pulsó, reorganizó, el botón volvió a salir, y a la segunda desapareció. Tiene que irse a la primera y volver solo con un cambio de verdad del viajero (`ReorganizarHost.tsx`).
- Captura del día 1 antes y después.

## 2. La excursión de la ruta, guardada en otro día (Pompeya, viaje del 25 al 29)
- **FALLO: la hoja «Excursión · Elige día y hora» no ofrece el día de la ruta.** La excursión estaba el sábado 28 y la hoja solo dio jueves 26 y viernes 27. Tienen que salir **todos los días completos del viaje** (no el de llegada ni el de vuelta), con el de la ruta marcado «En tu ruta».
- **Bajo el título,** en las de día entero: **«Es una excursión de día entero: solo se puede hacer un día completo del viaje.»**
- **FALLO: al guardarla el viernes 27 quedaron DOS días de excursión** (viernes, Pompeya reservada; sábado, «Excursión desde Roma · 13 h» con el interruptor). **Tiene que pasar lo mismo que con una entrada en otro día (el Coliseo):** el día de excursión se mueve al día elegido, los días que se mueven se recolocan, y sale el aviso E1 con estos textos:
  - título: «Tu excursión a Pompeya, el viernes 27. Para que encaje, cambiamos estos días:»;
  - una fila por día, sin pulsar: el día elegido arriba con borde dorado; los demás, con la fecha en negrita, el nombre del día y, en gris, «Antes, el {día}»;
  - [De acuerdo] y después el aviso abajo con [Deshacer].
- **El mismo aviso E1 para las entradas**, que hoy sale con el texto viejo («Para que tengas una buena experiencia en Roma, vamos a mover el día del Coliseo al día 3…»): «Tu Coliseo, el jueves 26. Para que encaje, cambiamos estos días:». **Siempre fechas, nunca «día 3».**

## 3. Solo datos verdaderos en la excursión
- **«Estación de Termini» y la salida a las 07:00 son inventados:** salen de `data/dias/roma/_excursiones.json` (`punto_de_encuentro`), y sus `coords` son las de Pompeya. **El punto de encuentro solo se enseña si viene de la API de Civitatis o del bono** que sube el viajero; si no, no sale. Revisa todas las excursiones de Roma y Lanzarote.
- **Quita [Cómo llegar al punto de encuentro]** de la tarjeta de la excursión.
- **FALLO: se guardó la hora gris de ejemplo.** Eric no escribió las 07:00 y se guardó como hora de recogida. **Nunca se guarda lo que el viajero no escribe:** sin hora, la tarjeta no la enseña. Revisa todas las hojas con hora (entradas, excursiones, vuelos, alojamiento).

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva (hay una tanda solo para eso).
- Antes de subir: `npm run build` sin errores y una captura en modo iPhone de cada punto.
- El REPASO, corto: esas capturas, qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
