Hola. Nueva tanda: TANDA 8C2, LAS PANTALLAS DE LOGROS, EL PERFIL CON SU MARCO Y LA EXP A LA VISTA. Es la segunda parte de la 8c: el cerebro ya está (8a, 8b, 8C1); aquí se pinta. Todo detrás de los interruptores de siempre. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8C1.md y, en docs/dias, EXP_Y_NIVELES.md (ya con las decisiones de Eric con Design) y NOTAS_PARA_8C.md.
- **Design, nuevo:** Claude ha puesto al día en `docs/diseno/proyecto/`:
  - **Logros · Pantallas** (cambiada);
  - **Logros · Momentos** (cambiada);
  - **Dashboard** (cambiado, con la pestaña de los marcos);
  - las piezas nuevas `Experiencia`, `Marco Rango` y `Marco Estatus`, y `Compartir` (cambiada);
  - en `assets/`, los 10 marcos de rango (`marco-nivel1.png` … `marco-nivel10.png`) y sus huecos (`hueco-1.png` … `hueco-10.png`).
- **Quién manda:**
  - cómo es cada dibujo: **Logros · Modelos** y el **Dashboard** (en los logros de viajero y los marcos, el Dashboard);
  - cómo aparece cada cosa: **Logros · Momentos**;
  - dónde vive cada logro: **Logros · Pantallas**.
  - Si algo choca con una regla de este prompt o de los apuntes, manda la regla y dímelo.
- Claude ha dejado este prompt en docs/dias. Inclúyelo en tu commit tal cual, con los archivos de Design.
- Si necesitas una migración nueva, escríbela sin aplicarla y dime en qué orden va.

## 1. Logros · Pantallas, 01: el botón flotante y lo de dentro
- **El botón**, en todos sus estados: antes del viaje en gris, bronce, plata, oro, diamante y «con algo nuevo sin ver».
  - Abajo a la derecha, encima de la barra de pestañas, en RUTA, DÍAS y HOY.
  - En HOY sube un poco para no tapar [✓ Visto].
  - La lista de días deja hueco al final para que la última tarjeta se vea entera.
- **La hoja al tocarlo** (2a, 3a, 3c, 4a): antes, durante y después del viaje, como en el diseño.
  - Las colecciones, en ese orden.
  - «En tu ruta» y «Con tu ruta puedes completar N de las 11 colecciones», con los números de su ruta de verdad.
  - «Lo nuevo de hoy» arriba durante el viaje, y «Para tu próximo viaje a Roma» después.
  - Tocar un pedazo dice su nombre; tocar una colección la abre (3b).
  - Tocar un emblema encontrado vuelve a poner su escena.
- **Los secretos:** antes del viaje, «Roma esconde 12 secretos». Durante y después, «Roma aún esconde N secretos.» (lo que decidió Eric), no «N de 12 secretos encontrados».
- **Lo conseguido vuela a donde se guarda** (5, 6a y 6b): lo de Roma al botón flotante y lo de viajero al Perfil. El puntito solo si se saltó la animación.

## 2. Logros · Pantallas, 02: la vitrina, Todos mis logros, cada destino y la ficha
- **«Mi vitrina» y «Todos mis logros»**, en una pantalla con dos pestañas (T1, T2, V1, V2):
  - «Por destino», con sus dos vistas: Destinos y Países;
  - los logros de viajero por grupos, con «Ver todo»;
  - Las 7 maravillas;
  - los Exclusivos.
  - Solo los logros encendidos de la versión 1.
- **La página de cada destino** (G1, G2, T3): sus sellos, sus colecciones y sus emblemas, y el Vaticano dentro de Roma («Estás aquí»).
- **Una colección por dentro, como un álbum de cromos** (A): con la fecha de lo visto, y con el día de su ruta y [Cómo llegar] en lo que le falta.
- **«Mi colección»** (M1, M2), página a página, con sus huecos por conseguir.
- **La ficha de un logro** (T4): con [Compartir], [Volver a ver] y «Es tu título».
- **Elegir hueco en la vitrina** (V3): «Llevar a mi vitrina», «Elige un hueco» y lo que vuelve a Todos mis logros.
- **Mis viajes → un viaje** (TR): sus días, sus fotos y lo que ganó en ese viaje.

## 3. Logros · Pantallas, 03: ¿Dónde has estado ya?
- J1, J2 y J3: marcar países en el globo o en la lista, buscar los países pequeños y «Lo que has ganado».
- **Las reglas:**
  - los países que marca dan su sello «recuerdo» en el pasaporte («antes de la app»);
  - no dan EXP;
  - no cuentan para el sorteo;
  - no cuentan para los logros que piden viajar con la app.
