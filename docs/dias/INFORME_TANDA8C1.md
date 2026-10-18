# Informe: Tanda 8C1, los logros de viajero de la Versión 1 y la experiencia (EXP)

18-oct-2026. Todo sigue detrás de los mismos interruptores. **El motor de rutas no se ha tocado** (ni `server/engine`, ni `shared/routeEngine`, ni `shared/archivo`). Ninguna pantalla nueva de la EXP. Incluyo, tal cual, `docs/dias/PROMPT_TANDA8C1.md`, `EXP_Y_NIVELES.md`, `NOTAS_PARA_8C.md` y los archivos de Design (Dashboard, Medalla Grado, Medalla Destino, Medalla Premium, Doce Meses, Cuatro Estaciones, Logro Unico, Medalla Prueba, Índice y las imágenes).

## Qué he cambiado

### 1. Solo la Versión 1
- Cada logro de `data/logros/viajero.json` lleva `version`. Los 4 de más adelante llevan `"version": 2, "activo": false`. **Para encender uno: cambiar su `version` a 1 y borrar `activo: false`** (y ponerle su EXP en `data/logros/exp.json`). Sin tocar código.
- Lo apagado no existe para el cerebro: no se gana, no sale en ninguna lista (ni en el resumen, aunque ya estuviera guardado de antes), no da EXP, y el «continente nuevo» tampoco se da (es de «Continentes»). El panel de Eric (`/?admin=logros`) enseña cuáles están apagados.
- Cada logro lleva también `como`: la línea corta de «cómo se gana» del Dashboard (para la vitrina de la 8c2).

### 2. Nombres y escalones del Dashboard
Destinos 25 «Pasión por el mundo» y 30 «Alma de explorador» · Patrimonios 1, 5 «Pasos por la historia», 10, 15 y 25 «Heredero del mundo» · Viajes 1, 5, 10, 15 «Viajero de ida y vuelta», 20 «Veinte maletas», 25 «Vida de viajero» y 30 «Treinta viajes, treinta recuerdos». Cazador de emblemas, Coleccionista y Conocedor ya llevaban los del Dashboard (comprobado uno a uno). Alondra y Búho: «Empieza tu ruta muy temprano» y «Acaba tu ruta muy tarde»; la regla sigue siendo 10 días Madrugador / 10 días Nocturno y nunca sale una hora.
**El avance:** el servidor manda en `GET /api/logros/viajero` el avance de «Las cuatro estaciones» (1 de 4… 4 de 4) y de «Los 12 meses» (cada mes es un pedazo). No hay pantalla todavía.

### 3. Los dibujos del Dashboard
- Conversor nuevo, `scripts/destino/dc2tsx.mjs` (las piezas de Design a React, con su JS tal cual). Con él: **Medalla Destino, Medalla Grado, Doce Meses** (nuevas) y **Cuatro Estaciones y Logro Unico** (rehechas, habían cambiado).
- `Chapa.tsx` (lo que dibuja cada logro en «Y además…», en los avisos de lo ganado y en el resumen del viaje) sigue ahora el Dashboard: las familias con escalones (Países, Destinos, Capitales, Patrimonios, Viajes, Con quién viajas, Cazador, Coleccionista, Conocedor) son la **Medalla Destino** que sube de grado (con el icono de su familia); los de un solo paso, la misma medalla en su último grado; **Tres ciudades de oro/diamante**, la Medalla Grado; **Los 12 meses**, Doce Meses; **Las cuatro estaciones**; los exclusivos, Exclusivo Holo; las 7 maravillas, la medalla quieta de la 8B5. Los iconos están copiados del Dashboard (`iconosDashboard.ts`).
- **Lo que pedía internet:** la Medalla Destino de Países dibuja la tierra del globo bajándose `d3-geo` y `world-atlas` de internet cada vez. Lo he sustituido por la tierra precalculada una vez (`piezas/tierraPath.ts`, 33 KB, solo se baja al dibujar un país). La app no pide nada a internet al dibujar.
- Los 39 logros encendidos tienen dibujo (lo comprueba la prueba).

