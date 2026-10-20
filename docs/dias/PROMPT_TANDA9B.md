Hola. Tanda pequeña: TANDA 9B, EL MODO «ESTOY EN EL SITIO» PARA LAS PRUEBAS DE ERIC. Eric revisa la app desde España y no puede ganar nada con el Visto, porque la app comprueba bien que no está en Roma. No toques el motor de rutas.

## 0. Antes de empezar
- Claude ha dejado este prompt en docs/dias/PROMPT_TANDA9B.md. Inclúyelo en tu commit tal cual.

## 1. El modo
- En /?admin=logros → «Mis pruebas», un interruptor: «Hacer como que estoy en el sitio». Apagado por defecto.
- Encendido, al tocar [Visto] el servidor da por buena la ubicación como si Eric estuviera en esa parada. Todo lo demás pasa igual que en Roma: los pedazos, las colecciones, los emblemas, las maravillas, el sello, la EXP, las sorpresas en su orden y el resumen del día.
- Con foto: que valga una foto de la galería aunque no sea de ese sitio ni de las fechas del viaje, para probar también ese camino.
- Que se vea que está encendido: una etiqueta pequeña «Modo prueba» en HOY, solo para él.

## 2. Los seguros
- Solo para los emails de LOGROS_ADMIN_EMAILS, y lo decide siempre el servidor. Nada del móvil puede encenderlo (ni un parámetro en la dirección ni nada guardado en el navegador).
- Solo afecta a su propia cuenta.
- Lo ganado con el modo encendido queda marcado como «de prueba»: no cuenta para el sorteo, no sale en el panel de administrador como ganado de verdad y se borra con [Reiniciar mis pruebas].
- Si se apaga el modo, todo vuelve a funcionar como para cualquiera.

## 3. La prueba
- No toca el motor: la batería rápida.
- Pruebas nuevas:
  - otra cuenta no puede encenderlo de ninguna forma;
  - con el modo encendido, un Visto lejos del sitio da sus sorpresas;
  - lo ganado sale marcado como de prueba y no entra en el sorteo;
  - reiniciar lo borra.

## 4. El informe (docs/dias/INFORME_TANDA9B.md)
En español sencillo: qué has hecho, dónde se enciende y los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
