Hola. TANDA V7: «YO TAMBIÉN ESTABA» (18-nov). Va después de la V6. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `ULTIMOS_RETOQUES.zip` (Descargas; lleva también lo de otras tandas: aquí solo lo de «Yo también estaba»). Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. Las pantallas nuevas son Y0 a Y5. El diseño, exactamente igual; los textos, los de este prompt; si no coinciden, manda el prompt.
- **Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v7.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.

**El problema (Eric y Alicia, Lanzarote):** Eric hizo las fotos y se las pasó a Alicia por WhatsApp. WhatsApp borra los datos de la foto (qué móvil la hizo, la fecha y el lugar), así que no le contaron. Eric no quiere que los pedazos le lleguen ganados a su compañero sin más: cada uno tiene que sentir que lo gana.

## 1. La regla
- **En un viaje compartido,** cuando un compañero gana un sitio (pedazo o emblema oculto) por cualquier vía (foto, Visto, galería), los demás miembros de ESE viaje que aún no lo tienen lo ven **pendiente**.
- **Lo ganan con [Yo también estaba],** y entonces viven su propio momento por la fila de la V6, como si hubieran hecho la foto. La frase de suspense del emblema sale la primera vez, igual.
- **CUÁNDO sale (Eric):**
  - **Solo cuando el viaje ya ha terminado.** Durante el viaje, NADA: ni aviso, ni punto, ni tarjeta. En el viaje, cada uno gana lo suyo con su cámara. Lo que el compañero gane durante el viaje queda guardado y aparece como pendiente al día siguiente de acabar.
  - **Solo si yo NO tengo ya ese sitio.** Si mi compañero gana Jameos y yo ya lo tengo, no sale nada, ni aviso ni tarjeta.
- **Las condiciones:**
  - solo los miembros del viaje compartido en las fechas del viaje (no los que se unieron después ni los que se fueron);
  - solo los sitios ganados dentro de las fechas del viaje y del plazo de 30 días;
  - una vez por sitio y persona;
  - y, como todos los logros, con pase (el Pase Dúo cubre a los dos). Sin pase, la tarjeta sale con el candado pequeño y lleva al pase.
- **Lo que se gana así,** con su origen («compañero»), para poder distinguirlo. Dime si hace falta una migración. Si se crea una tabla con datos de una persona, las TRES cosas de `CLAUDE.md`: `empezar_de_cero` desde su última versión con `diff`, su COMPROBAR y `pruebaTanda10J`. El SQL, listo para pegar.

## 2. Dónde sale (Y0 a Y5)
- **Y0:** en la hoja «Tus logros en …», arriba (debajo del plazo de «Reclamar con tus fotos»), una tarjeta pequeña, solo si hay algo pendiente: las miniaturas y «Eric consiguió 4 sitios donde estabais juntos ›». Sin nada pendiente, no sale (Y0b).
- **Y1:** si es un solo sitio, la hoja desde abajo:
  - la foto grande con «Foto de Eric»;
  - «Eric lo consiguió en Jameos del Agua. ¿Estabais juntos?»;
  - [Yo también estaba];
  - **y debajo, [Subir mi foto]** (sencillo). Abre la galería para ese sitio, como «Reclamar con tus fotos». Si la foto vale, gana el sitio con SU foto, que va a sus recuerdos. Si no vale, el motivo y puede seguir con [Yo también estaba].
- **Las fotos del compañero NUNCA van a mis recuerdos.** Con [Yo también estaba] se gana el sitio, pero mi álbum de ese día no se llena con fotos de otro.
- **Y2:** si son varios, la hoja «Lo que conseguisteis juntos», con [Yo también estaba en todos] y un [Yo también estaba] en cada sitio. Al tocar un sitio de la lista, se abre su Y1 (con [Subir mi foto]).
  - **Debajo de la lista, [Subir mis fotos]** (sencillo): abre «Reclamar con tus fotos» con varias a la vez. Cada foto que vale gana su sitio con SU foto (por ubicación o eligiendo el sitio). Los que no se cubran siguen pendientes en la lista, con su [Yo también estaba].
- **Los momentos (Y3a y Y3b),** por la fila de la V6: los pedazos juntos y luego cada emblema solo. Sin la línea «Con Eric».
- **Y5, el aviso:**
  - en la campana, «Eric ha conseguido Jameos del Agua. ¿Estabais juntos?» y debajo «Ahora», que abre Y1;
  - y un punto en el botón flotante de los logros.
- **El nombre que sale,** el del perfil del compañero.

## 3. Las fotos que no cuentan por falta de datos (Y4)
- **En cada foto:** «Esta foto no está hecha con tu móvil» (en vez de «Esta foto no está hecha con una cámara»).
- **Encima de la lista, la tarjeta de ayuda:**
  - «¿Por qué no cuentan?»
  - «Las fotos enviadas por WhatsApp y las capturas de pantalla pierden los datos que dicen dónde y cuándo se hicieron.»
  - «**¿Las hizo tu compañero de viaje?** Cuando él las suba desde su móvil, podrás ganar el mismo pedazo con **Yo también estaba**.»
  - «**También puede pasártelas** por AirDrop o por WhatsApp como documento: así no pierden nada.»
- Las fotos que no cuentan por otro motivo (otra fecha, otro sitio) siguen con su motivo.

## 4. La prueba
- `pruebaJutrip`, `pruebaV5`, `pruebaV6` y las de logros de Roma y de Lanzarote en 0. `pruebaTanda10J` en 0 si hay tabla nueva. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV7`,** con un viaje compartido de 2:
  - A gana 3 pedazos y un emblema, y B los ve pendientes;
  - [Yo también estaba] en uno da su momento;
  - [en todos] da el resto por la fila;
  - no se puede ganar dos veces;
  - alguien que se une al viaje después no los ve;
  - durante el viaje no sale nada, y sale al día siguiente de acabar;
  - si B ya tiene el sitio, no sale nada;
  - [Subir mi foto] gana con su foto y la pone en sus recuerdos; [Yo también estaba] no pone la foto de A en los recuerdos de B;
  - sin pase, el candado;
  - la notificación y el punto;
  - el texto de las fotos sin datos con su tarjeta.
- **En el REPASO:** capturas de móvil al lado de Design (Y0 a Y5) y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
