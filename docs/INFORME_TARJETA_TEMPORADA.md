# Informe: la tarjeta de temporada

Las cinco tarjetas a 390 px, en `docs/diseno/tarjeta_temporada/capturas/` (`primavera.jpg`, `verano.jpg`, `otono.jpg`, `invierno.jpg`, `navidad.jpg`). En desarrollo se ven solas con `?tarjeta=verano`.

## Cómo sale
1. Al abrir la ruta por primera vez sale la tarjeta: `src/components/route/SeasonCard.tsx`.
   - Es el diseño de `Navidad Modal.dc.html`: la escena, los colores, la letra y lo que cae (pétalos, motas de sol, hojas o nieve), que se desvanece antes del texto.
   - En Navidad es la 1a, con las ventanas encendidas y la guirnalda.
   - Con «reducir movimiento» no cae nada y las luces no laten.
2. Al tocar «Entendido» salen los avisos de fechas, si los hay. La nota de temporada ya no va como primera tarjeta de esa ventana.
3. Después, la ruta. Las dos marcas se guardan con el viaje (`seasonNoteDismissed` y `dateNoticesSeenKey`), así que no vuelven a salir.

No he puesto el botón para volver a verla, porque era opcional.

## Qué estación
Se decide en `server/engine/seasonNote.js`:
- **Con fechas:** la del primer día, con tus cortes: primavera del 20-3 al 20-6, verano del 21-6 al 22-9, otoño del 23-9 al 20-12 e invierno del 21-12 al 19-3.
  - Si el primer día cae en la `temporada_navidad` (del 26-11 al 6-1), sale la de Navidad.
  - No uso los cortes de `by_period`: son de horarios de los monumentos, no de la época del viaje.
- **Sin fechas:** la época del formulario.

## Qué texto
Los textos del prompt están en `SEASON_CARD_TEXTS`. Valen para cualquier destino: `{destino}` y `{hora}`, que es el atardecer real redondeado al cuarto de hora. Si el cambio de hora cae dentro del viaje, salen las dos horas.

Cada trozo condicionado sale solo si se cumple:

| Estación | Trozo | Sale si… |
|---|---|---|
| Primavera y otoño | «y llegar / llegues a los miradores con el atardecer» | alguna parada del viaje es un atardecer |
| Verano | «lo más importante, a primera hora» | la mayoría de los días empieza por un imprescindible antes de las 10:00 |
| Verano | «después de comer, descanso o sitios a cubierto» | algún día es de julio o agosto (la regla de 14:00 a 16:30 del motor) |
| Invierno | «, y por la noche, Roma iluminada» | el viaje tiene paseo nocturno |
| Navidad | — | los tres textos de siempre, sin cambios |

Si en verano falta uno de los dos trozos, se quita solo ese.

La auditoría comprueba que ninguna tarjeta promete algo que la ruta no hace (0 en las 365 fechas, Navidad y fechas clave). Regla: la 415.
