Hola. Tanda pequeña: TANDA 8C3, LOS ARREGLOS TRAS LAS CAPTURAS DE LA 8C2. Claude ha revisado tus 76 capturas: ha quedado muy bien (la hoja, la vitrina, el pasaporte, los marcos en sus 10 rangos, la subida de nivel, el cambio de rango y Leyenda ★3 cuadran con la tabla). Quedan estos arreglos. Todo detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8C2.md.
- Claude ha dejado este prompt en docs/dias. Inclúyelo en tu commit tal cual.

## 1. Las capturas, sobre la pantalla que toca
- Las de la hoja de logros (3a, 3b, 3c, 3d, 3e y 4a) y las del «+EXP» (E1 y E2) salen encima de «Crear el viaje» (paso 1/7, «¿De dónde sales?»). En la app salen sobre DÍAS o HOY.
- Rehazlas sobre la pantalla de verdad:
  - la hoja, sobre DÍAS o HOY;
  - el «+EXP», sobre HOY, al volver de las sorpresas de un Visto.
- Comprueba en las de HOY que el «+EXP» no tapa [✓ Visto] ni la barra de abajo.

## 2. Fallos que se ven en las capturas
- **3c:** las colecciones salen sin su dibujo (el hueco de la insignia, vacío). En 3e sí salen. Que no se vea la lista antes de que estén los dibujos, o que salga su hueco en gris mientras cargan.
- **P1-rango7 (Cartógrafo):** sale el Perfil de antes (la «V» sin marco, el mapa y Mis viajes), no el nuevo. Mira por qué y arréglalo; que los 10 rangos salgan con el Perfil nuevo.
- **El exclusivo de la ciudad y el año:** el texto dice «Roma 2026» y el dibujo dice «ROMA 2027» (T2b, V1, V2). Los dos, con el año de verdad del viaje.
- **El pasaporte del Vaticano (P2v):** el sello lleva el dibujo del Coliseo. Que lleve el del Vaticano, como su sello de ciudad.
- **HOY (1a-hoy):** arriba sale un mapa grande en vez de la foto del Coliseo con su mapa pequeño, como en la 8B. Si es a propósito, dime por qué; si no, que vuelva la foto.
- **Los secretos:** en la página de cada destino (G1, G2, T3) y en Todos mis logros (T1), donde pone «N de 12 secretos» o «N secretos encontrados», que diga «Roma aún esconde N secretos.», como en el resto. Antes del viaje, «Roma esconde 12 secretos».

## 3. Los datos del modo de pruebas, que cuadren
Ahora, en el mismo viajero de ejemplo:
- el Perfil dice «3 países · 4 sellos» y el pasaporte «7 países · 5 ciudades · 41 días viajando»;
- Todos mis logros dice «Roma, sello de diamante, 11 de 11 colecciones», y la página de Roma, «plata, 4 de 11 colecciones»;
- en «¿Dónde has estado ya?» (J3), 11 países marcados dan «8 sellos de recuerdo».

Que todo el modo de pruebas use un solo viajero con los mismos datos en todas las pantallas. Si los 8 sellos de 11 países tienen su razón, dímela.

En J3 sale «2 continentes». Los continentes están apagados en la versión 1: quita esa cuenta de la pantalla hasta que se enciendan.

## 4. Lo que dejaste distinto del diseño
- **Los pines de la vitrina** (✓ y «+») en la página de cada destino: ponlos, como en el diseño.
- **«Añadir a mi ruta»:** que abra «Añadir parada» con el sitio ya puesto.
- **Mis viajes:** las tarjetas grandes con foto, como en el diseño (P1), no las filas de antes.
- **La foto del perfil:** se queda la inicial hasta que estén las cuentas de verdad (parte 3).
- **Los sellos con monumento** solo en las ciudades que Design dibuja; las demás, con su sello sencillo. Está bien así.
- **Ajustes:** se queda para la parte 3 de las cuentas.

## 5. Los riesgos que dejaste
- **`construirVitrina` (`vistas.js`):** rellena sola una balda vaciada y mete el bronce de un sello que ya es oro.
  - Arréglalo.
  - O, si `GET /api/logros/vitrina` ya no lo usa nadie, quítalo para que no lo use nadie por error.
- **El sello estampado al acabar el viaje:** que el aviso de viaje acabado abra el pasaporte con el sello estampándose (P2e).

## 6. La prueba
- No toca el motor: la batería rápida.
- `pruebaPantallas8c` ampliada con lo de arriba:
  - los 10 rangos con el Perfil nuevo;
  - el año del exclusivo;
  - el sello del Vaticano;
  - los secretos;
  - los datos de prueba iguales en todas las pantallas;
  - sin continentes;
  - los pines;
  - «Añadir a mi ruta» con el sitio;
  - la vitrina sin los dos fallos.
- Rehaz en `docs/dias/capturas_8c/` las capturas que cambien.
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.

## 7. El informe (docs/dias/INFORME_TANDA8C3.md)
En español sencillo:
- qué has cambiado;
- por qué salía el Perfil de antes en el rango 7;
- lo del mapa grande de HOY;
- las capturas nuevas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
