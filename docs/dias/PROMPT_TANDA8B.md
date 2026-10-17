Hola. Nueva tanda: TANDA 8B, HOY V2 Y LOS MOMENTOS DE LOS LOGROS, en pantallas de verdad. Es la primera tanda con las pantallas de Design para los logros. El cerebro ya está hecho (8a, 8a2 y 8a3): aquí se pinta. No toques el motor de rutas: solo lo lees.

## 0. Antes de empezar
- **Los diseños:** Claude ha dejado el proyecto entero de Design en `docs/diseno/proyecto/` (las páginas `.dc.html`, la carpeta `Piezas/` y `assets/`). Ábrelos en el navegador para verlos. Manda lo que se ve en esas páginas; si una pantalla choca con una regla de este prompt o de los apuntes, manda la regla y dímelo.
- **Los dibujos de todo están en Logros · Modelos (Eric: «es importante»).** Los sellos con sus grados, las insignias de las colecciones con sus pedazos, los emblemas, la medalla de las maravillas y las chapas de los logros de viajero: cada uno, tal cual está en **Logros · Modelos**. Las demás páginas los usan; si en alguna un dibujo no coincide con el de Modelos, manda Modelos y dímelo en el informe.
- **Las pantallas de los momentos están en Logros · Momentos (Eric).** Cómo sale cada sorpresa, en qué orden y con qué animación: tal cual en esa página. Modelos dice cómo es cada dibujo; Momentos, cómo aparece.
- **Las páginas de esta tanda:**
  - **App · HOY:** el apartado 01 «HOY, día a día» y el 02 «El Visto y las fotos». Las piezas «HOY v2» y «Visto Fotos».
  - **Logros · Momentos:** todo, menos el aviso de los 10 días y la campanita, que van con las cuentas.
  - **App · Pase y cuenta:** P3 (el día de llegada sin pase), P10 (el día de prueba que empieza tarde) y el enlace a la pantalla 12 de HOY.
- **Lee también**, en docs/dias:
  - tus informes INFORME_TANDA8A.md, INFORME_TANDA8A2.md e INFORME_TANDA8A3.md;
  - los apartados 21 a 35 de APUNTES_TRAS_TANDA7.md (el 36 es para más adelante: no lo hagas);
  - REVISION_DESIGN_PASO3.md.
- Claude ha actualizado APUNTES_TRAS_TANDA7.md y ha dejado este prompt y la carpeta `docs/diseno/proyecto/`. Inclúyelos en tu commit tal cual.
- **Interruptor:** lo nuevo de HOY va detrás de uno nuevo (por ejemplo `VITE_HOY_V2`), apagado en producción y encendido en local con `?hoy2=on`. Los logros siguen detrás de los suyos. Con todo apagado, la app es la de hoy.

## 1. HOY v2 (App · HOY, apartado 01)
Las pantallas como en el diseño, con los datos de verdad de la ruta (los que ya calcula el motor):
- **antes del viaje** (1a y 1b), con «Pase de Roma»;
- **un día normal** (2): la siguiente parada en grande, [Visto], [No me da tiempo], [Cómo llegar], [Escuchar historia] (solo donde hay historia), [Sobre este lugar], los avisos del día y la lluvia con [Ver alternativa];
- **el día de llegada** (3, 3b y 3c):
  - el bloque de comer, solo si queda libre de 12:00 a 14:59;
  - «Restaurantes cerca de tu alojamiento» en los demás casos;
  - la llegada tarde;
  - «Tu ruta empieza en…» con la primera parada real;
- **el día de vuelta** (4 y 5);
- **las hojas:** «¿Qué hacemos con esta parada?» (7), «Más para tu día» (8), solo en los días recortados, y «Sobre este lugar» (11), con el texto de `por_que_recomendamos`;
- **la lista de paradas** con la pieza «Parada con foto», usando las miniaturas de la 8a2: a color con un ✓ si está vista, más apagada si está por ver.

**El pase:**
- Con el cobro apagado, todo abierto.
- Con el cobro encendido, lo que diga `puedeGanarLogros` y el estado del pase:
  - el día de llegada sin pase, la tarjeta P3;
  - al acabar el día de prueba y sin pase, la tarjeta de la pantalla 12;
  - la pregunta de las 12:00 (P10) cuando el servidor la pida.

## 2. El Visto y las fotos (App · HOY, apartado 02)
Todo conectado con lo que ya hiciste (`LogrosPorVisto`, `enviarFotoDeLaCamara`, `enviarFotoDeGaleria`, la cola sin cobertura):
- **A1, los permisos:** la primera vez que toca [Visto], nuestra pantalla y después las ventanas del móvil para la cámara y la ubicación. Una sola vez.
- **A2, sin cobertura:** la franja «Sin conexión. Tus sorpresas te esperan: saldrán al volver la señal.».
- **V1:** «Fontana de Trevi marcada como visto · [Deshacer]» durante 5 segundos.
- **Las tarjetas, todas como hoja desde abajo con su cruz:**
  - V2, el pedazo ganado con la ubicación y «Guarda un recuerdo»;
  - V3, sin ubicación;
  - V4, lejos;
  - V5, el Emblema Oculto;
  - «Guarda un recuerdo» en los sitios sin nada.
  - Abajo de todas, «¿No estás aquí? Desmarcar visto».
