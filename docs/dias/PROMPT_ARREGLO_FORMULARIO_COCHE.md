Hola. ARREGLOS PEQUEÑOS DEL FORMULARIO Y DE RESERVAS (Eric, 5-nov, 15:13 y 15:33). Va después de la HOY3 (ab2cc25), de la activación de los avisos y del arreglo de la web en el iPhone. Este mensaje acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Antes de empezar:** si al activar los avisos no comprobasteis la migración 0073 (contador de lecturas de documentos), guía a Eric:
- que pegue `docs/dias/COMPROBAR_0073.sql` en el SQL Editor;
- si sale «FALTA», que pegue `supabase/migrations/0073_lecturas_de_documentos.sql`.
Hace falta para [Añadir tu reserva] del coche.

## 0. LO PRIMERO: Lanzarote sin Claude
En tu informe de la HOY3 dices que `generate-day-places` llama a Claude para Lanzarote: el atajo sin Claude solo cubre Roma hasta 5 días. Sin saldo, no se puede crear un viaje a Lanzarote, y las pruebas gastan saldo.
- **La regla (5-nov):** un destino curado nunca depende de Claude. Lanzarote, todos sus días con nuestros datos (`listas.json`, `cocheTrip.js`…), como Roma.
- **Antes de tocar nada, dime:**
  - qué hace hoy Claude ahí para Lanzarote;
  - cuánto cuesta cada viaje.
- **Si es grande** (más de unas 2 h), dímelo y lo dejamos para después del viaje.
- **El viaje de Eric tiene que salir IGUAL que ahora** (`docs/dias/_hoy3_ruta_eric.json`).
- **Roma de 6 días o más:** dime qué hace Claude, pero no lo cambies ahora.

Eric ha creado su viaje (Barcelona → Lanzarote). En «¿Cómo quieres llegar a Lanzarote?» ve el resto en gris, la caja «Para moverte: Coche de alquiler ✓ [Cambiar]» y «Ir en avión · Continuar», pero no la fila del avión.

## 1. Fuera la caja «Para moverte» (decisión de Eric)
- **La regla, para todos los destinos:** el formulario solo pregunta cómo llegas y, si cambia la ruta, cómo quieres vivir el destino (la pregunta de «ruta en coche» o «desde una base», cuando el destino es dudoso). El vehículo para moverte allí (alquiler, el tuyo, una caravana) NO va en el formulario: va en RESERVAS, con el valor por defecto del destino.
- **Lanzarote:** quita la tarjeta «Para moverte» de `vehicleFlow.ts` (la del arreglo). Se queda lo que se da por hecho sin enseñarlo: coche de alquiler y base fija. En RESERVAS, el bloque «Coche de alquiler | Mi coche» lo cambia, como hasta ahora.
- **Comprueba que «Mi coche» en RESERVAS quita la hora de recoger el coche** del día de llegada (la regla de la LL) y que «Coche de alquiler» la vuelve a poner. Dime si ya era así.
- **Los demás destinos que hoy preguntan el vehículo en el formulario** (`BaseYExcursionesTransportFlow`, `RoadtripTransportFlow`, `UrbanoTransportFlow`): NO los toques ahora. Dime qué preguntan y en qué casos, y lo pasamos a RESERVAS después del viaje, destino a destino.

## 2. El avión, como opción y la única encendida
- La fila «Avión», con su tiempo («4-5 h»), sale en la lista como las demás: la primera, encendida y marcada. El resto, en gris con «Sin ruta».
- Que se vea sin hacer scroll en un móvil normal: hoy no se ve.
- Debajo, la frase «Desde Barcelona solo tiene sentido llegar en avión.» y el botón «Ir en avión · Continuar».
- Igual desde Madrid, Bilbao o Sevilla. Roma, como estaba.

## 3. «Trazando tu ruta…»: 10 segundos
- En el viaje de Eric, la pantalla de carga ha tardado unos 10 s.
- Mide dónde se va el tiempo, en producción y con Lanzarote: la red, el arranque del servidor, el motor, los tiempos en coche… Compáralo con Roma.
- Si Lanzarote tarda más por los trayectos en coche, que use la tabla que ya tenemos (`tiempos_en_coche`), sin llamadas de fuera.
- Lo que buscamos: como Roma, y que no pase de unos 4-5 s. Dime cuánto tardaba antes y cuánto tarda ahora.

## 4. «LAN» no existe: es «ACE»
- En la pantalla de carga y en los chips sale «BCN → LAN». El código de Lanzarote es **ACE** (el de su aeropuerto, como BCN).
- Añade `lanzarote: 'ACE'` en `cityCode.ts`.
- Mira que no salga «LAN» en ningún otro sitio.

## 5. El aviso «Tu viaje a Lanzarote empieza en 3 días»
- Le ha salido a Eric encima de la pantalla de carga. Tiene que salir UNA vez, ya dentro de la app, con la ruta abierta (después de [Ver mi ruta]).
- Lo mismo con cualquier otro aviso que pueda saltar mientras se crea el viaje.

