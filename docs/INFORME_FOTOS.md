# Fotos nuevas de Roma, textos de ficha y un fallo del servidor (1 de octubre de 2026)

## 0. Un fallo mío que estuvo en producción

Al borrar el ritmo (commit `7dc9952`, subido en `5728bb8`) quité por error una línea del servidor (`requestContext`). **Con esa versión, todas las peticiones a la API fallan con un error 500**: no se puede generar ninguna ruta ni cargar fotos, tips o fichas. Lo he comprobado en local; la versión subida es el mismo código, así que en producción ha tenido que fallar igual desde ese push, aunque producción no la he mirado.

- Lo he visto hoy, al probar las fotos contra la API en marcha.
- Arreglado y subido en `57fb14a`, solo ese arreglo.
- No lo vi antes porque las pruebas llaman al motor directamente, no a la API, y el servidor arrancaba sin error. Desde ahora, después de tocar el servidor hago una petición real a la API antes de dar nada por bueno.

## 1. Las fotos, preparadas

- Reducidas a 1.600 px de ancho como máximo, JPEG al 80 %, en `public/fotos/roma/`. La app no tenía carpeta de fotos propias (las suyas vienen de Unsplash y Wikipedia): es nueva.
- De cada una hay dos ficheros: el grande para la ficha (150-340 KB) y uno de 640 px para la tarjeta (44-80 KB).
- Los originales están fuera de git (`.gitignore`).
- Los datos de cada foto están en `data/dias/roma/_fotos.json`, con `fuente`, `autor` y `enlace` vacíos. **Ninguna lleva línea de crédito** hasta que me pases el autor y el enlace.
- **Las dos pequeñas** (San Pedro, 850 px; Coliseo con árbol, 800 px): las he abierto y se ven nítidas a su tamaño. En un móvil caben sin estirarse en la tarjeta y en la miniatura de la ficha. No las he visto en pantalla dentro de la app.

## 2. Fotos de noche

| Foto | Dónde sale |
|---|---|
| `noche_coliseo.jpg` | Coliseo (noche) |
| `noche_panteon.jpg` | Panteón (noche) |
| `noche_fontana_trevi.jpg` | Fontana de Trevi (noche) |
| `noche_castillo_desde_puente_sant_angelo.jpg` | Castillo de Sant'Angelo, cuando sale ya de noche |
| `noche_castillo_y_puente_sant_angelo_rio.jpg` | Puente Sant'Angelo (noche), que es la parada del paseo «El Castillo y el Tíber» |
| `noche_foro_romano.jpg` | El Foro desde el Campidoglio (noche), el Foro de noche y «Roma iluminada desde el Campidoglio» |

**Las 16 paradas de noche de `FOTOS_ROMA.html`** (regenerado):

| Parada de noche | Foto |
|---|---|
| Coliseo, Fontana de Trevi, Panteón, Puente Sant'Angelo, Foro desde el Campidoglio | Propia, de noche |
| Cúpula de San Pedro, Ponte Sisto | De noche (Unsplash) |
| **Altar de la Patria** | De día |
| **Piazza Navona** | De día |
| **Plaza de España** | De día (del 8 de diciembre al 6 de enero, la del árbol) |
| **Mirador del Janículo** | De día |
| **Terraza del Pincio** | De día |
| **Trastevere de noche** | De día |
| **Jardín de los Naranjos** | Sin foto |
| **Trinità dei Monti** | Sin foto |
| **Fontana dell'Acqua Paola** | Sin foto |

Faltan fotos de noche para las nueve en negrita.

## 3. Fotos de Navidad

| Foto | Dónde | Cuándo sale |
|---|---|---|
| San Pedro con el árbol, de día | Basílica y Plaza de San Pedro, solo de día | Del 16 de diciembre al 6 de enero |
| Plaza de España con el árbol, de noche | Plaza de España (noche) | Del 8 de diciembre al 6 de enero |
| Plaza Venecia con el árbol, de noche | Altar de la Patria y Plaza Venecia, de noche | **No sale**: `verificar` hasta confirmar que ese año hay árbol |
| Coliseo con el árbol, de noche | Coliseo (noche) | **No sale**: `verificar`. Mientras, `noche_coliseo.jpg` |

