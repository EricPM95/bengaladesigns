Hola. TANDA V10: «TODOS MIS LOGROS» (18-nov). Va después de la V9. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `ULTIMOS_RETOQUES.zip` (Descargas). Lleva también lo de otras tandas: aquí solo lo de «Todos mis logros». Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. El diseño, exactamente igual; los textos, los de este prompt; si no coinciden, manda el prompt.
- **Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v10.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.
- **Regla de Eric para toda la tanda: aire entre bloques,** más que el que deja Design, para que todo se vea limpio.

## 1. «Por destino»
- **Si solo hay un destino,** su tarjeta ocupa todo el ancho. **Si hay más de uno,** en fila con scroll de lado, como ahora, y el siguiente asoma un poco para que se vea que hay más.
- **«Destinos · Países»,** como Design (hoy son dos palabras sueltas con un subrayado naranja).
- **La tarjeta del destino, con la FOTO del destino arriba** (hoy es un degradado gris), como en «Mis viajes».
- **Los números de la tarjeta, claros.** Hoy pone «0 de 7 colecciones · 0%» a quien ya tiene pedazos, y parece que no ha hecho nada. Que diga lo que lleva: «2 colecciones empezadas · 3 pedazos · 2 secretos», y el % del destino entero (pedazos y emblemas ganados entre el total).
- **Dime qué es «Sello de plata»** en la tarjeta, cuando en la hoja de logros del mismo destino sale «Primeros pasos · Bronce». Si son cosas distintas (el sello del viaje y la medalla del destino), que no se confundan: en la tarjeta, la medalla del destino como en la hoja de logros.

## 2. «Logros de viajero» (El mundo, El tiempo, Cómo viajas, Coleccionista…)
- **Todos del mismo tamaño y un poco más grandes,** como Design. Cada uno con su dibujo y su marco de siempre.
- **El resto, como Design.**

## 3. El resto de «Todos mis logros», como Design (T1, T2 y G1)
- **Arriba, la tarjeta oscura** con «38 logros conseguidos» y el título de viajero elegido debajo (el mismo del Perfil; si se cambia en uno, cambia en el otro).
- **«Destinos / Países»:** el selector pequeño de dos opciones. En «Países», una tarjeta por país con sus destinos y sus medallas (el Vaticano «dentro del viaje a Roma»).
- **«Las 7 maravillas»** y **«Exclusivos»,** como Design.
- **Al tocar un destino o una ciudad,** su página (G1): la cabecera con la foto, la medalla y los números, y debajo sus sellos, colecciones y emblemas secretos.

## 9. La prueba
- `pruebaJutrip` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV10`:**
  - con 1 destino, la tarjeta a todo lo ancho; con 2, en fila y el segundo asomando;
  - la tarjeta con foto y con los números de lo que lleva (no «0 de 7» con pedazos);
  - los logros de viajero del mismo tamaño.
- **En el REPASO:** capturas de móvil al lado de Design y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
