# Repaso del diseño, 2.ª tanda

Muy buen trabajo con las 14 partes. Aquí van un cambio y lo nuevo, en orden: commit por parte y sin push. Todo con reglas generales, a INVARIANTES, que valga para todos los destinos.

Los prototipos que cito están en lienzos que tú no ves: lo que manda es este texto, que ya lleva todo lo necesario.

1. **Cambio del punto 3: arriba, la bombilla y la varita; abajo, una barra flotante de 5 iconos.** Sustituye a la columna de botones (presupuesto, mapa y varita) que hiciste en el punto 3, y a la pestaña Reservas de arriba.
   - **Arriba, en la cabecera**, junto al «● 0%»:
     - la maleta de ahora se cambia por una **bombilla**, que abre los tips del viaje (punto 3 de este prompt);
     - la luna (modo oscuro) se cambia por la **varita**, «Volver a mi ruta original».
       - Siempre visible y siempre igual, sin puntito ni aviso.
       - Si no hay cambios, al tocarla sale «Tu ruta está tal como te la preparamos».
   - **Abajo, una píldora oscura** (#1F1B16) flotando sobre la lista: 64 px de alto, a 24 px de los lados y 26 px del borde de abajo, con sombra suave.
     - Cinco sitios, con iconos de línea en crema, sin texto. Cada uno con su `aria-label` y 44 × 44 px de toque. En este orden:
       1. **Maleta**: nuevo viaje.
       2. **Presupuesto**: la bolsa, sin ningún aviso encima.
       3. **Perfil**, en el centro, en un círculo terracota de 50 px. Abre una hoja desde abajo con «Hola, viajero» (la cuenta llegará más adelante) y «MIS VIAJES»: la lista de viajes guardados en este dispositivo, con el abierto marcado.
       4. **Mapa**: abre el mapa. Sustituye al botón «Mostrar mapa».
       5. **Reservas**: la pestaña Reservas pasa aquí, con su aviso naranja «!» mientras falte algo por reservar.
   - **Arriba quedan cuatro pestañas:** Hoy, Ruta, Días y Explorar.
   - Ya no queda ningún botón flotante suelto.
   - La lista deja espacio abajo para que la barra no tape nunca la última tarjeta.
   - En escritorio, la misma barra, centrada abajo, con el ancho de la lista. El icono del presupuesto abre el panel del presupuesto que ya tienes.
2. **La nota de temporada, a la ventana de los avisos.** Ahora sale como un banner oscuro encima de los días («INVIERNO · En tus fechas anochece sobre las 16:45…»), y con el de alojamiento al lado parece todo alertas.
    - Quítala de la pestaña Días.
    - Pasa a la ventana de los avisos de fechas, con el mismo formato que los demás, y **siempre la primera**. Si hay festivos o días especiales, van detrás.
    - Si no hay ningún aviso de fechas, la ventana sale igual, solo con la nota de temporada.
    - Su título dice la temporada y el destino: «Invierno en Roma».
    - **Con el mismo efecto que en el formulario**, solo dentro de esa ventana:
      - invierno, nieve cayendo;
      - verano, el sol poniéndose;
      - primavera y otoño, el suyo del formulario.
    - Suave y sin tapar el texto. Si el móvil tiene activado «reducir movimiento», sin animación.
3. **Los tips del viaje (la bombilla).** Una ventana a pantalla completa con los tips del destino.
    - **Pocos y buenos: de 5 a 8 por destino.** Solo los que de verdad ahorran dinero, tiempo o un mal rato, o que el viajero no sabía. Nada que ya diga una parada.
    - Cabecera oscura con la bombilla, «8 COSAS QUE UN ROMANO TE DIRÍA» y el título «Lo que ojalá te hubieran contado».
    - Cada tip, en una tarjeta con:
      - su número grande;
      - su etiqueta de color: «Ahorras dinero» (verde), «Ahorras tiempo» (azul) o «Te evitas un mal rato» (terracota);
      - el título;
      - dos o tres líneas de texto, de tú a tú.
    - Si el tip tiene que ver con algo que se reserva, lleva un enlace a su entrada («Ver entradas de tu viaje ›»).
    - **Aquí sí pueden ir precios**, como en Entradas, siempre comprobados en la web oficial y con la fecha.
    - Los tips, en un archivo por destino, `data/dias/roma/_tips.json`, con el texto, la etiqueta, el orden, la fuente y la fecha de comprobación.
    - **Los 8 de Roma.** Estos son los textos; comprueba cada dato antes de ponerlo.
      1. «Ahorras dinero» · **La Fontana de Trevi, gratis y casi para ti** · «Bajar junto al agua cuesta 2 €, pero solo de 9:00 a 22:00 (lunes y viernes, desde las 11:30). Ve antes o después: no pagas y la tienes casi vacía.»
      2. «Ahorras dinero» · **El café, de pie en la barra** · «Es lo que hacen los romanos. Sentarte en la terraza, sobre todo en una plaza famosa, puede costarte el triple por el mismo café.»
      3. «Ahorras dinero» · **El agua de las fuentes es gratis, y buena** · «Roma está llena de "nasoni", fuentecillas con agua fresca. Lleva una botella y rellénala. Truco: tapa el grifo con el dedo y el agua sale por arriba para beber.»
      4. «Ahorras dinero» · **El «coperto» sí; la propina, no hace falta** · «En la cuenta verás el "coperto" (el pan y el cubierto): es normal y legal. La propina no es obligatoria: si te ha gustado, redondea y listo.»
      5. «Ahorras dinero» · **Huye de los menús con fotos** · «Junto a los monumentos, el menú con fotos y el camarero en la puerta suelen ser caros y malos. Aléjate dos calles y comerás mejor por bastante menos.»
      6. «Ahorras tiempo» · **Los primeros turnos se agotan semanas antes** · «El Coliseo, los Museos Vaticanos y la Galería Borghese a primera hora vuelan. Reserva en cuanto tengas las fechas y te ahorras horas de cola.» Con el enlace «Ver entradas de tu viaje ›».
      7. «Te evitas un mal rato» · **Hombros y rodillas tapados en las iglesias** · «En San Pedro y en muchas iglesias no te dejan pasar con tirantes o pantalón corto. Lleva un pañuelo fino en la mochila y listo.»
      8. «Te evitas un mal rato» · **El autobús 64, el de los carteristas** · «Va de Termini al Vaticano lleno de turistas, y los romanos lo conocen por eso. Mochila por delante, o mejor, ve en metro.»
4. **La tasa de la Fontana de Trevi, en la ruta.** En las paradas de Trevi decimos que se paga desde las 9:00. Según lo que he visto, los lunes y los viernes se paga desde las 11:30.
    - Compruébalo en la web oficial (fontanaditrevi.roma.it).
    - Si es así, el texto de la parada tiene que decir la hora buena según el día.

5. **Lo que salió de la tarjeta de parada** (tu nota del punto 11): «Revisita» y «Por tu experiencia» sí son útiles de un vistazo. Pásalos a etiquetas, con el mismo estilo que las demás. El nombre del paseo nocturno y el final del Free Tour («acaba en Piazza Navona») van dentro de la ficha, en Resumen. «Añadida por ti», fuera.

## Al terminar
- Commit por parte y sin push.
- Si no puedes verlo en pantalla, dímelo y lo compruebo yo en el móvil.
- Añade al informe `docs/INFORME_UI.md` lo que has hecho, y las capturas si puedes (375 px de ancho).
