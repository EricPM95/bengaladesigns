Hola. TANDA V69: LAS HOJAS DE REORGANIZAR, DE MOVER DÍAS POR UNA RESERVA, «REVISA LAS HORAS», LAS HORAS DEL FREE TOUR, LUGARES PENDIENTES EN DÍAS Y [VER ENTRADA]. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V68 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v69.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos.**

**Dibujos: `TODO_IGUAL`, en mis Descargas** (la versión de hoy). Descomprímelo otra vez en `docs/diseno/proyecto/`, **encima, sin borrar**. Páginas de esta tanda: E1/E2 (mover días por una entrada o una excursión), A1 (dos reservas o una reserva antes de aterrizar), «Elige día y hora» del Free Tour (H1-H3), «Lugares pendientes» (L5) y la hoja de Reorganizar (RO1-RO3). Design es un prototipo: se copia SOLO lo que se describe; los huecos de foto los llenas con la foto real.

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. La hoja de Reorganizar: avisar de lo importante, sin 50 cambios (RO1-RO3)
Eric vio hojas con 11 tarjetas «Después de X» en cadena (todas el mismo día) y con 45 cambios «y 41 más». Reglas:
- **Tarjeta SOLO para:** lo que cambia de día, va a Lugares pendientes, o tiene hora (una reserva: «Coliseo · A las 16:30, tu entrada», con el cuadrado y la hora). **Lo que sigue en el mismo día no se lista** (ni «Después de X» ni cambios de minutos).
- **Si lo que cambia es el orden del mismo día,** una frase arriba que diga por qué: «Damos la vuelta a tu miércoles para llegar a tu entrada del Coliseo de las 16:30: empiezas en el Panteón y acabas en el Coliseo.»
- **Si se mueve un día entero, UNA tarjeta por día** (la del dibujo E1: la foto del sitio principal, el nombre del día y «Pasa al miércoles 14»).
- **Un «de camino»** (la Fuente de las Tortugas, el Elefantino) nunca sale como tarjeta.
- **Un mismo sitio, una sola tarjeta** (Piazza Navona de día y de noche).
- **La comida y la cena,** con su imagen de los cubiertos (nunca el degradado verde).
- **La franja verde,** solo si de verdad queda algo igual.
- Antes del viaje, nunca «hoy».

## 1b. Todas las hojas de propuesta (`HojaPropuesta`), no solo Reorganizar
Eric abrió en Lanzarote «Viento fuerte en Los Hervideros · Ver cambio» y vio:
- **Sin foto en las tarjetas** (el hueco beige). Cada tarjeta lleva la foto real, la misma que la tarjeta de la parada de HOY (`useFotoDeParada`). Un sitio nuevo que entra en el día, la de los datos del destino. Hueco solo si el sitio no tiene foto en ninguna parte de la app.
- **El botón decía «Usar el plan de lluvia»** con viento. El botón dice la acción de cada caso: lluvia, «Usar el plan de lluvia»; viento, «Cambiar de sitio»; nubes, «Cambiar de mirador».
- **«Sale de hoy» con el cuadrado de pendientes.** El texto gris dice lo mismo que el cuadrado: «A Lugares pendientes» (u «Otro día» con la fecha).
- **«Hoy a las 15:12».** No enseñamos horas, salvo las de una reserva. Un sitio que entra hoy: «Hoy, en lugar de Los Hervideros».
- **«Sigue igual: lo más importante de tu día».** La franja verde nombra lo que sigue igual («Sigue igual: Timanfaya, los Jameos del Agua y 2 más»), y solo si es verdad.

## 2. Mover días por una reserva (E1, E2)
Sustituye a la hoja vieja «Tu Coliseo, el martes 13. Para que encaje, cambiamos estos días: …» (párrafo y solo [De acuerdo], ya aplicado). Sale ANTES de aplicar:
- **Título:** «Tu entrada del Coliseo, el martes 13» (o «Tu excursión a Pompeya, el jueves 15»).
- **Texto:** «Para que disfrutes de tu viaje a Roma, te recomendamos cambiar los días enteros: así cada zona se ve junta y no vas de un lado a otro.»
- **Una tarjeta por cada DÍA que cambia**, con la foto real del sitio principal, el nombre del día, «Pasa al miércoles 14» y su cuadrado.
- **Dos botones lado a lado, del mismo tamaño:** **[Cambiar los días]** (dorado, con la etiqueta verde «Recomendado») y **[Solo mover la entrada]** / «la excursión» (blanco con borde: mueve solo los sitios de esa reserva, a su hora, sin tocar los demás días). Nada debajo.
- Lo que hace después, la regla de la V68 (todo junto, a su hora, nada repetido), con [Deshacer] abajo.

