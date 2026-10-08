# Informe de la Tanda 6l

Cuatro arreglos, hechos en el orden. Las pruebas, a cero fallos. Lo que he decidido yo está en `PREGUNTAS_TANDA6L.md`.

1. **El Panteón espera a que abra.** El Panteón llegaba a las 8:54, seis minutos antes de abrir, y la regla 7 manda esperar (hasta 15 min). La espera existía, pero el motor la descartaba porque el Free Tour de las 10:00 salía 3 minutos tarde (la caminata del Panteón a la Plaza de España y los 15 min de margen para llegar al punto de encuentro). Con el Free Tour, ahora unos pocos minutos de ese margen (hasta 5) no cuentan como llegar tarde. El Panteón entra por dentro a las 9:00, sin nada en rojo, y el Free Tour sigue a las 10:00. Probado en los días escritos con una prueba nueva: ningún sitio se ve por fuera por llegar 15 min o menos antes de que abra (ni 40 con una plaza o un sitio al aire libre justo al lado).
2. **La varita lo borra todo.** El texto es «Volverás a la ruta inicial y se perderá todo lo modificado.». Se van las reservas de ese destino (con un destino, todas), sus avisos de la campana y las marcas de «cambiado a mano»; «Deshacer» las devuelve. Probado con dos reservas puestas: RESERVAS vacía, ningún día reservado, la campana sin avisos y la varita otra vez apagada.
3. **Letra del móvil, 1 px más pequeña.** Los títulos de las tarjetas de parada pasan de 17 a 16 px, y la línea de horario y duración baja 1 px; HOY, de 16 a 15 px. En el ordenador, igual que antes.
4. **«Experiencia nocturna».** La pastilla crece con su texto y queda en una línea con el mismo aire que las demás.

## Las pruebas

- **Prueba nueva de la 6l** (300 viajes, 1.025 días, con y sin Free Tour, con y sin fechas, medios días): 0 fallos; el Panteón del D3 por dentro en 100 de 100.
- **6g, 6h, 6i, 6j y 6k:** 0 fallos. **`pruebaListas`** (una de cada 5 fechas, de 1 a 6 días): 0 fallos.
- **A mano a 375 px:** descrito en `PREGUNTAS_TANDA6L.md`. Lo único que queda sin ver con los ojos: HOY con nombres largos y la tarjeta azul de la noche entera en pantalla.

## Una cosa para ti

La Trinità dei Monti del medio día de tarde llega 25 min antes de abrir y viene de un sitio al aire libre a unos 10 min andando; por la regla 7 (40 min solo «justo al lado») no espera. Si quieres que espere también en ese caso, es cambiar la regla.
