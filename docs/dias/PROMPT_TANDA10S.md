Hola. TANDA 10S: LA BATERÍA DE PRUEBAS, EN 0 FALLOS DE UNA PASADA (Y MÁS RÁPIDA), Y TRES RETOQUES DE LA 10N12 (29-oct). Va después de la 10N12 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas. Salvo los tres retoques del apartado 1, **no cambies nada de lo que ve el viajero**: esta tanda arregla las pruebas y aligera la descarga.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10S.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md` y `CLAUDE.md`.
- **Por qué:** en cada tanda salen pruebas en MAL «por la carga» que solas pasan (en la 10N12, 9 con 2 Chrome a la vez). Si sigue así, un fallo de verdad se nos esconderá entre ellas. Hasta ahora decías «solas pasan» y seguíamos: eso se acaba aquí.
- **Cómo trabajar:** hasta 4 agentes a la vez si va más rápido. Con menos de 6 GB libres, espera. Cierra todo lo que deje de hacer falta. La nota de estado (`docs/dias/_estado_10s.md`) a la rama `estado` cada 30 minutos, también mientras corre la batería (esta tanda es larga: que se vea que sigues). No apagues el PC.
- **Esta tanda sí pasa la batería completa** (es la excepción a la regla de «solo lo tocado»).

## 1. Tres retoques de la 10N12 (respuestas de Eric a tus dudas)
- **El aviso de Logros:** «**Con el Pase Roma, consigues el sello de cada sitio que visitas, las colecciones y los emblemas secretos.**» (lo mismo que dice la lista del pase).
- **La caja azul del pase** ([Ver]): sigue abriendo la lista. **El degradado** encima de los últimos puntos, detrás del botón fijo: se queda.
- **El botón de la cama:** en los días del viaje, sí. **En el día de prueba sin pase, no sale** (sin pase no hay dirección y el botón llevaría a un candado). Solo con pase.
- **La ✕ de la lista del pase pisa el texto** al bajar (en `10n12_lista_3_final.jpg` tapa el final de «Consigue el sello de cada sitio que visitas.»). Que no pise nada: con su fondo, o que el texto no pase por debajo.

## 2. Lo que falla hoy (de los informes de la 10N7 a la 10N12)
- **Por la carga** (con 2 Chrome a la vez o con la batería entera): `__rutaPrueba is not a function`, «No se ha podido crear el viaje de pruebas», esperas largas. Han caído así `pruebaJutrip`, `pruebaTanda10B`, `pruebaTanda10H` y otras.
- **`pruebaTanda7_reservas`:** cae en su sección 8 (`TarjetaTuUltimoDia`, `textos` undefined). Mira si es la prueba o la app: si es la app, dímelo antes de tocarla.
- **`pruebaTanda7_mover`:** 5 fallos (filas «Mié 10 Mar», día de excursión, A5 mover, «{n} días» en `fechas.ts` y `HoyAntesV2.tsx`).
- **`pruebaTanda10N6_recuerdos`:** falla con el Vite normal.
- **`pruebaTanda10N10_explorar`:** acaba con un cierre raro de node (código 3221226505) después de dar 44/0.
- **`pruebaEntrarReal` y `pruebaTanda10N3_real`:** usan el Supabase real y caen por el límite de altas anónimas. Que no creen cuentas nuevas cada vez (reutilizar cuentas de prueba fijas) o que corran aparte, solas, con un aviso claro.
- **`pruebaTanda7_hoy`** (y cualquier otra) no entra en la batería por su nombre: que la batería coja **todas** las pruebas que valen.
- **Los envoltorios** (`pruebaTanda10N*`, `10P`, `10O`, `10M`) duplican pruebas y Chromes: que la batería no los corra, o que no dupliquen.

## 3. Lo que te pido
- **Encuentra la causa de cada una** y arréglala de raíz. Por ejemplo:
  - cada prueba con su propia carpeta de ficheros temporales y sus propios datos de prueba;
  - esperar a que la página esté lista de verdad (que `__rutaPrueba` exista) antes de usarla; nada de esperas fijas;
  - un Vite recién arrancado (o el estable) para las pruebas de pantalla;
  - que las que comparten algo (un puerto, un fichero, un servidor, una cuenta) no corran a la vez.
- **Nunca** quitar una prueba, bajar lo que comprueba ni marcarla como «se puede saltar» para que salga en verde. Si una prueba ya no tiene sentido (porque la app cambió a propósito), dímelo y por qué, antes de tocarla.
- **El objetivo:** la batería completa **con 2 Chrome a la vez**, en **0 fallos de una sola pasada, tres veces seguidas**, sin repetir nada a mano. Dime cuánto tarda la batería entera antes y después: cuanto menos, mejor.

## 4. La descarga, más ligera
- Hoy la app pesa **371 KB** comprimidos al abrir; el tope era **340 KB** y lo subiste a 400 KB hasta esta tanda. Bájalo a **menos de 340 KB** cargando bajo demanda lo que no hace falta al abrir (por ejemplo, la lista del pase, que en la 10N10 pesaba 1,13 MB, el presupuesto, los logros, las hojas de RESERVAS…), y vuelve a poner el tope de `pruebaPantallas8b` y `pruebaCuentas3` en 340 KB. Que la prueba mida con un `dist` recién construido.
- Mide también lo que pesa ahora la lista del pase, sin la película.
- El viajero no tiene que notar nada, salvo que abra más rápido. Si algo tarda en salir al tocarlo, dímelo.

## 5. Las capturas de Design que faltan
- En `REPASO_10N11.html` y `REPASO_10N12.html`, pon al lado de las de la app las de Design que faltan: DÍAS día 1 y la tarjeta del vuelo (`Alojamiento Dias`), el alojamiento 02 y 03 regeneradas, la lista del pase y HOY sin pase (`Pase Lista`), y la del aviso a 375 × 667.

## 6. Cómo correr las pruebas
- Deja escrito en `docs/dias/COMO_CORRER_LAS_PRUEBAS.md`, en palabras sencillas: cómo se corre la batería entera, cómo se corren solo las de una tanda, cuánto tarda cada cosa y qué hacer si una falla. Pon al día `CLAUDE.md` con lo que cambie.

## 7. La prueba
- La batería completa, tres veces seguidas, con 2 Chrome a la vez, en 0 fallos. Y `pruebaJutrip`.
- Prueba nueva `pruebaTanda10S`: los tres retoques del apartado 1 (el texto del aviso de Logros, la cama en el día de prueba sin pase que no sale, la ✕ de la lista que no pisa nada) y el peso por debajo de 340 KB.
- La muestra de 60 fechas, solo para comprobar que las rutas salen exactamente iguales (esta tanda no debe cambiar ninguna).

## 8. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10S»: la causa de cada fallo y cómo lo has arreglado, lo que tarda la batería antes y después, las tres pasadas en 0, el peso antes y después, y si hace falta migración (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué) y, en los del apartado 1, **dónde lo mira Eric en el móvil** (y con qué cuenta) y su captura. La misma lista, arriba del todo de `docs/dias/REPASO_10S.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