### 4. La EXP: el cerebro (todo en el servidor)
- **`data/logros/exp.json`**: lo que da cada cosa, los 50 niveles, los rangos y la estrella de Leyenda. `server/logros/exp.js` (puro) no lleva ninguna cifra escrita (la prueba lo vigila).
- **Cómo se calcula:** se suma lo que ya ha conseguido el viajero (sus hechos y lo ganado): paradas vistas con ubicación o foto (5, máximo 50 al día), pedazos, colecciones (10 por pedazo), emblemas, maravillas, sellos (los del Vaticano aparte), país, destino, Patrimonio, viaje acabado (5 paradas o más y el último día ya pasado: 100) y los logros de viajero con su escalera de EXP. Los viajes de antes de la app dan 0; lo apagado, 0.
- **Nunca baja:** la mayor EXP que ha tenido se guarda (`logro_perfil.exp_max`, migración 0025) y el total es siempre lo mayor entre lo calculado y eso. Probado: se baja la tabla y a nadie le sale menos.
- **Con fecha:** cada EXP lleva su fecha; el servidor la tiene por año (`por_anio`) para el sorteo y la tienda.
- **Niveles:** 50 en 10 rangos de 5 (Soñador, Explorador, Viajero, Trotamundos, Aventurero, Nómada, Cartógrafo, Embajador, Navegante, Leyenda); subir cuesta 500, 900, 1.300, 1.700 y 2.100 y, desde el nivel 6, 2.500 cada nivel (cambio de Eric, 18-oct). El nivel 50 se alcanza con 116.500 EXP; **Leyenda ★1 a los 119.500** (una estrella cada 3.000, sin final): así he entendido «después del 50».
- **Lo que manda el servidor al móvil:** `GET /api/logros/exp` y `estado` → EXP total, nivel, rango, estrellas, EXP dentro del nivel, coste del nivel y lo que falta. En cada Visto o foto: `exp` por momento, `sube_de_nivel` por momento, y `exp` de la respuesta (`ganada`, `antes`, `despues`, `sube_de_nivel`). El móvil ya sabe leerlo; **no hay pantalla** (llegará con Design).
- **Invitaciones:** la regla está hecha y probada (100 EXP al que invita cuando su amigo **acaba su primer viaje**, no al crear la cuenta; máximo 10 al año, por año natural). Falta lo de abajo.
- **Sorteo (solo la regla):** nivel 3 o más y al menos un viaje acabado ese año. En `/?admin=logros`, pestaña **Sorteo**: cuántos entran y la lista, solo con el id corto de cada cuenta (ningún nombre ni correo).
- **Modo de pruebas:** `window.__momentos.exp()` (también `'normal'`, `'roma100'`, `'cero'`, `'n10'`, `'n50'`, `'leyenda'`) abre un panel con la EXP, el nivel y el rango de un viajero de ejemplo, con las cuentas de Roma y de dónde sale cada EXP. Usa las mismas funciones del servidor.

### 5. Lo que quedó de la 8B
- **Hoja de logros:** donde decía «N de 12 secretos», ahora «Roma aún esconde N secretos.» (lo mismo que el resumen). El texto «aún esconde N secretos…» del resumen del viaje ya decía «1 secreto» (8B5).
- **Título del día en HOY v2:** ya sale de `nombreDelDia`, la misma regla que DÍAS: si el viajero le cambió el nombre, manda el suyo (la prueba lo comprueba). **El «Roma antigua» de la captura de la 8B5 no venía del motor: era un caso especial de mi modo de pruebas.** Para sacar las 6 fotos junté a mano en el día 1 paradas de varios días (con los Museos Vaticanos del día 3) y el título se calculó con esas paradas mezcladas. Con la ruta tal cual la da el motor, el día 1 sale «Roma antigua y Centro histórico». No hay nada del motor que apuntar.

## Logros encendidos (39) y apagados (4)
- **Encendidos.** El mundo: Países, Destinos, Capitales, Patrimonios, Dos países en un día, Viajero nacional, Las 7 maravillas. El tiempo: Viajes, Las cuatro estaciones, Los 12 meses, Nunca es la última vez, Un destino cuatro estaciones, Navidad fuera de casa, Nochevieja fuera de casa, Tres viajes en un año, De sol a sol, Alondra, Búho. Cómo viajas: A mi aire, En pareja, Con amigos, En familia, Día perfecto, Viaje perfecto, Imparable, Escapada, Gran viaje, El fotógrafo. Coleccionista: Diamante a la primera, Cazador de emblemas, Coleccionista, Conocedor de la ciudad, {Ciudad} al completo, Tres ciudades de oro, Tres ciudades de diamante. Exclusivos: Viajero fundador, Pionero, {Ciudad} {año}, Probador.
- **Apagados (en los datos, `activo: false`):** Continentes, Los pequeños gigantes, Al otro lado del ecuador, Todos los secretos de {ciudad}.
- **La vuelta al mundo:** el Dashboard la enseña como «Próximamente», pero **no existe en los datos** ni en el cerebro (necesita los kilómetros de cada viaje); no la he creado.

