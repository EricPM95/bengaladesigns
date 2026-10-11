# Preguntas de la Tanda 6y

## De la ruta a mano
1. **El primer y el último día** salen en DÍAS como en nuestra ruta («Madrid → Roma · Día de viaje» y «Roma → Madrid · Día de viaje», con la fecha en la ficha), no con su fecha como los demás («mié 14 oct»). ¿Está bien, o quieres siempre la fecha?
2. **Si cambian las fechas con otra duración**, la ruta a mano mantiene los mismos días (renombra los que no tienen nombre propio). ¿Añado o quito días vacíos?
3. **El aviso «Creando tu itinerario…»** dura 0,7 s antes de pasar a la pantalla siguiente (el diseño lo dejaba 2,2 s). ¿Te vale?
4. **La clasificación y las sugerencias de experiencias en segundo plano** se lanzan antes de la pantalla de elegir (aún no se sabe el camino). Con «Quiero hacerla yo» quedan sin usar. ¿Las dejo así?
5. **Los pines del mapa dibujado** de la pantalla de elegir son decorativos (siempre tres días).
6. **El Free Tour en la ruta a mano:** el botón del Free Tour no sale porque pide días escritos. ¿Cómo debe añadirse a mano: como una parada más con su hora?
7. **«Hoy es un día completo»** cuenta comida y cena aunque el día a mano no las tenga (misma regla que en nuestra ruta). ¿Se deja así?
8. **Una reserva cuyo sitio no está en el día de su fecha** se queda solo en RESERVAS. ¿Avisamos al viajero?
9. **La lista de «Añadir parada»** incluye restaurantes, pero solo se pueden marcar las atracciones.
10. **Qué es «imprescindible»:** he usado la lista hecha a mano `pool_lista` de Roma (el servidor manda `essential_rank`). ¿Es esa?

## De «Reorganizar»
11. **Zigzag:** 75 de 200 días mezclados. Casi todo viene de «mañana antes que tarde», que sale del documento. ¿Pesa más que la cercanía?
12. **Lo reservado** va primero en su parte, por la hora entre reservas; no comparo su hora con las paradas sin reserva.
13. **Trastevere:** el D7 lo pone de mañana, así que se queda donde el documento lo escribe si el viajero tiene 3 o más paradas de ese grupo; con menos, va al final. ¿Prefieres siempre al final (rompería el D7 escrito)?
14. **La zona del alojamiento:** `zonas_alojamiento` no tiene coordenadas; solo `trastevere` coincide. Para centro, Prati, Monti y Termini hay que añadir un punto en los datos.
15. **Un día escrito con Free Tour (D3)** no se usa para repartir si el viajero no lleva el Free Tour.
