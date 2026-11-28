# DECISIONES V82 («Todos mis logros» nuevo)

Todo lo de abajo es lo que NO se ha decidido solo. Cada punto lleva mi propuesta.

## 1. ¿«Roma 2026» o «Roma 2027»? (lo que pidió Eric que mirara)
**Sí: el dibujo de Design dice 2027.** En N1 (los exclusivos del final) y en P3b (la tarjeta con 8 exclusivos), la medalla de Roma lleva «ROMA 2027» escrito. La app no lo copia: dibuja la medalla real, con el año real de la edición (hoy, «Roma 2026»). Propuesta: no hacer nada (es un error del dibujo). Lo mismo con los otros errores que decía el prompt: «Lanzarote 2026» con el dibujo del Probador, las monedas de P1 (dice «2 de 7» con 3 conseguidas), los exclusivos repetidos de P3b y las banderas de otro destino: no se copian; todo sale de lo real.

## 2. Las 7 maravillas y los exclusivos viven DENTRO de «Todos mis logros», sin pantalla aparte
En el dibujo N1 las 7 maravillas y los exclusivos son dos bandas azules de lado a lado al final de la pantalla (con el mismo contenido que P1/P1c y P2/P2b). Las he hecho como esas bandas (`Escaparates.tsx`: `BloqueMaravillas`, `BloqueExclusivos`), sin crear dos pantallas más que repetirían lo mismo. La animación completa de las 7 sale la primera vez que la banda se ve en pantalla (se apunta en el móvil) y las demás veces sale el brillo suave y [Volver a ver]. Propuesta: dejarlo así. Si Eric prefiere una pantalla propia al tocar la banda, es media tanda.

## 3. La vitrina en los exclusivos y las maravillas
El servidor NO deja llevar a la balda de la vitrina un exclusivo ni una maravilla (siempre están en el pedestal y en la balda de exclusivos, solas). Por eso la pastilla de arriba a la derecha de la ficha azul (N2) sale ya en «✓ En tu vitrina» y sin botón (no hay nada que elegir); donde sí se puede elegir (emblemas, logros de viajero, medallas de ciudad y colecciones completas) es el botón de siempre. **Incoherencia que dejo:** el «+» naranja pequeño de las tarjetas de exclusivos (que el prompt dice que se queda) sigue en «+» porque no están en una balda elegida, aunque en la ficha pone «✓ En tu vitrina». Propuesta: cambiar ese «+» de las tarjetas por un ✓ verde (es lo cierto) o quitarlo; lo dejo como estaba hasta que Eric diga.

## 4. Los exclusivos «que aún se pueden ganar»
Solo sale lo que se puede asegurar: **la edición de este año de cada destino que aún no has visitado este año** («Lanzarote 2026 · Visita Lanzarote en 2026 · Hasta el 31 de diciembre»). No salen: ediciones de años pasados, el Probador (se da a mano) ni el fundador ni el pionero, porque no tienen una fecha límite propia que enseñar (el fundador depende de la fecha de alta y del primer viaje de cada cuenta; el pionero de cuántos viajeros haya ya en ese destino). Propuesta: si Eric quiere que salgan también, hace falta decirme su regla visible («Visita X antes de…», «Quedan N plazas»).

## 5. La vitrina «llena»
El prompt dice «con la vitrina llena (3)». Cada balda tiene **4** huecos, y `ElegirHueco` enseña 4. Probado con la balda de logros de viajero llena (4): «Llevar a mi vitrina» abre `ElegirHueco`. Propuesta: dejarlo en 4 (cambiar a 3 toca el servidor y lo guardado de la gente).

## 6. La imagen para compartir la colección
Se dibuja en el navegador (el mismo método que «Compartir un logro»). Dos pegas pequeñas, no comprobadas en un iPhone real: (a) las letras de la imagen salen con la letra de reserva del sistema (serif) en vez de «Instrument Serif», porque una fuente de la web no entra dentro de la imagen; (b) el texto minúsculo de las monedas de las maravillas sale al revés en la imagen (no se lee a ese tamaño). Propuesta: si no gusta, dibujar la imagen con lienzo propio (como la del logro suelto), media tanda.

## 7. «Un solo botón dorado por pantalla»
En «Todos mis logros» hay dos [Presumir de mi colección] (arriba y abajo), como pidió el prompt; no se ven a la vez. En las fichas, el dorado es [Compartir] (o [Entendido] cuando no tienes el logro), uno solo.

## 8. Lo que no se ha tocado
- El visor de piezas de «Mi vitrina» (la pestaña de al lado, `Vitrina.tsx`, que abre una pieza con [Compartir] y [Quitar de mi vitrina]) sigue con su forma propia: el prompt no la nombra.
- Las 84 pruebas mal apuntadas de `_bateria_365.md` y las 21 decisiones de `CHECKLIST_V77_V81.md`: sin tocar.