## Lo que no ha podido quedar igual que en el Dashboard
- **Los 5 de «más adelante»:** no hay dibujo en `Chapa` para la vuelta al mundo (no existe el logro). Las piezas de Continentes y Pequeños gigantes siguen en el código para cuando se enciendan.
- **«Logro Unico» no sale en la versión 1:** el Dashboard dibuja todos los de un solo paso con la Medalla Destino en su último grado (el Logro Unico solo vale para los que no están en la lista de iconos). Lo he hecho así; la pieza queda convertida y sin usar.
- **Las líneas cortas:** he guardado la línea del Dashboard como `como` («Visita países nuevos con la app.») y he dejado la `linea` que ya había («Países distintos que has visitado con la app.»), porque dice lo que ya has hecho, que es lo que sale al ganarlo. Solo Alondra y Búho cambian de `linea`, como pedías. Dime si prefieres que `linea` sea también la del Dashboard.
- **Choques con Logros · Modelos (manda el Dashboard):** las chapas de 7 materiales (Logro Viajero) y la Chapa Viajero del templo ya no se usan; todo es Medalla Destino. Gran viaje lleva el avión del Dashboard (la prueba de iconos de transporte lo permite solo en `iconosDashboard.ts`).
- **Patrimonio, destino y país en «Y además…»:** se dibujan con el escalón más alto ya pasado (el país 2 con el dibujo del escalón del país 1), porque no hay dibujo para cada número.
- **Doce Meses y Cuatro Estaciones** en «Y además…» salen completas (son los momentos en que se completan).

## Las cuentas de EXP de Roma
Con la tabla de `EXP_Y_NIVELES.md` tal cual (mismas funciones en la prueba y en el panel):
- **Un viaje normal** (3 días y 2 noches, 9 sitios: Coliseo, Foro, Trevi, Panteón, Navona, Plaza de España, Museos Vaticanos, San Pedro y su plaza, con foto en todos): **1.785 EXP, nivel 3** (de 1.200 a 2.099). El documento decía «unos 1.400, nivel 3»: el nivel sale igual; la cifra es mayor porque con 9 sitios ya sale el sello de Roma en oro y el del Vaticano en diamante (500), los emblemas (175), los dos países (100) y 375 de logros de viajero (Escapada, El fotógrafo, {Ciudad} {año} y los primeros escalones), más 100 del viaje acabado. Desglose: sellos 500 · logros de viajero 375 · emblemas 175 · maravilla 150 · pedazos 115 · países 100 · viaje acabado 100 · Patrimonios 80 · destino 75 · colecciones 70 · paradas 45.
- **Roma al 100 %** (los 37 sitios de las colecciones y los emblemas, con Madrugador y Nocturno, un viaje de 10 noches): **3.930 EXP, nivel 4** (el 4 va de 2.700 a 4.399). El documento decía «unos 2.870, nivel 4». Desglose: pedazos 260 · colecciones 520 · sellos 700 · emblemas 300 · países 100 · destino 75 · maravilla 150 · Patrimonios 80 = **2.185** (lo que el documento cuenta seguro); + logros de viajero **1.450** (Cazador de emblemas y Coleccionista, 5 y 10: 500; Conocedor 25: 175; Diamante a la primera 150; {Ciudad} al completo 100; Gran viaje 100; De sol a sol 100; El fotógrafo 75; Dos países en un día 50; {Ciudad} {año} 50; y 25 de cada primer escalón de Países, Destinos, Maravillas, Patrimonios, Viajes y Con quién viajas: 150) + paradas vistas **195** (39 paradas) + viaje acabado **100**. Los 685 que el documento le deja sobre 2.185 no cubren todos esos logros; si «Roma al 100 %» no debe incluir Cazador, Coleccionista, Conocedor y los demás, dímelo y lo ajusto en `exp.json`.
- **Sin el continente ni «Todos los secretos»** (apagados), como pedías.

## Lo que falta para las invitaciones
La regla, la tabla (`logro_referidos`) y las funciones están hechas y probadas, pero **nada rellena la tabla**: falta (1) el **enlace o código de invitación a la app** (no a un viaje: `trip_invitations` invita a un viaje, no vale), (2) que al crear la cuenta se lea ese código y se llame a `registrarInvitacion(invitador, invitado)` del servicio, y (3) un aviso opcional al que invita («Tu amigo acabó su viaje: +100 EXP»). Con eso, el resto ya funciona: cuando el amigo acaba su primer viaje se apunta solo al calcular su EXP y se suma al que le invitó.

