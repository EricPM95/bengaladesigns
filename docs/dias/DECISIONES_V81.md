# DECISIONES V81

## §3 Hojas con campo de texto y el teclado del iPhone (agente del apartado 3)

**Propuesta aplicada.** Una sola pieza global, no un arreglo por hoja: `src/lib/tecladoDeHojas.ts` (`instalarTecladoDeHojas`, llamada una vez en `main.tsx`) + dos reglas en `src/index.css`. Vale para TODA hoja porque todas son un `[role=dialog][aria-modal=true]` (`Hoja`, `HojaOpciones`, `HojaAbajo`, `HojaV2`, `HojaDeHora`, `Cuentanos`).
- Con un campo de texto con el foco y la vista visible (`visualViewport`) más de 120 px más baja que la ventana (y sin zoom), `<html data-teclado>` y `--vv-top` / `--vv-bottom` colocan la hoja EXACTAMENTE en la vista visible (encima del teclado).
- El panel de la hoja de encima se queda con el alto que tenía al ponerse el foco (alto mínimo estable, limitado al 92 % de lo visible): filtrar no lo encoge.
- En `HojaOpciones` (moneda, país…) título + buscador van en `data-hoja-cabecera`, que con el teclado se queda fijo (sticky) arriba mientras la lista se desliza.
- Sin `visualViewport`, sin teclado o en escritorio: no hace nada. Sin consultas a Supabase.
- V63: con teclado manda el teclado (el aviso de abajo queda detrás del teclado); al cerrarlo la hoja vuelve a quedar encima del aviso.

**Por decidir / no cambiado.**
- En las hojas que NO son `HojaOpciones` (reservas, nombres, notas), el título no se queda fijo al deslizar con el teclado abierto: sale con el panel. Si Eric lo quiere fijo en todas, habría que dar a `Hoja`/`HojaAbajo`/`HojaV2` una cabecera propia (cambio de estructura en cada una).
- El «alto estable» es el que tenía la hoja al ponerse el foco; una hoja corta (nombre de un viaje) no crece.

## §1 y §2 RESERVAS y DÍAS (agente de los apartados 1, 2 y 2b)

**§1 Fichas del contador (`ResumenViaje.tsx`).** Rejilla de columnas iguales: se mide la ficha más ancha (`data-ficha-contenido`) y el ancho de la tarjeta (ResizeObserver); 3 columnas si `3×ancho + 2×6 px` cabe, si no 2. Nombre siempre en una línea (`whitespace-nowrap`), nunca cortado. En un iPhone de 390 px la tarjeta mide ~328 px y la ficha más larga («Entradas 0/6», «Llegada y vuelta») ~140 px: salen **2 columnas**; 3 solo en pantallas más anchas o con nombres cortos. Propuesta si Eric quiere 3 en el iPhone: letra de 11,5 px o quitar el círculo ✓ (no se ha hecho).

**§2 Tarjeta de una reserva extra (R13 / R13b).** Misma pieza `TarjetaDeReservaExtraHoy` (DÍAS con `sinFoto`, HOY con imagen): etiqueta del tipo («OTRA», «FERRY», «TREN», «AUTOBÚS») y el nombre una vez; cajas A LAS / HASTA / LUGAR las que haya (tantas columnas como cajas: una sola va de punta a punta); fila «Tu reserva» con su QR (dorado / gris con «+»), sin círculo del medio, sin repetir nombre ni hora; en DÍAS borde dorado 1,5 px (el de R13) y cajas compactas. HOY: «Otra» usa las mismas cajas; un ferry, tren o autobús en HOY conserva SALE / LLEGA (R10, ya probado). En DÍAS un ferry/tren/autobús usa A LAS / HASTA (la llegada) / LUGAR (el puerto o estación de salida) como R13b; **el destino va en el nombre** («Ferry a La Graciosa»).
- **«Hasta las…»** (hoja de «Otra», opcional, `CampoDeHora`): se guarda en `returnTime` (misma columna que la llegada de un ferry; sin migración). Alimenta la caja HASTA y el fin del rato en el choque con una parada (sin él, 1 hora). La tarjeta de RESERVAS ya enseñaba `returnTime` (ahora también en «Otra»: hora — icono — hora).
- **Su sitio por la hora (DÍAS):** `lugarDeLaExtraEnElDia` (`reservasUnidas.ts`): delante del primer elemento (parada, comida o cena) que empieza a su hora o más tarde; con la misma hora, la reserva va delante y la cena pasa detrás. Antes se ponía encima de toda la franja y, con hora igual o con la cena en otra franja, salía después. La franja se corta donde entra (la línea punteada se interrumpe un momento). HOY: va antes de lo que viene (la próxima parada o la comida de ahora, la que sea más temprana) si su hora es igual o menor.
- **Decisión por confirmar:** si la cena es a las 19:00 y la reserva a las 19:30, por hora va DETRÁS de la cena (no se fuerza delante). El día no se mueve nunca.

**§2b «Casi lista» en grupo.** Comprobado: ya usa `PersonasCuadradas` (vía `BloqueDinero`) para «¿Para quién es…?» y «¿Quién la ha pagado?», repartidos a todo el ancho, sin pastillas; y no pinta ninguna línea de «Va a la cuenta…» (`sinLineas`), así que con «Mi cuenta» no puede contradecir. Sin cambios en código; queda cubierto por `pruebaV81`. Propuesta: si Eric quiere una línea pequeña («Va a Mi cuenta · Solo lo ves tú»), usar `lineasDeDestino` (ya coherente), quitando `sinLineas` en `HojaReservaExtra`.
