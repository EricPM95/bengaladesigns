Hola. Nueva tanda: LAS CUENTAS, PARTE 2 (lo de dentro). Sigue sin pantallas de Design: todo detrás del mismo interruptor apagado, y con pantallas provisionales solo para probar. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_CUENTAS_1.md y, en docs/dias/APUNTES_TRAS_TANDA7.md, los apartados 24, 25, 27, 28 y 29. En docs/dias/ORDEN_PARA_CODE.md está lo que ya ha hecho Eric fuera del código. Claude ha actualizado esos dos archivos y ha dejado este prompt: inclúyelos en tu commit tal cual.
- Lo que ya hizo Eric (16-oct): «Allow manual linking» activado; Google dado de alta en modo Prueba y puesto en Supabase; Site URL `https://bengaladesigns.vercel.app` y Redirect URL `https://bengaladesigns.vercel.app/**`; `SUPABASE_SERVICE_ROLE_KEY` puesta en Vercel. La migración 0020 sigue SIN aplicar, a propósito.

## 1. La clave del servidor
- Eric ha puesto en Vercel una clave nueva de Supabase de las que empiezan por `sb_secret_`, no la antigua `service_role`. Comprueba que tu código del servidor (y la versión de supabase-js) la acepta. Si no, dime qué hay que cambiar.
- En tu informe dijiste que esa clave «ya se usa para las ventas del afiliado». Pero en Vercel no estaba hasta hoy: mira qué hacía esa parte sin ella (si fallaba sin avisar, si se perdían ventas) y dímelo.

## 2. Borrar la cuenta: que no pierdan nada los demás
Cambia lo que te pedí en la parte 1:
- **Pases:** al borrar la cuenta se borra solo su propio uso del pase. Si compró un Pase Dúo o de grupo, los usos que son para otras personas se quedan con esas personas, como si fueran suyos.
- **Viajes compartidos:** si el que borra la cuenta es el administrador y el viaje tiene invitados, el viaje no se borra: pasa a ser administrador el invitado que entró primero. Si no tiene invitados, se borra como ahora.
- Sus Vistos, fotos y logros se borran siempre.
- Añade estos casos a `pruebaCuentas1` (o a una prueba nueva).

## 3. Invitar a alguien (la lógica)
- El administrador crea una invitación a su viaje: un enlace y un código corto, que sirven para lo mismo.
- Quien la abre: si no tiene cuenta, la crea; después entra en el viaje como invitado.
- Si la invitación va con un Pase Dúo o de grupo, al entrar recibe su uso del pase. Un Dúo, 1 invitado; un grupo, tantos como usos tenga.
- La invitación se puede anular, y deja de valer cuando ya no quedan usos.
- Una pantalla provisional y sencilla para probarlo, solo con el interruptor encendido.

## 4. Los Vistos de cada persona
Con el interruptor encendido, la app lee y pinta los Vistos de cada persona desde `stop_visits`, no los del administrador. Con el interruptor apagado, como hoy.

## 5. Aceptar una recomendación cambia la ruta
- Cuando el administrador acepta una recomendación (un cambio suelto, un día nuevo o la ruta entera), la ruta cambia de verdad.
- Antes de cambiarla, guarda cómo estaba, para que la varita («Recuperar este día» / «Recuperar mi ruta») siga funcionando como hoy.
- Si la ruta del administrador cambió desde que se mandó la recomendación y ya no encaja (por ejemplo, el día ya no existe), no la aplica a ciegas: la marca como «ya no encaja» y se lo dice.

## 6. La prueba larga, más rápida
Parte la prueba larga del motor por fechas con un parámetro `tramo=i/n`, como propusiste, para poder lanzarla en muchos procesos a la vez. No cambies lo que comprueba, solo cómo se reparte. Pásala entera una vez partida y dime cuánto tarda y que da los mismos resultados que sin partir (0 fallos).

## 7. La prueba
No toca el motor: la batería rápida, con las pruebas de las cuentas ampliadas (punto 2, invitación, Vistos de cada persona y recomendación aplicada). Y la prueba larga partida, del punto 6.

## 8. El informe (docs/dias/INFORME_CUENTAS_2.md)
En español sencillo: qué has hecho, qué falta, lo que tiene que hacer Eric fuera del código, las migraciones nuevas (si las hay, sin aplicarlas) y en qué orden van después de la 0020, los riesgos y lo que no has podido hacer.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
