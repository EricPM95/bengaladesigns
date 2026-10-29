Hola. TANDA 10N12: RETOQUES DE LA 10N11 (EL AVISO PEQUEÑO, LA LISTA DEL PASE SIN PRECIOS Y CON EL BOTÓN FIJO, HOY SIN PASE COMPLETO, EL BOTÓN DEL ALOJAMIENTO SIEMPRE EN HOY Y «PASE ROMA») (29-oct). Va después de la 10N11 (ya hecha): si estás con otra tanda, acábala primero (con su push) y haz esta después. No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N12.md e inclúyelo en tu commit.
- **Las reglas de siempre:** `docs/REGLAS_DE_LA_APP.md`. Las reglas nuevas de esta tanda, añádelas ahí.
- **Design:** no hay zip nuevo. Usa lo que ya está en `docs/diseno/proyecto/` (`Piezas/Pase Lista`, `Vuelo Reservas`, `Alojamiento Dias`). Lo que no dibuja Design, con el mismo estilo de la pantalla donde va.
- **La película del pase:** no la toques. Se queda como está (en Design y en el historial de git).
- **Cómo trabajar:** hasta 4 agentes a la vez si va más rápido, un solo servidor, hasta 2 Chrome de prueba a la vez (las pruebas del Supabase real o de las mismas cuentas, solas). Con menos de 6 GB libres, espera. Cierra todo lo que deje de hacer falta. La nota de estado (`docs/dias/_estado_10n12.md`) a la rama `estado` cada 30 minutos, también mientras corren las pruebas. No apagues el PC.
- **Las pruebas, solo las de lo que tocas** más `pruebaJutrip` (no la batería completa).

## 1. Lo bloqueado abre el aviso pequeño, no la lista
- **La regla (ya está en `REGLAS_DE_LA_APP.md`, apartado 3):** al tocar **algo bloqueado** por el pase sale **el aviso pequeño** (`abrirAvisoPase`); su [Ver el Pase Roma] abre la lista del pase. La lista se abre directamente **solo** desde lo que es para ver el pase: la pastilla «Pase Roma» de RUTA, el [Ver] de la caja azul, [Ver el Pase Roma] del aviso y de HOY sin pase.
- **Hoy no se cumple en lo de la 10N11:** el bloque gris «¿Dónde te alojas?» / «Dirección del hotel» de la hoja «Tu alojamiento» y el [Ir] con candado del día 1 en DÍAS abren la lista entera. Que abran el aviso pequeño.
- **Repasa todos los sitios** donde algo bloqueado abre la lista directamente (también la línea gris del pase, `LineaDelPase`, si se puede tocar) y pásalos al aviso pequeño. Dime en el informe cuáles has cambiado.
- **Los textos del aviso** (en `src/lib/avisoPaseTextos.ts`, por destino), con el título de siempre «Desbloquéalo con el *Pase Roma*» y [Ver el Pase Roma]:
  - alojamiento (la hoja, la tarjeta de RESERVAS y el [Ir] de DÍAS): «**Con el Pase Roma, adaptamos tus días a donde duermes y llegas a tu alojamiento en un toque, estés donde estés.**»;
  - vuelo: «**Con el Pase Roma, adaptamos tu primer y tu último día a tus vuelos.**».

## 2. La lista del pase: sin precios y con el botón fijo
- **[Elegir mi pase] fijo abajo, siempre a la vista**, mientras se baja por la lista. **Sin precio** en el botón.
- **Fuera los precios de la lista:** quita el bloque de los precios del final (1 persona, Pase Dúo y Pase Grupo) y el [Elegir mi pase] del final, para que no haya dos botones. En la lista no sale ningún precio.
- **Los precios, solo en «¿Cuántos sois?»**, que se abre al tocar [Elegir mi pase] (como ahora, con la moneda y [Comprar]).
- Que el botón fijo no tape el último punto de la lista (deja el espacio que haga falta abajo) y que no pise la barra de abajo del iPhone.
- **Con el pase:** sin botón fijo; «✓ Tu Pase Roma está activo».

