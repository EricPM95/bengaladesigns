Empieza la Tanda 6l: está en docs\dias\PARA_CODE_TANDA6L.md. Léela entera y hazla toda, en el orden de los puntos. Son cuatro arreglos pequeños.

Resumen:
1. El Panteón del D3 llega unos minutos antes de las 9:00 y pasa a «por fuera» con el aviso en rojo. Por la regla 7 tiene que esperar (hasta 15 min, o 40 si al lado hay una plaza, y aquí el desayuno es en la misma plaza) y entrar por dentro. Busca por qué no se aplica la espera, arréglalo en un sitio y comprueba que no les pasa a otros sitios.
2. RUTA, la varita «Recuperar mi ruta»: borra todo, también las reservas, y Eric lo quiere así. Cambia el texto de debajo del título a «Volverás a la ruta inicial y se perderá todo lo modificado, incluido las reservas.» y comprueba que no queda nada de las reservas en ningún sitio.
3. En el móvil, los títulos de las tarjetas de parada, 1 px más pequeños (y la línea de debajo si hace falta), para que no se vean apretados. En el ordenador, igual.
4. La etiqueta «Experiencia nocturna» de la tarjeta de la noche no cabe: que la pastilla crezca con su texto, en una línea.
5. Las pruebas y la comprobación a mano a 375 px del punto 5.

Cómo trabajar: lo de siempre (PROGRESO, PREGUNTAS e INFORME de la 6l, commits locales por bloques). Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
