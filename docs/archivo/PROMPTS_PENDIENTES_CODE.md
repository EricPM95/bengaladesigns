# Para Code: pendientes (29 de septiembre, tarde)

Tres cosas, en este orden. Commit por parte y sin push. Todo con reglas generales, a INVARIANTES.

## 1. Añadido a la Parte 2 del PROMPT_UI: el desayuno

Añadido a la Parte 2, punto 4 (el desayuno). Esto sustituye lo que dice ese punto sobre el formato.

**Cuándo sale** (regla del motor, a INVARIANTES):
- Solo en ritmo completo. En tranquilo nunca: el día empieza a las 10:00.
- Solo después de una visita al amanecer (Trevi a las 8:30) o para llenar el rato hasta una actividad con hora fija, como el Free Tour de las 10:00.
- Nunca como bloque fijo de todas las mañanas.
- Si un día escrito lleva desayuno en tranquilo, quítalo y comprueba que no queda hueco.

**Cómo se ve:**
- Se queda la tarjeta que tiene ahora («Desayuno romano», con la franja de color y la diagonal), sin número de orden.
- Solo cambia la foto: ahora la diagonal sale en rojo, vacía. Pon **la misma foto para todos los destinos: un café**.
  - Una sola foto fija, guardada en la app, no una búsqueda en Unsplash por destino.

---

## 2. PROMPT UI — Parte 3: llegada y vuelta

Sigue a las Partes 1 y 2 del PROMPT_UI. Commit por parte y sin push. Todo con reglas generales, a INVARIANTES, que valga para todos los destinos y para avión, tren, bus, ferry o coche.

Prototipo de referencia: el lienzo «Llegada y vuelta». Donde el prototipo y este texto no coincidan, manda este texto.

### 1. Dónde van: siempre
- **La llegada**, en el primer día, justo después del bloque de alojamiento y antes del primer tramo.
- **La vuelta**, en el último día, al final del todo, después de la última parada o de la comida. Debajo, «Fin del viaje. Arrivederci, Roma.» (con el adiós en el idioma del destino).
- **Van unidas a la posición, no al día.** Si el viajero elimina o mueve el primer o el último día:
  - el que queda primero hereda la llegada (y el bloque de alojamiento);
  - el que queda último hereda la vuelta.
- Si el día que hereda la llegada tiene paradas antes de la hora a la que llegas al centro, esas paradas llevan la marca roja «Llegas después». Debajo, un enlace, «Ajustar este día a tu llegada», que lo recoloca solo si el viajero lo toca.
- Lo mismo con la vuelta: las paradas que acaban después de la hora de salida, con «Ya te has ido», y el enlace «Ajustar este día a tu vuelta».
- «Volver a mi ruta original» (la varita) lo deja todo como estaba, bloques incluidos.

