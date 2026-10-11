# Informe de la Tanda 6y4

Hecha en siete partes, cada una con su informe más detallado (`INFORME_PARTE_*_TANDA6Y4.md`). Aquí va el resumen en palabras sencillas. Todo en `main`; el push, al final, solo con todas las pruebas a 0 fallos.

## Punto 0 · Respuestas a la 6y3
- **Foto del Free Tour:** la de la Plaza de España, nuestra y sin crédito (lo dice un solo dato, `photo_from` en los datos de Roma; lo leen la ruta nuestra, la ruta a mano y EXPLORAR).
- **Acortar fechas:** los días con una excursión reservada se quitan igual que los demás; nunca quedan días de más. El «¿Estás seguro?» lo dice, por ejemplo: «Se quitarán el vie 12 y el sáb 13, con sus paradas, tu entrada al Coliseo del vie 12 y tu excursión a Pompeya y Sorrento.» Las reservas de esos días se van con su día (también del presupuesto). Sin [Deshacer] después de acortar.
- **[Deshacer] al quitar cualquier otra reserva** (entrada, Free Tour, seguro, eSIM, tarjeta, coche, vuelo, tren, bus, alojamiento…), con una sola función (`quitarConDeshacer`) y una prueba que busca sitios que quiten una reserva sin ella.
- **Calendario cubierto por el panel:** resuelto con el punto 3.

## 1 · Elegir sin espera
Al tocar «¡Sí, hazla por mí!» o «Quiero hacerla yo» se pasa al instante (medido en el navegador: la barra ya marca 6/7 a los 136 ms). Fuera el temporizador y el aviso «Creando tu itinerario…», que ya no daba tiempo de ver.

## 2 · Tope del pool
5 sitios con 1 o 2 días, 7 con 3 y 8 con 4 o más.
- **8 sitios en 4 días: sale bien.** Medido con el mismo motor que usa el servidor: 1.952 viajes con 16 combinaciones de 8 sitios, y salen 15.614 de los 15.616 sitios elegidos. Los dos que faltan son Museos Vaticanos y Capitolinos el 1 de enero (no hay hueco). Zigzag nuevo: 10 viajes de 1.952, todos con salida el 30-31 de diciembre o el 1 de enero. El resto del año, 0 y 0.
- **Lo que no queda bien:** con 5 sitios en 1 o 2 días, y con 7 en 3, el motor no los encaja todos: quedan en «No incluido» el 48 %, el 23 % y el 8,7 % de los sitios elegidos, y en el 12 % de los viajes de 2 días aparece un zigzag nuevo. Es una pregunta abierta (ver `PREGUNTAS_TANDA6Y4.md`).

## 3 y 4 · Un solo calendario
«Pon tus fechas» desde HOY, RESERVAS, la cabecera, la campana y «Añade un día más» entra por una sola puerta y abre solo el calendario, a pantalla completa y por encima de todo (z-index 130); al cerrar vuelves a donde estabas. Es el mismo componente del formulario (`TrazoCalendar`), con el fondo de la temporada del mes de llegada. Comprobado a 375 px: ocupa 375×812, sin scroll horizontal. Arreglo de paso: desde RESERVAS el «¿Estás seguro?» de acortar no estaba montado.

## 5 · Fontana de Trevi
Fuera de «Entradas», de «x de n listo» y de todo lo que cuente entradas por comprar (la regla: un sitio con `entrada_de_pago` no tiene entrada que reservar). Su ficha muestra «No necesitas entrada · Bajar junto al agua · 2 €», solo con los datos que ya tenemos verificados.

## 6 · La hora de la entrada, una vez
«✓ Tu entrada: 10:30» una sola vez y debajo «Llega unos 30 minutos antes: …» (15 en el Free Tour), sin horas calculadas a la vista. Corregido: HOY de pago la repetía al pulsar [No me da tiempo].

## 7 · Paradas que desaparecen con una reserva
- **Reproducido** con el almacén y el servidor reales: ruta de 3 días sin Free Tour, Coliseo a las 10:00 el día 1 y luego el Altar de la Patria el día 3 → el Altar se quedaba sin día.
- **Causa (una, en dos mitades):** la app sacaba la parada de su día y pedía rehacer solo el día de la reserva; el motor lo devolvía con su lista (donde el Altar va con el Coliseo) y la parada no estaba en ningún sitio. Además cada día se pedía con solo sus reservas.
- **Arreglo, en la regla:** `listasTrip.js`, paso 5.0 — una reserva de un sitio que no es de los grandes va al día de su fecha, en el puesto que le toca por su hora; nada se quita. La petición lleva ahora todas las reservas del viaje.
- **Comprobación nueva** en la prueba de listas: tras cualquier reserva, el viaje lleva exactamente las mismas paradas. Sin el arreglo da 48 fallos en 3 fechas, así que de verdad lo detecta.
- **Las 365 fechas** (desde el 11-oct-2026): 581.677 viajes, 2.220.266 días, **0 fallos**.
- **Hecho a mano a 375 px** (ruta de 3 días, Roma, sin Free Tour): 48 paradas antes de reservar, 48 tras el Coliseo y 48 tras el Altar; el Altar queda en el día 3 a su hora y el Ara Pacis sigue; al quitar las dos reservas, 48 otra vez.
- **No pude reproducir** el «Ara Pacis delante de todo» tal cual (ver preguntas).