- **V6, la parada con lo que le falta,** en HOY y en DÍAS, con su botón de cámara.
- **La cámara de la app (9b) y la galería (9c):** antes de abrir la galería, «Elige una foto del 10 al 14 de octubre», con las fechas de verdad del viaje.
- **V7, las fotos que no valen,** con los mensajes del servidor y [Elegir otra foto].
- **V8, «Lo de ayer también cuenta»,** con lo que da `lo-de-ayer`.
- **Las fotos dentro:** en los sitios con «foto dentro», su línea antes de abrir la cámara («En la Capilla Sixtina no se pueden hacer fotos…»).
- **El plazo:** durante el viaje, sin cuenta atrás; después, «Te quedan 10 días para reclamar tu premio».

## 3. Los momentos (Logros · Momentos)
- **La primera vez de los logros:** «Hoy empiezas a ganar logros» con [Empezar mi día], al empezar el primer día con logros.
- **Las sorpresas, una a una,** en el orden que da el servidor:
  - pedazos, colecciones completadas, el sello que sube, emblemas, países, destinos, maravillas, Patrimonios y logros de viajero;
  - tocar la pantalla pasa a la siguiente; [Saltar todo] va al final;
  - al final, siempre el resumen del día.
- **Los emblemas en cine:**
  - la película del Coliseo, con «Casi 2.000 años esperándote…» siempre, también al volver a verla;
  - los demás emblemas, con su escena;
  - la frase de suspense al azar solo la primera vez («primera_vez» del servidor);
  - [Seguir] al final de cada uno;
  - fuegos artificiales solo en las maravillas del mundo;
  - «El final de las 7 maravillas», listo aunque hoy solo se pueda conseguir el Coliseo.
- **Al conseguir algo, su dibujo vuela a donde se guarda:** lo del destino, al botón flotante de los logros; lo de viajero, al Perfil.
  - El botón flotante, en esta tanda, solo el botón con su aro de avance y su puntito, en DÍAS y en HOY. La hoja que se abre al tocarlo es de la 8c: de momento, que abra lo que ya haya.
  - Si se vio la animación, el botón late y no hay puntito. Si se saltó, puntito. Guárdalo con `animacion_vista`.
- **El resumen del día** (el mismo al acabar la ruta y al final de las sorpresas).
- **El resumen del viaje:** sus dos textos, lo conseguido arriba y lo pendiente debajo con su cuenta atrás.
- **Compartir:** «Compartir un logro» (C1) y «Compartir el viaje» (C2), con la imagen y los botones [Guardar imagen] y [Compartir] (el compartir del móvil).
- **La medalla de las 7 maravillas:** con las imágenes de `assets/` del diseño (la base apagada y una capa por maravilla). Es la única excepción a «todo dibujado con código».

## 4. Cómo se mueven
- **Cortas,** de unos 2 segundos cada una, y se pueden saltar tocando.
- **«Reducir movimiento»:** si el móvil lo tiene puesto, salen sin moverse.
- **El sonido de cada momento,** con tu función `sonar()`, y la vibración donde el móvil la deja.
- **El peso:**
  - dibujadas con código (SVG y CSS), sin vídeos ni GIF;
  - cada escena se carga solo al abrirla, para que la app no pese más al abrir;
  - mide el peso al abrir antes y después, y ponlo en el informe.

## 4b. Lo que quedó de la 8a3
- **La espera al abrir una pantalla:** la primera vez que se abre una pantalla se ve un fondo vacío un instante. Pon algo mientras carga, con el mismo fondo y la cabecera de la app, para que no parezca un fallo.
- **Si falla la red justo al cargar una parte:** que no se quede en blanco. Un mensaje sencillo, «No se ha podido cargar. [Reintentar]», que vuelva a pedirla.

## 5. Las reglas que no se pueden saltar
- **Los emblemas nunca se ven antes:** ni en la ruta, ni en las fichas, ni en el botón flotante.
- **Ninguna hora de Madrugador o Nocturno a la vista.**
- **Ningún número inventado:** los números son los de cada viajero.
- **Ningún nombre de empresa** en los textos de la app.
- **Zonas de toque de 44 px como mínimo.**
- **Textos:** los del diseño y los de los apuntes. Si algo no está, dime qué has puesto.

## 6. La prueba
- No toca el motor: la batería rápida.
- Una prueba nueva de las pantallas: con un viaje de ejemplo y el servidor de prueba, recorre en el navegador un día entero, con todos sus casos:
  - un Visto con pedazo, uno sin ubicación, uno lejos y uno con emblema;
  - una foto que no vale;
  - la serie de sorpresas con [Saltar todo];
  - el resumen del día;
  - el resumen del viaje y compartir.
- Comprueba que no hay errores en la consola.
- **Capturas para Eric:** guarda una captura de cada pantalla, a tamaño de móvil, en `docs/dias/capturas_8b/`, con el mismo nombre que su pantalla en el diseño (1a, 2, 3b, V5, A2…). Eric las revisará con calma una a una, comparándolas con el diseño.

## 7. El informe (docs/dias/INFORME_TANDA8B.md)
En español sencillo:
- qué pantallas has hecho y dónde están;
- lo que no has podido hacer igual que en el diseño, y por qué;
- los textos que has tenido que poner tú;
- el peso antes y después;
- lo que queda para la 8c y para las cuentas, parte 3;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
