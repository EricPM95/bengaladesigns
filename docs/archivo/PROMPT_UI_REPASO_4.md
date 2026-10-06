# Repaso de diseño 4 (pestaña Días)

Commit por parte y push al final. Comprueba cada punto a 390 px (móvil) y en escritorio, con capturas.

1. **Resumen del día:** la línea de datos del día («6 PARADAS · 8 KM A PIE…») lleva **20 px de margen abajo**, hasta lo siguiente.
2. **Cabeceras de franja:** más margen arriba en «MAÑANA», «TARDE» y «NOCHE», para separarlas más de lo de encima. De 28 px a **40 px**, y los 12 px de abajo se quedan.
3. **Fotos de las tarjetas:** la zona de la foto, **el doble de ancha** que ahora. Se mantienen la diagonal y la banda de color con su icono. Nombre, horario y etiquetas siguen cabiendo sin cortarse a 390 px. Si hace falta, el nombre pasa a dos líneas antes que cortarse. Vale para todas las tarjetas: paradas, de noche y aperitivo.
4. **Puntitos sueltos:** en la línea del día salen puntitos («·») sin nada al lado. Por ejemplo, debajo de «De camino · Borgo Pio» y debajo de la cabecera «NOCHE». Si son elementos vacíos, que no se pinten. Y si hay un aperitivo o un rato libre que no se ve, que se vea: la cena dice «12 min andando desde el aperitivo» y no hay tarjeta de aperitivo encima.
