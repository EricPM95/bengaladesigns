# Repaso de diseño 3 (1 de octubre de 2026)

Regla nueva: INVARIANTES 412. Commits `d4ad485`, `069a0c6` y `080f24d`, sin push.

**No hay capturas.** El panel del navegador sigue sin mostrarse: las animaciones no avanzan y no se puede recorrer la app hasta la ruta. Lo comprobado es que compila (`tsc` y `vite build`), no cómo se ve a 390 px ni en escritorio.

## 1. Pestaña Ruta

- Una tarjeta por destino, en el orden del viaje: la bandera a la izquierda, el nombre del destino («Roma»), debajo «4 días · 03 sept – 06 sept» (sin fechas, «4 días») y la flecha a la derecha.
- Fuera «PAÍS 1», los tres puntos y «1 destino». Entre dos destinos se queda la distancia.
- **La ventana de antes no se había quitado**: seguía en el código (`DestinationDetailModal.tsx`), pero solo se llegaba a ella abriendo la tarjeta del país y tocando el destino. Ahora se abre al tocar la tarjeta. Va tal cual, con sus enlaces de afiliado. Dos cosas que conviene que sepas:
  - Sus títulos dicen **«🏨 Alojamientos en {destino}»** y **«🎟 Actividades en {destino}»**, no «Hoteles en…». No he encontrado en git ninguna versión con «Hoteles en» en esta ventana. No lo he cambiado: dime si lo cambio.
  - **Enseña precios** («/noche» en los hoteles, y el de cada actividad), que son de prueba. Choca con «sin precios»; lo he dejado tal cual porque pedías recuperarla sin cambios.

## 2. Margen de las franjas

Cada cabecera («MAÑANA · 08:30 — 13:05», TARDE, NOCHE) lleva 28 px arriba y 12 abajo. La primera también, debajo de la barra de llegada. Antes la separación la ponía cada bloque, con 50 px, y la comida y la cena iban sueltas.

## 3. Comidas y cenas que se arrastran

- La tarjeta de la comida y la de la cena llevan la misma asa de tres rayitas que las paradas, en el mismo sitio y del mismo tamaño.
- Al soltarla encima de una parada, va detrás si se baja y delante si se sube. Las horas se recolocan por posición, como al mover una parada: quien ocupa un hueco se lleva su hora, y lo que se pisa se empuja.
- La comida no puede acabar en la noche ni detrás de la cena; la cena no puede acabar en la mañana ni delante de la comida. Fuera de su parte, vuelve a su sitio.
- Una parada soltada encima de una comida o una cena vuelve a su sitio.
- El motor no se entera: solo cambian la hora y el orden en que se ve (`DayPlan.mealAfter`).

## 4. Un solo icono

- Las rutas traían el emoji delante del texto («🚌 Bus 115»), y la fila ponía además el icono lineal. Ahora va solo el icono lineal, del tamaño y grosor del caminante.
- Uno por tipo: bus, metro y tranvía (dos iconos nuevos, de línea fina) y el coche para el taxi.
- Vale también para las rutas ya guardadas, que traen el emoji.

## 5 y 6. Comida y cena, con su espacio y alineadas

- Iban fuera de la línea del día, más anchas que las paradas. Ahora cuelgan de la línea, con el mismo borde izquierdo y derecho que las paradas.
- Llevan encima el mismo hueco que hay entre dos paradas, y debajo el de la parada siguiente.
- Casos: comida después de una parada; cena después del aperitivo (antes iban pegados); cena después de una parada de noche; comida o cena al final del día, antes de «Fin del día».

## Para decidir

1. ¿«Alojamientos en…» o «Hoteles en…» en la ventana del destino?
2. ¿Quito los precios de prueba de esa ventana?
