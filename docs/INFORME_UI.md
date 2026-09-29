# Informe · Diseño de la app, partes 1 y 2 (29 de septiembre de 2026)

Commits por parte, **sin push**. Las reglas generales están en INVARIANTES (354 y 355).

## Parte 1 · Pestaña Días (`d867120`)

- **Cada día con su color.** Cada día guarda su color (`colorIndex`), que se fija al crear el viaje. Va con el día, no con su posición: si se mueve o se elimina otro día, no cambia.
  - Se ve en una franja diagonal fina a la izquierda del acordeón.
  - También en el número del día: claro sobre el cuadrado oscuro, fuerte sobre el claro. El cuadrado no cambia.
  - Y en los pines y la línea del mapa. Sin día abierto, el mapa enseña todos los días, cada uno con su línea; al abrir uno, solo ese. Sin leyenda.
- **El asa.** A la izquierda del todo, asomando por el borde y sin tapar la franja. Es más grande, con 44 × 44 px de zona de toque, y solo sale en los días que se pueden mover.
- **Menú «···».**
  - «Volver al día original», con la varita, solo si el día tiene cambios.
  - «Eliminar día», en todos, también llegada y vuelta. Pregunta en una ventana de la app y deja el aviso «Día eliminado · Deshacer».
  - Si eliminas el primer día, el viaje empieza un día después.
- **La varita, «Volver a mi ruta original».** Es un botón redondo debajo de la flecha del mapa, con su mismo estilo.
  - La primera vez sale con el texto «Ruta original»; después, solo el icono.
  - Solo aparece si hay cambios.
  - Recupera la copia guardada al crear el viaje (días, orden, paradas, horas, restaurantes y fechas), sin recalcular nada.
  - Al terminar deja el aviso «Ruta original recuperada · Deshacer».
- **Un fallo arreglado.** Al mover un día, «Volver al día original» le devolvía su número de antes; ahora se queda donde está.

## Parte 2 · Interior de cada día (`f5bbc2f`)

1. **Color del día dentro.** El número del día y los números de las paradas van en el color del día, como sus pines: relleno claro, número fuerte y borde blanco. Con el día abierto, los pines y la línea del mapa también.
2. **Tres tramos.**
   - El orden es Mañana → Comida → Tarde → Cena → Noche. Ya no hay «Mediodía» ni «Atardecer».
   - Lo de antes de comer es la mañana.
   - La comida y la cena van entre tramos. Si la cena va detrás de las nocturnas (invierno), va dentro de la Noche, al final.
   - Hay 50 px encima de cada bloque. De la cabecera al primer «+ Añadir parada» hay el mismo espacio que entre paradas.
3. **Comida y cena, formato «Mesa».** Tarjeta terracota suave con el icono en un círculo, «COMIDA · 13:15 – 14:15» en mono, el restaurante en Instrument Serif, los minutos debajo y «Cambiar».
4. **El desayuno.** El mismo formato en pequeño, sin número y con «Cambiar» como enlace.
5. **«De camino».** Mini-tarjeta de 60 px con borde discontinuo, foto redonda, «DE CAMINO · SIN DESVÍO», el nombre y «Ver ›». No lleva número ni hora.
6. **Volver al día original.** Ya no hay botón dentro del día: está en el menú «···».
7. **La excursión.** Ya no sale «Montar día manualmente». Al final de la lista de días, si el viaje no lleva excursión, sale la tarjeta «Sal de Roma un día».
   - Tres escapadas sin repetir sitio (Pompeya, Florencia y la Costa Amalfitana), con foto y sin precios.
   - Al tocar una se abre su ficha, y al elegirla pregunta qué día se cambia. En 4 días propone el de D5C.
   - Las fotos de las excursiones se buscan con un término nuevo del destino (`photo_name`, en inglés), porque con el nombre en español salía cualquier cosa.
8. **Las fotos.**
   - Las paradas de noche piden «(noche)». El servidor busca ese lugar de noche y exige que la foto lo diga («night», «evening», «illuminated»…). Si no hay, usa la de día del mismo lugar, nunca la de otro.
   - Llevan su propia clave de caché, así que la Plaza de España ya no sale con la Fontana de Trevi.
   - Revisión en [`docs/FOTOS_ROMA.html`](FOTOS_ROMA.html) (`scripts/destino/fotosRoma.mjs`): 81 lugares; de los 16 que salen de noche, 8 tienen foto nocturna y 8 usan la de día del mismo lugar.
   - La clave de Unsplash sigue solo en el servidor.
9. **Horas y duraciones de 5 en 5.** Ya estaba hecho en el pulido del motor (`eed34c3`, regla 349). La prueba de las 365 fechas y los 56 viajes salieron igual o mejor.
10. **Avisos de fechas.** Flechas ‹ › a los lados, «1 de 3» junto a los puntitos, y «Siguiente» hasta el último aviso, que dice «Entendido».
11. **«34 hasta Museos Vaticanos».** Ahora dice «34 min hasta…», en la comida y en la cena.

## Capturas (móvil, 375 × 812)

| | |
|---|---|
| Días en invierno (19-22 nov, 4 días) | [dias_invierno.jpg](capturas_ui/dias_invierno.jpg) |
| Día eliminado, con la varita y el aviso | [dia_eliminado_varita.jpg](capturas_ui/dia_eliminado_varita.jpg) |
| Día de invierno abierto: mañana | [dia_invierno_manana.jpg](capturas_ui/dia_invierno_manana.jpg) |
| Día de invierno: cena y noche | [dia_invierno_cena_noche.jpg](capturas_ui/dia_invierno_cena_noche.jpg) |
| Comida «Mesa» y «De camino» | [comida_y_de_camino.jpg](capturas_ui/comida_y_de_camino.jpg) |
| «Sal de Roma un día» | [excursion_tarjeta.jpg](capturas_ui/excursion_tarjeta.jpg) |
| «¿Qué día la haces?» (propone el de D5C) | [excursion_que_dia.jpg](capturas_ui/excursion_que_dia.jpg) |
| Días en verano (9-12 jun) | [dias_verano.jpg](capturas_ui/dias_verano.jpg) |
| Día de verano: tarde | [dia_verano_tarde.jpg](capturas_ui/dia_verano_tarde.jpg) |
| Día de verano: cena y noche (el Panteón de noche) | [dia_verano_noche.jpg](capturas_ui/dia_verano_noche.jpg) |

## Lo que no he podido hacer, o conviene saber

- **En local la app sigue sirviendo v3.** Tu `.env.local` tiene `ROUTE_ENGINE=v3`, que manda sobre el v4 por defecto. Las capturas de arriba salen de v3.
  - El diseño es el mismo con los dos motores, pero los días de v4 se ven distintos (por ejemplo, D2 A con el atardecer en el Castillo).
  - No lo he cambiado: es tu configuración. Si quieres v4 en local, quita esa línea o ponla a `v4`.
  - Conviene revisar también que Vercel no tenga `ROUTE_ENGINE` puesto.
- **No tengo el lienzo «Interior del día».** No está en el repo; he seguido el texto del prompt, que es lo que manda.
- **Las líneas del mapa con todos los días** se dibujan (una capa por día), pero con tantos pines juntos en el centro se ven poco.
- **Excursiones de viajes antiguos.** Los viajes creados antes de este cambio no tienen `photo_name`, y sus tarjetas de excursión pueden salir sin foto hasta que se rehagan.
- **Fotos de noche.** Cuando Unsplash no tiene una buena, sale la de día del mismo lugar (8 de 16). Mírala en `FOTOS_ROMA.html` y dime cuáles cambiar a mano.
