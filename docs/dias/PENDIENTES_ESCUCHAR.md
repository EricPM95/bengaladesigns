# Pendientes: ESCUCHAR Y LAS HISTORIAS

**(11-oct, 22:47) Eric ya revisó las 31 historias: entran en la Tanda 6y5.** Con historia, la barra de la ficha dice «Escuchar historia» y la lee; sin historia, «Escuchar» y lee el Resumen. En HOY, «Historia» al lado de «Escuchar». La del Coliseo, gratis. Los datos dudosos de las fichas también se corrigen en la 6y5. Queda para después: las historias de los demás sitios y la voz de Eric.

Punto 3 del orden de `PENDIENTES_6K.md`: va después de Roma pulida y antes de las Llegadas.

## Lo que hay ahora
- **Escuchar** (de pago, en HOY y en la ficha): lee en voz alta, con la voz del móvil, el porqué, la descripción, «Qué vas a ver» y el porqué del día (`useEscuchar.ts`, `textoResumenDeParada`).

## Lo decidido (Eric, 11-oct)
- **Escuchar sigue leyendo el resumen completo** de la ficha.
- **La historia es un extra**, con su propio botón **«Escuchar historia»**. Solo sale donde hay historia.
- **Lo que cuenta la historia nunca se repite en el Resumen** de la ficha.
- **De pago.** La del Coliseo, gratis, como muestra.
- **El Resumen de la ficha** (pedido en la 6y4): primero el porqué, en un recuadro, y luego el resumen; «Qué vas a ver» no se toca.

## Las historias
- `docs\dias\HISTORIAS_ROMA.md`, **versión 3, 31 historias** (las 11 de los imprescindibles y 20 más). Cada una de 1 a 1,5 minutos (unas 200 palabras): gancho, historia, anécdota y algo que mirar desde donde estás.
- Cada historia lleva al final sus líneas «Comprobar».
- **Falta:** que Eric las lea y dé el visto bueno, y comprobar los datos marcados.
- Quedan unos 40 sitios sin historia. Se hacen después, poco a poco; mientras, sin botón.

## Datos dudosos de las fichas (arreglar antes de la tanda)
Están al final de `HISTORIAS_ROMA.md`:
- Trevi: la figura del centro es Océano, no Neptuno.
- Trevi: la costumbre de la moneda no viene de la película de 1954 (la hizo famosa).
- Panteón: el rayo en la puerta, ¿21 de abril (nacimiento de Roma) y no 21 de junio?
- Panteón: fuera «técnicamente imposible»; mejor «la mayor cúpula de hormigón sin armar del mundo».
- Navona: la leyenda de las dos figuras (el Río de la Plata y el Nilo).
- San Pedro: el bronce del Baldaquino y el Panteón, suavizar.

## La voz
- **Ahora:** la voz del móvil (gratis, sin descargas).
- **Más adelante, tres opciones:**
  1. Grabadas por Eric (lo más auténtico; lleva tiempo).
  2. Una voz hecha con inteligencia artificial.
  3. **La voz de Eric clonada**, con su permiso por escrito. Hace falta el plan comercial de la empresa de voz (el gratis no permite uso comercial).
- Cada audio pesa ~1 MB: se guardan en el almacenamiento, no se generan cada vez.
- En los textos de la app, nunca el nombre de la empresa de voz.

## Para la tanda de Escuchar
- El botón «Escuchar historia» en la ficha y en HOY, solo con historia.
- Las historias, en los datos de cada sitio (un campo nuevo), no en el código.
- En la gratis: solo la del Coliseo; en las demás, el botón con el candado de pago.
- Pruebas: ningún sitio sin historia enseña el botón; la historia no repite frases del Resumen.

## Para los destinos nuevos
- Añadir a `GUIA_NUEVOS_DESTINOS.md`: cada sitio importante lleva su historia, y la historia no repite nada de su ficha.
