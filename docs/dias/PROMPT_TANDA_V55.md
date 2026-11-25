Hola. TANDA V55: TODAS LAS HOJAS QUE PROPONEN UN CAMBIO, CON EL MISMO FORMATO (y la rueda de la hora). Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V54 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v55.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita, y nada se inventa: se usan las piezas que ya existen (CLAUDE.md). **Todo vale para todos los destinos** (regla V53).

## 1. Regla nueva: TODAS las hojas que proponen un cambio usan la tarjeta del sitio (decidido por Eric)
Hoy hay dos formatos en `HojaPropuesta` (`CambiarPlan.tsx`):
- si la propuesta trae `tarjetaDia`, sale **la tarjeta del sitio** (`TarjetaDelSitio`, la pieza A2 de la V50);
- si no, sale **el bloque de resumen viejo** (`ResumenDeCambios`: fondo gris, líneas con iconos redondos).

Eric quiere **solo el primero, en todas**. Sustituye la regla de la V43 «un bloque de resumen que no se pulsa» en CLAUDE.md por esta:
- **arriba, el texto claro** de lo que pasa y por qué;
- **una tarjeta por cada sitio que cambia,** con:
  - **la foto real del sitio**, la misma de su parada (el degradado solo si no hay foto);
  - el nombre;
  - **a dónde va, en gris**;
  - **a la derecha, su cuadrado**:
    - **otro día:** el cuadrado de la fecha (`CuadradoFecha`);
    - **hoy, a otra hora:** el mismo cuadrado con el día de hoy, y la hora en el gris («Hoy a las 17:30»);
    - **a pendientes:** el cuadrado azul con el icono de pendientes (V53);
    - **quitar del viaje:** el mismo cuadrado azul con la papelera que ya usa la app.
- **si cambian más de 3 sitios** (Reorganizar), 3 tarjetas y debajo «y 5 más» en gris, que al tocarlo despliega el resto;
- **la franja verde** con lo que se queda igual («✓ Sigue igual: el resto de tu martes», «✓ Así llegas a tiempo a tu entrada de las 10:00»);
- **el botón dorado dice la acción** («Pasarlo al jueves», «Guardarlo en pendientes», «Comer ahora en Da Enzo»); si hay segunda opción, el blanco con borde (regla V53 de los botones); **[Dejarlo como está] en texto pequeño**, al final;
- **nunca «dejar» para dos cosas.** Fuera «¿Lo dejamos?» / [Sí, dejarlo] (hoy sale con `p.pregunta`): el botón dorado dice qué hace.

## 2. Las hojas que hay que pasar (una a una)
Que no quede ninguna con `ResumenDeCambios`:
- «Voy con retraso»;
- «Quiero comer ahora» (`ComerAhora.tsx`);
- «Añadir un sitio cercano»: la tarjeta es del sitio nuevo, con «Hoy a las …» en gris;
- «Saltarme esta parada»;
- «Hoy ya no da tiempo a todo» (`HoyYaNoDaTiempo.tsx`);
- «Si te sobra tiempo» (`MasTiempo.tsx`);
- el horario y lo cerrado (`HorarioHoy.tsx`);
- `QueHagoAhora.tsx` y `ComoVais.tsx`, si proponen cambios;
- el plan de lluvia (`AvisosDelTiempo.tsx` y `RainAlert.tsx`);
- **Reorganizar** (`ReorganizarHost.tsx`, `AvisoNoCabe.tsx`, `ReorganizarDia.tsx`).

**NO se tocan** las propuestas entre viajeros de un viaje compartido (`PropuestaHost.tsx`, `HojaPropuestaDelDueno.tsx`): son otra cosa.

Si una hoja no encaja (por ejemplo, no cambia ningún sitio), no inventes: déjala como está y apúntala en DECISIONES con su captura.

## 3. La rueda de la hora (Eric, iPhone, 25-nov por la mañana)
- **El fallo:** el bloque sale en gris con una hora de ejemplo (08:30) y al abrir la rueda sale 08:30. Si Eric pulsa ✓ sin mover la rueda, **no se guarda**: tiene que moverla arriba y abajo y volver a las 08:30. Viene de la V49: «la hora gris de ejemplo nunca se guarda».
- **El arreglo:** al pulsar ✓, **se guarda la hora que se ve**, aunque no se haya movido la rueda. La hora gris solo no se guarda si nunca se abrió la rueda y se confirmó.
- En **todas** las ruedas de hora de la app (`HojaDeHora.tsx`, `PickerSheet.tsx` y las que haya).
- Tocar fuera sigue cerrando sin guardar.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva.
- Antes de subir: `npm run build` sin errores.
- El REPASO, corto:
  - una captura en modo iPhone de **cada hoja del punto 2**, antes y después, una al lado de la otra; una de Reorganizar con más de 3 sitios; una en Lanzarote;
  - en la rueda, cuenta qué has comprobado en cada sitio;
  - la lista de hojas que has pasado y las que has dejado en DECISIONES.

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
