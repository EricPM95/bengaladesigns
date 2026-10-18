Hola. Tanda pequeña: TANDA 8B5, LAS FOTOS ELEGIDAS, LA MEDALLA NUEVA Y LOS TEXTOS DEL RESUMEN. Eric y Claude han revisado la 8B4: ha quedado muy bien. Todo sigue detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8B4.md y docs/dias/notas_8b/candidatas_8b4.json.
- Claude ha puesto al día en `docs/diseno/proyecto/` la pieza nueva de la medalla (`Piezas/Medalla Siete.dc.html`), `Piezas/Momentos Grandes.dc.html` y las imágenes de las monedas en `assets/` (`mm-off-*.png`, `medalla-7-maravillas*.png`, `siete-maravillas.png`, `coliseo-relieve.png`).
- Claude ha dejado este prompt en docs/dias/PROMPT_TANDA8B5.md. Inclúyelo en tu commit tal cual, con los archivos de Design de arriba.

## 1. Las fotos que ha elegido Eric
De `FOTOS_CANDIDATAS_8B4.html`:
- Foro Romano y Palatino: la 2.
- Arco de Constantino: la 1.
- Panteón: la 1.
- Piazza Navona: la 3. Es su foto de día para todo el año; la de Navidad sigue saliendo solo en sus fechas.
- Museos Vaticanos: la 2 (el letrero «Musei Vaticani» con las estatuas).
- Columna de Trajano: la 2.

Para cada una:
- Ponla como foto propia en `_fotos.json`, con su autor, su enlace y la licencia, como las del 2 de octubre.
- Guárdala en `public/fotos/roma/` a 1600 de ancho y hazle su miniatura WebP, como las demás.
- Comprueba cómo queda recortada en HOY v2 y en la miniatura.

Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio se quedan sin foto. Apúntalos en `notas_8b/fotos.md` como pendientes.

## 2. La medalla nueva de las 7 maravillas (Eric)
- **El dibujo:** el de `Piezas/Medalla Siete`, el que ya sale en **Logros · Modelos** y en Momentos Grandes, apartado 03 «Una maravilla, en la medalla»: un disco dorado con las 7 monedas alrededor y en el centro «1 de 7».
- **Dónde va:** en todos los sitios donde sale la medalla de las maravillas: la tarjeta de «Y además…», Logros, la vitrina y donde haya otro. Si en algún sitio sale la medalla de antes, cámbiala.
- **Las monedas:**
  - En oro, las que el viajero tiene de verdad, sean las que sean; en plata, las que le faltan.
  - Con el Coliseo, solo el Coliseo; si luego consigue Petra, el Coliseo y Petra.
  - En el centro, cuántas lleva («2 de 7»).
- **Quieta:** en la tarjeta de «Y además…» no se anima. No uses el destello de la pieza (`gain`).
- **El texto de la tarjeta, según cuántas lleve:**
  - «Tu primera maravilla», «Tu segunda maravilla», «Tu tercera maravilla», «Tu cuarta maravilla», «Tu quinta maravilla» y «Tu sexta maravilla».
  - Debajo, la que acaba de conseguir y la cuenta: «El Coliseo · 1 de 7», «Petra · 2 de 7»…
- **La séptima:** no lleva tarjeta. Sale «El final de las 7 maravillas», como ya lo tienes. No lo toques.

## 3. La tarjeta del Patrimonio en «Y además…»
Como las demás tarjetas, con su número:
- arriba, «PATRIMONIO DE LA HUMANIDAD»;
- el título, «Tu Patrimonio número 1: Centro histórico de Roma».

Así se leen igual las cuatro: «Tu país número 1: Italia», «Tu destino número 1: Roma», «Tu primera maravilla», «Tu Patrimonio número 1: …».

## 4. Los textos del resumen del día
Todos empiezan siempre por mayúscula, con el singular y el plural bien puestos:
- **El título:** «Lo que te llevas de hoy». Encima se queda «TU DÍA EN ROMA».
- **El sello:** la fila del sello no lleva número.
  - Si sube, «Tu sello sube a oro», con el grado que toque: bronce, plata, oro…
  - Si nace, «Tu sello de Roma, en bronce». En el Vaticano, «Tu sello del Vaticano, en plata».
- **Las filas**, con el número delante como ahora:
  - «Pedazo nuevo» / «Pedazos nuevos»;
  - «Colección completa» / «Colecciones completas»;
  - «Emblema Oculto» / «Emblemas Ocultos»;
  - «País nuevo» / «Países nuevos»;
  - «Destino nuevo» / «Destinos nuevos»;
  - «Maravilla del mundo» / «Maravillas del mundo»;
  - «Patrimonio de la Humanidad» / «Patrimonios de la Humanidad»;
  - «Logro de viajero» / «Logros de viajero».
- **La línea de abajo:** en vez de «3 de 12 secretos encontrados», «Roma aún esconde 9 secretos.», con la cuenta de verdad.
  - Si solo queda uno, «Roma aún esconde 1 secreto.».
  - Si no queda ninguno, «Has encontrado todos los secretos de Roma.».
- Mira también el resumen del viaje y cambia lo mismo donde se repita.

## 5. La prueba
- No toca el motor: la batería rápida.
- `pruebaLogros1` y las pruebas de pantallas, con lo de arriba:
  - las monedas encendidas según las maravillas que tiene;
  - el texto «Tu segunda maravilla» con dos;
  - el Patrimonio con número;
  - los textos del resumen, en singular y en plural;
  - «Roma aún esconde…».
- Capturas nuevas en `docs/dias/capturas_8b/`:
  - «Y además…» del Coliseo con la medalla nueva;
  - el mismo «Y además…» con una segunda maravilla, en el modo de pruebas;
  - el resumen del día;
  - HOY v2 con las 6 fotos nuevas.
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.

## 6. El informe (docs/dias/INFORME_TANDA8B5.md)
En español sencillo:
- qué has cambiado;
- dónde salía la medalla de antes y si queda alguna;
- las fotos puestas y cómo quedan recortadas;
- las capturas nuevas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
