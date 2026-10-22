# Informe · Tanda 10E · La marca nueva en toda la app

No he tocado el motor de rutas. El zip de Design que usé es «Trazo App_ diseño de rutas personalizadas.zip» de Descargas (22-oct, 01:32); Eric confirmó que es el bueno. `docs/diseno/proyecto/` está al día con él (sin `uploads/` ni las capturas de prueba del zip).

Las capturas están en `docs/dias/capturas_jutrip/` (las de esta tanda empiezan por `10e_`) y la comparación con Design, en `docs/dias/MARCA_COMPARA.html`.

## 1. Los colores (Marca JUTRIP 01)
- Oro claro `#D8B98E` (solo líneas, pines, iconos grandes, rutas de puntos y brillos), oro oscuro `#A67C52`, oro profundo `#6F4E37` (también en `--accent-hover` y `--accent-warm`). Oro pálido, crema, marfil, tarjeta y tinta, igual. `--border-accent` recalculado (218 199 174) y `--accent-soft` en `#F1E3BF`.
- **El texto pequeño en oro va en `#6F4E37`**: `text-accent` ahora lo pide (variable nueva `--accent-texto`). `#A67C52` solo en títulos de 18 px o más (`text-accent-grande`), iconos, líneas y rellenos sin letra pequeña encima. En el formulario, `ACCENT` (letra pequeña) es `#6F4E37` y `ACCENT_GRANDE` (títulos) es `#A67C52`.
- Los colores escritos a mano en las pantallas (`#8B6620`, `#8E6820`, `#6E5018`, `#B58A2E` y sus `rgba`) pasados a los nuevos. No se tocaron los dibujos de medallas, sellos, emblemas, marcos ni el logo (su oro es el del metal).

### Dónde Design ponía texto pequeño en `#A67C52` y lo he pasado a `#6F4E37`
Etiquetas («ROMA · 28 – 31 OCT», «JUE 17 · CENTRO HISTÓRICO», «QUÉ VAS A VER»), «+ Añadir parada», enlaces («Crea tu cuenta»), la letra de la pestaña elegida de la barra, la frase de la apertura y las cifras pequeñas de las listas. El **icono** de la pestaña elegida sí va en `#A67C52` (es un icono, como pide Marca 03).
Además, el título «¿De dónde sales y *a dónde vas?*» de la primera pantalla, que está sobre el mar azul, va en `#6F4E37` (con `#A67C52` daba 2,6 sobre el mar, menos de 3).

## 2. Los botones principales, en champán
Degradado marfil `#FBF3E2` → champán `#EBD9AE`, letra `#6F4E37`, brillo y sombra. Una sola definición: la clase `btn-champan` (`src/index.css`) y `botonChampan()` (`src/lib/marcaBoton.ts`). Sobre paneles oscuros, la variante con borde y letra en oro pálido (`botonChampan(true)`). Lo elegido (pestaña o pastilla seleccionada) pasa a tinta.

**Comprobado:** ninguno de los botones cambiados es «Visto» (sigue en verde). Entre los que cambié había dos de borrar/quitar y **los dejé en el rojo de los avisos**: «Quitar del viaje» (`ReservedMarks.tsx`) y «Sí, reiniciar» (`AdminLogros.tsx`, solo para pruebas). Los que estaban sobre un panel oscuro (la invitación, la barra de propuesta, Compartir en la vitrina de logros) usan la variante en oro pálido. Ninguno de los champán va sobre una foto: los que van sobre la foto de una tarjeta (la etiqueta «Día 2 de 4» de las tarjetas de viaje del perfil) son pastillas, no botones, y son champán con la letra en oro profundo.

### Los que eran de tinta y ahora son champán (para que Eric los mire en las capturas)
- **Ajustes y cuenta:** «Compartir el enlace» (Ajustes), «Invitar» (Mis pases), «Abrir mi correo» (Entrar), «Reintentar» (pantalla perezosa), botón grande del perfil (`PerfilSheet`), «Continuar con Google» (Entrar, ya era champán).
- **Logros:** «Ver el resumen del viaje», «Seguir» (resumen del día), «Compartir mi viaje», «Terminar» (Dónde has estado), botón de la página de viaje guardado, «Continuar» y «Abrir la cámara» (hojas del «Visto»), «Volver al viaje» (propuesta enviada), álbum de viaje.
- **Ruta, días y hoy:** «Cómo llegar» (ficha de la parada y vuelta a casa), «Quiero entrar», «Elegir mis sitios» (dos), «Cambiar a Roma», «Añadir a mi viaje», «Añadir foto» (HOY), «Ver mi primer día», «Nuevo viaje» (HOY después, v1 y v2), «Pasarla a otro día», «Añadir» (más para tu día), «Subir mis fotos», «Foto», «Sí, ponla», «Guardar» (excursión, alojamiento, extra del día), «Vale»/«De acuerdo»/«Entendido» de los avisos, «Sí, ajústala», «Hoy vuelves a casa».
- **Reservas y presupuesto:** «Guardar» (reserva, precio, vuelo, alojamiento), «Añadir» y «Guardar» (presupuesto), «De acuerdo» (resumen del vuelo), «Buscar alojamiento», «Ver excursiones», «Buscar» y «Comprar» (Útil para el viaje), aviso de solape, selector (`PickerSheet`).
- **Hojas en general:** `BotonHoja` «principal» (era ámbar) y «oscuro».