## La migración nueva
**`supabase/migrations/0025_exp_e_invitaciones.sql`**, **sin aplicar**. Va **después de la 0023** (logros) y, por tanto, después de la 0020 y la 0021; **no depende de la 0024** (pase y guardados: puede ir antes o después). Orden: 0020 → 0021 → 0023 → 0024 → **0025**. Crea `logro_perfil.exp_max` (la mayor EXP) y `logro_referidos` (quién invitó a quién). Sin ella, el servidor funciona igual: la EXP se calcula siempre desde los hechos, solo que no se guarda el máximo ni hay invitaciones (los errores de «falta la columna» se atrapan).

## El peso al abrir
- **Antes: 708,4 KB de JavaScript (315,1 KB de descarga). Después: 709,9 KB (315,6 KB)**: +1,5 KB (los iconos del Dashboard van con las chapas).
- Los dibujos nuevos se bajan solo al abrirlos: Medalla Destino 21 KB (+33 KB la tierra, solo en Países), Medalla Grado 7 KB, Doce Meses 9 KB, Cuatro Estaciones 17 KB. El panel de la EXP solo existe en desarrollo.

## Capturas nuevas (`docs/dias/capturas_8b/`)
- `8C1-ademas-logros-de-viajero-dibujos-nuevos.jpg`: «Y además…» con cinco logros de viajero (Pasión por el mundo, Viajero de ida y vuelta, Ojo de lince, Tres ciudades de oro, Las cuatro estaciones).
- `8C1-exp-roma-viaje-normal-nivel-3.jpg` y `8C1-exp-roma-al-100-nivel-4.jpg`: el modo de pruebas con la EXP, el nivel y el rango.
La prueba sigue fallando si dos capturas son idénticas.

## Pruebas
- `pruebaLogros1`: **432 comprobaciones, 0 fallos** (nueva sección 5: la Versión 1, los apagados, los escalones nuevos, la EXP de cada cosa, los niveles en 499/500/1.199/1.200/13.999/14.000/16.499/16.500/111.499/111.500/114.499/114.500, que la EXP no baja, las invitaciones con su tope, el sorteo, las rutas y el avance de estaciones y meses).
- `pruebaPantallas8b`: **171 comprobaciones, 0 fallos** (nueva sección 9: dibujos, hoja de secretos, título de HOY, panel de la EXP).
- Batería (74 pruebas, con el servidor reiniciado; sin `pruebaFase6y5_motor`, que tarda más de 9 minutos y no toca nada que haya cambiado): dos pruebas viejas avisaron y las he ajustado, no el código: la de iconos (el avión de «Gran viaje» del Dashboard) y la del calendario (el panel de pruebas de `src/dev` tiene un z-index alto a propósito). Ahora todo en 0 fallos. `tsc -p tsconfig.app.json` limpio. Los `PRUEBA_TANDA6*.md` que reescriben las pruebas del motor los he dejado como estaban.
- Consola: sin errores míos (solo el 404 del mapa y el 400 de Supabase sin claves en local, de siempre).

## Riesgos
- La EXP se calcula en cada Visto/foto y al pedirla, leyendo todos los hechos de la cuenta; hoy sobra, con miles de cuentas convendría guardar los totales. El sorteo recorre todas las cuentas con hechos (pensado para el panel de Eric, no para el móvil).
- «Nunca baja» se apoya en `exp_max`; sin la migración 0025 aplicada no se guarda el máximo (se calcula desde los hechos, que no desaparecen).
- «Leyenda ★1» a los 119.500 (3.000 tras el 50) es mi lectura de «después del 50»; si quieres la primera estrella nada más llegar al 50, es un cambio en `exp.json`/`nivelDeExp`.
- Si se cambia la tabla a la baja, el que la cruce ve en pantalla EXP «ganada» menor que la de los momentos (el total no baja, el de los momentos sí es el de la tabla nueva).
- El conversor de piezas es mío (no el de Design): lo comprueba la prueba (mismas animaciones, sin internet), pero no he comparado pixel a pixel con el Dashboard.
- Sin probar en un móvil real ni con Supabase real.

## Cambio posterior: costes de los niveles
Costes nuevos en `data/logros/exp.json`: 500, 900, 1.300, 1.700, 2.100 y 2.500 desde el nivel 6 (niveles: 2 en 500, 3 en 1.400, 4 en 2.700, 5 en 4.400, 6 en 6.500, 50 en 116.500, Leyenda ★1 en 119.500). Roma: viaje normal 1.785 EXP (nivel 3) y al 100 % 3.930 (nivel 4). `pruebaLogros1`: 433/0. Capturas del panel de la EXP rehechas.
