# Decisiones de la noche 24-25 nov · agente HOY (repaso de diseño + una sola forma)

Lo dudoso que he decidido solo (Eric no contesta de noche), con la regla que he usado. Lo que no pude resolver sin tocar archivos de otro agente va en «Para el coordinador».

## Decidido
1. **El dibujo de Design es un prototipo: los tamaños de la tarjeta de la parada se ajustan a T1-T3** (foto de 140 px antes de llegar y 170 al llegar; nombre de 34 px; cajas de 18 de radio con icono de 15). Los datos de ejemplo no se copian.
2. **«Aquí ganas 1 pedazo»: se queda el trozo REAL de ese sitio** (V47) en lugar del icono genérico de puzle del dibujo; cambio solo colores, radio y sombra a los del dibujo. El círculo pasa de 46 a 44 px.
3. **Un solo dorado.** El dibujo T1 usa DOS dorados (uno claro para [Cómo llegar] y el de siempre para [Usar mi ubicación]); la regla de la V43 dice uno solo, así que [Cómo llegar] usa `BOTON_ORO`.
4. **[Ya he llegado] en el recuadro de puntos** usa `BOTON_CLARO` (marfil con filo dorado) y no el blanco `#FFFDF8` del dibujo: una sola pieza de botón claro.
5. **El «···» y [Otro día] de «Lugares pendientes»** tienen el tamaño del dibujo (30 × 34 y 36 de alto) pero con `zona-toque` para que el área de toque siga siendo de 44 px. La pastilla del motivo («Saltada hoy», «Ya ha cerrado») pasa a texto en oro oscuro, como en L2; el icono de reloj de la pastilla se quita (el dibujo no lo enseña pero el texto del motivo se mantiene entero).
6. **El resumen de «Pasar todos a otros días» (L4)** enseña ahora, como en el dibujo, una fila por sitio con foto y el cuadrado de la fecha (`CuadradoFecha`, tamaño pequeño) y, aparte, los que no caben. El texto del botón es «Pasar los N que caben» (N > 1) o «Pasar el que cabe».
7. **El aviso de arriba (Design «Avisos Arriba» A1)** es una tarjeta clara con filo dorado y el icono en un círculo (reloj si habla de un cierre, «i» si no). `AvisoDeAbajoHost` usa la pieza `AvisoArriba` de `ui/` y le pasa el aspecto por `estilo`; **para el coordinador / agente de `ui/`:** si `AvisoArriba` cambia su aspecto por defecto a este, se puede quitar el `estilo` de HOY.
8. **El aviso ámbar de cierre (A1 de «Aviso Cierre»)** se pasa al dibujo (fondo `#FBF1D8`, filo 1,5 px, icono 22 px, texto 14,5 px) y su enlace pasa a ser «Pasarlo a otro día» subrayado.
9. **Los enlaces de los avisos de arriba** ([Ver solución], [Ver alternativa], [Ver plan]) son UNA pieza (`EnlaceDeAviso`): antes eran un enlace subrayado en un aviso y una píldora azul oscura en otros dos.
10. **El botón azul oscuro de HOY** (`BOTON_AZUL`): [Pasar todos a otros días], [Añadir] foto del álbum, [Añadir] alojamiento, [Deshacer] del cartel del tiempo y el punto de encuentro de la excursión. Ya no hay píldoras de azul oscuro sueltas.
11. **Todos los botones dorados de HOY son `BOTON_ORO` con esquinas de 16** (`rounded-2xl`); había píldoras `btn-champan` (otro dorado, de marfil a champán) y tres degradados `#E4C58A…` sueltos (Ver el Pase, Ver el resumen, Hoy, Hacer la foto, Reservar…). El pase y el resumen de viaje siguen diciendo lo mismo.
12. **«Dejarlo como está»** es UNA pieza (`EnlaceDejarlo`, 14 px subrayado en `#8E6820`); antes eran 4 copias en gris y sin subrayar.
13. **La X de cerrar de las hojas de HOY** es `CruzDeHoja` de `ui/` (la del resto de la app, círculo de 40 px). Había 8 X distintas (36, 40, 44 px, fondos distintos).
14. **Todas las hojas de HOY** (`HojaV2` y las que se escribían a mano) tienen esquinas de 32, tirador de 44 × 4, sombra de arriba del dibujo y velo `rgba(20,16,10,.5)`. «Pasar a otro día» desde Lugares pendientes usaba otra hoja (`PickerSheet`): ahora es la misma que desde Cambiar plan.
15. **El recuadro de puntos** es UNA pieza (`RecuadroDePuntos`): «Sin tu ubicación…», «Estás lejos…» y «Pon tu alojamiento para volver…».
16. **Las etiquetas** («Contiene recompensa», «Lo tienes el …», la hora de una reserva en «Tu día» y «Cierra en N min») son UNA pieza (`Etiqueta`) con cuatro tonos.
17. **Las tarjetas oscuras de HOY** tienen todas esquinas de 26 (`TarjetaOscura` era de 28).
18. **Las fechas de la tarjeta «Tu día de prueba» (P12)** pasan a `CuadradoFecha`.

## Para el coordinador (no he tocado `ui/`, `dayDetail/`, `reservas/`)
- **`ListaDeDias.tsx` (dayDetail/) sigue en beige** y la usan «Pasar a otro día» y «Elegir otro día» de HOY: el cuadrado de la fecha de la lista (26a) saldrá azul cuando lo cambie el agente de DÍAS. En HOY ya la usan `CambiarPlan`, `HorarioHoy`, `HojasV2` y `saltar.tsx`.
- **El billete (`Billete QR`, Q1-Q4) vive en `dayDetail/BilleteDeVuelo.tsx`**, que no es mío: lo he capturado en HOY y lo comparo con el dibujo en el informe, sin tocarlo.
- **`AvisoArriba` (ui/)** es oscuro por defecto; el dibujo A1 de «Avisos Arriba» lo quiere claro con filo dorado (ver decisión 7).
- **La tarjeta oscura «Tu viaje a …» (HoyDespues, versión vieja)** lleva una tira de días con la fecha en cuadritos translúcidos; **no la he pasado a `CuadradoFecha`** porque el cuadrado es azul oscuro y la tarjeta también (se perdería). Es la tira de días de `HoyDespues.tsx` (pantalla de HOY de después del viaje).

## Sin hacer / sin ver en pantalla
Ver el informe final y `docs/dias/NOCHE_HOY.md`.