Los que eran de oro con letra blanca (≈ 46: «Reservar», «Ver disponibilidad», «Añadir paradas», «Reintentar», botones de las excursiones, etc.) también son champán ahora; los dos que eran «lo elegido» (pestañas de día, lugares elegidos y filtros de «Mis atracciones») pasaron a tinta.

## 3. RESERVAS (Marca 02 · 06)
«0 de 3 listo» en oro (cursiva); los círculos de «Llegada y vuelta», «Alojamiento» y «Entradas 0/4» en oro claro; los cuadros de los iconos (avión, cama, entrada y los de «Útil para el viaje») en champán con el icono en oro. «Falta» y «0 de 4 reservadas» siguen en frambuesa. Lo mismo dentro de los acordeones y las hojas. «Reservar»/«Añadir +» de cada fila, en champán.

## 4. El frambuesa que queda
Solo para **lo que falta** y **resaltar**:
- Lo que falta: «Falta» y «0 de 4 reservadas» (RESERVAS), la franja de la entrada sin reservar (tarjeta y pestaña), la franja de «Te falta por reservar» (HOY), el color de `falta` de los iconos, lo pendiente en Logros («Te quedan N sorpresas por reclamar», el plazo de la foto pendiente, lo que falta para otro viaje, el borde discontinuo de lo que aún no está en la ruta).
- Resaltar: el corazón de «lo recomiendan», las piezas de la colección principal y el progreso de las colecciones.
- Puntos como el de Avisos: la campana de arriba (`Header.tsx`), la lista de avisos, el puntito del botón flotante de Logros y el de «Lo nuevo de hoy».

**Logros, lo «nuevo»:** si es un punto, se queda en frambuesa; si es una etiqueta o un texto, pasa al oro. Así: la pastilla «Nuevo» del pasaporte, la etiqueta «nuevo» de cada colección, el texto «Lo nuevo de hoy» y el fondo de la colección nueva → oro (champán con letra `#6F4E37`). Los puntos, quietos en frambuesa.

**Pasados de frambuesa a oro o tinta:** cuadros de iconos y círculos de RESERVAS, «0 de 3 listo», botón «Reservar» de la tarjeta de la entrada, franja del traslado privado (ficha de llegada), botones «Reservar traslado» y «Reservar», la etiqueta «Día 2 de 4»/«Abierto» de las tarjetas de viaje, la etiqueta «En curso» del perfil, la etiqueta de la hoja de logros, el icono del aviso de «después del viaje», las cifras del resumen del día, el icono de «Parece que no estás aquí» y la franja de la ficha de un sitio. Los avisos de error de las hojas del «Visto» (foto que no vale, ubicación) pasaron al **rojo de los avisos**, que es lo que son.
No cambian: el verde de «Visto» y de lo reservado, el rojo de los avisos, el lila de los barrios y los colores de cada día de la ruta (azul, naranja, verde).

## 4b. Lo que no he cambiado a propósito
- La pantalla de Entrar sigue con fondo blanco (lo pidió Eric antes).
- En Logros, los naranjas propios de esa sección (los «+», la pestaña elegida) y los emblemas siguen como estaban: son de su diseño.
- `ExpPrueba` (pantalla de desarrollo) sigue con su frambuesa.
- El icono del móvil (`public/icons`, `favicon.svg`, `iconosJutrip.mjs`) no se ha tocado.

