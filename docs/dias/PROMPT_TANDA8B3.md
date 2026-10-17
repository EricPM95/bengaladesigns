Hola. Tanda pequeña: TANDA 8B3, LOS ARREGLOS TRAS LAS CAPTURAS DE LA 8B2. Claude ha revisado tus capturas: las escenas, la película del Coliseo y el orden han quedado muy bien. Quedan fallos de datos y de capturas. Todo sigue detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8B2.md y docs/dias/notas_8b/fotos.md.
- Claude ha dejado este prompt en docs/dias. Inclúyelo en tu commit tal cual.

## 1. Las capturas repetidas (otra vez)
Siguen saliendo copias exactas, byte a byte, con dos nombres:
- V1 = 2;
- V3 = 2b;
- V5 = 3b;
- V6 = 1a = plazo;
- lista = 9b;
- A2 = CS-coliseo-03 (la cámara).

Además, V4 no es «lejos»: es la pantalla de los permisos.
- Rehaz V1, V3, V4, V5, V6, A2 y lista, cada una con su pantalla.
- Añade a la prueba una comprobación que falle si dos capturas son idénticas.

## 2. «País nuevo: Vaticano» al marcar el Coliseo
En CS-coliseo-18 y 19 sale «Tu país número 2: Vaticano» al marcar el Coliseo, que está en Italia. Además, el mismo día dice «Tu destino número 1: Roma».
- Mira por qué. Si es un fallo del servidor, arréglalo y ponle su prueba.
- Si es tu dato de prueba, haz que la serie cuadre.

## 3. Números que no cuadran
- El sello dice «Has visto tu primer imprescindible», y debajo y en el resumen pone «3 de 8 imprescindibles» (CS-17 y CS-20).
- En S2-01, antes de encenderse, la insignia dice «3 de 8» y el texto de debajo «4 DE 8».
- El resumen de S2-10 cuenta «1 emblema oculto» y «1 maravilla del mundo», pero en esa serie no ha salido ninguno de los dos.

El resumen del día cuenta lo que ha salido ese día, nada más. Las series de prueba, con datos que cuadren de principio a fin.

## 4. La medalla de las 7 maravillas
En CS-12 a CS-14, el Coliseo casi no se distingue de las demás maravillas al encenderse. Tiene que verse claro que se enciende su pedazo, y solo el suyo, como en **Logros · Momentos**.

## 5. La película del Coliseo
- No hay captura de la frase «Casi 2.000 años esperándote…»: CS-06 es «frase-2».
- Comprueba que sale siempre, también al volver a verla, y añade su captura a la serie.

## 6. Una sola serie, un solo viaje
- La serie del Coliseo pone «17 – 19 oct» y el resto de capturas «17 – 20 oct». Todo el modo de pruebas, con las mismas fechas.
- CS-coliseo-01 (permisos) es de otro viaje (Centro histórico, con el Panteón). Toda la serie, del mismo viaje y del mismo día.

## 7. HOY v2
- **Avisos de otro día:** en V2 (sábado 17, Centro histórico) sale «Basílica de San Pedro cierra hoy a las 20:00», que es una parada del domingo. Cada aviso, solo el día de su parada.
- **El texto tras el Visto:** en CS-01 el Coliseo dice «Guarda un recuerdo» y un momento después «Te espera una sorpresa: sube tu foto». Que salga lo bueno desde el principio.
- **El «⌛ 0min»** de la ficha del Coliseo (CS-00): si no hay duración, no lo enseñes.

## 8. Las fotos
Lo de tu auditoría, decidido:
- **Coliseo:** en CS-00 sale sin foto (fondo gris) y en V7 con una foto de una reja con árboles. Revísalo: tiene que salir el Coliseo.
- **Sin foto antes que una equivocada.** Via del Babuino deja la de Trevi. Terraza de Largo Gaetana Agnesi y Colle Oppio dejan la del Altar de la Patria. Estas tres, sin foto.
- **Museos Vaticanos:** fuera la foto de dentro de la Capilla Sixtina.
- **Los sitios más importantes** (Coliseo, Panteón, Basílica y Plaza de San Pedro, Foro, Trevi, Navona, Plaza de España, Museos Vaticanos…): nunca la de Wikipedia ni la de otro sitio. Si no tienen foto propia, dime en el informe cuáles son y las buscamos.
- **Las fotos de Navidad** (mercadillo de Navona, belenes…): solo dentro de sus fechas. Fuera de ellas, sin foto.
- **Columna de Trajano:** deja de compartir la de los Mercados. Si no hay otra, sin foto.
- No borres ninguna foto: solo cambia qué foto sale en cada sitio.

## 9. La prueba
- No toca el motor: la batería rápida.
- `pruebaLogros1` y las pruebas de pantallas, con lo de arriba: el país del Coliseo, el resumen que cuenta solo lo del día, los avisos de cada día.
- Rehaz en `docs/dias/capturas_8b/` las del punto 1, la serie entera del Coliseo y la S2.
- Comprueba que no hay errores en la consola.

## 10. El informe (docs/dias/INFORME_TANDA8B3.md)
En español sencillo:
- qué has cambiado;
- por qué salía Vaticano;
- la lista de los sitios importantes sin foto propia;
- las capturas nuevas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
