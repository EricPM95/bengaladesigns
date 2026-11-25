# DECISIONES V65

## 1. CONTRATO de `entradasPorPersona` (agente de los apartados 2 y 3; lo usa el agente de la tarjeta y el QR deslizable)

**Pura:** `src/lib/entradasPorPersona.ts` (sin React ni red). **Con React:** `src/hooks/useDocumentosDeLaEntrada.ts`. **Almacén:** `src/store/useDocumentosDeEntrada.ts`.

```ts
// Lo que necesita la tarjeta y el bloque del QR (D7d):
const uso = useDocumentosDeLaEntrada(reserva, 'entrada' | 'excursion' /* por defecto 'entrada' */, compradorId?)
uso.modo          // 'unico' | 'porPersona' | 'comun'
                  //   'unico'     -> la entrada es para una sola persona: lo de siempre (un QR, "TU ENTRADA")
                  //   'porPersona'-> un QR por persona: "TU ENTRADA · 1 DE 2", deslizar -> "ALICIA · 2 DE 2"
                  //   'comun'     -> un solo QR para todos: "ENTRADA PARA 4" (el mismo en todos los móviles)
uso.lista         // DocumentoDePersona[] = [{ personaId, nombre /*de pila*/, esMio, doc: DocumentoGuardado | null }]
                  //   LA MÍA SIEMPRE PRIMERO; el resto en el orden de `paraQuien`. En 'comun' todas llevan el MISMO doc.
                  //   doc === null  => esa persona está en "Falta".
uso.yoId, uso.esParaVarios
uso.puedeSubir(personaId)   // true: lo SUYO siempre; el de otra persona de la misma entrada; o Administrador / "Puede editar"
uso.loComun                 // 'cambiar' (Administrador y "Puede editar": día, hora, precio, para quién es) | 'proponer' ("Solo recomendar")
uso.guardar(personaId | 'comun', { codigo, localizador, personas, nombre })
uso.quitar(personaId | 'comun')

// Funciones puras útiles:
conCodigo(doc)                         // ¿hay un QR que enseñar? (doc.codigo.dibujo || doc.codigo.imagen)
cuantasSubidas(lista) -> {subidas,total}
modoDeQr(reserva, docs), documentosDeLaEntrada(reserva, miId, personas, docs), puedeSubir(...), queHagoConLoComun(permiso)
repartirPorNombre(leidos, personas) -> { porPersona, comun, sinColocar }
```
- Para pintar un QR: `doc.codigo` es un `CodigoDelBillete` (usar `ImagenDelCodigo`, `CodigoPantallaCompleta` de `TarjetaBillete.tsx`, como ahora). `doc.localizador`, `doc.nombre` (el que lleva el documento).
- **Tarjeta guardada:** el botón «+ Sube tu entrada» de una entrada de más de una persona abre la hoja «Las entradas de cada uno» (`HojaEntradasDeCadaUno`, archivo `src/components/route/reservas/HojaEntradasDeCadaUno.tsx`). Para cablearlo hay DOS props opcionales nuevas que ya añadí con Edit pequeño: `BotonAnadirEntrada` → `alPulsar?: () => void` (en vez de abrir el selector) y `TarjetaEntradaDesign` → `onSubirVarias?: () => void` (lo pasa a ese botón). Si reestructuras la tarjeta, MANTENLAS. Con documento, el bloque del QR lo pintas tú con `uso.lista`.
- **Lo que ya funciona sin tocar nada:** `useBilletesDeEntradas().de(refId)` y `useBilletesDeExcursiones().de(refId)` (los que ya usan HOY, la ficha y la tarjeta) devuelven el billete MÍO también cuando otra persona de la entrada lo subió por mí, o si es el QR común; así «Tu entrada» y el QR de HOY salen solos.

## 2. Qué se guarda y quién lo ve (modelo de datos)
- Tabla nueva `documentos_de_entrada` (migración 0095, SIN aplicar; la aplica Eric a mano): una fila por (viaje, tipo entrada|excursión, `refId`, `clave`); `clave` = id de la persona o `comun`. Lleva `para` (los ids de `paraQuien` cuando se subió), `subido_por`, `nombre`, `localizador`, `personas` y el `codigo` (QR redibujado en SVG, sin recorte grande).
- RLS: la leen y la cambian SOLO las personas de `para` y quien la subió. Nadie más del viaje (ni el administrador si no es de la entrada).
- Copia en el móvil (`localStorage`): el QR se ve sin internet en la puerta. Si la 0095 no está aplicada, todo sigue funcionando solo en cada móvil (como la 0070).

