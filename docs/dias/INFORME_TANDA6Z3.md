# Informe de la Tanda 6z3

## Lo que ve el viajero
- **Barra de abajo**: Hoy · Ruta · Días · Explorar · Reservas, siempre igual y siempre a la vista. Reservas lleva un «!» cuando falta algo por resolver. El selector de arriba y la barra vieja desaparecen.
- **Cabecera**: el destino y debajo «13 – 16 oct · 2 personas» (sin fechas: «octubre · 2 personas»). A la derecha, Presupuesto (cartera, abre la pantalla de la 6z2), la campana con su punto y Perfil.
- **Dónde fue el «+» de nuevo viaje**: no cabía en la cabecera, así que está dentro de Perfil (junto a Tips del viaje y Mis viajes). También sale en HOY al acabar el viaje.
- **HOY, siempre presente**, y su contenido cambia según el momento:
  - *Antes*: tarjeta oscura con la cuenta atrás, «Te falta por reservar» (cada [Reservar] abre la ficha de la entrada, el mapa de alojamientos o la llegada y la vuelta), lo ya hecho en verde, «Útil para el viaje» y «El tiempo en {destino}». Sin fechas: «Tu viaje a {destino} · octubre» con [Pon tus fechas].
  - *Durante, gratis*: «HOY · {fecha}», el título del día y la lista de paradas; la hora solo sale en las reservas (pastilla verde «✓ 9:00»), y el botón de la cámara.
  - *Durante, de pago*: tarjeta oscura «SIGUIENTE PARADA · n» con mapa pequeño, nombre, distancia (desde tu ubicación si la compartes; si no, desde la parada anterior), [Ubicación], [Cómo llegar] (abre Google Maps) y [✓ Visto] (que ofrece «Añadir foto»), aviso de entrada, aviso de lluvia con [Ver alternativa] y la lista «2 de 5 visto». Ninguna hora calculada por la app.
  - *Después*: «Tu viaje a {destino}», los días con su fecha, «Guarda tus recuerdos» con las fotos y [Subir mis fotos], y «¿A dónde vamos ahora?» con [+ Nuevo viaje].
- **Iconos**: una sola familia (`src/lib/iconos.ts`), de línea y gris. La excursión lleva la **mochila**; el autobús queda solo para la llegada y la vuelta en autobús. Pasan a la familia: los de EXPLORAR, los de tipo de parada, los de BloqueReservas, los de preparación del viaje, los de horas, los de líneas y los de modos de transporte, además de los svg sueltos (85 archivos).
- **Colores**: la frambuesa `oklch(0.55 0.17 5)` es ahora lo de «falta» y «reservar», en un solo sitio (los tokens `--accent`, `--accent-hover`, `--accent-soft`, `--accent-warm`, `--border-accent` de `src/index.css`): botones Reservar, pestañita de entradas de DÍAS, «+» de EXPLORAR, «Falta» de RESERVAS. El verde sigue siendo «hecho»; el azul, llegada, vuelta y tiempo, sin cambios. Contraste calculado ≥ 4,5:1. Quedan con su color propio, a propósito, los degradados de temporada, el confeti de fechas especiales y los colores por categoría de los pines de EXPLORAR.
- **Con fechas no hay «Día n»**: la ficha de DÍAS dice «LUN/13», desaparece la línea «DÍA 1 · LUN 13 OCT», la hora reservada ya no sale en la cabecera cerrada y los textos dicen «el lun 13», «el martes 14». Sin fechas, todo como antes. Se hace en un solo sitio, `src/lib/nombreDeDia.ts`, y cubre hojas, avisos, reservas y el PDF.
- **Fotos**: en un sitio privado de Supabase (bucket `fotos-viaje`, tabla `trip_photos`), solo con acceso del dueño, reducidas a 1600 px y siempre sin los datos EXIF; se pueden borrar de verdad. Una foto reducida pesa unos 200–400 KB. Sin límite por ahora. **La migración `supabase/migrations/0018_fotos_viaje.sql` hay que aplicarla a mano en el panel de Supabase**; sin ella, las fotos se desactivan sin romper nada. El mapa de viajes del perfil no entra en esta tanda.
- **Respuestas a la 6z2**: pulsar una tarjeta de «Útil para el viaje» abre la tienda y **no** la marca como añadida; cada una tiene «¿Ya lo tienes? Añádelo», que abre la hoja del precio, y solo entonces cuenta. Los traslados no van; el taxi va en Extras. La guía de destinos nuevos dice ahora que cada precio de los datos lleva su moneda.

## Pruebas
Todas las de siempre a 0 fallos, más las nuevas: `pruebaTanda6z3.mjs` (19.028 comprobaciones: la barra con cinco pestañas siempre, HOY en cada momento con fecha simulada, 0 «Día n» con fechas, 0 horas calculadas en HOY, nada de pago en HOY de la gratis, colores e iconos), `pruebaDiasFecha6z3.mjs` y `pruebaFotos6z3.mjs` (sin EXIF y borrado real). `tsc` limpio.

## Pendiente de ti
Ver `PREGUNTAS_TANDA6Z3.md`. La 6y (la ruta a mano) no se ha tocado.
