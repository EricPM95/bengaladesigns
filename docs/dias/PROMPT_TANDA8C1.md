Hola. Nueva tanda: TANDA 8C1, LOS LOGROS DE VIAJERO DE LA VERSIÓN 1 Y LA EXPERIENCIA (EXP). Es la primera parte de la 8c; las pantallas de Logros (vitrina, pasaporte, Perfil) van en la 8c2. Todo detrás de los interruptores de siempre. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8B5.md y, en docs/dias, NOTAS_PARA_8C.md y EXP_Y_NIVELES.md.
- **Design, nuevo:** Claude ha puesto en `docs/diseno/proyecto/` la página **Dashboard** (`Dashboard.dc.html`) y sus piezas nuevas o cambiadas: `Medalla Grado`, `Medalla Destino`, `Medalla Premium`, `Doce Meses`, `Cuatro Estaciones`, `Logro Unico`, `Medalla Prueba.dc.html`, `Indice.dc.html` y las imágenes de `assets/`.
- **Para los logros de viajero, manda el Dashboard** (pestaña «De viajero»): sus nombres, sus escalones y sus dibujos. Si algo choca con Logros · Modelos, manda el Dashboard y dímelo.
- Claude ha dejado este prompt y EXP_Y_NIVELES.md en docs/dias. Inclúyelos en tu commit tal cual, con los archivos de Design.
- Si necesitas una migración nueva, escríbela (0025 o la que toque) sin aplicarla, y dime en qué orden va.

## 1. Solo los logros de la Versión 1 (Eric)
En el Dashboard, solo los que llevan la etiqueta **VERSIÓN 1** salen en esta versión. Los demás se quedan en los datos, apagados: no se ganan, no se ven en ningún sitio y no dan EXP.

**Versión 1:**
- **El mundo:** Países, Destinos, Capitales, Patrimonios de la Humanidad, Dos países en un día, Viajero nacional y Las 7 maravillas.
- **El tiempo:** Viajes, Las cuatro estaciones, Los 12 meses, Nunca es la última vez, Un destino cuatro estaciones, Navidad fuera de casa, Nochevieja fuera de casa, Tres viajes en un año, De sol a sol, Alondra y Búho.
- **Cómo viajas:** A mi aire, En pareja, Con amigos, En familia, Día perfecto, Viaje perfecto, Imparable, Escapada, Gran viaje y El fotógrafo.
- **Coleccionista:** Diamante a la primera, Cazador de emblemas, Coleccionista, Conocedor de la ciudad, {Ciudad} al completo, Tres ciudades de oro y Tres ciudades de diamante.
- **Exclusivos:** Viajero fundador, Pionero, {Ciudad} {año} y Probador.

**Para más adelante (apagados):**
- La vuelta al mundo;
- Continentes;
- Los pequeños gigantes;
- Al otro lado del ecuador;
- Todos los secretos de {ciudad}.

**Hazlo con un dato en `viajero.json`** (por ejemplo `version: 1` o `activo: false`), para encenderlos más adelante sin tocar código.

## 2. Los nombres y escalones nuevos del Dashboard
Pon en `viajero.json` lo que haya cambiado. Por ejemplo:
- **Destinos:** suma 25 «Pasión por el mundo» y 30 «Alma de explorador».
- **Patrimonios:** 1, 5 «Pasos por la historia», 10, 15 y 25 «Heredero del mundo».
- **Viajes:** 1, 5 «Cinco maletas», 10 «Maleta siempre lista», 15 «Viajero de ida y vuelta», 20 «Veinte maletas», 25 «Vida de viajero» y 30 «Treinta viajes, treinta recuerdos».
- **Cazador de emblemas:** 5 «Cazador de emblemas», 10 «Ojo de lince» y 15 «Nada se te escapa».
- **Coleccionista:** 5 «Coleccionista», 10 «Álbum lleno» y 15 «Gran coleccionista».
- **Conocedor de la ciudad:** 25 «Conocedor de {ciudad}» y 50 «Como en casa en {ciudad}».
- **Las cuatro estaciones:** se ve su avance (1 de 4… 4 de 4).
- **Los 12 meses:** cada mes es un pedazo.
- Compara todos los demás con el Dashboard.
- Las líneas cortas, las del Dashboard.
- **Alondra y Búho:** el Dashboard dice «Empieza tu ruta muy temprano» y «Acaba tu ruta muy tarde». La regla sigue siendo la de ahora (10 días Madrugador / 10 días Nocturno), hasta que Eric diga otra cosa. Nunca una hora a la vista.

## 3. Los dibujos
- Cada logro de viajero, con su dibujo del Dashboard: `Medalla Grado`, `Medalla Destino`, `Logro Unico`, `Sello Logro`, `Cuatro Estaciones`, `Doce Meses`, `Dos Paises`, `Exclusivo Holo` y `Medalla Siete`. Cada grado, con su color y su detalle, como allí.
- Cámbialos en todos los sitios donde ya salen: «Y además…», los avisos de lo ganado y donde haya otro.
- Dibujados con código, como en Design. Cada dibujo se carga solo al abrirlo. Mide el peso al abrir antes y después, y ponlo en el informe.

