Hola. TANDA V59: HOY › EL CIERRE DEL DÍA, «VOY CON RETRASO» Y LA HORA DE COMER Y DE CENAR. Tanda corta, MODO RÁPIDO. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v59.md` en la rama `estado` al empezar y cada 30 minutos (en las V52-V58 no la subiste: esta vez sí). 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md). **Todo vale para todos los destinos** (regla V53): cada punto, en Roma y en Lanzarote.

**Dibujos: `TODO_IGUAL`, en mis Descargas** (la versión nueva, de hoy por la tarde; sustituye a la de la V53). Descomprímelo en `docs/diseno/proyecto/`, **encima, sin borrar** lo que no traiga. Las páginas de esta tanda (búscalas por su título): **«Hoy ya no da tiempo y el resumen del día»** (H1-H5, R1, R1b, R2, L1, L2) y **«Hora de comer y de cenar en HOY»** (C1-C6, I1). **Design es un prototipo:** se copia SOLO lo que se describe aquí; los datos de los dibujos son de ejemplo.

## 1. Una sola hoja para «vas tarde» y para el cierre del día (H1-H5)
Sustituye a la hoja «Hoy ya no da tiempo a todo» de ahora (`HoyYaNoDaTiempo.tsx`) y a la de «Voy con retraso». **Una sola pieza**, cambia el texto de arriba:
- **H1, durante el día** (más de 1 h de retraso, o la mañana pasada sin nada hecho; una vez al día; nunca desde las 20:00, V56): «Hoy ya no da tiempo a todo» · «Lo de esta mañana ya ha pasado: te han quedado 3 sitios sin ver.»
- **H2, al acabar el día:** a las 22:00, o al pulsar [He terminado] en la última parada (lo que pase antes). **Si quedan paradas nocturnas** (Trevi de noche…), espera a que se terminen; si no se hacen, sale al abrir la app al día siguiente. «Por hoy ya está» · «Te han quedado 3 sitios sin ver.» (las nocturnas no cuentan como «sin ver»).
- **H3, a la mañana siguiente** (si no se abrió la app por la noche): «Ayer te quedaron 3 sitios sin ver». Al pasarlos, hoy también vale.
- **H4, «Voy con retraso» cuando aún da tiempo a todo:** «Vas 40 minutos tarde, pero hoy te da tiempo a todo.», sin tarjetas, la franja verde y un solo [Entendido]. **Un solo ✓** en la franja (en el dibujo salen dos).
- **H5, «Voy con retraso» cuando ya no da tiempo:** como H1, título «Voy con retraso» y «Vas tarde: hoy no te da tiempo a ver 3 sitios.» **Con la franja verde** (en el dibujo falta).

**Dentro, igual en todas:**
- una tarjeta por sitio (`TarjetaDelSitio`): la foto real, el nombre, a dónde iría en gris («Al jueves 26» o «A Lugares pendientes») y su cuadrado (la fecha, o el icono de pendientes);
- la franja verde: **«La tarde sigue igual, desde {lugar}»** (H1/H5) o «Tu día sigue igual, solo un poco más tarde» (H4);
- [Pasarlos a otros días] (dorado), [Guardarlos en pendientes] (blanco con borde) y [Dejarlo como está] en texto;
- **si el día tiene una entrada con margen** (V54), línea gris: «Tu entrada del Foro Romano vale todo el día: puedes entrar cuando llegues.» **Nunca «ya ha pasado»** en una entrada con margen.
- **Fuera [Ver otra opción]** (además no hacía nada) y fuera [Ver lo que queda hoy] (para cerrar está la X).
- **Una entrada cuya hora ya pasó nunca sale como «Sigue igual»** en ninguna hoja de HOY (hoy pasa en el plan de lluvia: `hoyLluvia.ts`, `mantieneReservas` solo mira si está marcada, no la hora).
- No sale el día de vuelta (ahí va «Buen viaje de vuelta», V57).

## 2. El resumen del día (R1, R1b, R2)
`ResumenDia.tsx` (hoy con textos propios) pasa al dibujo. Sale **después de H2/H3** (al cerrarla, de cualquier forma) o **directamente** si se vio todo. Ya salía al completar el día y al abrir la app con el de anoche pendiente (`MomentosHost.tsx`): eso se queda; se añade el cierre de las 22:00.
- **Por la noche:** «TU DÍA EN ROMA · Lo que te llevas de hoy». **A la mañana siguiente:** «TU DÍA DE AYER EN ROMA · Lo que te llevaste ayer». Una vez por día: si salió por la noche, no se repite por la mañana.
- Arriba, la medalla del destino («Tu medalla sube a oro» / «Tu medalla de Roma, en bronce»).
- **Debajo, la tira de las fotos de ese día** (si no hay fotos, no sale). **Llenan el ancho:** caben las que caben hasta el borde derecho y solo el último hueco es «+N» (en el dibujo hay 4 y «+5» con sitio para otra: serían 5 y «+4»).
- **Una fila por cada cosa ganada** (solo las que no son 0; singular o plural; empiezan en mayúscula): pedazos, colecciones, emblemas ocultos, país nuevo, destino nuevo, continente, maravillas, Patrimonio, logros de viajero. **En cada fila, las miniaturas de lo ganado** (los pedazos, los emblemas, la medalla de «País nuevo» con «🇮🇹 Italia» debajo, la de «Destino nuevo» con «Roma», la maravilla, la de Patrimonio con su nombre, cada logro de viajero con su nombre). **Todas las miniaturas al MISMO tamaño (el grande de los pedazos y los emblemas), todo alineado** a la misma izquierda, llenando el ancho y «+N» si sobran.
- Las filas no se pulsan. Abajo, [Ver todos mis logros] y «Roma aún esconde 9 secretos.»
- **Si ese día no ganó nada, no sale el resumen** (fuera «Aún no has ganado nada hoy»).
- De paso: en «Y además…», cada logro de viajero dice lo que acaba de conseguir (como «La pandilla viaja · Tu primer viaje con amigos»); hoy «Testigo de la historia» dice «Patrimonios de la Humanidad que has visitado»: «Tu primer Patrimonio de la Humanidad».

## 3. La hora de comer y de cenar (C1-C6, I1)
**Fuera la tarjeta oscura «Es hora de comer».** La comida y la cena usan **la misma tarjeta de la parada** (`ParadaHoy`), con una **imagen fija** en lugar de la foto (I1: comer, color cálido con los cubiertos; cenar, azul noche con los cubiertos en dorado). Esa imagen, una pieza, se usa en toda la app donde salga una comida o una cena (DÍAS, listas).
- **C1/C2, con restaurante en la ruta** (lo normal: el que pone el motor o el que eligió): «COMIDA» / «CENA»; «Es hora de comer · Armando al Pantheon»; cajas HORARIO / A PIE / COMIDA (1 h; cena 1 h 30); el recuadro de la ubicación como en la parada; [Cómo llegar] (dorado) y **[Elegir otro sitio]** (en lugar de [Cambiar plan], abre «Comer cerca de ti»); debajo, «Ya he comido · seguir con el plan» (o «Ya he cenado»).
- **C5/C6, ya en el restaurante** (al pulsar [Ya he llegado] o por el GPS): la misma tarjeta; A PIE «Aquí · Ya has llegado»; sin el recuadro, sin botones ni enlace; **solo [He terminado] verde, de punta a punta** (pasa a la siguiente parada).
- **C3/C4, sin restaurante** (la comida al llegar, «Cerca de tu alojamiento»): «12 abiertos · Restaurantes cerca de ti», [Elegir sitio] (dorado) y [Cambiar plan]. Al elegir uno, pasa a C1/C2.
- **Si pasa la hora de comer o de cenar sin pulsar nada,** la tarjeta se va sola y sale la siguiente parada.
- **Lo que NO se copia del dibujo:** «Abierto» va en verde (V46); [Ya he llegado] con el botón de siempre de la parada; [Elegir otro sitio] cabe (en el dibujo se sale); mismos colores, márgenes y alineación que la tarjeta de la parada.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone, al lado de su dibujo, de H1, H2, H3, H4, H5, R1 (un día con mucho), R2, C1, C2, C3, C5; una en Lanzarote; qué has cambiado y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