## Agente de la tarjeta guardada (apartado 1 y parte visual del 2)
- **Pieza nueva:** `src/components/route/reservas/DatosDeLaEntrada.tsx` (`DatosDeLaEntrada` = «DATOS DE LA ENTRADA/EXCURSIÓN» con `CajaDeDato`/`RejillaDeDatos` de la V64; `BloqueDelCodigo` = el bloque oscuro del vuelo, deslizable; `accesoDeLaEntrada`; `nombresDeLasPersonas`). La entrada (`TarjetaEntradaDesign`) y la excursión (`TarjetaExcursionDesign`) usan las MISMAS piezas.
- **Datos por persona:** las tarjetas llaman a `useDocumentosDeLaEntrada(reserva, tipo, compradorId)` del otro agente (modo `unico` → el billete de siempre; `porPersona` → un código por persona con código, el mío primero; `comun` → uno, «ENTRADA PARA N»). No hay lógica propia.
- **ACCESO:** libre → «Todo el día»; margen (V54) → «Con margen · Hasta N min tarde» (texto mío: Eric solo dio los otros dos; cámbialo si no gusta); estricta → «Hora exacta · Llega 15 min antes». Sin hora y no libre, la caja no sale. En la excursión, igual (el nombre no está en `_puntualidad.json` → estricta).
- **PERSONAS:** solo con 2 o más en el viaje sale «2 · Eric y Alicia» (en su móvil, con nombres). En el móvil de quien no la compró: «Tú y Eric · La compró Eric» (la nota «X la ha reservado para ti» pasó a esa caja, para no repetirla). Sin grupo, el número que dice el documento.
- **Sigue lo que ya funcionaba (V46):** el lápiz de los datos (a la derecha del rótulo), la línea naranja con [Cambiar], la papelera abajo a la derecha, el punto de encuentro de la excursión (ahora en su caja «PUNTO DE ENCUENTRO», solo si hay), «¿Para quién es?» en las hojas.
- **Quitado a propósito (como el dibujo):** la línea de puntos entre el QR y la papelera y el «Toca para ampliar» del QR pequeño (ahora el bloque oscuro con [Ampliar]).
- **Ajustes de tamaño míos:** QR de 84 px y frase de 20 px en el bloque (con 92/21 se partía en dos líneas en el iPhone); el valor de ACCESO a 13,5 px sin partir.
- **Alicia (no la compró) sin documento:** su tarjeta sigue en `soloVer` (sin botón «+ Sube tu entrada»): la subida por persona es del otro agente.

## 3. Decisiones para Eric (apartados 2 y 3: cada uno con su entrada)
1. **Tabla nueva `documentos_de_entrada` (migración 0095, SIN aplicar; `docs/dias/COMPROBAR_0095.sql`).** El documento de una entrada de varias personas tenía que verlo más de una, y `billetes_personales` (0070) es privado de UNA sola persona; por eso hace falta una tabla nueva. Solo la leen y la cambian las personas de la entrada y quien la subió. Cumple la regla de «Empezar de cero»: la 0095 rehace `empezar_de_cero` partiendo de la 0091 (la última; el `diff` solo trae las dos líneas nuevas: por `subido_por` y por `persona_id`), `pruebaTanda10J` (inventario + una fila sembrada) pasada: 264 comprobaciones, 0 fallos. Hasta que la apliques, todo funciona en cada móvil pero el QR de una persona NO llega a las demás.
2. **Un solo QR para todos: cómo se decide.** No hay interruptor: si al pulsar [Subir todas a la vez] sale UN solo código y su nombre no es el de nadie (o no trae nombre), se pone el MISMO para todos (`clave = comun`). Si el único código lleva el nombre de una persona, es el suyo y los demás quedan en «Falta». Con varios códigos sin nombre que case con nadie: «Falta» (no se adivina).
3. **El nombre del titular se lee con la IA en el servidor** (nuevo `tipo: 'entradas_varias'` en `/api/read-ticket`; una llamada por archivo, con pase y límite como las demás lecturas; `max_tokens` 1800). Hasta ahora el prompt de las entradas decía «no devuelvas el nombre de ninguna persona»; aquí SÍ se pide, solo para repartir. El nombre no se guarda en el servidor ni en ningún registro; se queda en el documento de esa persona (visible solo para la gente de la entrada). **El servidor está reiniciado.** Cada archivo gasta una de las 10 lecturas del día.
4. **Cómo casa un nombre con una persona:** sin tildes ni mayúsculas, y vale que la persona del viaje lleve solo el nombre de pila («Eric» casa con «Eric Peña»). Si dos personas del viaje casan con el mismo nombre (dos «Eric»), no se adivina: queda en «Falta».
5. **Quién puede subir el documento de otra persona:** cualquiera que sea también de esa entrada (así [Subir todas a la vez] reparte aunque lo haga Alicia) y quien puede editar el viaje. Quien NO es de la entrada y solo recomienda, no. Lo suyo (su archivo, su nombre, su código), siempre, desde su móvil.
6. **Si «¿Para quién es?» cambia** (AddReservationSheet): los documentos ya subidos de esa entrada actualizan quién los ve (`cambiarPara`). Si se QUITA a alguien, deja de verlo; la fila de la nube la puede actualizar quien la subió o alguien de la entrada.
7. **Clave del documento = `refId` de la reserva** (el nombre de la entrada o el id de la excursión), igual que el billete privado de siempre. Si dos reservas distintas del mismo sitio (una del administrador y otra de un invitado) comparten `refId`, comparten también documentos. Es un caso raro; si pasa de verdad, se pasa a la clave `id` de la reserva.
8. **Excursiones: exactamente igual** (`tipo: 'excursion'`): misma hoja, misma tabla, mismos permisos.
9. **PENDIENTE del otro agente (tarjeta):** la hoja se abre con `onSubirVarias` desde el botón «+ Sube tu entrada» (cuando NO hay QR mío). Cuando YA hay QR mío y falta el de Alicia, la tarjeta debe llevar en esa diapositiva un «Falta · [Subir]» que llame a `onSubirVarias` (la prop ya existe en la tarjeta de la entrada y de la excursión y `EntradasYFreeTour` / `ExcursionesReservas` ya abren la hoja). En el móvil de quien NO compró (`soloVer`), el botón «+ Sube tu entrada» ya sale si la entrada es de varias; el billete que se le enseña debe salir de `useBilletesDeEntradas().de(refId)` (ya trae el que subió otra persona por ella) y no de `mia ? … : null`.