## 4. La experiencia (EXP): el cerebro
Todo lo de `EXP_Y_NIVELES.md`, en el servidor. Las pantallas de la EXP (la barra de nivel, los marcos de rango, la subida de nivel y la tienda) llegarán con Design: **en esta tanda, ninguna pantalla nueva.**
- **Cómo se calcula:** la EXP sale de sumar lo que cada viajero ya ha conseguido (`logro_hechos`), con la tabla de `EXP_Y_NIVELES.md`, en un archivo de datos fácil de cambiar (por ejemplo `data/logros/exp.json`).
  - Solo cuenta lo comprobado (ubicación o foto).
  - Los viajes de antes de la app («¿Dónde has estado ya?»): 0 EXP.
  - Lo que está apagado (punto 1): 0 EXP.
  - Lo calcula siempre el servidor. Nunca baja: si se cambia la tabla y a alguien le saldría menos, se queda con lo que tenía.
- **Con fecha:** cada EXP ganada lleva su fecha, para saber cuánta se ganó cada año. Hará falta para el sorteo y para la tienda.
- **Los niveles:**
  - 50 niveles en 10 rangos de 5: Soñador, Explorador, Viajero, Trotamundos, Aventurero, Nómada, Cartógrafo, Embajador, Navegante y Leyenda.
  - Lo que cuesta subir: 500, 700, 900… (200 más cada vez) hasta el nivel 11; desde ahí, todos piden 2.500.
  - Después del 50, «Leyenda ★1, ★2…»: una estrella cada 3.000 EXP, sin final.
  - Todo en el archivo de datos: los nombres, los costes y las estrellas.
- **Lo que manda el servidor al móvil:** EXP total, nivel, rango, EXP dentro del nivel y la que falta para el siguiente. También, en cada momento de logro, cuánta EXP da y si se sube de nivel (para cuando llegue la pantalla).
- **Las invitaciones:**
  - 100 EXP al que invita cuando el amigo invitado acaba su primer viaje con la app. No antes: crear la cuenta no cuenta.
  - Como mucho, 10 amigos al año.
  - Si todavía no hay un enlace de invitación, deja preparados el dato y la regla, y dime qué falta.
- **El sorteo:**
  - Solo la regla, sin pantalla: entra quien tenga nivel 3 o más y haya acabado al menos un viaje con la app ese año.
  - En `/?admin=logros`, cuántos entran este año y la lista para el sorteo. Nada de nombres ni correos a la vista en el móvil.
- **El modo de pruebas:**
  - una forma de ver la EXP de un viajero de ejemplo, su nivel y su rango;
  - las cuentas de Roma: un viaje normal (unos 1.400 sin el continente, nivel 3) y Roma al 100 % (unos 2.870 sin el continente ni «Todos los secretos», nivel 4).
  - Si te salen otras cifras, dime por qué.

## 5. Lo que quedó de la 8B (NOTAS_PARA_8C.md)
- **El título del día en HOY v2:** siempre el que tiene ese día en la ruta, sea cual sea, también si el viajero le ha cambiado el nombre.
  - En la captura de la 8B5, el día se llamaba «Roma antigua» y empezaba por los Museos Vaticanos. Dime si venía del motor o era un caso especial de tu modo de pruebas.
  - Si viene del motor, no lo toques: apúntalo en el informe.
- **La hoja de logros:** donde dice «N de 12 secretos», que diga lo mismo que el resumen del día: «Roma aún esconde N secretos.».

## 6. La prueba
- No toca el motor: la batería rápida. Si alguna prueba del motor tarda mucho, dilo, pero pásala si toca algo del motor.
- `pruebaLogros1` ampliada:
  - los apagados no se ganan ni dan EXP;
  - los escalones nuevos;
  - la EXP de cada cosa;
  - los niveles en sus límites: 499, 500, 1.199, 1.200, el cambio a 2.500 en el 11 y el paso del 50 a Leyenda ★1;
  - la EXP que no baja al cambiar la tabla;
  - las invitaciones con su máximo;
  - el sorteo: nivel 3 con un viaje este año sí; nivel 3 sin viaje este año no; nivel 2 no.
- **Capturas** en `docs/dias/capturas_8b/`:
  - «Y además…» con los dibujos nuevos de los logros de viajero;
  - el modo de pruebas con la EXP y el nivel de un viajero de ejemplo.
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.

## 7. El informe (docs/dias/INFORME_TANDA8C1.md)
En español sencillo:
- qué has cambiado;
- la lista de logros encendidos y apagados;
- lo que no ha podido quedar igual que en el Dashboard, y por qué;
- las cuentas de EXP de Roma;
- lo que falta para las invitaciones;
- la migración nueva, si la hay, y su orden;
- el peso antes y después;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
