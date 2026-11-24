Hola. TANDA V44: LO QUE ERIC HA VISTO EN EL MÓVIL TRAS LA V43, Y DÍAS. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**ANTES DE NADA: sube la nota `_estado_v44.md` a la rama `estado` al empezar y cada 30 minutos.** Van tres tandas sin subirla: Eric la necesita para seguirte. Además: 2 agentes como mucho, 1 Chrome, un servidor. No apagues el PC. Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. Consulta nueva a Supabase: cada cuánto y cuánto baja.

**Dibujos en Design, en «ULTIMO».** Copia SOLO el bloque del que se habla. Nombres y horas son ejemplos.

## 1. IMPORTANTE · La ubicación lejos del destino
Eric, en Barcelona, dio permiso a la ubicación y HOY mandó el Coliseo y el Foro a pendientes («Ya ha cerrado» a las 8:30) y puso «A pie · 10407 min». `cerradasDeHoy` suma el trayecto desde el GPS. Le pasaría a cualquiera que abra HOY en su casa o en el aeropuerto. La caja «A PIE» (o «EN COCHE») de la tarjeta de la parada:
- **En la ruta** (a 30 min andando o menos de la parada): «12 min · Desde ti», con [Actualizar] pequeño en la caja (siempre en este caso), y abajo «¿Ya estás aquí? [Ya he llegado]».
- **En el destino pero lejos de la ruta** (el aeropuerto) **o sin ubicación:** el tiempo del plan, diciendo de dónde a dónde: «19 min · Del alojamiento al Coliseo» (la primera del día, también el día de llegada) o «Del Panteón a la Fontana de Trevi». Sin ubicación, además, el recuadro de puntos «Sin tu ubicación no sabemos cuándo llegas», con [Usar mi ubicación] y [Ya he llegado].
- **Fuera del destino** (más de 50 km): la caja con «—» y «Estás lejos», y el recuadro de puntos «Estás lejos de Roma. Cuando llegues, contaremos desde donde estés.», sin botones y sin [Ya he llegado].
- **El GPS solo cuenta para minutos y cierres en el primer caso.** Nada se va a pendientes ni sale vacío por estar lejos (también en comer y en añadir un sitio). La app lo nota sola al acercarse, sin botón.

## 2. La tarjeta de la parada (ULTIMO)
- Dos cajas, una al lado de otra: «HORARIO» (con «Cerrado ahora · abre a las 9:00») y la del punto 1.
- **«Escucha su historia por el camino · 3 min», en azul oscuro desde el principio.** Al darle al play solo cambia ▶ por ❚❚ y se mueven las ondas.

## 3. Los avisos con [Deshacer]
- «Parada saltada» no lleva [Deshacer] (`saltar()` llama a `avisarAbajo` sin deshacer) y por eso sale arriba. **Todo lo que cambia la ruta lleva [Deshacer] y va abajo:** saltar, quitar, pasar a otro día, pasar todos, recuperar hoy y ya lo visité.
- Una vez se juntaron uno con [Deshacer] y otro informativo, arriba y con el texto pegado. **Juntar es SOLO para los de arriba.**
- **Al saltar, mira todo el día de golpe** (no lo hiciste en la V43): un solo aviso. Lo que ya pasó y no es visita (la comida a las 22:35) sale de la lista. «Han cerrado», en plural.

## 4. «Lugares pendientes» › «···»
Hoy son dos botones sencillos. Tiene que ser como el L3 y **con la misma pieza que la hoja de opciones de una parada en DÍAS**: «PARADA» y el nombre, y tarjetas grandes con icono, título y subtítulo («Recuperar hoy», solo si sigue abierto; «Ya lo visité»; «Quitar», en rojo).

## 5. «Quiero comer ahora»
- **El título según la hora:** «Desayunar cerca de ti» hasta las 11:30 (con [Café] marcado), «Comer cerca de ti» hasta las 17:00 y «Cenar cerca de ti» después. En el menú de «Cambiar plan» sigue siendo «Quiero comer ahora».
- **Sin ubicación:** «No tienes la ubicación activada · [Usar mi ubicación]», sin nombrar ningún sitio. La lista y el mapa, desde la parada de ahora. En el mapa, el punto de partida. El encuadre del mapa no se toca.
- **Debajo del nombre, el tipo** (`tipo_local`: «Cafetería», «Trattoria»…), no el plato ni el nombre repetido.
- **Si no hay nada abierto:** nunca vacío ni mandar a otra pantalla: «A esta hora aún no han abierto. Los más cercanos:», con «Abre a las 12:00».
- **Abajo del todo, [Ver todos en Explorar]:** EXPLORAR solo con el filtro Restaurantes, y el subfiltro si había uno.
- **En «Añadir un sitio cercano»,** la misma línea sin ubicación.

