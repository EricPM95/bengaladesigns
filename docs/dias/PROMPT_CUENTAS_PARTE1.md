Hola. Nueva tanda: LAS CUENTAS, PARTE 1 (lo de dentro). Las pantallas de la cuenta aún las está dibujando Design; aquí va todo lo que no depende de ellas. No toques el motor de rutas.

## 0. Antes de empezar
- Lee en docs/dias/APUNTES_TRAS_TANDA7.md los apartados 24 (cuentas), 25 (repaso y Pase) y 27 (recomendar cambios en un viaje compartido). Claude ha dejado en docs/dias sus notas al día (APUNTES_TRAS_TANDA7, ORDEN_PARA_CODE, NOMBRES_LOGROS, BRIEF_DISENO_LOGROS, GRATIS_Y_PASE, PENDIENTES_6K, PENDIENTES_ESCUCHAR, PENDIENTES_RECOMPENSAS, INVESTIGACION_TANDA7C, POR_QUE_RECOMENDAMOS_ROMA y este prompt). Inclúyelas en tu commit tal cual, sin cambiarlas.

## 1. Primero mira y escribe el plan (docs/dias/PLAN_CUENTAS.md)
Antes de programar nada, apunta:
- qué guarda hoy la app y dónde (viajes, Vistos, fotos, ajustes): en el móvil, en Supabase o en los dos;
- cómo pasar todo eso a la cuenta sin que nadie pierda lo que ya tiene: al entrar por primera vez, lo que tenía en el móvil se sube a su cuenta;
- las tablas nuevas y quién puede ver cada cosa.
Si algo del plan choca con lo de abajo o ves un riesgo, apúntalo y sigue con lo que no choque.

## 2. Entrar en la app
- Con el email y un enlace mágico, o con Google. Apple, más adelante.
- La cuenta se pedirá al empezar, pero TODO esto va detrás de un interruptor, apagado en producción, hasta que estén las pantallas de Design. Con el interruptor apagado, la app funciona exactamente igual que hoy.
- Para probarlo, una pantalla de entrar provisional y sencilla, solo con el interruptor encendido.
- Lo que tenga que hacer Eric fuera del código (dar de alta Google para entrar, el servicio de envío de emails para que los enlaces mágicos no se queden cortos), explícalo paso a paso en el informe. No me pidas ni pegues claves en el chat.

## 3. Lo que se guarda en la cuenta
Prepara las tablas una vez, pensando en todo lo que viene, aunque hoy no se use todo:
- **Viajes:** cada viaje tiene un dueño, el administrador. Puede tener invitados. Solo el administrador cambia la ruta; los invitados mandan recomendaciones (un cambio suelto, un día nuevo o la ruta entera) que el administrador acepta o no. Hoy solo la tabla y las reglas de quién puede qué; las pantallas, más adelante.
- **Vistos y fotos:** de cada persona, aunque compartan viaje. Cada uno los suyos.
- **Logros:** la tabla preparada para la Tanda de los logros (qué logro, qué escalón, cuándo, en qué viaje y destino). Hoy vacía.
- **Pases:** la tabla preparada (destino, quién lo compró, tipo: uno, Dúo o grupo, para quién, usos, fecha). Hoy sin cobro: todo sigue abierto.
- **Viajero fundador:** guarda la fecha de alta. Fundador = alta antes de «salida + 1 año», con la salida guardada como dato, no escrita a mano.
- Cada persona solo puede ver lo suyo y lo de los viajes donde está invitada.

## 4. Las fotos en la nube
- Comprimidas a unos 300 KB cada una.
- Sin la ubicación ni los datos escondidos del archivo: se quitan al subirla. Antes de quitarlos, la app lee la fecha y, si la tiene, el sitio, porque los necesitaremos para los logros; guárdalos aparte, en nuestra tabla.
- Privadas: solo las ve su dueño.
- Con [Guardar en mi galería] para bajarla al móvil.
- Se borran al borrar la cuenta.

## 5. Borrar la cuenta
- Borra la cuenta, sus viajes (los que administra; en los que está invitado, solo sale él), sus fotos de la nube, sus Vistos, sus logros y sus pases.
- Comprueba con una cuenta de prueba que no queda nada suyo en ninguna tabla ni en las fotos.

## 6. Privacidad
- Una página de privacidad con su estructura (qué guardamos, para qué, cuánto tiempo, cómo borrarlo, a quién escribir). Los textos legales NO los inventes: deja cada apartado marcado como «Texto pendiente» para que lo escriba Eric. Lista en el informe qué servicios de fuera tratan datos (esta página sí tiene que nombrarlos, es la única excepción a la regla de no nombrar empresas).

## 7. Migraciones de Supabase
Escribe las migraciones, pero no las apliques en producción. En el informe, di cuáles hay que aplicar y en qué orden.

## 8. La prueba
No toca el motor: la batería rápida. Y además, una prueba nueva de las cuentas: entrar, subir un viaje del móvil a la cuenta, una foto, un invitado que no puede cambiar la ruta, y borrar la cuenta sin que quede nada.

## 9. El informe (docs/dias/INFORME_CUENTAS_1.md)
En español sencillo: qué has hecho, qué falta, lo que tiene que hacer Eric fuera del código, las migraciones pendientes, los riesgos y lo que no has podido hacer.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
