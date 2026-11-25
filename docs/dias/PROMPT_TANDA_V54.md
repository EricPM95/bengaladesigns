Hola. TANDA V54: LOS AVISOS DE ARRIBA Y LAS ENTRADAS EN PELIGRO. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V53 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v54.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md). **Todo vale para todos los destinos** (regla V53): lo común en el código, lo de cada destino en sus datos.

**Dibujos:** `docs/diseno/proyecto/Avisos Hoy Compactos` (de `TODO_IGUAL`, ya descomprimido en la V53), V1 a V6. **Design es un prototipo:** se copia SOLO lo que se describe aquí.

## 1. El aviso de arriba, compacto (`AvisoArriba.tsx`, `AvisosHoy.tsx`)
- **Cómo es (V1 y V3):** una fila: icono pequeño en su cuadro a la izquierda, el título en negrita, debajo el sitio en gris, y su botón a la derecha.
  - **Rojo** (fondo rosado, borde rojo, reloj en cuadro rojo, botón granate) para lo urgente;
  - **amarillo** (fondo marfil, icono en cuadro amarillo, botón claro [Ver]) para lo informativo;
  - **azul** (nube en cuadro azul, [Ver plan]) para el tiempo.
- **Arriba, siempre UNA sola fila.** Nunca dos avisos uno encima de otro.
- **Los del mismo tipo se juntan en una frase** (V4): «Hoy ya no llegas a 3 sitios · Museos Vaticanos, Castillo de Sant'Angelo y Panteón» [Ver]; «2 entradas corren peligro · Coliseo 9:15 · Museos Vaticanos 11:00» [Ver solución].
- **Si son de tipos distintos, se ve el más importante con la insignia «+x»** (V5), un poco más grande que el «+2» de antes. Al tocarlo se despliega la lista de todos, cada uno con su color y su botón, y abajo «Ocultar avisos ⌃» (V2). **Orden:** primero lo rojo, después la lluvia, después lo demás.
- **Al resolverse el de arriba, sube el siguiente** con su «+x» (V6).
- **Ninguno con botón se va solo.** Cada uno se va cuando ya no es verdad (la lluvia, cuando pasa; la entrada, cuando llegas o la resuelves) o cuando se desliza hacia arriba. Solo el aviso verde de «Tranquilo…» (punto 2) se va solo a los 5 s.
- **Lo que NO se copia del dibujo:**
  - el ejemplo del Foro Romano en rojo (ver punto 2);
  - la fila «Los Museos Vaticanos ya han cerrado · Los tienes en Lugares pendientes»: ese aviso ya no existe desde la V52;
  - «Va a llover esta tarde · Tenemos un plan a cubierto»: solo si hay plan de verdad y si «esta tarde» aún no ha pasado.
- El [Ver] de «Hoy ya no llegas a 3 sitios» abre la hoja de «Pasar a otro día» (la pieza A2 de la V50) con **una tarjeta por sitio**.
- Sustituye en CLAUDE.md la regla «los avisos se juntan en uno».

## 2. No todas las entradas tienen hora estricta
Hoy sale «Tu entrada de las 9:15 en Foro Romano y Palatino corre peligro», y al Foro y al Palatino se entra a cualquier hora dentro de las 24 h del billete. La hora fija es la del Coliseo.
- **En los datos de cada sitio con entrada, su puntualidad:**
  - **estricta:** si llegas tarde, no entras (Coliseo, Museos Vaticanos, Galería Borghese, Última Cena…);
  - **con margen:** X minutos;
  - **libre:** cualquier hora del día o en 24 h (Foro y Palatino).
- **Comprobado en la web oficial de cada sitio, nunca de memoria** (`_webs_oficiales_entradas.json`), en Roma y en Lanzarote. Lo que no puedas confirmar va como estricta y en DECISIONES.
- **Estricta:** el aviso rojo, con el texto **«Si no sales ya, no llegas a tu entrada de las 9:15 en el Coliseo»** y [Ver solución].
- **Libre o con margen:** nunca «peligro». Dos casos:
  - **si el retraso aún cabe en el día:** aviso verde que se va solo: «Tranquilo, tienes margen: al Foro Romano puedes entrar más tarde y tu día sigue igual.»;
  - **si ya no cabe todo:** aviso amarillo «Vas con retraso: al Foro Romano puedes entrar más tarde sin problema, pero hoy quizá no te dé tiempo a todo.», con [Ver cómo queda el día] (la hoja de «Voy con retraso»).
- **Cuando la hora de una entrada estricta ya ha pasado,** nada de «peligro» ni de protegerla. Hoy a las 9:30 sigue saliendo y la hoja dice «Sigue igual: tu entrada de las 9:15» (`PELIGRO_DESPUES_MIN = 30` en `hoyPeligro.ts`). Pasa a ser un aviso amarillo: «Tu entrada de las 9:15 en el Coliseo ya ha pasado».

## 3. Fuera la hoja vieja «Una solución»
[Ver solución] de la entrada en peligro abre la hoja vieja «Una solución». En la V50 solo se cambió la de los Vaticanos; esta es otra. Rompe tres reglas:
- protege una entrada que ya pasó;
- manda el Arco de Constantino a pendientes sin proponer antes pasarlo a otro día;
- usa «dejar» con dos sentidos («¿Lo dejamos?» / [Sí, dejarlo] / [Dejarlo como está]).

Pásala a **la pieza A2 de la V50** (la de «Pasar a otro día»):
- el texto de arriba, claro;
- **la tarjeta del sitio que cambia,** con **la foto real** (la de su parada), el nombre, a dónde va en gris y, a la derecha, el cuadrado de la fecha o el icono de pendientes (V53). Una tarjeta por sitio;
- la franja verde con lo que se queda igual;
- el botón dorado dice la acción, y [Dejarlo como está] va en texto.

**Primero propone pasarlo al mejor día:** «Para llegar a tu entrada de las 9:15 en el Coliseo, te pasamos el Arco de Constantino al jueves 26.» [Pasarlo al jueves] / [Elegir otro día].
**Si no cabe en ningún día:** «… hoy no te da tiempo de ver el Arco de Constantino. Lo guardamos en Lugares pendientes y luego decides.», con la tarjeta «Arco de Constantino · A Lugares pendientes», la franja «✓ Llegas a tu entrada de las 9:15» y [Guardarlo en pendientes].

**Busca TODAS las hojas que aún dicen «Una solución»** (al menos `PeligroHoy.tsx`, `MasTiempo.tsx`, `HorarioHoy.tsx`, `hoyPeligro.ts` y `hoyHorarios.ts`) y pásalas igual. Dime cuáles eran.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO, corto. Con el día simulado de HOY, captura en modo iPhone de:
  - un aviso solo;
  - dos del mismo tipo juntos;
  - tres de tipos distintos, plegados y desplegados;
  - el Coliseo en peligro y su hoja;
  - el Foro con margen (los dos casos);
  - una entrada estricta ya pasada;
  - un caso en Lanzarote.
- Añade la lista de puntualidades con su web, qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
