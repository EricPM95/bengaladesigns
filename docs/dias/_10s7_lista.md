
**10S3 · Respuestas a mis dudas (seguimiento 10S3b)**

- ✅ Hecho — Captura de la hoja del tren Con Design 02c al lado. Es sin pase.  
  *Dónde:* RESERVAS > Llegada y vuelta, viaje en tren.  *Captura:* `10s3b_tren_hoja.jpg`
- ✅ Hecho — HOY: el billete como en DÍAS, «BCN 08:30 → FCO 11:15», sin cortar la hora de llegada Comprobado por render de servidor, sin captura de HOY. La vuelta en HOY conserva su tarjeta.  
  *Dónde:* HOY, con pase, día de llegada.
- ✅ Hecho — Castillo «por dentro»: foto de día apuntada Sin crédito (no hay autor ni licencia).  
  *Dónde:* Parada «Castillo (por dentro)», EXPLORAR y Añadir parada.
- ✅ Hecho — Free Tour: reservarlo o cambiarle la hora nunca rehace ni mueve días, tampoco por reservasParaMotor Causa que faltaba: reservasParaMotor mandaba el Free Tour al motor en cada «rehacer días». Sin tocar servidor ni motor. Caso nuevo en pruebaTanda10S3.  
  *Dónde:* RESERVAS > Entradas y Free Tour > Free Tour a otra hora; mira todos los días.

**1 · El presupuesto**

- ✅ Hecho — El vuelo, tren, autobús y barco suman siempre, con pase y sin él Nada más del presupuesto depende del pase. Prueba antigua puesta al día (pastilla de precio siempre).  
  *Dónde:* Presupuesto, cualquier cuenta: vuelo 150 € + hotel 280 € + Coliseo 50 €.
- ✅ Hecho — Leyenda separada: «Transporte», «Alojamiento», «Ruta» (y «Extras»), cada uno con su color; el bloque de abajo junto Comprobado a 375 px: no se corta (Ruta pasa a una segunda línea). El botón flotante tapa un poco el borde de Extras.  
  *Dónde:* Presupuesto, debajo del total.  *Captura:* `10s4_presupuesto_375.jpg`

**2 · RESERVAS: bloques que se pliegan**

- ✅ Hecho — «Llegada y vuelta» y «Alojamiento» cerrados cuando están «Listo» (icono verde, sin línea bajo el título); se abren y cierran; abiertos mientras falta algo  
  *Dónde:* RESERVAS, con vuelo y alojamiento puestos.  *Captura:* `10s4_reservas_gratis_01_cerrados.jpg`
- ✅ Hecho — El precio dentro («Precio · 110 €» con «Cambiar»); el alojamiento abierto con el estilo del vuelo Con pase, la zona real de la hoja no está cubierta por la prueba (usa una zona inventada).  
  *Dónde:* RESERVAS, bloques abiertos.  *Captura:* `10s4_reservas_gratis_03_aloj_abierto.jpg`
- ✅ Hecho — Línea del pase sin pase: dentro si abierto, fuera bajo la cabecera si cerrado; «Eliminar vuelo» a la derecha (también tren, bus y barco) Tren, bus y barco usan el mismo componente; la prueba solo ejerce el avión.  
  *Dónde:* RESERVAS, cuenta sin pase.  *Captura:* `10s4_reservas_gratis_02_vuelo_abierto.jpg`

**3 · Entradas y Free Tour, solo lo de tu ruta**

- ✅ Hecho — Solo «En tu ruta» y al día: añadir un sitio con entrada (Capitolinos) lo hace aparecer; quitarlo, desaparecer; con la entrada guardada, «Ya no está en tu ruta»; sin «Ver 3 más» Causa: la lista era cerrada, de 8 nombres. Un sitio repetido en otro día se duplica (una entrada por parada).  
  *Dónde:* DÍAS: añade Museos Capitolinos; mira RESERVAS.  *Captura:* `10s4_entradas_1.jpg`

**4 · [Añadir otra reserva] y su buscador**

- ✅ Hecho — Casilla libre con sugerencias con foto; la sugerencia entra en la ruta como primera parada del día elegido, marcada, sin quitar nada; lo escrito, solo en RESERVAS Con pase, igual que sin pase (de momento). Si el día es de excursión o de vuelta, la parada no se añade.  
  *Dónde:* RESERVAS > Añadir otra reserva > «cupula».  *Captura:* `10s4_otra_reserva_3.jpg`
- ✅ Hecho — Línea gris del pase si la hora no cuadra con su franja (sin pase)  
  *Dónde:* Cuenta sin pase, hora de tarde en una parada de mañana.  *Captura:* `10s4_otra_reserva_3b_sin_pase.jpg`
- ✅ Hecho — Buscador sin acentos ni mayúsculas, palabras a medias, letra equivocada, nombre en italiano «cupula», «capito», «cupla», «Cupola», «Musei Capitolini».  
  *Dónde:* Añadir otra reserva.  *Captura:* `10s4_otra_reserva_1.jpg`

**5 · Todos los buscadores, igual**

- ⚠️ A medias — Una sola forma de buscar (src/lib/busqueda.ts) en EXPLORAR y «+» de DÍAS, destino de la primera pantalla, país de Logros y Añadir otra reserva Sin cambiar: «Añadir parada», AttractionsFinder y la ciudad de salida buscan en Mapbox, que ya tolera acentos y erratas; que busquen también en nuestro catálogo es otra tanda. Regla añadida.  
  *Dónde:* EXPLORAR: «Cupola» y «Musei Capitolini».

**6 · «Reorganizar este día» solo con pase**

- ✅ Hecho — Sin pase no sale; con pase, como antes  
  *Dónde:* DÍAS, día con 2 o más paradas, con y sin pase.

**7 · Lo pendiente de otras tandas**

- ✅ Hecho — PiezaSegura en cada día de DÍAS, cada bloque de RESERVAS y cada aviso de la campana Solo se nota si algo falla. Gancho de prueba solo en desarrollo.  
  *Dónde:* No se ve a simple vista.
- ✅ Hecho — Zonas de toque de 44×44 en hojas, modales y menús 7 botones cambiados (Rutas, tiempo entre paradas, «Cambia las fechas», pestañas del explorador, «+ Añadir», «Me gusta» grande, línea del pase). Sin tocar el «Me gusta» pequeño de 30 px (pisaría el botón de debajo): decisión tuya.  
  *Dónde:* Vuelo, menús «…», explorador, aviso del pase.

**8 · La prueba**

- ✅ Hecho — pruebaTanda10S4 (F, G, H, I) y pruebaTanda10S3 con el caso nuevo del Free Tour, más pruebaJutrip Sin migración.  
  *Dónde:* No es de móvil.
