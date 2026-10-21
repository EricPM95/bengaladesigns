Hola. TANDA 10C, tres arreglos pequeños de la 10B. No toques el motor de rutas.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10C.md e inclúyelo en tu commit.

## 1. Los iconos de la tarjeta del destino (RUTA)
- En tus capturas, en la tarjeta de Roma solo sale la bombilla. **El icono de compartir no se ve**, y tampoco **la flecha para volver a la ruta de antes** (la que había antes de la 10B, al lado de la bombilla).
- Los tres iconos, siempre a la vista: la bombilla, la flecha de volver y compartir. Si la flecha no se puede usar todavía (no hay nada que deshacer), que salga apagada, como antes, pero que salga. Si compartir solo sale con cuenta y viaje guardado, que salga igual y, sin cuenta, que pida entrar al tocarlo.
- Dime por qué no salían.

## 2. El mapa de RUTA cuando no sabemos cómo llega
- En la captura sin medio elegido, el mapa sigue enseñando todas las paradas numeradas. **El mapa de RUTA nunca enseña las paradas.**
- Siempre: la ciudad y el punto de llegada. Si no ha elegido cómo llega, el punto que sale de su origen (el medio que la app deduce: desde Madrid, avión → Fiumicino y Ciampino). Si tampoco se puede deducir, Roma Termini, que es donde conecta todo (`_llegada.json` ya lo dice).

## 3. HOY sin pase
- Con «Verme como viajero sin pase», la pestaña **HOY desaparece** de la barra de abajo. **Tiene que seguir ahí:** sin pase, HOY enseña lo de antes del viaje («Tu modo Hoy se activa…», con el día de prueba y [Ver el Pase de Roma]), como dice `docs/dias/GRATIS_Y_PASE.md`. Que el viajero gratis vea que HOY existe.
- Revisa si «sin pase» esconde algo más que debería verse cerrado o con su invitación a comprar, en vez de desaparecer, y dímelo.

## 4. La prueba
- La batería rápida y `pruebaJutrip`.
- Capturas en `docs/dias/capturas_jutrip/`: la tarjeta de Roma con los tres iconos, el mapa de RUTA sin medio elegido, y HOY y la barra de abajo con «Verme como viajero sin pase» encendido.

## 5. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10C».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
