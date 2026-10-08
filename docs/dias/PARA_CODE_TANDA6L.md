# Para Code · Tanda 6l: cuatro arreglos pequeños

**Empieza cuando esté subida la 6k** (ya lo está: 4e973b7). No cambia cómo se montan los días, salvo el punto 1, que es la regla 7 de siempre.

## Cómo trabajar
Lo de siempre:
- `PROGRESO_TANDA6L.md`, `PREGUNTAS_TANDA6L.md` e `INFORME_TANDA6L.md`;
- commits locales por bloques;
- **cuando acabe, con la prueba en 0 fallos, `git status` limpio y nada privado (.env, claves), haz push de `main` a `origin`, sin `--force`.** Si algo falla, no hagas push y explícalo.

## 1. El Panteón tiene que esperar a que abra (regla 7)
- **Cómo se ve:** en el día del Free Tour (D3), después de Trevi sin gente y el desayuno, se llega al Panteón unos minutos antes de las 9:00. La app lo pasa a **por fuera** (15 min), con el aviso en rojo «A esta hora aún no ha abierto (abre a las 09:00)».
- **Lo que dice la regla 7 del documento:**
  - si se llega antes de que abra, se espera hasta 15 min;
  - se espera hasta 40 min si lo de antes es una plaza o un sitio al aire libre justo al lado.

  Aquí el desayuno es en la misma Piazza della Rotonda. **Tiene que esperar a las 9:00 y entrar por dentro** (~30), sin nada en rojo. Después llega de sobra al Free Tour de las 10:00 en la Plaza de España.
- **Busca por qué no se aplica la espera** y arréglalo en un solo sitio.
- **Comprueba todos los sitios con hora de abrir,** en todos los días escritos: 0 sitios pasados a «por fuera» por llegar 40 min o menos antes de que abran.

## 2. RUTA · la varita «Recuperar mi ruta»
- **La varita borra todo, también las reservas.** Eric lo quiere así.
- **Cambia el texto de debajo del título a:** «Volverás a la ruta inicial y se perderá todo lo modificado, incluido las reservas.»
- **Comprueba que después no queda nada de las reservas:**
  - ni en RESERVAS;
  - ni en los días;
  - ni en la campana;
  - ni los días marcados como «cambiados a mano».

## 3. Móvil · la letra de las tarjetas, un punto más pequeña
- **En el móvil, los títulos de las tarjetas de parada** («Plaza de San Pedro», «Basílica de San Pedro»…) se ven apretados y parten en dos líneas.
- **Bájalos 1 px solo en móvil.** Si hace falta para que respire, haz lo mismo con la línea de debajo (horario y duración).
- **En el ordenador, igual que ahora.**
- **Míralo a 375 px** en DÍAS, RUTA y HOY, con nombres largos («Museos Vaticanos y Capilla Sixtina», «Terraza del Pincio»…).

## 4. La etiqueta «Experiencia nocturna» no cabe
- **Cómo se ve:** en la tarjeta azul de la noche (por ejemplo, «Piazza Navona»), la etiqueta «Experiencia nocturna» se sale de su pastilla y parte en dos líneas.
- **La etiqueta tiene que caber entera,** en una línea, con el mismo aire que las demás: que la pastilla crezca con su texto.
- **Míralo a 375 px,** con el nombre más largo de las nocturnas («El Puente y el Castillo de Sant'Angelo»).

## 5. Pruebas
- **Las de siempre, a 0 fallos:** 6g, 6h, 6i, 6j, 6k y `pruebaListas`, con la comprobación nueva del punto 1.
- **A mano, a 375 px:**
  - el D3 con el Panteón por dentro;
  - la varita con una reserva puesta;
  - las tarjetas con nombres largos;
  - la tarjeta de la noche.

Al final, **reinicia el api-server.**
