# Informe: Tanda 8A3, tres arreglos

17-oct-2026. Sin pantallas, todo detrás de los interruptores de siempre. **El motor de rutas no se ha tocado**: de él solo se LEEN dos funciones (`libreDeLlegada` y `datosDeVuelta`); la prueba comprueba que los logros no importan nada más del motor ni escriben en él. No hay migraciones nuevas.

## Qué he cambiado

### 1. La hora libre del día de llegada es la de la ruta
- Para elegir el día de prueba ya no uso «llegada + 90 minutos». Uso la misma hora que calcula el motor: **llegada + traslado del punto + 30 min de maleta** (Fiumicino 60, Ciampino 50, Termini 15…), leída con la función del propio motor (`libreDeLlegada`) y los datos de `_llegada.json`. Para el último día, la hora de **salir** (`datosDeVuelta`: Fiumicino 3 h antes, Ciampino 2 h 50, tren 45 min…).
- Se toma del plan de llegada que el motor guardó en el viaje (aeropuerto o estación y medio) y, si no hay plan pero sí hora de vuelo, del punto por defecto (el de más traslado), como hace el motor.
- **Ejemplo (llegada a las 8:35):** Fiumicino queda libre a las 10:05 → la prueba es el día 2; Ciampino, a las 9:55 → día 1; tren a Termini, a las 9:20 → día 1. Con los 90 minutos de antes, los tres habrían dado el día 2.
- **Respaldo:** si el motor no da la hora (en coche, sin los datos de llegada del destino), se usan los 90 minutos y los 3 horas de `data/pase/ajustes.json`, y el viaje queda marcado (`libre_origen` / `salir_origen` = `respaldo`). Hoy pasa en **coche** (el motor no calcula hora clave) y si el destino no tiene `_llegada.json`. En Roma con avión, tren, autobús o barco, siempre sale del motor.

### 2. La pregunta de las 12:00, también sin cobertura
- Cuenta la hora del **Visto**, no la de llegada. Si es de las 12:00 en adelante y es la primera vez que usa HOY en su día de prueba, **no se gasta la prueba**: se hace la pregunta cuando el Visto llega (el servidor responde `pregunta_medio_dia` y no guarda el Visto).
- **Cómo lo he resuelto en el móvil:** el Visto queda en la cola marcado «en espera» (`enEspera`). **[Hoy]** (`responderPregunta`) gasta la prueba y vuelve a mandar esos Vistos, que cuentan con la hora en que se hicieron; **[Mañana]** pasa la prueba al día siguiente y **descarta** esos Vistos (lo de hoy se gana mañana con «Lo de ayer también cuenta»). La pregunta llega al almacén de logros (`pregunta`) para que la pantalla (P10, de Design) la enseñe.
- **Si ya ha pasado ese día cuando llega:** se gasta la prueba directamente, como antes, y el Visto da lo suyo con su hora. Motivo: ya no puede contestar «hoy o mañana» porque «hoy» pasó.
- Un Visto de antes de las 12:00 que llega por la tarde: manda la hora del Visto, se gasta sin preguntar.

### 3. El código partido: la app abre antes
- La pantalla de la ruta (RUTA, DÍAS, EXPLORAR, RESERVAS, HOY, los mapas, las fichas, el Perfil…) está ahora en su propio archivo (`src/components/route/RouteScreen.tsx`) y se carga **cuando se abre**; igual **Mis viajes**, **Preparando tu viaje…** y la pantalla de desarrollo. Mientras llega una parte se pone un fondo vacío del mismo tamaño de pantalla (sin saltos). Mientras se prepara el viaje (tarda un rato) la pantalla de la ruta ya se va bajando, para que esté lista al terminar.
- Las librerías grandes van cada una en su archivo (`vite.config.ts`): el **mapa** (`vendor-mapbox`, 1,8 MB, el mayor), el PDF, arrastrar y soltar, las fechas, Supabase y React. React y las piezas comunes van juntas, para que un archivo grande no arrastre a los demás al abrir (me pasó al principio: el mapa y «arrastrar» entraban al abrir por una pieza compartida).
- Nada de lo que ve el usuario cambia.

## El peso, antes y después
Medido con `vite build` sobre lo que carga `index.html` (KB de 1.024 bytes; el gzip es lo que se descarga):

