# Textos del ritmo tranquilo y dos arreglos de la prueba

Con la vuelta atrás de la parte 4, los días de tranquilo empiezan a la hora escrita de cada día: algunos a las 8:30-9:30 (el Vaticano, el Coliseo) y otros a las 10:00. Hay textos que siguen prometiendo «empiezas a las 10:00», y eso ya no es verdad.

Commit y sin push. Regla general a INVARIANTES: ningún texto promete una hora que la ruta no cumple.

1. **Busca todos los textos que dan una hora de inicio para tranquilo o completo:** en `roma.json`, en el formulario, en el resumen y en los banners. Lístalos en el informe. Por ejemplo:
   - `context_banners.tranquilo`: «…empiezas a las 10:00…»;
   - `pace_stats.tranquilo.inicio: "10:00"`, que usa el gráfico de la pantalla de ritmo.
2. **`pace_stats`:** vuelve a sacar `inicio` del motor v4, igual que las paradas por día. Pon la hora más habitual de la primera parada (la mediana), redondeada de 5 en 5. Si en tranquilo sale de las 9:00 a las 10:00, pon el rango.
   - El gráfico del formulario empieza en esa hora real.
3. **`context_banners.tranquilo`,** sin hora fija. Propuesta:
   > «Hemos preparado tu ruta con calma: menos paradas, comidas sin prisa y ratos libres para disfrutar de Roma a tu aire. Algún día empieza pronto, para entrar al Vaticano o al Coliseo sin colas. Lo imprescindible está todo; si te apetece añadir algo más, usa el + entre paradas.»
   - Y `tranquilo_antes` («Solo {n} {n_dias} antes…») ya no hace falta: quítalo si solo servía para avisar de los días que empiezan antes de las 10:00.
4. **El texto de la pantalla de ritmo** (`pace_texts.tranquilo`) no da hora: se queda como está.
5. **Completo:** comprueba también que el «08:00» de `pace_stats.completo.inicio` sea verdad con v4.

6. **La comida de −5 min** (prueba de las 365 fechas: 1 de enero y 31 de diciembre, 2 días, tranquilo con Free Tour, D1-FT A). Una comida nunca puede tener minutos negativos.
   - Regla: la comida dura como mínimo 45 min. Si no cabe, se quita primero una opcional y después se acorta la elástica, nunca la comida.
   - Revisa también las de 25-30 min de esas fechas: que lleguen a 45 con la misma regla.
7. **Navidad, el día del Vaticano sin museos** (25 de diciembre, D2 A): de la Basílica de San Pedro a Santa Cecilia hay 33 min andando, sin transporte, y la hora de llegada no cuadra con el paseo.
   - Pon el tramo en bus o taxi, con su tiempo real, y que la hora cuadre.
   - Lo mismo el 14 de agosto: 27 min andando hasta Santa Maria in Trastevere. Si pasa de 25 min, bus o taxi, como siempre.

Vuelve a pasar la prueba de las 365 fechas y los 56 viajes: igual o mejor, y sin comidas por debajo de 45 min.

Informe corto: los textos cambiados, antes y después, las horas nuevas de `pace_stats` y los números de la prueba.
