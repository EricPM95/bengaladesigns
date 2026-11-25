Hola. TANDA V65: LAS ENTRADAS Y LAS EXCURSIONES, CADA UNO CON LA SUYA. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V64 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v65.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita (**«¿Para quién es?»** se queda, V46), y nada se inventa (CLAUDE.md). Si hace falta una tabla nueva con datos de una persona, sigue la regla de «Empezar de cero» de CLAUDE.md (migración, inventario de `pruebaTanda10J` y pasarla). **Todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/` (`TODO_IGUAL`), la tarjeta de la entrada: **D7a, D7b, D7c, D7d** y la hoja **«Las entradas de cada uno»**. Design es un prototipo: se copia SOLO lo que se describe. **Las excursiones van EXACTAMENTE igual que las entradas** (Eric: «al final es lo mismo»): la misma tarjeta, el mismo documento, la misma hoja y los mismos permisos (más su punto de encuentro, solo si es verdad, V49).

## 1. La tarjeta de la entrada y de la excursión (D7a-D7c)
- Arriba, como ahora: la etiqueta («En tu ruta»), el nombre, el día y la hora en su cuadro oscuro, el icono del documento y el lápiz.
- «DATOS DE LA ENTRADA», cajas en filas de dos (sin dato, no sale):
  - **PRECIO**;
  - **LOCALIZADOR**;
  - **PERSONAS** («2 · Eric y Alicia»; en el móvil de Alicia: «2 · Tú y Eric · La compró Eric»);
  - **ACCESO**, de la puntualidad de la V54: «Hora exacta · Llega 15 min antes» o «Todo el día».
- Sin documento: «+ Sube tu entrada» (con la hoja de la V64). Con documento: el bloque oscuro del QR.

## 2. Cada uno con su entrada (idea de Eric)
Hoy la entrada la guarda quien la compra y los demás de «¿Para quién es?» la ven como suya pero **sin el QR** (`entradasDelGrupo.ts`). Ahora:
- **El documento de una entrada lo ven TODAS las personas para las que es** (nadie más del grupo).
- **Muchas entradas traen un QR por persona con su nombre** (varios archivos o un PDF de varias páginas). Al pulsar «+ Sube tu entrada» en una entrada para más de una persona, la hoja **«Las entradas de cada uno»**:
  - arriba, **[Subir todas a la vez]** (dorado; debajo, en gris: «Si tienes un solo archivo con todas, las repartimos por el nombre»): acepta varios archivos o un PDF de varias páginas, lee cada código y su nombre y lo pone en la persona que se llama así. Las que no sabe colocar quedan en «Falta»;
  - **una fila por persona**, con el nombre en grande: «✓ Subida» en verde y [Cambiar], o «Falta» en gris y [Subir] (los dos abren la hoja de la V64 para esa persona).
- **Si es un solo QR para todos,** ese mismo en todos los móviles.
- **El bloque del QR (D7d) se puede deslizar:** primero la tuya, «TU ENTRADA · 1 DE 2»; deslizando, «ALICIA · 2 DE 2» (una línea, que no se parta), con los puntitos ● ○ debajo; [Ampliar] amplía la que se ve. Con un solo QR para todos: «ENTRADA PARA 4». Con una sola entrada: «TU ENTRADA».

## 3. Quién puede cambiar qué
- **Lo SUYO, cada uno desde su móvil y sin pedir permiso:** subir su propio archivo, cambiarlo si está mal, corregir su nombre o su código. Lo mismo con la entrada que alguien compró aparte, por su cuenta.
- **Lo COMÚN** (día, hora, precio, para quién es) sigue los permisos del viaje compartido: Administrador y «Puede editar» lo cambian; «Solo recomendar» lo propone.

## 4. Sin pruebas
- No pases pruebas ni escribas una nueva (salvo `pruebaTanda10J` si creas una tabla). Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone al lado de su dibujo de D7a, D7b, D7c, D7d (en el móvil de Eric y en el de Alicia) y «Las entradas de cada uno»; lo mismo con una excursión; qué no has podido comprobar (por ejemplo, leer un PDF de varias páginas de verdad).

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
