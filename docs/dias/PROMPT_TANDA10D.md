Hola. TANDA 10D, pequeña: HOY ANTES DEL VIAJE, SIN PASE, COMO EL DISEÑO. No toques el motor de rutas. Si estás con la 10C u otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10D.md e inclúyelo en tu commit.

## 1. Lo que hay que cambiar
- Con «Verme como viajero sin pase», HOY antes del viaje enseña una lista sencilla («Ese día tendrás»: siguiente parada, «No me da tiempo», escuchar, lo que tienes cerca, los avisos) y la tarjeta del día de prueba. **Eric quiere el formato del diseño:** App · HOY → **1a** (antes del viaje, con fechas) y **1b** (sin fechas), que ya están en `HoyAntesV2`:
  - arriba, «Tu modo Hoy se activa el lun 20 oct» con la cuenta atrás grande («7 días»), o sin fechas, «Tu modo Hoy se activa el primer día de tu viaje» con [Pon tus fechas];
  - debajo, el panel «🔒 PASE DE ROMA · Durante el viaje, Hoy te dará», con sus **seis cuadros** (Siguiente parada, Escuchar su historia, Tu día paso a paso, Cerca de ti, Avisos del día, Fotos del viaje);
  - y **«Logros y sellos»** con las medallas de bronce, plata y oro y [Ver el Pase de Roma], como en el diseño.
- **La tarjeta del día de prueba** («Tienes un día de prueba con HOY, gratis. Con el Pase de Roma, te acompaña todo el viaje.»), debajo de todo eso, en vez de la lista sencilla.
- **Con los colores de Marca JUTRIP:** los paneles oscuros, en tinta (`#1C2230`); donde el diseño 1a usa azul claro en cursiva («lun 20 oct», «días», «el primer día de tu viaje»), el oro pálido (`#E9C77A`); «Hoy te dará», en oro, como ahora.
- **Con el pase**, lo mismo sin el candado «PASE DE ROMA» ni [Ver el Pase de Roma], como ya hace `HoyAntesV2` con el cobro apagado.
- Los textos de los cuadros, los del diseño. Cuando llegue el compañero de HOY, se cambiarán.

## 2. La prueba
- La batería rápida y `pruebaJutrip`.
- Capturas en `docs/dias/capturas_jutrip/`: HOY antes del viaje sin pase (con fechas y sin fechas) y con pase, enteras (con lo de abajo).

## 3. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10D».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
