Hola. TANDA V64: RESERVAS › SUBIR O ESCRIBIR LOS DATOS, Y LAS TARJETAS DEL VUELO, EL TREN Y EL ALOJAMIENTO. Tanda corta, MODO RÁPIDO. Empieza SOLO cuando la V63 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** nota `_estado_v64.md` en la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. **Solo se cambia lo que se dice aquí;** nada que funcione se quita (**«¿Para quién es?» y la zona del alojamiento se quedan**, V46), y nada se inventa (CLAUDE.md). **Todo vale para todos los destinos.**

**Dibujos:** `docs/diseno/proyecto/` (`TODO_IGUAL`), las páginas de RESERVAS: **D1-D6** («Añadir un documento: subir o escribir», «Datos del vuelo», «Revisa los datos», la línea naranja, la tarjeta del alojamiento y «Tu alojamiento está en Monti») y **B1-B3** (las tarjetas guardadas del vuelo y del tren). Design es un prototipo: se copia SOLO lo que se describe.

## 1. Una sola forma de añadir un documento, en TODAS las tarjetas (D1-D4)
- Al pulsar «+ Añade tu tarjeta de embarque / tu billete / tu reserva» o «+ Sube tu entrada», **en vez de abrir directamente el menú del iPhone**, una hoja pequeña: **[Subir foto o archivo]** (dorado; debajo, en gris: «PDF, foto o captura de pantalla (también de Wallet o de la app de la aerolínea)», según el tipo) y **[Escribir los datos]** (blanco con borde; debajo: «Sin el código: en el aeropuerto, usa la app de la aerolínea» / «en la estación…» / «en la entrada, enseña el email de la reserva»).
- **Fuera los enlaces «o escribe los datos a mano»** de todas las tarjetas.
- **Después de subir, siempre «Revisa los datos»** («Hemos leído tu billete. Revisa los datos y cámbialos si hace falta», los campos ya rellenos y [Guardar]), en todos los tipos, como ya hace el vuelo.
- **«Datos del vuelo» (y del tren): campo nuevo «Compañía»**, arriba del todo; en avión se rellena sola por el código del vuelo (VY → Vueling) y se puede cambiar.
- Falta el espacio en «+Añade…» del dibujo: «+ Añade…».

## 2. La línea naranja del documento (D5)
«⚠ Esta tarjeta de embarque es del viernes 13 y tu vuelo es el martes 24. **Si no es la buena, súbela otra vez o cambia los datos a mano.**» Debajo, dos botones pequeños: [Es correcta] y **[Cambiar]** (abre la hoja del punto 1). En todas las líneas naranjas (`avisoDeDocumento.ts`).

## 3. La tarjeta guardada del vuelo y del tren (B1-B3)
- «DATOS DEL VUELO», **seis cajas en tres filas de dos**: **COMPAÑÍA** (con un maletín) / VUELO, **TERMINAL** / ASIENTO, DURACIÓN / LOCALIZADOR. En tren: COMPAÑÍA / TREN, ESTACIÓN / ASIENTO, DURACIÓN / LOCALIZADOR. **Sin dato, la caja no sale y las demás se recolocan sin huecos** (B2). La duración, de las horas reales.
- El bloque oscuro del documento: «TARJETA DE EMBARQUE · Enséñala en la puerta · [Ampliar]»; tren «TU BILLETE · Enséñalo al revisor»; ferry «Enséñalo al embarcar»; autobús «Enséñalo al conductor».

## 4. «Llegada y vuelta»
- **Orden:** los vuelos, después el precio y **[Buscar vuelos] abajo del todo**.
- El precio (de la ida y la vuelta juntas), con el formato de la caja PRECIO de las tarjetas (icono €, «PRECIO» pequeño y el importe), a lo ancho y **con su lápiz** a la derecha.
- En la VUELTA sin poner, solo «+ Falta añadir la vuelta» (fuera el «Añadir» de la derecha, que hace lo mismo).

## 5. La tarjeta del alojamiento (D5a)
- Las fechas y **las noches, calculadas SIEMPRE de las fechas** (del 24 al 27 son 3; hoy salía 2). **Fuera la casilla «Noches»** de la hoja de datos (`ReservaDelAlojamiento.tsx`: se escribía aparte y por eso no cuadraba).
- «DATOS DEL ALOJAMIENTO», cajas en filas de dos: **PRECIO / ZONA, ENTRADA** («Desde las 15:00») **/ SALIDA** («Hasta las 11:00»), **TELÉFONO** (se toca para llamar) **/ LOCALIZADOR**. Sin dato, no sale.
- El mapa a lo ancho con la dirección y [Cambiar]; **[Cómo llegar a tu alojamiento] en dorado** (no azul oscuro: es de HOY); [+ Añade tu reserva] en blanco con borde.

## 6. El alojamiento en otra zona (D6)
Al guardar la dirección (escrita, del mapa o leída del documento), mira en qué zona del destino cae. Si no es la elegida: hoja «Tu alojamiento está en Monti» · «Elegiste Plaza de España, pero tu alojamiento está en Monti. ¿Cambiamos tu zona? Tus primeros y últimos días se adaptan a donde duermes.» · [Cambiar a Monti] (dorado) y [Dejarlo como está] (blanco con borde), lado a lado. Al cambiar, Reorganizar (V61) con [Deshacer]. Si no cae en ninguna zona, no pregunta.

## 7. La papelera
En todas las tarjetas de RESERVAS, abajo a la derecha como ahora, **un poco más arriba**: la tarjeta pierde 15-20 px de alto por abajo.

## 8. Sin pruebas
- No pases pruebas ni escribas una nueva. Antes de subir: `npm run build` sin errores.
- El REPASO, corto: captura en modo iPhone al lado de su dibujo de D1 (vuelo, tren y entrada), D2, D3, D5, B1, B2, B3, «Llegada y vuelta», D5a (con las 3 noches) y D6; qué no has podido comprobar (por ejemplo, leer un documento de verdad).

Cuando acabe, con la app compilando, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
