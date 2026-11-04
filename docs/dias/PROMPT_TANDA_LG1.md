Hola. TANDA LG1: LA PESTAÑA «LOGROS» EN LA FICHA DE CADA LUGAR Y EL SELLO «POR CONSEGUIR» (4-nov). Va después de la HOY1 (ya subida). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip de logros de hoy a las 19:04 (`LOGROS.zip` o `LOGROS_1.zip`, en la carpeta del proyecto o en Descargas; si tienes los dos, el más nuevo). Pon al día `docs/diseno/proyecto/` (sin `uploads/` ni `Archivo/`). **El diseño, exactamente igual; los textos y los datos, los nuestros.**
- **Como siempre:** Roma y Lanzarote (Lanzarote sigue oculto). 2 agentes como mucho, 1 Chrome, un servidor. Nota de estado (`_estado_lg1.md`) a la rama `estado`. No apagues el PC.

## 1. La pestaña «Logros» en la ficha del lugar
**Tal cual `App Explorar y fichas.dc.html`, apartado 02** (pulsa la pestaña «Logros» del prototipo para verla).
- **Una cuarta pestaña:** Resumen · Entradas · Tips · **Logros**. Si el sitio no está en ninguna colección, la pestaña no sale.
- **Arriba:** «La Fontana de Trevi suma en 3 colecciones» (el número, el de verdad).
- **Una tarjeta por colección** en la que está el sitio, que se abre y se cierra:
  - la insignia con sus pedazos ganados (en Lanzarote, la pieza de gajos de la LZ3);
  - el nombre y «3 de 8»;
  - la etiqueta «Te faltan 5 sitios»;
  - la lista de los sitios de esa colección, cada uno con su estado:
    - **«Visto»**, en verde con ✓;
    - **«Estás aquí · te falta este»**, en naranja, cuando la ficha es la de este sitio y aún no lo tiene;
    - **«Por ver»**.
- **Al tocar un sitio de la lista**, abre su ficha.
- **Gratis o pase:** con la misma regla que la hoja de logros de hoy (lo que hoy se ve sin pase, igual).

## 2. El sello «Por conseguir» y el botón flotante
**Tal cual `Piezas/Logros Boton.dc.html`**: el botón en sus estados (1a y 1b) y la hoja «Tus logros en …» antes del viaje (2a), durante (3a y 3c) y después (4a).
- **Antes de conseguir nada:**
  - el sello en gris con el dibujo del destino (el Coliseo en Roma, el volcán en Lanzarote), el borde de puntos, «Por conseguir · 0 de 8 imprescindibles» y «Empieza en bronce»;
  - el del Vaticano en Roma: «Empieza en plata»;
  - la línea verde «Con tu ruta puedes completar 7 de las 11 colecciones» (los números, los de verdad de su ruta);
  - las insignias en gris, con «En tu ruta» las que su ruta puede completar.
- **El botón flotante, antes del viaje:** el sello en gris con el aro a rayas, como 1b «Antes del viaje».
- **Compara con lo que hay ahora en la app** (`BotonFlotanteLogros.tsx`, `HojaLogros.tsx`), pon lo que no sea igual como Design y dime qué has cambiado. En Lanzarote, igual, con sus datos.

## 3. Retoques de la HOY1 (Eric, 4-nov)
- **Radios:**
  - «Ya estás aquí» y la foto usan el radio de cada sitio de los datos de logros (La Graciosa y Timanfaya, 2.500 m), no un número fijo;
  - si un sitio no tiene radio, 150 m para «Ya estás aquí» y 800 m para la foto.
- **El atardecer (H13), en Roma y en Lanzarote, con textos cercanos.** Sale desde unas 2 horas antes de la puesta de sol:
  - **Si el día tiene parada de atardecer** (El Golfo, el Faro de Pechiguera, Famara, el Pincio…): «Hoy ves el atardecer en El Golfo: el sol se pone a las 18:04. Llega un cuarto de hora antes, que es cuando más bonito está.» con [Cómo llegar].
  - **Si no tiene:** «Hoy el sol se pone a las 18:04. Si te apetece verlo, estos sitios están cerca:» y 2 o 3 sitios de atardecer de nuestros datos, los más cercanos a donde estás, con su tiempo (a pie o en coche) y [Cómo llegar] en cada uno. En Lanzarote, además: «Aquí el sol cae al mar.»
- **La siguiente parada, en cuanto acabas la anterior** (H1, «Por llegar»): la tarjeta pasa a la siguiente con todo lo que sirve de camino, sin esperar a llegar:
  - el trayecto y [Cómo llegar];
  - «Sal ahora…» si hay turno;
  - [Escuchar historia] para ir escuchándola por el camino;
  - y, si la hay, **[Tu entrada]**, para tenerla a mano en la cola.
  - **Lo del sitio** («Qué vas a ver», «Haz tu foto», «Dónde has aparcado») sale al llegar, en «Ya estás aquí».
  - **Si el GPS no lo detecta,** una línea pequeña [Ya he llegado] para pasar a mano a «Ya estás aquí».
  - **Tocar la tarjeta** abre la ficha entera del sitio.
- **Los umbrales del tiempo** se quedan (lluvia 50 % o 0,5 mm; nubes bajas ≥ 80 %; rachas ≥ 55 km/h).
- **Las 3 o 4 fotos de prueba** que entraron en el Supabase real: bórralas (solo esas) y dime cuáles eran.

## 4. La prueba
- `pruebaJutrip`, las de logros de Roma y `pruebaTandaLZ3` en 0. Las que cambien, con «antes → ahora → decisión de Eric».
- **Prueba nueva `pruebaTandaLG1`:**
  - la pestaña sale solo en sitios con colección;
  - el número de colecciones y «X de Y» son los de verdad;
  - los tres estados de los sitios;
  - el sello gris y el botón antes del viaje;
  - Roma y Lanzarote.
- **En el REPASO, capturas de móvil:** la pestaña Logros de la Fontana de Trevi y la de Jameos del Agua, la hoja antes del viaje en Roma y en Lanzarote, y el botón en sus estados. Y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
