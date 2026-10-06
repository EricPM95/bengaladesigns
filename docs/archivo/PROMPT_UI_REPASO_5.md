# Repaso de diseño 5 (pestañas Ruta y Días)

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil) y en escritorio, con capturas.

## Pestaña Ruta

1. **La ventana del destino, a pantalla completa:** al tocar la tarjeta del destino, la ventana de «Alojamientos en {destino}» y «Actividades en {destino}» ocupa toda la pantalla. Sin mapa arriba (ahora sale), ni pestañas, ni menú detrás.
   - **Cerrar:** arriba, una cruz para cerrar y volver a la pestaña Ruta.
   - **Tercer bloque:** debajo de Actividades, **«Excursiones desde {destino}»**. Solo sale si hay excursiones que enseñar; cuando conectemos las APIs de afiliados, saldrán de ahí. Déjalo preparado: si no hay datos, el bloque no aparece, ni vacío ni con «próximamente».
   - Sin precios de prueba, como ya se pidió.

## Pestaña Días

2. **Esconder el mapa:** al abrir el acordeón de un día se puede volver atrás, pero ya no está el botón para esconder el mapa, que antes sí estaba. Recupéralo (búscalo en el historial de git) y comprueba que funciona.
3. **«Rutas» y la barra de abajo:** al tocar «Rutas», las opciones «Abrir en Apple Maps» y «Abrir en Google Maps» salen por debajo de la barra flotante de abajo, que las tapa y no se pueden tocar. Tienen que salir por encima de todo, barra incluida, y enteras.
4. **«Añadir parada»:** la ventana con el mapa y su tirador está bien, pero el menú de arriba (Hoy, Ruta, Días, Explorar) se queda encima y tapa parte de la ventana.
   - La ventana va por encima de todo, sin ese menú ni la barra flotante.
   - Tiene una cruz para cerrar, visible siempre. Hoy no se ve.
5. **Abrir un día:**
   - Al tocar un día (Día 1, Día 2…), los demás días se cierran.
   - El día que se abre empieza desde arriba, en su primera parada. Hoy, si estás leyendo el final del Día 1 y tocas el Día 2, se abre por su última parada.
   - Que la pantalla suba sola hasta el principio del día abierto.

**INVARIANTES:** las ventanas (fichas, Añadir parada, Rutas, alojamientos) van siempre por encima de los menús y de la barra flotante, y tienen su cruz para cerrar.
