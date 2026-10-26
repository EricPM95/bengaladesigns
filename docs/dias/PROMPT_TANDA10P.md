Hola. TANDA 10P: EL PASE, LA MONEDA, EL SORTEO Y EL PERFIL. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10P.md e inclúyelo en tu commit.
- Sale del repaso de la app que ha hecho Eric el 25-oct en su iPhone, y de tu repaso de la lista del pase contra el código (10M).
- No hace falta la muestra de 60 fechas, salvo que toques el motor de rutas (entonces, dímelo antes).
- **Design, nuevo:** Eric ha dejado en la carpeta del proyecto el zip «NUEVA_TANDA_1.zip». Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/`) e inclúyelo en tu commit. Lo que cambia:
  - `Piezas/Pase Moneda` (nueva) y `Piezas/Pase Pelicula`: el precio en la moneda del viajero y el botón [Ver]. **Para esta tanda** (apartado 1.7).
  - `Piezas/Sorteo Perfil` (nueva; también en `Logros Pantallas`, al final: «El sorteo anual en el Perfil»): el sorteo. **Para esta tanda** (apartado 1.6).
  - `Logros Pantallas`, apartado 04 (P1 y P2): el perfil y el pasaporte. **Para esta tanda** (apartado 1.8).
  - `Piezas/Reservas v4` («¿Para quién es?») y `Piezas/Presupuesto` (la cartera de Extras): **no los toques ahora**, van en la tanda de compartir (10N).

## 1. El pase
### 1.1 La historia de prueba: la que el viajero elija
- Hoy (`Escuchar.tsx`), en la versión gratis solo suena la historia del Coliseo (la muestra fija); las demás salen con el candado.
- **Lo nuevo:** la historia de prueba es **la del sitio que el viajero elija**. Si abre la Galería Borghese y toca [Escuchar historia], suena la de la Galería Borghese.
- **Antes de usarla,** en todos los sitios con historia, el botón sale abierto: «Escuchar historia · **Gratis**, tu historia de prueba · **0/1**» («Gratis», en oro).
- **Se gasta a los 3 segundos de escucharla,** y **esa historia se queda suya**: la puede escuchar las veces que quiera, durante todo el viaje.
- **Las demás, después:** el mismo botón con el candado dorado a la derecha (como ahora), con el texto «Todas las historias, con el Pase de Roma».
- **Una por destino** (una en Roma, otra en París…), guardada en la cuenta, no solo en el móvil. El día de prueba de HOY no la gasta.

### 1.2 La película del pase, en el móvil
- **Que ocupe toda la pantalla.** En el iPhone deja mucho margen negro a los lados: la plantilla va a un ancho fijo de 390 px (`Pase_Pelicula.ts`). Que se adapte al ancho del móvil, sin deformarse.
- **En el final no se puede bajar en el iPhone.** Que la lista haga scroll, con la parte fija de abajo («Se paga una vez y no caduca», [Elegir mi pase]…) siempre a la vista.
- **Un botón [Ver] arriba, junto a [Saltar]** (o junto al ✕ en el final), para volver a verla desde el principio.
- **Cuando ya se ha visto, el final sale ya montado.** Hoy, al tocar [Elegir mi pase] o cualquier botón del pase, vuelve a hacer la animación de entrada del final (unos 5 s). Que salga directamente como queda al acabar: «Pase de Roma», la lista entera ya colocada y [Elegir mi pase].

### 1.3 La puesta de sol y lo de mañana, en HOY
- La lista del pase promete «La puesta de sol y lo de mañana · A qué hora cae el sol y qué te espera mañana», y HOY no tiene ninguna de las dos.
- **El atardecer:** cuando la siguiente parada es un mirador del atardecer (`isSunset`), HOY lo dice con la hora real: «Al Janículo para el atardecer: el sol se pone a las 17:02» (con el icono del sol). Si ese día no hay mirador en la ruta y hay uno cerca a media tarde: «Hoy el sol se pone a las 17:02 · el Janículo está a 15 min».
- **Lo de mañana:** al acabar el día (después de la última parada, o a partir de la hora de la cena), una tarjeta pequeña: «Mañana: Vaticano y Trastevere · empiezas a las 9:00», con la primera parada y, si hay, la reserva con hora del día siguiente («Tienes entrada a los Museos Vaticanos a las 10:00»). El último día del viaje, nada.
- Con el pase (y el día de prueba). Sin pase, como ahora.

### 1.4 La lista del pase: solo lo que existe
- **Fuera de la lista** (el final de la película, «Todo lo que incluye» y «Con el pase tendrás» de HOY, que salen de la misma lista) **mientras no existan:** «Modo "a mi aire"» y «El reto del día».
- Se quedan, porque se harán antes del lanzamiento: «¿Qué hago ahora?», «Estoy aquí», «Funciona sin internet» (y ahora «La puesta de sol y lo de mañana», apartado 1.3). Apunta en el informe cuáles faltan todavía.
- **«Invita a un amigo»:** la fila pasa a «**Invita a un amigo** · Gana 200 EXP cuando haga su primer viaje con HOY» («HOY» con `<Marca>`), y lo mismo, en una línea, en la hoja de invitar a un amigo.

### 1.5 +200 EXP por invitar a un amigo
- Hoy no hay código que dé experiencia por invitar. Que lo haya:
  - **+200 EXP** a quien invita cuando el amigo (una cuenta nueva, como ya cuenta `logro_referidos`) **completa su primer viaje con HOY**: el viaje ha terminado y ha usado HOY al menos la mitad de los días del viaje (redondeando hacia arriba: 1 de 2, 2 de 4, 3 de 5…; usar HOY un día = al menos un [Visto] ese día).
  - **Como mucho 5 amigos al año** por persona.
  - Un aviso en la campana de quien invita: «Ana ha hecho su primer viaje con HOY: +200 EXP».
  - Cuenta para el nivel y para el sorteo, como cualquier otra experiencia.

### 1.6 El sorteo, como en `Piezas/Sorteo Perfil`
- Hoy el sorteo solo existe por dentro (la regla de `data/logros/exp.json` y la pestaña «Sorteo» del admin). El viajero solo lo conoce por la película.
- **El diseño, tal cual `Piezas/Sorteo Perfil`:**
  - **el billete dorado en el perfil, debajo de la tarjeta de EXP**, con sus tres estados: «Te faltan 340 EXP para el nivel 3» (el número real, con su barrita), «Ya tienes el nivel. Haz un viaje con HOY activado y entras.» y [✓ Estás dentro];
  - **al tocarlo, la página del sorteo** (pantalla entera, con la foto de Roma arriba y la flecha para volver): el premio, cuándo se sortea, quién puede entrar, «Cómo se entra» con las dos condiciones (con ✓ las que ya cumple), [Bases legales] y el botón de abajo con su estado;
  - **el aviso de la campana el día que entra**, el especial dorado: «¡Ya estás en el sorteo de 2027!». Una sola vez.
- **La regla nueva (Eric, 26-oct), en `data/logros/exp.json › sorteo`:**
  - entra quien tenga **el nivel 3 o más** y haya acabado **al menos un viaje usando HOY la mitad de los días o más** (la misma regla que la del amigo del apartado 1.5: redondeando hacia arriba, y usar HOY un día = al menos un [Visto] ese día). **Cualquier viaje, a cualquier destino.**
  - **Se cierra el 31 de agosto**: para el de 2027, cuentan los viajes acabados y el nivel conseguido hasta el 31 de agosto de 2027. Los años siguientes, del 1 de septiembre al 31 de agosto.
  - Hoy la regla dice «al menos un viaje acabado con la app ese año» (`viajes_acabados_minimos_al_anio`): cámbiala a esta, y que la pestaña «Sorteo» del admin cuente con la nueva.
- **Los datos del sorteo, en el mismo sitio, fáciles de cambiar:** el año (2027), el destino (Roma), el premio «**Un viaje a Roma para dos personas**» (sin «en 2027»: hasta cuándo se puede usar lo dirán las bases), las fechas del sorteo «del 8 al 10 de octubre de 2027», el día de cierre (31 de agosto de 2027) y el enlace de las bases. **Las bases todavía no están** (Eric las revisa con su gestor): mientras no haya enlace, el botón [Bases legales] no sale.
- **Después del cierre y hasta el sorteo:** quien está dentro sigue viendo «Estás dentro». A los demás, el billete ya les cuenta para el del año siguiente (con «Un viaje al destino del año», sin destino, hasta que Eric lo ponga en el dato).
- Para todos los que tengan los logros encendidos.
- **Comprueba el sorteo de punta a punta** con cuentas de prueba: que la experiencia sube, que el nivel se ve en el perfil, que el billete pasa por sus tres estados, que un viaje con HOY menos de la mitad de los días no cuenta, que un viaje acabado el 1 de septiembre de 2027 ya no cuenta para el de 2027, que el aviso llega una vez y que la pestaña del admin cuenta a esa cuenta. Dime qué falta, si falta algo.

### 1.7 El precio del pase en la moneda del viajero, como en `Piezas/Pase Moneda`
- Hoy el pase solo está en euros (`data/pase/precios.json`). Alguien de México ve 6,99 € y no sabe cuánto es.
- **El diseño, tal cual `Piezas/Pase Moneda`:** en «¿Cuántos sois?», la pastilla de la moneda arriba («MXN ⌄») junto a la ✕; cada pase con el precio grande en su moneda («≈ 140 MXN») y pequeño debajo en euros («6,99 €»); el tachado y el «Ahorras ≈ 60 MXN» en su moneda, con los euros tachados debajo; «≈ 110 MXN cada uno»; [Comprar · ≈ 400 MXN]. El final de la película, con «≈ 140 MXN» grande y «6,99 €» pequeño. La hoja «Moneda», desde abajo, con el código y el nombre y la elegida con borde de oro. En euros, todo como ahora, sin «≈».
- **La moneda:** la que ya tiene puesta en la app (la misma del presupuesto) o, si no ha elegido, la de su país. Se puede cambiar ahí mismo, con la lista de monedas del presupuesto.
- **Las cifras, redondeadas para que se lean bien** (140, 220, 400 en pesos; de 100 en 100 en pesos colombianos o chilenos) **y que cuadren:** tachado − precio = lo que se ahorra, sin que el redondeo lo descuadre. Los precios en euros siguen siendo los de `precios.json`: nada de un precio a mano por moneda.
- **La regla de Eric: que nunca pague más de lo que vio.**
  - Lo primero, **el cambio de Stripe** (el de Adaptive Pricing, con su comisión dentro), si Stripe deja pedirlo antes de pagar.
  - Si no se puede, **el cambio del día más un 4 %** (lo máximo que cobra Stripe), **redondeando hacia arriba**: lo que se enseña es igual o un poco más que lo que se cobra, nunca menos. Dime de dónde sacas el cambio del día y cada cuánto se pone al día.
- **Al pagar:** Eric encenderá **Adaptive Pricing** en el panel de Stripe, para que la página de pago le cobre en su moneda y a JUTRIP le llegue en euros. **Comprueba antes** que sirve para pagos de una vez como el nuestro (no solo suscripciones) y en qué países, y dime qué tiene que tocar Eric en Stripe (sin enseñar ninguna clave).

### 1.8 El perfil y el pasaporte, como en `Logros Pantallas` (04, P1 y P2)
- **Manda el pasaporte.** Hoy el perfil se contradice: «Mi pasaporte · 0 países · 0 ciudades» y, debajo, el mapa «1 país · 1 lugar · 3 días» (cuenta el viaje planeado, no lo visitado), centrado en la Antártida. Los países, las ciudades y el mapa salen **de un solo sitio, el del pasaporte** (lo visitado), en el perfil y dentro.
- **En el perfil (P1):** **fuera el mapa de países** que sale debajo de «Mi pasaporte». La tarjeta de «Mi pasaporte», como en P1: el círculo con el mapa a la izquierda, «Mi pasaporte», los sellos asomando a la derecha, y **solo «6 países · 9 ciudades»** (sin «días viajando»: eso va dentro). Al tocarla, el pasaporte.
- **Dentro del pasaporte (P2):** arriba, «**Pasaporte de {nombre}**» (el nombre de su cuenta), y **el círculo del mapa mucho más grande**, como en P2 (en el móvil, hoy se ve pequeño). Debajo del mapa, «6 países · 9 ciudades · 41 días viajando». El mapa, centrado en los países que ha visitado (sin ninguno, en Europa).
- El orden del perfil, como en P1: EXP, el billete del sorteo, Mi vitrina, Mi pasaporte y Mis viajes.

## 2. La prueba
- La batería rápida y `pruebaJutrip`. Si `pruebaJutrip`, `pruebaTanda10B`, `pruebaRevisionLargos` o `pruebaTanda10F` fallan solo al correr con las demás y solas pasan, dilo y sigue: se arreglan más adelante.
- Prueba nueva `pruebaTanda10P`:
  - la historia de prueba: 0/1, se gasta a los 3 s, esa se queda abierta y las demás cerradas; otra en otro destino;
  - la película a todo el ancho, el final con scroll, [Ver], y el final ya montado la segunda vez;
  - HOY con el atardecer y con lo de mañana;
  - la lista del pase sin «a mi aire» ni «el reto del día», y con la fila nueva de invitar;
  - +200 EXP cuando el amigo completa su primer viaje con HOY (y no si no llega a la mitad de los días, ni el sexto amigo del año);
  - el sorteo: el billete en sus tres estados, la página (sin [Bases legales] si no hay enlace), la regla nueva (la mitad de los días con HOY, el cierre del 31 de agosto), el aviso dorado una sola vez y la cuenta dentro en la pestaña del admin;
  - la moneda: en EUR como ahora; en MXN, USD y COP con el «≈», el tachado y el «Ahorras» que cuadran, el final de la película, la hoja «Moneda»; y que lo enseñado nunca sea menos que lo que se cobra;
  - el perfil sin el mapa suelto, la tarjeta del pasaporte solo con países y ciudades, los mismos números fuera y dentro, y dentro «Pasaporte de {nombre}» con el mapa grande.
- Capturas en `docs/dias/capturas_jutrip/` y una página `docs/dias/REPASO_10P.html`, a tamaño de móvil, para que Eric lo revise en su teléfono.

## 3. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10P».

**Al final del informe, la lista de comprobación (Eric, 26-oct: es el repaso final de la app).** Todos los puntos de este prompt, uno por uno y en el mismo orden (cada viñeta, no solo los apartados), cada uno con:
- **✅ Hecho**, **⚠️ A medias** (qué falta) o **❌ No hecho** (por qué);
- **dónde lo mira Eric en el móvil** (la pestaña y los toques: «RUTA › Compartir»), y con qué cuenta o en qué modo (dueño o invitado, con pase o sin pase);
- su captura, si la tiene.
La misma lista, arriba del todo de la página de repaso (`REPASO_10P.html`), con una casilla en cada punto para que Eric la vaya marcando en su teléfono mientras lo comprueba.


Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