### 2. Cerrado: una barra fina tipo billete, igual en la ida y en la vuelta
- Una sola línea, de 52 px de alto, con las esquinas redondas del todo. Distinta de las paradas:
  - a la izquierda, un bloque azul petróleo (#1F5F78) con el icono del medio en blanco (avión, tren, bus o coche) y una diagonal clara;
  - en el centro, los datos en mono, en mayúsculas;
  - a la derecha, la hora clave en terracota;
  - al final, una línea discontinua con dos muescas, como el troquel de un billete, y la flecha «›».
- Sin número de orden y sin hora en la columna de las paradas.

**Con el vuelo o el tren en Reservas:**
- Llegada: «LLEGADA · VUELO 11:30 · FIUMICINO» y, a la derecha, «EN EL CENTRO 12:30».
- Vuelta: «VUELTA · VUELO 19:30 · FIUMICINO» y, a la derecha, «SAL A LAS 16:30».
- En tren: «LLEGADA · TREN 10:45 · TERMINI» y «EN EL CENTRO 11:00».

**Sin nada en Reservas.** Usamos lo que ya sabemos del formulario (medio y ciudad de origen):
- Llegada: «LLEGADA · AVIÓN DESDE BARCELONA».
- Vuelta: «VUELTA · AVIÓN A BARCELONA».
- A la derecha, en las dos, «+ AÑADIR VUELO» en azul, que lleva a Reservas.
- Sin vuelo, la ventana muestra todos los puntos de llegada del destino (en Roma, Fiumicino y Ciampino), cada uno con sus opciones.
- En móvil, si no cabe, la línea de datos se corta con «…» y la hora clave se queda siempre entera.

### 3. Abierto: una ventana aparte, como la de los lugares y los restaurantes
- Tocar la tarjeta abre una ventana, no un acordeón.
- Arriba, una foto (las llegadas del aeropuerto o la estación), la X de cerrar, «LLEGADA · MAR 29 SEP», el título y el vuelo con «Editar».
- **Tres pestañas: Resumen, Traslados y Tips.**
- **Aquí sí van precios**, en Resumen y en Tips. Es la excepción a la regla, igual que las Entradas.
- Todos los precios, comprobados en la web oficial. Si no hay web oficial, no se pone precio.

#### Resumen (todo el valor)
**Llegada:**
- **Del aeropuerto al centro:** todas las opciones, la más cómoda primero y marcada «EL MÁS CÓMODO». Cada una con su tiempo, cada cuánto pasa y su precio a la derecha. Roma desde Fiumicino, comprobado en las webs oficiales el 29 de septiembre:
  - Leonardo Express a Termini: 32 min, sin paradas, cada 15 min (a algunas horas, cada 30), 14 €. Primer tren a las 5:38 y último a las 0:23 (trenitalia.com).
  - Taxi oficial: 55 € de tarifa fija al centro, dentro de las murallas (adr.it).
  - Tren regional FL1 (Trastevere, Ostiense, Tiburtina), mejor si duermes en Trastevere o en Testaccio: comprueba el precio.
  - Autobús a Termini, 50-70 min: comprueba las compañías y el precio.
  - Al final, «Traslado privado a tu alojamiento», que lleva a la pestaña Traslados.
- **De la estación a tu alojamiento:** metro y bus desde Termini, con el precio del billete (comprobado en atac.roma.it) y si se puede pagar con tarjeta en el torno.
- **Si aún no puedes entrar al alojamiento:** la consigna más cercana, con su precio.
- **Tu primera parada:** la primera parada del día, con su número y cómo llegar desde el punto de llegada.
- **Los textos de la llegada a Roma que ya tienes me gustan: mantenlos.** Cambia solo el diseño y añade lo que falte.

**Vuelta (nuevo):**
- **Tu última tarde, sin prisas:** una barra con los tres momentos (libre hasta las 16:00 · la maleta a las 16:00 · al tren a las 16:30) y una frase que lo explique.
- **Hasta el aeropuerto o la estación:** las mismas opciones, al revés, con sus precios y el último tren del día.
- **La maleta:** dónde dejarla el último día para no arrastrarla.
- **Tu última hora en el destino:** algo que merezca la pena a pocos minutos del punto de salida. En Roma, Santa María la Mayor, a 5 min de Termini, y el Mercato Centrale, dentro de la estación, para comer algo antes del tren.

#### Traslados
- **La pestaña que ya tienes, tal cual:** el traslado privado entre el aeropuerto o la estación y el alojamiento. En la llegada, al alojamiento; en la vuelta, del alojamiento al aeropuerto.

#### Tips
- De 3 a 5 consejos que solo sabe alguien que vive allí, con título corto en negrita y dos líneas. Ejemplos de Roma, en el prototipo:
  - **Llegada:**
    - no aceptar a nadie que te ofrezca coche dentro de la terminal;
    - el billete de grupo del Leonardo: 4 por 40 € en lugar de 56 €, y un niño de 4 a 12 años gratis con cada adulto;
    - validar el billete de papel;
    - la cartera, delante en Termini;
    - los «nasoni», el agua gratis.
  - **Vuelta:**
    - el Leonardo sale del fondo de Termini (10 min andando con maleta);
    - comprar el billete antes;
    - a Barcelona, sin control de pasaportes (Schengen);
    - la tarifa fija del taxi vale solo desde dentro de las murallas.
- Comprueba cada dato antes de ponerlo.

### 3 bis. Todo cambia según el medio que eligió en el formulario
Lo de arriba es el caso del avión. Con cualquier otro medio cambian **el icono, los textos de la barra, la hora clave y todo lo de dentro de la ventana** (las tres pestañas). Nada del avión puede salir en un viaje en tren, ferry o coche.

| Medio | Icono | Barra sin reservas | Barra con reservas (hora clave) | Desde dónde se explica todo |
|---|---|---|---|---|
| Avión | avión | LLEGADA · AVIÓN DESDE BARCELONA | EN EL CENTRO 12:30 · SAL A LAS 16:30 | los aeropuertos (Fiumicino, Ciampino) |
| Tren | tren | LLEGADA · TREN DESDE… | EN EL CENTRO 11:00 · SAL A LAS 17:15 | la estación (Termini, Tiburtina) |
| Autobús | autobús | LLEGADA · AUTOBÚS DESDE… | EN EL CENTRO · SAL A LAS | la estación de buses (Tiburtina en Roma) |
| Ferry | barco | LLEGADA · FERRY DESDE BARCELONA | EN EL CENTRO 10:30 · SAL A LAS … | el puerto (Civitavecchia en Roma) |
| Crucero | barco | LLEGADA · CRUCERO · CIVITAVECCHIA | EN EL CENTRO 10:00 · A BORDO A LAS 18:00 | el puerto, pensado para un día en Roma |
| Coche (propio o de alquiler) | coche | LLEGADA · EN COCHE DESDE… | AL VOLANTE, SIN HORA FIJA · OJO CON LA ZTL | la entrada a la ciudad y dónde aparcar |

**Qué cambia dentro, en cada medio:**
- **Tren:** en qué estación bajar (Termini o Tiburtina) según el alojamiento, cómo salir de la estación, metro y bus al alojamiento, la consigna y la primera parada.
- **Autobús:** la estación de buses, cómo llegar al centro desde ella (metro B en Tiburtina), la consigna y la primera parada.
- **Ferry:** del puerto al centro.
  - Primero, del puerto a la estación de Civitavecchia: el lanzadera del puerto o andando.
  - Después, el tren regional a Roma (San Pietro, Ostiense, Termini), unos 60-80 min.
  - Luego, el taxi o el traslado privado.
  - Los precios, comprobados en las webs oficiales.
- **Crucero:** lo mismo que el ferry, pero el viajero tiene **un solo día** y una hora para volver a bordo.
  - La hora clave de la vuelta es «A BORDO A LAS 18:00». La hora de salir de Roma se calcula desde ahí, con el tiempo del tren y un margen.
  - Si el día escrito no cabe, se marca «Ya te has ido», como en la vuelta.
- **Coche:** la ZTL y las multas por cámara, dónde aparcar (aparcamientos fuera de la ZTL y los de intercambio con el metro), si el alojamiento tiene garaje, y el coche de alquiler (recogerlo y devolverlo en el aeropuerto o en Termini).
  - Sin hora de llegada fija: la hora clave se cambia por el aviso de la ZTL.
- **Traslados, con la venta, en todos los medios menos en coche:** el traslado privado desde ese punto (aeropuerto, estación o puerto) hasta el alojamiento, y de vuelta.
  - En ferry y crucero, del puerto de Civitavecchia a Roma y de vuelta al puerto.
  - En crucero, sin alojamiento: puerto → centro de Roma → puerto, a la hora de volver a bordo.
  - En coche, esta pestaña no sale.
- **Ferry y crucero son la misma opción del formulario.** Si el viaje es de un solo día, se trata como crucero (hora de volver a bordo); si no, como ferry.
- **Tips:** de 3 a 5 por medio, de local. Por ejemplo:
  - Tren: la salida de Termini hacia el metro.
  - Ferry y crucero: el tren desde Civitavecchia va lleno los días de muchos cruceros; mejor el de antes.
  - Coche: la ZTL también vigila por la noche en algunas zonas, como Trastevere.
  - Comprueba cada dato.
- **Horas:**
  - Tren y bus: salida − 45 min.
  - Ferry: salida − la hora de embarque de la naviera (2 h si no se sabe) − el trayecto hasta el puerto.
  - Crucero: hora de a bordo − el trayecto − 30 min de margen.
  - Todo, de 5 en 5 hacia abajo.
- **Ida y vuelta pueden ser distintas.** Por ejemplo, llegar en avión y volver en tren. Cada barra usa su propio medio.
- Los textos y opciones de cada medio, en el mismo archivo por destino (`_llegada.json`), una sección por medio y por punto de llegada. Si al destino no se llega de alguna manera (Roma no tiene ferry dentro de la ciudad), esa opción no sale.

### 4. Horas
- Llegada: hora en el centro = llegada + traslado (lo que ya tenemos en INVARIANTES), redondeada de 5 en 5.
- Vuelta: hora de salida = salida del vuelo − 3 h (avión) o − 45 min (tren y bus), redondeada de 5 en 5 hacia abajo.

### 5. Datos
- Los textos, las opciones y los precios de cada punto de llegada y de salida, en un archivo por destino, como el resto de días escritos (`data/dias/roma/_llegada.json`).
- Cada precio y cada horario, con su fuente y la fecha en que lo comprobaste.
- Haz también una página de revisión, `docs/LLEGADAS_ROMA.html`, generada desde el JSON, para que la revise yo sin abrir el JSON. Una sección por medio y por punto de llegada, con:
  - la barra;
  - las tres pestañas;
  - los precios, con su fuente.

### Al terminar
- Commit por parte y sin push.
- Añade al informe `docs/INFORME_UI.md` capturas de:
  - la llegada y la vuelta cerradas, con vuelo y sin vuelo;
  - la ventana abierta, en sus tres pestañas;
  - un viaje en el que hayas eliminado el primer día.

---

## 3. Retoques de las Partes 1 y 2 (he revisado tu informe y tus capturas)

Muy buen trabajo. Esto es lo que he visto:

1. **La excursión nunca en el día de llegada ni en el de vuelta.** En «¿Qué día la haces?» se propone el día de la oferta aunque sea el de la vuelta. Una excursión de día completo el día que vuelves a casa no se puede hacer.
   - Regla: los días de llegada y de vuelta no salen en la lista.
   - Si el día de la oferta (D5C) es uno de ellos, se propone el día completo más cercano.
   - Lo mismo con el aviso «¿Prefieres una excursión este día?»: nunca en esos dos días.
2. **Comida y cena en el móvil.**
   - «COMIDA · 14:00 – 15:15» tiene que caber en una línea.
   - El nombre del restaurante, como mucho en dos líneas (en móvil, a 18 px; ver el punto 9): «Borghiciana Pastificio Artigianale» ahora ocupa tres.
   - El botón «Cambiar», más pequeño en móvil, para que la línea de los minutos no se corte («9 min andando desde B…»).
3. **«De camino» en el móvil.** «DE CAMINO · SIN DESVÍO» en una línea y el nombre entero (en dos líneas si hace falta). Ahora sale «Via della Conciliazi…».
4. **Los botones flotantes del mapa y del presupuesto tapan los «···» del último día** en el móvil.
   - Deja sitio abajo en la lista para que nunca tapen nada.
   - Cambia los iconos de emoji (el mapa y la bolsa de dinero) por iconos de línea del estilo de la app.
5. **El mapa, en español:** sale «Rome» y «Colosseum». Pon el idioma del mapa en español (Roma, Coliseo), y en todos los destinos, el idioma de la app.
6. **En local, v4.** Pon `ROUTE_ENGINE=v4` en mi `.env.local` (en Vercel ya está en v4) y rehaz las capturas con v4.
7. **Las líneas del mapa con todos los días**, que se ven poco: hazlas algo más gruesas y con borde blanco, como los pines.
8. **La tarjeta «Roma · fechas» del mapa, en móvil, más pequeña y más estrecha.** Ahora tapa buena parte del mapa.
   - Nombre y fechas en una sola línea («Roma · 9 – 12 jun»), con el nombre a unos 20 px.
   - Poco relleno, para que no pase de unos 36-40 px de alto.
   - En escritorio se queda como está.
9. **En móvil, todo más compacto: letra más pequeña y acordeones más estrechos.** Cuanto más estrechos, mejor.
   - En móvil (menos de 480 px de ancho), una escala más pequeña para toda la app:
     - títulos de parada, 17 px;
     - restaurante de comida y cena, 18 px;
     - hora y etiquetas en mono, 11 px;
     - textos de apoyo (minutos, horario, «Acceso libre»), 12 px.
   - Menos relleno dentro de las tarjetas y menos alto:
     - una parada normal, unos 88 px;
     - comida y cena, unos 72 px;
     - «De camino», unos 52 px;
     - la barra de llegada y vuelta, 48 px.
   - La franja de foto e icono de las paradas, algo más estrecha en proporción.
   - Los títulos largos, como mucho en dos líneas, nunca en tres.
   - Nada se corta con «…» si cabe en dos líneas.
   - En escritorio se queda como está.
   - Haz las capturas nuevas a 375 px de ancho, para ver que todo entra.
10. **Día abierto, sin la línea de color.** Cuando el acordeón está abierto, quita la línea de color que baja por el borde izquierdo de todo el día (la verde, la lila…).
    - Dentro del día abierto, el color del día se queda solo en los numeritos del orden de visita (y en sus pines del mapa).
    - Cerrado, el acordeón se queda con su franja de color, pero **el número del día va en el mismo color neutro en todos los días** (el oscuro del texto), no en el color del día. Con la franja ya se ve claro qué color es cada día.
11. **Para que revise las rutas de v4 como un local.** Cuando acabes, genera con v4, ya con las horas de 5 en 5, los 35 viajes de mi revisión:
    - los 5 de fechas normales;
    - los 30 de `revisionCierre`.
    Déjalos en `docs/revision/REVISION_V4_FINAL.md`, día a día, con horas, paradas, comidas y avisos.

Commit por parte y sin push. Añade las capturas nuevas al informe.
