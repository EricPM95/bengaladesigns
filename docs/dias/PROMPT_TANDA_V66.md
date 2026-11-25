Hola. TANDA V66: HOY › LAS RESPUESTAS DE ERIC A TUS PREGUNTAS DE LA V52-V58, LA HOJA DEL EMBLEMA OCULTO Y EL ATARDECER. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V65 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v66.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

**Dibujos: `TODO_IGUAL`, en mis Descargas** (la versión más nueva; trae páginas que no tenía la V60). Descomprímelo otra vez en `docs/diseno/proyecto/`, **encima, sin borrar**. Páginas de esta tanda: **«El Emblema Oculto»** (E1, E2) y **«El atardecer»** (S1, S2, S3). Design es un prototipo: se copia SOLO lo que se describe.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. La hoja del Emblema Oculto, nueva (E1, E2)
Sustituye a la de ahora (`HojaLlegadaOculta`): hoja azul noche casi a pantalla completa, con estrellas y rayos; el rombo dorado con «?» arriba, en el centro; «EMBLEMA OCULTO»; el título centrado «¡Aquí se esconde un Emblema Oculto!»; «Haz una foto en {lugarCon('en', sitio)} y descúbrelo.»; **[Hacer la foto]** (dorado) y **[Elegir de la galería]** (oscuro con borde dorado; abre la fototeca y la foto cuenta igual); abajo «¿No estás aquí? Desmarcar visto». Sale al llegar (V52) y nunca de una parada saltada (V63). **Comprueba que, con un aviso de [Deshacer] abajo, la hoja empieza encima y no se tapan sus botones** (V63 §1).

## 2. El atardecer (S1, S2, S3)
La tarjeta de ahora pone el botón a la derecha y aprieta el texto. Como el dibujo:
- arriba, pequeño, el icono y **«ATARDECER · 18:26»** (en S2 y S3, solo «ATARDECER»: la hora ya va en el título);
- **S1, con parada de atardecer:** «Hoy ves el atardecer en el Castillo de Sant'Angelo» · «Llega un cuarto de hora antes, que es cuando más bonito está.» (sin repetir la hora) · botón a lo ancho [Ir al Castillo de Sant'Angelo];
- **S2, sin parada de atardecer:** «Hoy el sol se pone a las 18:26» · **solo el sitio más cercano** («Desde el Pincio, a 10 minutos andando, se ve precioso.») · [Ir a la Terraza del Pincio];
- **S3, sin ningún sitio cerca:** solo «Hoy el sol se pone a las 18:26», sin texto ni botón.
- Desde dónde busca: a menos de 50 km de la ruta, desde donde está; a más, desde la última parada hecha. Con lluvia, no sale (V63).

## 3. Las respuestas de Eric a tus preguntas (CHECKLIST_V52_V58)
1. **Una entrada o reserva cuyo documento trae OTRO día del viaje: PREGUNTAR antes de moverla** (hoy la V50 la mueve sola). Hoja con el formato de las hojas nuevas (`HojaPropuesta`): «Tu entrada del Coliseo dice jueves 26, pero la tenías el martes 24. ¿La pasamos al jueves?», la tarjeta del sitio con «Al jueves 26» y su cuadrado, [Pasarla al jueves] (dorado) y [Dejarla el martes] (blanco con borde), lado a lado. Al pasarla, aviso abajo con [Deshacer]. Si la deja, nada más. (Fecha fuera del viaje: la línea naranja, como siempre.)
2. **«Guarda un recuerdo de {sitio}»: solo en los sitios de la colección «Los imprescindibles» de cada destino y en las maravillas del mundo**, al pulsar [He terminado], **solo si no hizo ya una foto de ese sitio** (con [Hacer foto] de la tarjeta o con la cámara flotante estando allí) y una vez por sitio. En el resto de paradas, nunca (Eric: «es muy pesado foto en todos los lugares»).
3. **(13)** El aviso de la entrada con margen: «Al Foro puedes entrar más tarde; hoy quizá no llegues a todo».
4. **(14)** A la fila nueva de avisos (`FilaDeAviso`): los cierres de la mañana, viento y nubes, «activa los avisos» y el día de prueba del pase. «¿Cómo vas?» y «Cerca de ti» se quedan como tarjetas.
5. **(15)** El texto: «Es de los lugares más importantes de tu viaje: solo lo hacemos si tú quieres.»
6. **(16)** Lluvia: «esta mañana» hasta las 13:00, «esta tarde» hasta las 20:00; después, «esta noche».
7. **(20)** En una hoja con muchos cambios: tarjeta **solo** para lo que cambia de día, va a pendientes o se quita. **Lo que sigue en el mismo día no se menciona** (ni «se corre unos minutos»): no enseñamos horas, cada uno va a su ritmo.
8. **(22)** **[Sin fuerzas] primero pregunta:** «¿Acabamos aquí el día y descansas?» con [Sí, acabar el día] (dorado) y [Seguir] (blanco con borde). Con sí: «Por hoy ya está» (H2) y después el resumen del día.
9. **(28)** Viajando solo: «Sin fuerzas», «¿Cómo vas?», «Tómate un respiro». Ok, como está.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: la lista con ✅/🟡/❌; captura en modo iPhone al lado de su dibujo de E1, S1, S2 y S3; captura de las hojas de los puntos 3.1 y 3.8 (todo el recorrido de [Sin fuerzas]); qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