## 5. El logo y la apertura
- **Logo nuevo:** la palabra JUTRIP en Italiana con el degradado de oro y la estrella sobre la I (`shared/marca/logoJutrip.js`, un solo sitio). Donde salía el logo P4 (la estrella con anillo y ruta de puntos, y la palabra en Bodoni): la apertura, Entrar, los huecos del logo (invitación y avisos; en un hueco pequeño, solo la estrella) y el **logo pequeño de una línea** de la primera pantalla y del formulario de crear el viaje. El pequeño es el mismo logo nuevo, **quieto**, y el lema («De viajeros, para viajeros») que sale a su lado también va quieto. **La Bodoni ya no existe en ningún logo ni se carga**; la animación es solo de la apertura.
- **Apertura:** marfil con su luz, brillo detrás, el logo entra de borroso a nítido, destello, chispas, la frase letra a letra y la ruta de puntos con su pin (`shared/marca/aperturaJutrip.js`). Sale **una sola vez** y dura **3 segundos** (la frase se reparte para acabar en ese tiempo, del 22 % al 88 %); a los 3 s entra en la app, y un toque la salta. Con las animaciones reducidas queda quieta, con el logo y la frase. La frase es la de la marca, «De viajeros, para viajeros», en el oro profundo.
- Las capturas de la apertura están paradas en tres momentos (logo entrando, frase a medias y final).

## 6. La barra
La A (tinta), con el icono de la pestaña elegida en `#A67C52` sobre su pastilla marfil y su letra en `#6F4E37`.

## 7. La prueba
`pruebaJutrip` salió con 4 fallos en una pasada intermedia. Qué eran y dónde lo arreglé:
1. **«La pantalla de entrar lleva JUTRIP»** — *prueba*. El texto del logo nuevo se parte al leerlo («JUTRI» y «P», por la estrella de la I); a la vista no cambia nada. Ahora la prueba lee solo las letras, y sigue exigiendo que la palabra esté entera.
2. **«El oro claro sobre crema»** — *prueba*, porque cambió el color: el oro claro ahora da 1,63 (antes 2,8). La prueba pedía «entre 2,5 y 4,5»; ahora pide «menos de 2,5». Sigue comprobando lo que importa: que el oro claro no sirve para texto.
3. **«El frambuesa solo queda en lo permitido (sobraba Header.tsx)»** — *prueba*: es el punto de Avisos de la campana, que es un uso permitido; lo apunté en la lista. (Antes ese punto usaba el oro; lo pasé a frambuesa, como pide el prompt.) Además quité de la lista lo que ya no usa frambuesa (`ResumenViaje.tsx`, `ArrivalReturnSheet.tsx`).
4. **«[Cómo llegar] en el degradado de marfil»** — *prueba*: la prueba buscaba el degradado escrito en `piezas.tsx`; ahora vive en `marcaBoton.ts`, y la prueba mira que `piezas.tsx` use `botonChampan()` y que `marcaBoton.ts` lleve el degradado y la letra `#6F4E37`.

Ninguna fue un fallo de la app. Las pruebas no se aflojaron: los contrastes del texto se exigen en 4,5 con los colores nuevos, y se añadieron comprobaciones nuevas (el oro oscuro **no** llega a 4,5, así que el texto pequeño va en el profundo; la apertura dura 3 s, no se repite y se queda quieta con las animaciones reducidas; ya no hay Bodoni). Además cambié un `medir` que habría quedado flojo: el título sobre el mar se mide con el color que se usa de verdad (`#6F4E37`, mínimo 3), en vez de bajar el mínimo. También actualicé `pruebaCuentas3` y `pruebaTanda10B` al color nuevo (un hex y un `rgb`) y esperé en `pruebaJutrip` a que exista la ruta de pruebas (a veces fallaba por correr antes de tiempo).

Resultado final: ver abajo.

## 8. Lo que no he podido dejar como Design y por qué
- Marca JUTRIP no tiene pantalla de RUTA ni de Crear el viaje: esas dos van sueltas en la comparación.
- Design pone en la barra la letra elegida en `#A67C52`; la dejé en `#6F4E37` por la regla de lectura (el icono sí va en `#A67C52`).
- La apertura de Design es un bucle de 5,6 s con «TU APP DE VIAJES»; la nuestra es de una vez, 3 s, con nuestra frase.
- La 10 de Marca («una parada por dentro») no salió en la captura automática de Design; la comparación enseña solo nuestra ficha.

## 9. Resultado final
`pruebaJutrip` 129 comprobaciones, 0 fallos · `pruebaCuentas3` 476, 0 fallos · `pruebaTanda10B` 141, 0 fallos · `tsc -p tsconfig.app.json` limpio. Capturas y `MARCA_COMPARA.html` rehechas con la apertura de 3 s y el logo pequeño quieto.