- El globo, el de «Tu mundo».

## 4. Logros · Pantallas, 04: el Perfil y el pasaporte
- **El Perfil** (P1):
  - con su **marco de rango** alrededor de la foto, el **nivel**, el **rango** y la **barra de EXP**, como en el Dashboard y en `Marco Rango` / `Marco Estatus`;
  - su título, que se elige al tocarlo (P1b), entre sus logros de viajero;
  - su vitrina;
  - Mi pasaporte;
  - Mis viajes (en curso, próximo, ya hechos y los de antes de la app);
  - «Añadir un viaje que ya hiciste».
- **El pasaporte** (P2, P2l, P2v, P2i2, P2m y P2e): las páginas por país, la lista de países, el Vaticano aparte, «Por conseguir» y el sello que se estampa al acabar el viaje.
- **Ajustes, Mis pases y Borrar la cuenta** (P3, P4 y P5) no van en esta tanda: van con la parte 3 de las cuentas, porque necesitan las cuentas de verdad. Deja el botón de Ajustes donde va.
- **Los marcos:**
  - son imágenes;
  - pásalos a WebP a un tamaño que se vea bien en el Perfil (en origen pesan de 700 KB a 1,2 MB cada uno; que se queden en unos 40–60 KB);
  - cárgalos solo cuando se ven;
  - cada nivel dentro del rango, con su detalle, como en el Dashboard.

## 5. La EXP a la vista (Logros · Momentos y pieza `Experiencia`, E1 a E4)
Lo que decidió Eric:
- **Durante las sorpresas y las películas, nada de EXP:** ni con el Emblema Oculto, ni con la maravilla, ni con «El final de las 7 maravillas».
- **Cuando se acaban y vuelve a verse la app,** sale **una sola animación** con toda la EXP sumada («+405 EXP»), flotando en la parte de abajo, con el nivel, el rango y la barra.
- **Si se sube de nivel,** sale justo después (E3). **Si cambia de rango,** el cambio de rango con su marco nuevo (E4). Se pasa tocando.
- **En el resumen del día no sale la EXP.**
- **No tapa nada de abajo:** ni la barra de pestañas, ni el botón flotante, ni [Seguir]. Si un dibujo vuela al botón flotante, primero el vuelo y luego el «+EXP».
- **Los números:** los de verdad del servidor (8C1). Los de Design son de muestra.

## 6. Compartir (C1, C2)
- Con los cambios de Design en `Compartir`.
- El hueco del **LOGO** se queda vacío y preparado para cambiarlo: el nombre y el logo de la app aún no están decididos (`data/marca.json`).
- Ningún nombre puesto a mano, tampoco «Routy».

## 7. Las reglas que no se pueden saltar
- **Los emblemas nunca se ven antes:** ni en la hoja, ni en la vitrina, ni en el pasaporte. Solo «?».
- **Ninguna hora de Madrugador o Nocturno a la vista.**
- **Ningún número inventado.**
- **Ningún nombre de empresa** en los textos de la app.
- **Zonas de toque de 44 px como mínimo.**
- **«Reducir movimiento»:** si el móvil lo tiene puesto, todo sale sin moverse.
- **Fuera los textos que explican lo que ya se ve.** Los del diseño y los de los apuntes; si algo no está, dime qué has puesto.

## 8. La prueba
- No toca el motor: la batería rápida.
- Pruebas de pantallas nuevas:
  - el botón en sus estados;
  - la hoja antes, durante y después;
  - la vitrina con y sin piezas;
  - un destino;
  - una colección por dentro;
  - «¿Dónde has estado ya?» sin EXP;
  - el Perfil con su marco en cada rango;
  - el pasaporte;
  - la EXP al volver a la app, la subida de nivel y el cambio de rango;
  - nada de EXP en el resumen del día.
- **Capturas** en `docs/dias/capturas_8c/`, a tamaño de móvil, con el mismo nombre que su pantalla en el diseño (1b, 2a, 3a, 3c, 4a, T1, T2, G1, G2, T3, A, M1, M2, T4, V1, V2, V3, TR, J1, J2, J3, P1, P1b, P2…, E1–E4, C1, C2).
  - De las animaciones, varias capturas: principio, mitad y final.
  - Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.
- Mide el peso al abrir antes y después.

## 9. El informe (docs/dias/INFORME_TANDA8C2.md)
En español sencillo:
- qué pantallas has hecho y dónde están;
- lo que no ha podido quedar igual que en el diseño, y por qué;
- los textos que has tenido que poner tú;
- el peso antes y después (y lo que pesan los marcos);
- lo que queda para la parte 3 de las cuentas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
