# Informe de la Tanda 6z6b

Arreglos de RESERVAS, el presupuesto solo desde arriba, el Perfil a pantalla completa y los tips en RUTA. Cada punto, uno por uno.

## 1. RESERVAS: la oscura solo con la cuenta atrás
- La tarjeta oscura lleva SOLO «Tu viaje a {destino} empieza en {n} días» y el tiempo pequeño. Fuera «Te faltan n cosas» y «Lo tienes todo listo ✓».
- Lo que falta va solo en la tarjeta clara, aparte y debajo: «Tu viaje a Roma · x de 3 listo» (gratis «x de 2») con botones redondos por bloque.
- **Fuera el «0 %»** de la cabecera de RESERVAS (`TripReadinessBadge` borrado). Dónde más salía el porcentaje: en ningún otro sitio visible. Quedan `TripReadinessQuickPanel.tsx` (huérfano, nadie lo monta) y `useTripReadiness`, que solo usa el «!» de la barra.
- **«Falta» igual en todos los bloques:** texto frambuesa monoespaciado debajo del nombre (`EstadoBloque`). Llegada y vuelta ya no usa la etiqueta a la derecha. Entradas conserva «0 de 6 reservadas».

## 2. El presupuesto solo desde la cartera
- Quitada la fila «Presupuesto» de RESERVAS (`FilaPresupuesto.tsx` borrado). No queda ningún otro botón que lo abra: solo la cartera de la cabecera.
- La cabecera de RESERVAS lleva la misma cartera (`BotonCartera`) donde estaba el «0 %».
- **Efecto «el precio vuela a la cartera»:** la pastilla «+103,13 €» sale junto a donde se guardó, vuela 0,8 s a la cartera achicándose y desvaneciéndose, y la cartera da un saltito. Cambio: «+20,00 €» / «−20,00 €»; borrar: «−103,13 €». Moneda y formato del viajero (`shared/dinero/formato.js`). Con «reducir movimiento», solo el saltito. Igual en gratis y en pago. Dentro de la pantalla del presupuesto no sale. Si hay dos carteras, elige la que se ve.

## 3. «Útil para el viaje»: solo tarjetas
- Quitada la lista de debajo. Tarjetas de 220 px (1,5 visibles a 375 px) con imán al desplazar.
- Cada una: icono, «5 % dto.», nombre, línea corta, [Comprar] (enlace de afiliado) y [Añadir] (hoja del precio; añade al presupuesto y lanza el efecto).
- Añadida: «✓ Lo tienes · precio» y al tocar, Cambiar o Eliminar. Igual en gratis y en pago. Sin nombres de empresas en los textos de estas tarjetas.

## 4. El Perfil a pantalla completa
- Pantalla completa como RESERVAS: cabecera «Perfil» con X, y nada oculto bajo la barra.
- Mapa de 220 px: un dedo baja la página, dos dedos mueven el mapa (`cooperativeGestures`, mensaje en español). La bola se ve entera con su borde curvo con 1 o con varios viajes. El estilo y el token son los mismos en local y en producción.
- Debajo, «Mis viajes». La ficha y el álbum se abren a pantalla completa con [‹ Volver].
- Probado con 0, 1 y 6 viajes.

## 5. Los tips
- El mensaje de la tanda se cortó en este punto. Lo que entendí: quitar «Tips del viaje» del Perfil y ponerlos en RUTA. Hecho con una bombilla (icono fino, borde frambuesa) arriba a la derecha del mapa de RUTA que abre la hoja de tips. **Si querías otra cosa, dímelo.**

## 6. Pruebas y comprobación a mano
- `pruebaCorr6z6.mjs` (reservas 318, efecto 70, perfil 88) y `pruebaTanda6z6.mjs` ajustadas a las reglas nuevas; el resto de pruebas, sin fallos. Invariantes 534 corregida y 544 a 550 nuevas.
- A mano a 375 px: la tarjeta oscura y la clara, sin «%», la cartera en las dos cabeceras, «Falta» frambuesa, las tarjetas de Útil con Comprar y Añadir y «✓ Lo tienes», la pastilla del precio, el Perfil con 1 y con 6 viajes y la bombilla de RUTA. Capturas en `docs/dias/img/6z6b-*.jpg`. Viajes de prueba borrados.
- **No pude comprobar:** los gestos de dos dedos en un móvil real, el saltito de la cartera en RESERVAS a simple vista, «reducir movimiento» (lo cubre la prueba), el Perfil con 0 viajes a ojo (lo cubre la prueba).
