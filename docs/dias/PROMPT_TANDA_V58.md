Hola. TANDA V58: LO QUE ENCONTRARON LOS VIAJEROS DE PRUEBA DE ANOCHE Y NO ESTABA EN NINGUNA TANDA. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V57 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v58.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**Los botones flotantes que tapan cosas (Roma, Lanzarote T1) NO se tocan:** decisión de Eric.

Todo sale de `docs/dias/VIAJEROS_ROMA.html` y `VIAJEROS_LANZAROTE.html`: ahí está cómo repetir cada caso. **Primero repite cada caso con un viaje creado como lo crea un usuario normal.** Si con un viaje normal no pasa, no toques nada y dilo: era cosa del viaje de prueba. En el REPASO, **una línea por cada punto con ✅ hecho, 🟡 a medias o ❌ no hecho, y por qué**.

## 1. El alojamiento: unas pantallas lo ven y otras lo piden (Roma C, Lanzarote C1 y X3)
- **En Roma:** DÍAS dice «ALOJAMIENTO · Hotel Quirinale» y RESERVAS «✓ Listo», pero HOY dice «Pon tu alojamiento para volver con un toque · Añadir» y cuenta los minutos «Desde el centro».
- **En Lanzarote** solo con la zona elegida (Costa Teguise):
  - el contador de RESERVAS lo cuenta como hecho;
  - la tarjeta dice «Falta»;
  - DÍAS y HOY lo piden.
- **Una sola respuesta para toda la app** a «¿tiene alojamiento?»: la misma función en RESERVAS, DÍAS y HOY.
  - **Con alojamiento:** nadie lo pide, y HOY cuenta «Desde el alojamiento».
  - **Solo con la zona:** no cuenta como hecho, ni en el contador ni en la tarjeta. HOY puede contar desde la zona, «Desde Costa Teguise».

## 2. La cabecera de RESERVAS no se entiende (Roma, Lanzarote C2)
«Domingo 18 · 2 de 3», «Martes 10 · 3 de 5» en un viaje de 6 días, «Entradas 1/3» con una sola reservada.
- Dime en el REPASO qué cuenta cada número.
- Pon un texto que se entienda solo, por ejemplo «3 de 5 reservas listas». El total tiene que cuadrar con lo que enseña la lista de abajo.

## 3. Dos tarjetas del mismo vuelo el día de llegada (Roma)
En HOY, a las 8:30, sale el billete «LLEGADA · VUELO VY6102 · 11:15 FCO» y justo debajo «TU VUELO · Aterrizas a las 11:15». Lo mismo dos veces. Que salga **solo el billete** (la pieza del billete QR) y, si la otra trae algo que el billete no tiene, pásalo al billete.

## 4. La barra «… · Deshacer» que no se va (Roma)
«Tu Coliseo, el domingo 18 · Deshacer» se queda tapando lo de abajo. Mira si pasa también sin cambiar el día simulado:
- si pasa, que se vaya como los demás avisos de abajo;
- si no pasa, dilo.

## 5. «a el», «de el» y los sitios sin artículo (Roma)
«Tu entrada a el Coliseo», «Tu entrada de las 10:00 en Coliseo».
- **Regla para toda la app:** «a el» → «al», «de el» → «del».
- Cada sitio, con su artículo en los datos si lo lleva («el Coliseo», «la Fontana de Trevi», «los Museos Vaticanos»; «Montserrat», sin artículo), para decir «en el Coliseo».
- Busca todos los textos que ponen un nombre de sitio después de «a», «de» o «en».

## 6. Lanzarote en coche (L8, L9, L10)
- **«23,8 KM A PIE»** en la cabecera de un día en coche. Los 23,8 km son de coche. En un día en coche, «23,8 km en coche» (y los de a pie, aparte, solo si los hay).
- **Minutos de visita raros:**
  - El Golfo y el Charco de los Clicos: 139 min;
  - Playas de Papagayo: 240 min;
  - Salinas de Janubio: 20 min;
  - Playa de Montaña Bermeja: 15 min.

  Con los 139 min de El Golfo, el día 2 acaba después de que cierre. **No los cambies:** haz una tabla en DECISIONES con los minutos de cada sitio de Lanzarote, de dónde salen y lo que propones. Eric decide. Lo que sí: **que ningún día termine una visita después de que cierre el sitio** (arréglalo en el motor, para todos los destinos).
- **«Hora de comer» sin restaurantes** (jueves en Marina Rubicón o Playa Blanca, viernes). Mira por qué no sale ninguno:
  - si faltan restaurantes en los datos de esa zona, dilo y no los inventes;
  - si los hay y no salen, arréglalo.

## 7. «Guarda un recuerdo de {sitio}» (Lanzarote P1)
En la V52 quedó cuándo sale: tras [He terminado] sin foto, una vez por sitio. Ahora, además:
- sale unos segundos tarde y tapa la siguiente parada y el aviso;
- se queda abierta horas después;
- se queda encima de DÍAS y de otro viaje al cambiar de pestaña.

Que salga **al momento**, solo en HOY, y que se cierre sola al cambiar de pestaña, de día o de viaje.

## 8. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO, corto:
  - la lista con ✅/🟡/❌;
  - captura en modo iPhone, antes y después, de cada punto;
  - la tabla de minutos de Lanzarote, en DECISIONES.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