- Solo salen con fechas reales de viaje. Sin fechas, la foto de siempre.
- **Las fechas de San Pedro y de la Plaza de España las he puesto yo**, prudentes: el árbol de San Pedro se inauguró el 7 de diciembre en 2024 y el 15 en 2025, así que la foto sale desde el 16. La de España, desde el 8, cuando se encienden los árboles de las plazas. Dime si prefieres otras.
- La línea de Navidad de la Plaza de San Pedro («la plaza tiene su árbol gigante…») sigue con `verificar` y no sale todavía: hoy la foto del árbol saldría sin esa línea.

## 4. Piazza Navona en Navidad

**No he encontrado ninguna candidata que cumpla.** Con la clave del servidor he buscado «Piazza Navona Christmas market», «Piazza Navona Natale», «Piazza Navona Christmas», «Navona Christmas», «Rome Christmas market», «mercatino Natale Roma» y «Befana Navona»: casi todas dan 0 resultados, y las que salen de Navona no hablan de puestos ni de luces en su descripción.

Lo más cercano, por si quieres mirarlas (ninguna dice que se vea el mercadillo; no las he usado):

1. «Winter view of Piazza Navona», de Gabriella Clare Marino — https://unsplash.com/photos/a-city-square-with-a-fountain-in-the-middle-of-it-ibZR8WQA26o
2. «The Fountain of the Four Rivers, Piazza Navona», de Gabriella Clare Marino — https://unsplash.com/photos/gray-concrete-statue-of-man-0zbqoPa6TDs
3. Sant'Agnese en Piazza Navona, de noche, de Sten Ritterfeld — https://unsplash.com/photos/white-concrete-building-during-night-time-RGw1FT6l4kQ

Solo he leído sus descripciones, no las imágenes. Para una con puestos y luces habrá que buscar en Pexels o en otra fuente. El buscador queda en `scripts/destino/candidatasFoto.mjs`.

## 5. Los 10 textos de ficha

Puestos tal cual en `por_que_lugares`, sin texto de la IA.

- **Dónde se ven:** en la ficha, como primer párrafo. En tres paradas la ruta ya tenía un texto propio para ese momento, y ahí el tuyo va debajo, como segundo párrafo:
  - **Jardines del Pincio:** arriba sigue «Vuelve a subir al Pincio, 7 min de escaleras…».
  - **Ponte Sisto al atardecer:** arriba sigue el texto del atardecer.
  - **Trinità dei Monti cuando se ve por fuera:** arriba sigue el texto de «por fuera».
- **Las tres de Navidad, para no repetir:**
  - **100 Presepi:** no es una parada aparte, cambia la de la Plaza de San Pedro; tu texto es ahora el de esa parada. La línea del árbol, cuando se active, saldrá en su versión corta, sin los Presepi.
  - **Santo Bambino:** la línea de la Plaza del Campidoglio que también lo cuenta no sale el día que la ruta ya lleva la parada del Santo Bambino.
  - **Luces:** la línea de Via del Corso no sale el día que la ruta ya lleva el paseo de las luces.
- **Comprobación:** no he vuelto a buscar cada frase en una fuente. De lo que sé, todas cuadran (Sixto IV, 1473-79; Luis XII y la Trinità, 1502; Paparazzo; el sileno de Via del Babuino; Via Margutta 51; la muralla de Aureliano; Valadier y el reloj de agua; los 100 Presepi desde 1976; el robo del Bambino en 1994; las carreras del Carnaval). No he cambiado ninguna. Si quieres que las compruebe una a una en fuentes, dímelo.

## 6. Capturas

**No hay.** El panel del navegador sigue sin mostrarse. He comprobado con peticiones reales a la API que cada parada recibe su foto (de noche, de Navidad en fechas, y la normal fuera de ellas), pero la tarjeta y la ficha no las he visto.

## 7. Pruebas

365 fechas 23, Navidad 0 y 56 viajes 0 peor: sin cambios.

## Para decidir

1. Las fechas de las fotos de San Pedro (desde el 16 de diciembre) y de la Plaza de España (desde el 8).
2. Si busco la foto de Navona en otra fuente, o me la pasas tú.
3. Autor y enlace de las 10 fotos, para el crédito.
