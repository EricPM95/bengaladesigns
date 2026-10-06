# El pool del formulario, guardado y listo desde el principio

El pool de lugares del formulario (las tarjetas con foto para elegir qué quieres ver) parece cargarse cada vez desde cero, y tarda. Es igual para todos los viajeros de un mismo destino: no tiene sentido pedirlo cada vez.

Commit por parte y sin push. Sin cambios de diseño.

1. **Mira primero cómo carga hoy** y dímelo en el informe:
   - qué pide la pantalla al abrir el pool;
   - si alguna parte ya se guarda;
   - cuánto tarda en un móvil con 4G (la herramienta de red del navegador, en lento), la primera vez y la segunda.
2. **La lista del pool, guardada.** La lista de lugares del pool de cada destino (nombre, foto, orden, a qué época o experiencia pertenece) se prepara una vez y se guarda: en el servidor y en el navegador del viajero.
   - Solo cambia cuando cambiamos los datos del destino (roma.json). Ponle una versión, para que al cambiar los datos se renueve sola y nadie vea una lista vieja.
   - Lo que cambia con el viajero (la época, las experiencias que elige, cuántos caben según los días) se aplica encima, sin volver a pedir nada.
3. **Las fotos del pool, ligeras y guardadas.**
   - Usa la versión pequeña (640 px), nunca la grande.
   - Que el navegador las guarde mucho tiempo (cabeceras de caché largas en Vercel). Si una foto cambia, que cambie de nombre o de versión, para que se renueve.
4. **Que esté listo antes de llegar.** Mientras el viajero rellena los pasos de antes del formulario (destino, fechas…), la app va trayendo en segundo plano la lista y las fotos del pool de ese destino. Al llegar al pool, sale al momento.
5. **Lo mismo en Explorar y en Añadir parada**, si usan las mismas fotos y datos: que aprovechen lo ya guardado.

**Informe corto:** los tiempos antes y después, la primera vez y la segunda, en móvil con 4G.