## 8 a 14 · Presupuesto y reservas
Moneda sin «tuya» (se dice «€ Euro»), fila «Moneda» al final del presupuesto, fuera «n paradas» de DÍAS (comprobado en pantalla), aviso del alojamiento solo el día 1 y solo mientras falte, precio y código opcionales de vuelo/tren/bus en la tarjeta de llegada y vuelta, «¿Dónde lo has comprado?» en seguro/eSIM/tarjeta («✓ Lo tienes · …»), y la pastilla del precio probada en todos los sitios donde se guarda un precio (espera si una hoja tapa la cartera).

## 15 · Perfil y «la foto vuela al Perfil»
Perfil con el diseño nuevo: bandera como en la tarjeta de RUTA, globo un 30 % más alto, sin «Pronto podrás…», álbum con todas las fotos juntas y sin filtros. Las fotos entran desde la cámara de la ficha, ✓ Visto, «Tus fotos de hoy» y «Guarda tus recuerdos»; en la gratis el álbum no tiene [Añadir fotos]. Efecto nuevo: la foto vuela al botón del Perfil (con «reducir movimiento», solo un rebote; si el botón está tapado, espera). La regla de «¿está tapado?» es la misma que usa la pastilla del precio (una sola, en `precioVuela.ts`).

## 16 · Ficha de lugar
Diseño nuevo con nuestros datos; lo que no tiene datos no sale. Dónde quedó cada cosa de la ficha vieja (foto y crédito, etiquetas, pestañas, resumen, entradas, tips, cámara, «Escuchar la historia», Free Tour, «Quiero entrar», Navidad…) está en `INFORME_PARTE_FICHA_TANDA6Y4.md`. Cambio no pedido: el botón de volver pasa a 44 px blanco sin borde, como el diseño.

## 17 · Iconos de transporte
Avión, tren, autobús y coche, de «Varias Ciudades». Barco, autocaravana y taxi, que el diseño no trae, los dibujé en el mismo estilo.

## 18 · «Trastevere»
Etiqueta lila (matiz 285, un solo lugar para el color en `index.css`) en estos 10 sitios, y en ningún otro: Mirador del Janículo, Isla Tiberina, Iglesia de Santa Maria in Trastevere, Villa Farnesina, Plaza Trilussa, San Pietro in Montorio y Tempietto de Bramante, Fontana dell'Acqua Paola, Basílica de Santa Cecilia in Trastevere, Trastevere y Mirador de San Pietro in Montorio. Sale en DÍAS, HOY, EXPLORAR y la ficha. A 36° del morado y del azul de los días y a 100° del frambuesa; contraste mínimo 7,78.

## Pruebas
- Nuevas: `pruebaFase6y4_listas` (641), `_formulario` (572), `_reservas` (117), `_presupuesto` (109), `_perfil` (157), `_ficha` (122), `_iconos` (3.100), todas a 0 fallos.
- Todas las de siempre (6y, 6y2, 6y3, 6z6x, Corr6z6, Fotos6z3 y las de Tanda 6g a 6z6d): 0 fallos. Tres comprobaciones del código de pruebas anteriores se ajustaron al nuevo diseño de la ficha y a la nueva firma del aviso de acortar; dos errores reales de la ficha se corrigieron en el código (un color a mano y un emoji en un comentario).
- La de listas con las 365 fechas: 0 fallos.
- Tipos (`tsc -p tsconfig.app.json`): sin errores.

## No hecho o no verificado en pantalla
Con el navegador pequeño a veces no pinta o pierde un clic, así que lo visto a 375 px son los pasos principales (formulario, elegir sin espera, tope 0/7, calendario a pantalla completa, DÍAS sin «n paradas», el caso de Eric con el almacén real). No se ha oído la voz de la barra «Escuchar la historia» ni se ha visto cada pantalla nueva del Perfil y de la ficha una a una; si algo se ve mal, dímelo con la pantalla y lo corrijo.
