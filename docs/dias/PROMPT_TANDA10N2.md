Hola. TANDA 10N2: LAS CUENTAS DEL GRUPO (quién le debe a quién). Va justo después de la 10N: si estás con ella, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10N2.md e inclúyelo en tu commit.
- **Design:** el zip «DESIGN_26OCT.zip» de la 10N (ya puesto al día). Lo de esta tanda: `Piezas/Cuentas Grupo` (nueva), montada en «App Reservas y presupuesto», con sus seis pantallas, de la 01 a la 06. Mírala entera antes de tocar nada.
- Sigue al presupuesto compartido de la 10N (apartado 9): ya existen [Para todos] / [Para mí], «¿Quién lo ha pagado?» y los permisos.
- No toques el motor de rutas. No hace falta la muestra de 60 fechas.

## 1. «¿Entre quién?» al añadir un gasto (02 y 03)
- En la hoja de añadir un gasto [Para todos], debajo de «¿Quién lo ha pagado?», **«¿Entre quién?»** con una pastilla por persona del viaje, **todas marcadas por defecto**, y a la derecha «4 de 4». Con el estilo de elegir de la 10N (lo elegido, en azul oscuro con su ✓).
- Debajo, la línea **«30 € cada uno»**, que cambia al desmarcar a alguien («3 de 4 · 40 € cada uno»).
- **A partes iguales y en euros**, entre los marcados. Los céntimos que sobren al repartir (100 € entre 3), al que lo ha pagado, para que las cuentas cuadren siempre al céntimo.
- Lo reservado para varios en RESERVAS («¿Para quién es?» de la 10N) cuenta igual: lo pagó quien lo añadió y se reparte entre los marcados.
- Los gastos [Para mí] no cuentan en las cuentas del grupo. Los «Pendiente de…», tampoco, hasta que se aceptan.
- Se puede editar un gasto [Para todos] después (quién lo pagó, entre quién, el importe): quien lo añadió, el administrador y los que pueden editar.

## 2. La pantalla «Cuentas del grupo» (01, 04, 05 y 06)
- **Se entra desde el presupuesto (01):** debajo de la tarjeta «Del grupo», la tarjeta **«Cuentas del grupo»** con las caras del grupo y, debajo, la primera deuda pendiente («Ana le debe 15 € a Eric»), o «Estáis en paz». Solo en un viaje compartido.
- **04 · la pantalla:** «4 personas · a partes iguales»; arriba, «Total del grupo 600 € · 150 € por persona»; cada persona con «Ha pagado 240 € · Le toca 150 €» y su saldo (en verde con «+», en rojo con «−», o «0 € ✓»); y abajo, **«Para quedar en paz»**: lo mínimo de pagos para que todos queden a cero («Luis le debe 15 € a Eric»), cada uno con **[Ya está pagado]**.
  - Si con «¿Entre quién?» no todos tienen lo mismo, «Le toca» es lo de cada uno, y arriba sale solo el total (sin «por persona»).
- **05 · al tocar [Ya está pagado]:** esa línea en verde con «✓ Pagado», y los saldos cambian. Lo puede tocar quien paga, quien cobra, el administrador o los que pueden editar; al otro le llega a la campana: «Eric ha marcado como pagados los 15 € que le debías.» Se puede deshacer.
- **06 · todos en paz:** todos a «0 € ✓» y la tarjeta verde **«Estáis en paz»**.
- Lo ve todo el grupo, con cualquier permiso. En directo: si alguien añade un gasto o marca un pago, a los demás les cambia sin recargar.
- Si alguien sale del viaje o lo quitan (10N, apartado 4a), sus gastos y lo que le tocaba se quedan en las cuentas, con su nombre, para que nadie pierda lo que puso.

## 3. La prueba
- La batería rápida y `pruebaJutrip`. Si `pruebaJutrip`, `pruebaTanda10B`, `pruebaRevisionLargos`, `pruebaTanda10F` u otras fallan solo al correr con las demás y solas pasan, dilo y sigue: se arreglan más adelante.
- Prueba nueva `pruebaTanda10N2`:
  - «¿Entre quién?» con todos marcados, desmarcando a uno, y «… € cada uno» que cambia;
  - las cuentas del ejemplo de Design (Eric +90, Ana −15, Luis −15, Marta −60) y lo mínimo para quedar en paz; 100 € entre 3 cuadra al céntimo;
  - [Para mí] y «Pendiente de…» no cuentan; lo reservado para varios, sí;
  - [Ya está pagado], su aviso, deshacerlo, y «Estáis en paz»;
  - en directo para los demás; alguien que sale del viaje sigue en las cuentas;
  - sin compartir, ni la tarjeta ni la pantalla.
- Capturas en `docs/dias/capturas_jutrip/` y una página `docs/dias/REPASO_10N2.html`, a tamaño de móvil.

## 4. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10N2». Di qué no se ha podido hacer igual que en Design.

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden (cada viñeta, no solo los apartados), cada uno con:
- **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué);
- **dónde lo mira Eric en el móvil** (la pestaña y los toques), y con qué cuenta (administrador, puede editar o solo recomendar);
- su captura, si la tiene.
La misma lista, arriba del todo de `REPASO_10N2.html`, con una casilla en cada punto para que Eric la vaya marcando en su teléfono mientras lo comprueba.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