## 6. Nuevos sitios en Roma (Eric los aprueba)
En `restaurants` de `roma.json`, con el mismo formato, horario y dirección comprobados en fuentes de verdad, y la fecha de comprobación:
- **heladerías:** Ciuri Ciuri (Via Leonina) y Gelateria dell'Angeletto (Monti);
- **desayuno:** Oppio Caffè (Via delle Terme di Tito, con vistas al Coliseo), La Licata (Via dei Serpenti) y uno hacia Piazza Venezia (dime cuál).

## 7. Otros arreglos de HOY
- **El «mejor día»:** quita el tope de «menos de 7 visitas». Lo que cuenta es el tiempo: que quepa en las horas del día, con lo que tiene y los trayectos, sin quitar nada.
- **«Activa tu ubicación», sin pasos:** «Para guiarte en tu viaje necesitamos saber dónde estás. Activa la ubicación para jutrip.app en los ajustes de tu móvil o de tu navegador, y vuelve a esta página.», con [Entendido]. Los pasos de Safari no coincidían con el iPhone de Eric.

- **El billete nuevo, con QR** (llegada y vuelta, en HOY y en DÍAS; ULTIMO, Q1 a Q4): el billete de Design sustituye al de ahora. El icono de QR y la línea de abajo llevan al mismo sitio. Con la tarjeta de embarque guardada, dorado y «Tarjeta de embarque guardada»: abre el código en grande (`CodigoPantallaCompleta`). Sin ella, gris con «+» y «Añade tu tarjeta de embarque»: abre lo mismo que en RESERVAS. El de vuelta se titula «Vuelta · Vuelo XX1234». Candado si no hay pase.

## 8. El alojamiento en el mapa (M1 a M3)
- **El problema:** hoy la dirección no se busca. «Cómo llegar» abre Google Maps con el texto, y Google la puso en Mataró. Los minutos salen del centro de la zona.
- **Lo nuevo:** reutiliza «Buscar en el mapa» (`MapaDelAviso.tsx`), con la búsqueda **solo en la ciudad del viaje** (una caja del destino, no `proximity`). El viajero confirma el pin y se guarda ese punto en el viaje. Los minutos y «Volver al alojamiento» se cuentan desde ahí, y «Cómo llegar» abre el punto. Si cae en otra zona, se le propone la zona.
- **Antes, comprueba en las condiciones de Mapbox** que se puede guardar el punto que confirma el viajero (la búsqueda temporal no deja guardar resultados). Si no, solo añade la ciudad al enlace y dímelo.
- **Solo se AÑADE el mapa:** el nombre, la zona, «¿Para quién es?», el dinero y la reserva se quedan como están. En el M3 falta la zona: se queda.

## 9. El globo y DÍAS
- **El globo grande › [Ver destino]:** la página se abre por detrás (globo `z-[90]`, página `z-[80]`). Que se abra encima y, al cerrarla, vuelva al globo. Pruébalo desde los dos globos, con y sin viaje.
- **`ExtraDaySheet`:** «A partir de aquí, el viaje lo eliges tú: monta cada día a tu gusto.»
- **Día montado por el viajero** («lo hago yo», «Crear mi propio día», días más allá de los escritos): nunca «Hora de comer» ni «Hora de cenar» automáticas.
- **El día en blanco más allá de los escritos:** solo [Elegir mis sitios], en azul oscuro, y el título «Día por organizar».
- **Las franjas blancas de `StopConnector`** (`-ml-[26px] … bg-bg-card pl-[26px]`) se salen de la tarjeta. Que no se salgan, con capturas de todas las filas de un día.
- **Las pruebas viejas que fallaban:** `pruebaFase6y_manual`, `pruebaV36_cliente` (importante), `10N10_explorar` y `10N_propuesta`. Si la vieja es la prueba, ponla al día; si es la app, arréglala.

## 10. La prueba
- **`pruebaJutrip`, `pruebaV36`, `pruebaV43` y las de lo que toques, en 0.**
- **Nueva `pruebaV44`:**
  - con la ubicación en Barcelona y el viaje en Roma, nada se va a pendientes, sale «—» y «Estás lejos», y ninguna cifra es de más de un día;
  - en el aeropuerto, el tiempo del plan;
  - cada cambio de la ruta da [Deshacer] abajo;
  - el globo grande abre la página encima;
  - el día a mano sin comida ni cena;
  - ninguna franja fuera de la tarjeta.
- **En el REPASO:** capturas en tamaño iPhone de cada punto, tu lista de comprobación DE ESTA TANDA y qué cambia, en palabras sencillas.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que HOY, DÍAS y el Perfil cargan. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