| Al abrir la app | Antes (8A2) | Después |
|---|---|---|
| JavaScript que lee el móvil | **3.392,7 KB** | **697,0 KB** (−79 %) |
| JavaScript descargado (gzip) | 978,5 KB | 212,4 KB |
| CSS | 533,4 KB (102,4 gzip) | 485,5 KB (95,8 gzip) |
| **Descarga total al abrir** | **1.080,9 KB** | **308,2 KB** (−71 %) |
| Archivos que carga | 1 JS + 1 CSS | 3 JS (app, React, Supabase) + 1 CSS |

Lo demás (el mapa 1.826 KB, la pantalla de la ruta 626 KB, arrastrar, las fechas, el PDF…) se baja al abrir la pantalla que lo pide. En total la app sigue pesando lo mismo (3.395,6 KB repartidos en 14 archivos): solo cambia **cuándo** se carga. Comprobado en el navegador (versión de producción): al abrir se piden solo esos 4 archivos y se ve el formulario.
El CSS pesa un poco menos porque el del mapa ahora viaja con el mapa.

## Lo que he comprobado en el navegador
- **Versión de producción (`vite build` + `preview`):** abre la primera pantalla (el formulario «¿De dónde sales y a dónde vas?») pidiendo solo los 4 archivos de arriba, sin errores en la consola.
- **Versión de desarrollo, con una ruta de Roma creada con «Dev: ruta rápida»** (la única forma de llegar a la ruta sin IA): se abre la pantalla de la ruta (se carga al abrirla) en **HOY** (con su mapa), **Ruta** (mapa y tarjeta del viaje), **Días** (mapa y paradas), **Explorar** (las 7 tarjetas y el mapa) y **Reservas**; la **ficha** de una parada (con su mapa, Resumen/Tips, Horario, Cómo llegar) y el **Perfil** (con «Mis viajes» y su mapa). **Cero errores en la consola.** No he probado en navegador la pantalla de ruta de la versión de producción (el botón de la ruta rápida solo existe en desarrollo) ni Mis viajes ni «Preparando tu viaje…» (los cubre la prueba de código y la prueba de pantallas).
- La primera vez que arranca el servidor de desarrollo tras instalar paquetes, tarda en «reoptimizar» y la pantalla queda en blanco un par de minutos: es de desarrollo, no de la app.

## Pruebas
- `pruebaLogros1`: **354 comprobaciones, 0 fallos** (+24: la hora libre con Fiumicino, Ciampino y tren, el respaldo, la hora de salir el último día, y el Visto sin señal de las 13:00 que llega a las 15:00 —con [Hoy], con [Mañana], un Visto de las 9:00 y otro que llega al día siguiente—).
- `pruebaLogros2`: **54 comprobaciones, 0 fallos** (+9: el código partido).
- **Batería rápida: 72 pruebas, ninguna mal.** `tsc -p tsconfig.app.json` limpio.
- **Muestra de 60 fechas (6 tandas de 10, repartidas de oct-2026 a ago-2027): 0 fallos** (≈ 22.000 viajes y ≈ 61.000 días por tanda). Las 365 no se han lanzado. El motor no se ha tocado, así que es una comprobación de que sigue igual.
- Una prueba antigua (`pruebaTanda6v`) miraba que `App.tsx` montara el aviso de solape; ahora está en `RouteScreen.tsx` y la prueba lo mira ahí (misma comprobación, otro archivo).

## Riesgos
- **Lo que se carga al abrir otra pantalla tarda un instante** la primera vez (más en un móvil lento o sin buena señal): se ve el fondo vacío unos instantes. Para que no se note al crear un viaje, la ruta se va bajando mientras se prepara; **entrar a una ruta ya guardada** (la primera pantalla al abrir) sí espera a que baje (unos 185 KB comprimidos más el mapa de 520 KB).
- **El mapa (520 KB comprimidos) se baja al abrir la ruta**, no antes. Si se quisiera aún más rápido, se podría cargar el mapa después de pintar la ruta (hoy va con ella).
- Un fallo de red justo al cargar una parte deja esa pantalla en blanco hasta recargar (no hay «reintentar»): lo pondría Design.
- Si en algún sitio de la app se importa algo que arrastre el mapa o la pantalla de la ruta a la primera carga, el peso al abrir volvería a subir: la prueba (`pruebaLogros2`) lo vigila (que al abrir no entren el mapa, el PDF, «arrastrar» ni la pantalla de la ruta, y que pese menos de 1 MB).
- La hora libre del motor depende de los datos de llegada del destino: en un destino nuevo sin `_llegada.json`, el día de prueba se calcula con los 90 minutos de respaldo.
- No lo he probado con Supabase de verdad.
