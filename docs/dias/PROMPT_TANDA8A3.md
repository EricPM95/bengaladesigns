Hola. Nueva tanda pequeña: TANDA 8A3, TRES ARREGLOS. Sin pantallas de Design, todo detrás de los interruptores de siempre. No toques el motor de rutas: solo lo lees.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8A2.md y el apartado 34 de docs/dias/APUNTES_TRAS_TANDA7.md.
- Claude ha actualizado APUNTES_TRAS_TANDA7.md y REVISION_DESIGN_PASO3.md, y ha dejado MENSAJE_DESIGN_CAMBIOS_PAREJA_17OCT.md, MENSAJE_DESIGN_AVISO_RECOMENDACION_17OCT.md y este prompt. Inclúyelos en tu commit tal cual.

## 1. La hora libre del día de llegada, la de la ruta
- Para elegir el día de prueba usas «llegada + 90 minutos». Pero el motor ya calcula a qué hora queda libre el viajero el día de llegada, según el aeropuerto o la estación y el transporte (Fiumicino no es lo mismo que Ciampino o el tren).
- Usa esa misma hora: la que sale en la ruta de ese día. Léela de lo que ya devuelve el motor, sin tocarlo.
- Lo mismo para la hora del último día, si la usas.
- Si para algún caso el motor no da la hora, usa los 90 minutos de antes como respaldo y dímelo en el informe.

## 2. La pregunta de las 12:00, también sin cobertura
- Si un Visto se hizo sin señal y llega más tarde, cuenta la hora del Visto, no la de llegada.
- Si esa hora es a partir de las 12:00 y es la primera vez que usa HOY en su día de prueba, no gastes la prueba directamente: haz la pregunta de las 12:00 cuando llegue («Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?»).
- Si ya ha pasado ese día cuando llega, gasta la prueba como ahora y dime en el informe cómo lo has resuelto.

## 3. Partir el código para que la app abra antes
- Al abrir la app, el móvil tiene que leer unos 3,4 MB de código, aunque se descarguen 1,1 MB. En un móvil lento se nota.
- Pártelo para que al abrir solo cargue lo de la primera pantalla. Lo demás (el mapa, las fichas, Explorar, Reservas, los logros, el Perfil, el panel de Eric…) se carga cuando se abre.
- Que no cambie nada de lo que ve el usuario. Mientras se carga una parte, lo de siempre de la app (sin pantallas en blanco que salten).
- Mide antes y después: lo que se descarga y lo que tiene que leer el móvil al abrir, y ponlo en el informe.

## 4. La prueba
- La batería rápida.
- Y, por el punto 3, la muestra de 60 fechas, por si acaso, aunque el motor no se toque. Las 365, no.
- Abre la app en local en el navegador y comprueba que se abren todas las pestañas, una ficha, el mapa y RESERVAS sin errores en la consola. Dime qué has mirado.
- Amplía `pruebaLogros1` con el punto 1 (llegada a Fiumicino, a Ciampino y en tren) y el punto 2 (un Visto sin señal de las 13:00 que llega a las 15:00).

## 5. El informe (docs/dias/INFORME_TANDA8A3.md)
En español sencillo:
- qué has cambiado;
- el peso antes y después;
- lo que has comprobado en el navegador;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
