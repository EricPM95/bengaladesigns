Hola. TANDA V53: TODO IGUAL (una sola forma para cada cosa, decisiones de Eric sobre el CHECKLIST de la noche). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V52 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v53.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md).

**Dibujos: `TODO_IGUAL`, en mis Descargas** (sustituye a `NUEVO_DISEÑO`). Descomprímelo en `docs/diseno/proyecto/`, encima de lo que hay, **sin borrar** las 4 páginas que no trae (`Piezas/Companero`, `Piezas/Hoy Estados`, `Logos JUTRIP Lujo`, `Logos JUTRIP Palabra`). Míralo con `scripts/destino/capturaDesign.mjs`. **Design es un prototipo:** se copia SOLO lo que se describe aquí.

## 1. Un solo botón dorado (CHECKLIST 13 y 17)
El dorado de Design (`BOTON_ORO`, `botonesOro.ts`) para **toda** la app. **Fuera el champán** (`BotonHoja`, unos 12 archivos: cuenta, pase, ajustes…): cada uno pasa a `BOTON_ORO`, igual de tamaño que los demás. Que no quede ningún dorado hecho a mano.

## 2. La sombra de detrás de las hojas (CHECKLIST 15)
La de Design, sin desenfoque (la de HOY, `trazo-notice-backdrop`), en **todas** las hojas. Una sola pieza.

## 3. Los botones de «no» (CHECKLIST 16)
Hoy «Ahora no» sale de tres formas. Regla nueva, para toda la app:
- **Dos opciones:** dos botones del mismo tamaño, **lado a lado**: el dorado y el **blanco con borde** (como en «¿Adaptamos tu primer y tu último día a tus vuelos?»).
- **Tres o más:** el dorado, debajo el blanco con borde, y la salida («Dejarlo como está», «Ahora no») **como texto pequeño** al final.

## 4. La papelera de las reservas (CHECKLIST 18)
En **todas** las tarjetas de RESERVAS, abajo a la derecha. También la del vuelo, que hoy va en la fila del botón de la tarjeta de embarque.

## 5. DÍAS: los días que ya pasaron (CHECKLIST 23)
Hoy todos salen «Hecho» con el ✓ verde aunque no se hiciera nada (`DayList.tsx`, la línea de «Hecho · Ver tu día»). En Lanzarote, el 10 y el 11 salen «Hecho» sin nada marcado.
- **Si ese día hizo algo** (al menos una foto, una parada marcada como vista o [He terminado]): como ahora, «Hecho · 1 foto» / «Hecho · Ver tu día», con el ✓ verde.
- **Si no hizo nada:** **«Ya pasó · Ver tu día»**, sin ✓ verde.
- OJO: la página `Dias Pasados` de Design es vieja (cuadrados beige, «Hecho» en todos). No la sigas.

## 6. El icono de «Lugares pendientes»
- **Es el D de `Icono Pendientes`, el «Pin con reloj» (dibujos I1b a I4).** OJO: Design marca como «La elegida» la A; Eric eligió la **D**. Ni la A, ni la E, ni la F.
- Una sola pieza (por ejemplo `IconoPendientes.tsx`), en cuatro sitios:
  - la cabecera del bloque «LUGARES PENDIENTES 7» (I2);
  - en la hoja de «Pasar a otro día» (la pieza A2 de la V50), cuando el sitio va a pendientes y no a un día: el cuadrado de la derecha de su tarjeta, azul oscuro con el icono en dorado, en lugar de la fecha (I3);
  - el botón [Guardar en pendientes] (I4);
  - el aviso de abajo «… lo tienes en Lugares pendientes · [Deshacer]».

## 7. Dos detalles de Eric en el iPhone
- **RESERVAS › «Llegada y vuelta» plegado:** la tarjeta y su icono están más a la izquierda que las de Alojamiento, Entradas y Excursiones. El mismo margen que las demás.
- **«¿Adaptamos tu primer y tu último día a tus vuelos?»** (y toda hoja que ofrezca Reorganizar): antes del título, **el icono del botón flotante de Reorganizar**, para que, si pulsa [Ahora no], reconozca el botón que se queda flotando.

## 8. Reglas nuevas para CLAUDE.md
- Los puntos 1 a 4 y 6, como reglas («una sola forma»).
- **La misma pieza siempre, pero si sobre un fondo no se ve, se adapta** (CHECKLIST 20: la tira de días de «Tu viaje a…» se queda con sus cuadritos claros).
- **Todo lo que se decide probando Roma vale para TODOS los destinos** (Lanzarote, Madrid y los que vengan): entradas, horarios, «Abierto/Cerrado», «Ya ha cerrado», pendientes, avisos, hojas, excursiones… **Lo común va en el código, una vez; lo de cada destino, en sus datos**, adaptado a él (en Lanzarote, en coche; los pueblos, sin horario). Nada se escribe solo para Roma: cada tanda dice en el REPASO cómo queda en Lanzarote y comprueba al menos un caso allí.

## 9. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone de cada punto (en el 5, un viaje de Lanzarote con un día con foto y otro sin nada), qué has cambiado (en el 1 y el 2, la lista de archivos) y qué no has podido comprobar.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