## 3. HOY sin pase, completo
- Se queda lo de Design (`Pase Lista` 2 y 2b): «HOY, tu guía del día», los puntos con sus dibujos, la caja del día de prueba y [Ver el Pase Roma].
- **Vuelve lo que había antes de la 10N11**, arriba de «HOY, tu guía del día», con el estilo de esta pantalla:
  - **sin fechas:** «Pon tus fechas» (sin fechas no se sabe cuándo es el día de prueba);
  - **antes del viaje:** la cuenta atrás;
  - **después del viaje:** «Tu viaje ha terminado»;
  - **los avisos del día de prueba** («mañana es tu día de prueba», «¿qué tal ayer?»), cuando tocan.
- **Fuera la ✕** de arriba: es una pestaña, no hace falta.

## 4. El botón del alojamiento, siempre en HOY
- **Un botón pequeño, redondo, con el dibujo de una cama** (en el estilo de los iconos de la app), **siempre a la vista en HOY**: todos los días del viaje (también el de llegada y el de vuelta), a cualquier hora, al empezar, durante y al acabar el día. Que no tape nada: por ejemplo, arriba a la derecha, junto al título del día. Si hay un sitio mejor en la pantalla, dímelo.
- **Con dirección guardada:** al tocarlo, el camino desde donde está el viajero hasta su alojamiento (lo mismo que [Cómo llegar a tu alojamiento]).
- **Con pase y sin dirección:** al tocarlo, se abre la hoja «Tu alojamiento» para ponerla.
- **Sin pase:** no sale.
- Las tarjetas [Cómo llegar a tu alojamiento] de empezar y acabar el día se quedan como están. El día de vuelta, al empezar, tampoco sale la tarjeta (solo el botón).

## 5. Siempre «Pase Roma»
- Fuera «Pase de Roma» en toda la app: «✓ Tu Pase Roma está activo», los avisos, los logros, las hojas, los textos de `data/pase/` y las pruebas. Con otro destino, «Pase {Destino}» («Pase París»), sin «de».
- Añádelo a `REGLAS_DE_LA_APP.md`.

## 6. Con varios destinos
- Se queda como está (la zona y la dirección, solo en la primera estancia). Apúntalo en `REGLAS_DE_LA_APP.md`, apartado 6 (lo pendiente), para cuando hagamos los multidestinos: cada estancia, con su zona y su dirección.

## 7. La prueba
- Solo las pruebas de lo que tocas en esta tanda, más `pruebaJutrip`, en 0 fallos.
- Prueba nueva `pruebaTanda10N12`:
  - el bloque gris del alojamiento, el [Ir] de DÍAS y los demás sitios cambiados abren el aviso pequeño con su texto, y su [Ver el Pase Roma] abre la lista;
  - la pastilla «Pase Roma» de RUTA sigue abriendo la lista directamente;
  - la lista sin ningún precio, con [Elegir mi pase] fijo abajo, sin precio, a la vista arriba, en medio y al final de la lista, sin tapar el último punto; un solo botón; con pase, sin botón;
  - «¿Cuántos sois?» con sus precios;
  - HOY sin pase sin ✕, con «Pon tus fechas» (sin fechas), la cuenta atrás (antes), «Tu viaje ha terminado» (después) y los avisos del día de prueba;
  - el botón de la cama en HOY con pase, en el día de llegada, uno del medio y el de vuelta, por la mañana y por la noche; con dirección abre el camino; sin dirección abre la hoja; sin pase no sale;
  - ningún «Pase de Roma» en la app.
- Capturas en `docs/dias/capturas_jutrip/` y en `docs/dias/REPASO_10N12.html`, a tamaño de móvil (390 × 844 y 375 × 667).

## 8. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N12». Di qué pruebas has pasado, qué sitios has pasado al aviso pequeño y si hace falta migración (con su comprobación).

**Al final del informe, la lista de comprobación.** Todos los puntos de este prompt, uno por uno y en el mismo orden, cada uno con **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué), **dónde lo mira Eric en el móvil** (y con qué cuenta, con pase o sin él) y su captura si la tiene. La misma lista, arriba del todo de `REPASO_10N12.html`, con una casilla en cada punto.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