## 3. «Revisa las horas» (A1)
Al **guardar** una reserva imposible, antes de meterla en la ruta. Hoja con el icono de aviso ámbar y el título **«Revisa las horas»** (no «Algo no cuadra», como pone el dibujo):
- **A1a, una reserva antes de aterrizar** (o después de que salga el vuelo de vuelta): «Tu vuelo aterriza a las 17:30 y tu Free Tour es a las 10:00 del mismo día.» · [Revisar el vuelo] · [Revisar la entrada].
- **A1b, dos reservas a la vez:** «Tu entrada del Coliseo (13:00) coincide con tu Free Tour (12:00 a 14:30).» · [Revisar el Free Tour] · [Revisar la entrada].
- Abajo, pequeño: «Guardarla igualmente» (no obligamos). Si la guarda así: línea naranja en su tarjeta de RESERVAS con lo mismo, y **no se mete en el día como si cupiera**. No es para Reorganizar.

## 4. «Elige día y hora» del Free Tour y de las actividades con horas fijas (H1-H3)
Hoy la hoja pone la rueda libre y deja cualquier hora («09:15»). En su lugar:
- Arriba, **solo los días del viaje**.
- **«HORA DE INICIO»: las horas en botones** (3 por fila). Las de **Civitatis para ese día**, con sus plazas (el servidor ya las da: `server/civitatis/servicio.js` + `mapeo.js`, `horasParaLaApp` → { hora, plazas, aviso }); sin datos de Civitatis, las de `shared/routeEngine/freeTourHoras.js` (10:00, 12:00, 15:00, 17:00, 19:00, 21:00), sin plazas.
- **La recomendada** (la de la V60) con borde verde y «Te la recomendamos»; **«Quedan 3»** en ámbar (`textoDePlazas`); **agotadas** tachadas en gris con «Agotado», sin poder pulsarse; la elegida, en azul con el texto dorado.
- **El día de llegada, las horas antes de quedar libre** (hora útil del vuelo), en gris con **«No llegas»**, sin poder pulsarse (sin dibujo: como el agotado).
- **Un día sin ninguna hora libre:** el botón del día en gris con «Agotado»; al pulsarlo, «Este día no quedan plazas. Elige otro día.»
- [Guardar el Free Tour] apagado hasta elegir hora. La rueda libre se queda para lo que no tiene horas fijas.

## 5. Lugares pendientes en DÍAS (L5)
- **Una sola lista para todo el viaje.** Además de en HOY, **en DÍAS: al final de la lista de días, justo encima de «Añadir día»**, el mismo bloque «LUGARES PENDIENTES · N» (foto, nombre, motivo en gris, [Otro día], «···», [Pasar todos a otros días]). Si está vacío, no sale.
- **Antes del viaje,** el motivo es el que toca («No cabía el viernes»), nunca «Ya había cerrado» ni «Saltada hoy».
- Lo que Reorganizar no puede colocar va ahí, antes y durante el viaje.
- La hoja «Pasar todos a otros días» sigue la V63 §17 (cuadrado azul de la fecha, a dónde va en gris, sin flecha; los que no caben, con el icono de pendientes, no ⚠).
- En el dibujo de DÍAS está marcada la pestaña «Hoy»: en DÍAS se marca «Días».

## 6. [Ver entrada] (la ficha de la parada › pestaña Entradas)
Hoy no hace nada (`StopReservation.tsx`: `onVerEntrada={() => undefined}`). Con documento: abre el código a pantalla completa (`CodigoPantallaCompleta`; con varias personas, el bloque que se desliza de la V65). Sin documento: el botón dice «+ Subir tu entrada» y abre la hoja de la V64. **Regla nueva para CLAUDE.md: nunca un botón que no hace nada.**

## 7. Sin pruebas
- No pases pruebas ni escribas una nueva (salvo que algo toque lo de la `pruebaV68`: entonces pásala). Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone al lado de su dibujo de cada punto (en el 1, con la entrada del Coliseo a las 16:30 y con el vuelo a las 17:00); un caso en Lanzarote; qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
