# Preguntas abiertas de la Tanda 6y4

## Paradas con reserva (punto 7)
1. **El «Ara Pacis delante de todo» de Eric:** con la reserva del Altar de la Patria no he podido reproducirlo; sale si lo reservado es el Ara Pacis (a veces llamado «el Altar de la Paz») a las 10:00, y eso ya está arreglado. ¿Reservó el Altar o el Ara Pacis? Si fue el Altar, necesito sus fechas y el estado del viaje.
2. **El documento quita sitios según el día:** si una reserva grande deja el día del Vaticano en domingo o miércoles (o la Galería Borghese en lunes), el documento dice «sin Museos» / «sin Galería» y el sitio queda en «No incluido». Para el viajero, una reserva ha quitado algo. Lo dejé porque es el documento. ¿Hacemos que el día del Vaticano salte al otro día libre?
3. **Quitar la reserva de los Museos puesta en miércoles:** el día se rehace en miércoles sin mover días y el documento quita los Museos. Mismo asunto que la 2.
4. **Una reserva grande a una hora cuya fila del documento es otra** (Coliseo desde las 14:16): la tarde trae otras paradas y se pierden la Fuente de las Tortugas, el Elefantino… ¿Se queda así o pasan a «Si te sobra tiempo»?
5. Un día que recibe o pierde una parada puede cambiar un relleno de hueco. Se cuenta, no se prohíbe. ¿Bien?

## Tope del pool (punto 2)
6. ¿Subimos el límite de extras del motor (`poolExtrasLimit`) para que vaya con el tope de la pantalla (5/7/8)? Probé 5/5/7/8 y casi todo lo perdido pasa a «no cabe»: el día no da más.
7. ¿Dejamos el tope en 3 con 1 y 2 días hasta que el motor encaje 5? Hoy hay zigzag nuevo en el 12 % de los viajes de 2 días con 5 sitios, y en 1 día con pool aparece el fallo `foro_por_fuera` en 48 de 432 viajes.

## Calendario (punto 4)
8. «Guardar» con botón (como el «Continuar» del formulario) o al tocar el segundo día, como antes. Es cambiar una línea.

## Presupuesto y reservas (puntos 11 a 14)
9. Aviso del día 1: de pago, la zona elegida cuenta como «alojamiento resuelto» (igual que RESERVAS). ¿O prefieres que el aviso solo desaparezca con el hotel puesto?
10. Con seguro o eSIM, si hay «dónde lo compré» y precio, la tarjeta enseña el lugar. ¿Quieres los dos («Lo tienes · Mi banco · 30 €»)? Cabe justo en 220 px.
11. Si tras esto sigues sin ver la pastilla del precio, dime desde qué pantalla guardas (hoja, gratis o pago): probada en todos los sitios, sería algo de la pantalla.
12. El código del vuelo se ve en RESERVAS y en la barra de DÍAS solo cuando la ida/vuelta está completa (hora + punto), igual que la hora.
13. Hotel y acortar fechas: el hotel se queda con su estancia, no con el día. ¿Bien?
14. En la hoja de «Útil para el viaje», quitar una tarjeta (seguro, eSIM…) se hace desde su hoja con «Quitar» y sale el aviso con [Deshacer]. ¿Prefieres también un gesto directo en la tarjeta?

## Perfil (punto 15)
15. **¿Cómo se vuelve a abrir un viaje guardado?** Antes la ficha del viaje tenía [Abrir este viaje]; con el diseño nuevo solo hay título, fecha y álbum, y tocar un viaje abre su álbum. Ahora no hay forma de cambiar de viaje desde el Perfil. ¿Devuelvo un [Abrir este viaje] pequeño?
16. **«Lugares»:** conté destinos (ciudades) distintos. El diseño pone «4 lugares» con solo la chincheta de Roma; ¿quería contar sitios distintos visitados?
17. **«Roma ×1»:** con un solo viaje la pastilla dice «Roma». ¿Quieres «×1» siempre?

## Ficha de lugar (punto 16) y «Trastevere» (punto 18)
18. Los lunes de la Fontana: el aviso del motor en DÍAS usa `viernes_desde` y solo mira el viernes, pero la ficha y la nota oficial dicen lunes y viernes. En la ficha puse lunes y viernes; el aviso del motor no lo toqué. ¿Lo corregimos?
19. ¿El «Paseo por Trastevere» (el paseo libre) y los restaurantes de Trastevere llevan también la etiqueta? Hoy no.
20. La línea de llegar antes usa el motivo de cada sitio; solo los sitios sin motivo propio dicen «hay cola de control». ¿Quieres «hay cola de control» en todos?
21. La tarjeta de noche de DÍAS usa también azul-violeta de matiz 285, parecido al lila. ¿Muevo el lila 10° si se confunde?
22. Quité la marca «Reservada ✓» de la ficha (el «✓ Tu entrada» ya lo dice) y dejé «Fijada». ¿Bien?
23. ¿Quito la rama de HOY gratis que ya no se alcanza (desde la 6z6 HOY es solo de pago)?
24. El botón de volver de la ficha pasa a 44 px blanco sin borde, como el diseño (antes tenía borde de acento). Quítalo si prefieres el anterior.

## Iconos (punto 17)
25. ¿Te vale el barco y la autocaravana que dibujé, o se los pedimos a diseño?
26. El taxi lleva el coche nuevo con un letrero: ¿distinto del coche o igual?
27. El diseño no trae «a pie», metro ni tranvía; los dejé como estaban. ¿Los pedimos también?

## Otras
28. Al probar con PowerShell (que manda mal los acentos), el servidor devolvió una foto de Wikipedia equivocada guardada en la caché de fotos (un cantante) para un nombre mal escrito. Con el nombre bien escrito sale la foto propia. No toqué nada.