## 6. RESERVAS: el bloque del coche (Design `Coche Lanza` 06a)
- **«¿Para quién es?»** con la regla de todo RESERVAS (`gente.length >= 2`, como en el alojamiento, las entradas y las excursiones): solo si en el viaje hay 2 personas o más. Hoy el coche se la salta y sale «Tú» solo.
- **[Añadir tu reserva], como en el alojamiento (A1):**
  - la línea «Desde el PDF, una foto o una captura.»;
  - la app lee la confirmación: compañía, coche (modelo o grupo), recogida (sitio, día y hora), devolución (sitio, día y hora), precio y código. Todo se puede corregir a mano.
  - Hoy solo se llega a la hoja tocando las fechas, y no se ve: el botón tiene que estar a la vista.
- **Con la reserva puesta:**
  - el bloque pasa a «Listo», con compañía · coche · precio, y la recogida y la devolución;
  - la hora de recogida de verdad cuenta en el día de llegada, y la de devolución en el último día (la hora límite de la LL).
- **Sin pase:** la misma regla que en el alojamiento.

## 7. RESERVAS: [Buscar vuelos] en el vuelo (Eric)
- **El botón:** como el alojamiento tiene su [Buscar], el vuelo sin reservar lleva [Buscar vuelos]. Abre el buscador con el origen, el destino y las fechas del viaje (BCN → ACE, 8-13 nov). Nunca el nombre de la web en el botón.
- **Los enlaces de afiliado (Eric, 5-nov):** hoy van todos SIN nuestro código. Ponlos en UN solo archivo (por ejemplo `src/lib/enlacesAfiliado.ts`) y úsalos en todos los sitios donde salen:
  - **vuelos (Skyscanner):** `https://skyscanner.pxf.io/B539xL`. Para [Buscar vuelos] con origen, destino y fechas, usa el enlace profundo de su red (`?u=` + la dirección de la búsqueda, codificada). Comprueba de verdad que acaba en la búsqueda buena (BCN → ACE, 8-13 nov) y no en la portada;
  - **seguro (IATI):** `https://www.iatiseguros.com/?r=60565847640308`;
  - **eSIM (Holafly):** `https://holafly.sjv.io/NGxJQK`;
  - **coche (DiscoverCars):** `https://www.discovercars.com/es?a_aid=JUTRIP`. Si se puede, con el destino y las fechas del viaje (recogida y devolución) sin perder el `a_aid`; compruébalo;
  - Comprueba que cada enlace abre bien y dime cuáles has cambiado. El nombre de la web, nunca en el texto del botón.

## 7b. «Útil para el viaje» (`UtilParaElViaje.tsx`)
- Fuera la fila de vuelos: el vuelo ya tiene su bloque con [Buscar vuelos].
- En los destinos con el bloque del coche (Lanzarote), fuera también la fila de alquiler de coche: está repetida. En Roma se queda.
- Se quedan la eSIM, el seguro y lo demás.

## 7c. Las 4 decisiones de Eric (tu informe de la HOY3)
1. **«¿Cómo vais?»:** 1 h después de empezar la comida y no más tarde de las 18:30. Sí.
2. **El último aviso del viernes:** a la hora de la T1 menos 30 min (16:40 en el viaje de Eric), con el texto «En media hora tienes que dejar el coche en la T1 (antes de las 17:10).». Fuera el de las 15:17.
3. **La lista roja «X cierra hoy…»:** fuera, porque repite la tarjeta de la mañana.
4. **Los compañeros de un viaje compartido** reciben los avisos, y cada uno los puede apagar en Ajustes.

## 7d. DÍAS de Lanzarote (Eric, 6-nov)
- **Las fotos** van en un mensaje aparte (`PROMPT_FOTOS_LANZAROTE`), después de este.
- **El trayecto en coche, como en Roma:** en vez de [Abrir en Maps] (que va solo a la parada), el enlace **«Rutas»**. Abre la misma hoja de Roma (`OpenInMapsSheet`, Google Maps o Apple Maps) con la ruta de una parada a la siguiente, **en coche**, con los nombres y el pueblo (la regla de la LZ3b). **Fuera la línea «+5 min para aparcar»** (Eric no la quiere ver); esos minutos siguen contando por dentro.

## 8. La prueba (corta, decisión de Eric: sin la batería entera)
- **Solo estas:**
  - `pruebaJutrip`;
  - `pruebaArregloCrearLanzarote`, al día con lo de este arreglo;
  - la muestra de 60 de Roma, idéntica;
  - la de la HOY3, por las decisiones;
  - el viaje de Eric con la clave de Claude vacía, que sale igual.
- **Las demás de Lanzarote:** si el apartado 0 queda hecho, ya no gastan saldo, así que pasa una sola vez las de HOY2 (A, B, C). Si no, no las pases.
- **En el REPASO, capturas de móvil:**
  - el paso del transporte desde Barcelona;
  - el coche sin reserva y con ella;
  - el vuelo con [Buscar vuelos];
  - un trayecto en coche con «Rutas».

**Después del push, comprueba PRODUCCIÓN** (lo de anoche, 2b2b145, tiró toda la API sin que ninguna prueba local lo viera):
- espera a que Vercel acabe de desplegar;
- abre bengaladesigns.vercel.app en modo iPhone;
- comprueba que responden `/api` (la clasificación de Lanzarote como administrador y el clima, por ejemplo) y que la app carga. Si algo falla, avísame enseguida.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
