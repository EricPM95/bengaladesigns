# Piazza Navona con el mercadillo de Navidad, y reglas para todas las paradas (1 de octubre de 2026)

Reglas nuevas: INVARIANTES 409. **No hay capturas**: el panel del navegador sigue sin mostrarse. Lo comprobado es lo que devuelve el servidor para cada parada y que la app compila; en pantalla no lo he visto.

## 1. Etiquetas internas

- «Mercadillo_navideno» pasa a «Mercadillo de Navidad».
- He revisado las 25 etiquetas de las paradas de Roma. Solo otra salía mal: «Subterraneo», ahora «Subterráneo».
- Una etiqueta que falte en la tabla ya nunca sale con guion bajo.
- La prueba de Navidad cuenta cualquier nombre con guion bajo en pantalla.

## 2. «Por tu experiencia»

Quitada de todas las paradas. «Revisita» y «Opcional» se quedan.

## 3. Nombre

- «Piazza Navona y su mercadillo navideño», el mismo en la tarjeta y en la ficha. Antes la ficha enseñaba el nombre interno de la parada («Mercadillo de Navidad de Piazza Navona»).
- La ficha usa ahora el título de la tarjeta en todas las paradas que llevan título propio.
- Regla «primero el lugar, luego lo de la fecha»: he cambiado también «Luces de Navidad: Via del Corso, Condotti, Babuino y Margutta» por «Via del Corso, Condotti, Babuino y Margutta, con sus luces de Navidad». «Plaza de San Pedro y los 100 Presepi» ya la cumplía.

## 4. Texto de la IA

- En esta parada la ficha lleva solo nuestro texto. El de la IA ya no se pide.
- **Otras paradas de Roma que siguen saliendo con texto de la IA** (no tienen ficha escrita a mano): Ponte Sisto, Trinità dei Monti, Via Veneto, Via del Babuino, Via Margutta, Porta Pinciana, Jardines del Pincio, 100 Presepi in Vaticano, Santo Bambino de Aracoeli y Luces de Navidad del Tridente. Las otras 74 tienen ficha propia.
- De las nocturnas, «Foro Romano desde el Campidoglio (noche)» y «Trastevere de noche» tampoco tienen ficha con ese nombre; no he comprobado en pantalla si la app les encuentra la de día.
- Dime si quito el texto de la IA también en esas.

## 5. «Date una vuelta entre los puestos antes de cenar»

- En la ruta con Free Tour, la parada va a las 20:00 y la cena a las 20:45: se cumple.
- La prueba de Navidad cuenta ahora cualquier «antes de cenar» en una parada que acabe después de empezar la cena: 0 en 1.092 viajes.

## 6. Pestaña «Entradas»

Un sitio de acceso libre ya no la lleva, salvo que esté en el recorrido del Free Tour. Entonces sí, y en ella va ese tour (nombre, duración, de dónde sale y enlace).

**Sitios de acceso libre que la mantienen, y por qué:**

| Sitio | Por qué |
|---|---|
| Fontana de Trevi | Está en el recorrido del Free Tour |
| Plaza de España | Está en el recorrido del Free Tour |
| Piazza Navona | Está en el recorrido del Free Tour |
| Via Condotti | Está en el recorrido del Free Tour |
| Iglesia de San Ignacio de Loyola | Está en el recorrido del Free Tour |
| Basílica de San Pedro | Tiene una parte de pago: la cúpula |
| Basílica de Santa Cecilia in Trastevere | Tiene una parte de pago: la cripta y el fresco |
| Basílica de Santa María la Mayor | Tiene una parte de pago: el museo y la loggia |
| Altar de la Patria | Tiene una parte de pago: la terraza panorámica |
| Basílica de San Clemente | Tiene una parte de pago: las excavaciones |

- Las cinco últimas son una decisión mía: la entrada es libre, pero la pestaña cuenta lo que se paga aparte. Si prefieres quitarla también ahí, se quita.
- Los demás sitios de acceso libre y todas las nocturnas ya no la llevan.
- No hay visitas guiadas ni actividades reales conectadas todavía: hoy la única excepción que existe es el Free Tour.
- En destinos sin datos curados no cambia nada.

## 7. Aspecto en Navidad

- Tarjeta con un árbol de línea fina en lugar del icono de monumento, y la banda en rojo navideño.
- Lo llevan Piazza Navona con su mercadillo (con y sin Free Tour), la Plaza de San Pedro con los 100 Presepi, el Santo Bambino y el paseo de las luces. Solo en sus fechas y con la experiencia elegida.
- De noche manda el aspecto de noche, como siempre.

## Pruebas

| Prueba | Antes | Ahora |
|---|---|---|
| 365 fechas | 23 | **23** (los mismos) |
| Navidad y Fin de Año | 0 | **0** |
| 56 viajes | 0 peor | **0 peor** |

## Para decidir

1. ¿Quito el texto de la IA en las otras 10 paradas sin ficha?
2. ¿Quito «Entradas» también en los cinco sitios libres con una parte de pago?
