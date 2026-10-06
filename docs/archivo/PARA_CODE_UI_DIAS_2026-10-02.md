# UI de la pestaña Días: lo que faltó ayer y cosas nuevas

Va **después** de PARA_CODE_ARREGLOS_SUELTOS_2026-10-02. Commit por parte y sin push. Comprueba cada parte a 390 px (móvil), con capturas.

Vale para **todos los destinos**. Diseño de la app en todo: Instrument Serif + Geist, papel crema, acento terracota, ventanas que suben desde abajo con su tirador y su cruz. Textos con «tú», sin nombres de proveedores.

Capturas que acompañan este archivo (en `docs\archivo`):
- `captura_mapa_flecha.png`;
- `captura_anadir_a_dia_minutos.png`;
- `captura_ruta_acordeon_roma.png`.

## 1. Fotos

1. **La foto del Coliseo no se ve,** ni en su tarjeta del día ni en el pool del formulario. Arréglalo y dime por qué pasaba.
2. **«Pasea y piérdete por Campo de' Fiori» no tiene foto.** Lleva la foto de la zona, de día o de noche según la hora (la regla del paseo que ya existe).
3. **Que todo tenga foto.** Haz una lista de todo lo que el viajero puede ver sin foto:
   - paradas de todos los días escritos y sus versiones;
   - paseos y experiencias nocturnas;
   - el pool del formulario, «Añadir parada» y Explorar;
   - excursiones.

   Si alguna no tiene, búscala en Unsplash con las reglas de siempre:
   - de día en las paradas;
   - de noche solo en las nocturnas (excepto las de Navidad);
   - nunca la misma foto dos veces en el mismo día.

   Si no encuentras una buena, no pongas cualquiera: dímela en la lista y la busco yo. Si hay una regla que lo compruebe en las pruebas, añádela para que no vuelva a pasar.

## 2. Nada de etiquetas internas

En los acordeones se ven etiquetas como «OPCIONAL». Son datos internos del motor y no deben salir nunca, ni esa ni las que vengan después («imprescindible», «si entra», «paseo»…). Revisa todas las etiquetas que salen en tarjetas y fichas, y dime cuáles quitaste.

**A INVARIANTES:** «El viajero nunca ve los niveles ni las marcas internas del motor».

## 3. El mapa que se esconde

Captura `captura_mapa_flecha.png`. Al tocar la flecha del mapa, el mapa desaparece y no hay forma de volver a abrirlo.

Como lo teníamos antes:
- la flecha esconde el mapa, pero deja una **franja pequeña** arriba (o un botón con la flecha hacia abajo) para volver a abrirlo;
- al tocarla, el mapa vuelve tal como estaba.

## 4. «+ Añadir día» → «Añadir lugares»

Por este orden:
1. **El nombre del día nuevo.** El ejemplo del campo de texto dice «Compras por Via del Corso». Cámbialo por **«Recorrido por el Centro Histórico»**. En otros destinos, el ejemplo sale de los datos de cada destino.
2. **El pool se abre con «Atracciones» ya marcado.** Así sale el mapa con sus puntos desde el principio. Hoy, sin nada marcado, la página se ve sin mapa.

## 5. La ventana de añadir un lugar a un día

Captura `captura_anadir_a_dia_minutos.png`. Es la que sale al tocar «Añadir» en un monumento del pool.

- **El campo «Minutos»** no se entiende. Pon «Minutos» como título y debajo «¿Cuánto tiempo quieres visitarlo?». Dentro va el tiempo recomendado de ese lugar (el que ya tiene en los datos), y el viajero lo puede cambiar.
- **El diseño, al de la app.** Hoy se ve anticuado. Hazla igual que las ventanas nuevas, como «¿Dónde la ponemos?» de las excursiones:
  - tirador y cruz;
  - en letra pequeña, el nombre del lugar, y el título «¿A qué día lo añades?»;
  - la lista de días con su fecha y su título. El día marcado, en terracota suave. El día donde ya está, apagado y con «Ya está en este día»;
  - el botón «Añadir al Día {n}».
- **Al añadir, la pantalla se queda en el pool** para seguir eligiendo. Sale una confirmación corta durante unos segundos: «Añadido al Día {n} ✓». No se cierra ni te lleva al día.

## 6. Recuperar un día y recuperar toda la ruta

Esto **cambia lo del 1 de octubre** (la varita en cada día con dos opciones):
- **«Recuperar este día»** va en el menú de los **tres puntos** de cada día, y recupera solo ese día.
  - Sale solo en los días que tienen cambios.
  - Quita la varita de los días.
- **«Recuperar mi ruta»** (toda la ruta del destino) va en la **pestaña Ruta**, en la tarjeta de cada destino (hoy solo Roma: `captura_ruta_acordeon_roma.png`), con el icono de la varita.
  - **Haz una varita más bonita,** con el estilo de los iconos de la app.
  - Antes de recuperar, una ventana: «¿Recuperar tu ruta de {destino}?», con la línea «Se pierden los cambios que has hecho en tus días» y los botones «Cancelar» y «Recuperar».
- **En los dos casos:** lo reservado no se quita. Se queda en su día y a su hora (regla de lo reservado).
- **En un día del viajero** (un día libre o uno creado con «+ Añadir día»), no sale «Recuperar este día»: no hay ruta nuestra que recuperar. Mándame captura de los tres puntos en un día así.

## 7. Marcar lo reservado en el día

Cuando algo está **reservado** (una entrada, una excursión, el Free Tour), se ve en dos sitios, con el mismo verde y el mismo candado de Reservas:
- **En el día cerrado (el acordeón):** una etiqueta pequeña bajo el título, con el candado y lo fijado: «🔒 Coliseo · 11:00». Si hay dos o más ese día: «🔒 2 reservas».
- **En la parada, con el día abierto:**
  - la franja de color de la tarjeta, en verde;
  - arriba, «Reservada ✓» y el candado con «Fijada», como ya estaba pedido.
- **Lo añadido pero sin reservar no se marca en verde.** Su tarjeta sigue normal, con «Reservar». Si se marcara igual, el viajero podría creer que ya la tiene.

**Informe corto:** capturas a 390 px de:
- el Coliseo y Campo de' Fiori con foto, y la lista de lo que no tenía foto;
- una tarjeta sin etiquetas internas;
- el mapa escondido con su franja, y abierto otra vez;
- el nombre del día nuevo y el pool con «Atracciones» marcado;
- la ventana nueva de añadir y la confirmación;
- los tres puntos con «Recuperar este día», y la tarjeta de Roma en Ruta con la varita nueva y su ventana;
- un día cerrado con «🔒 Coliseo · 11:00», y la parada reservada abierta.
