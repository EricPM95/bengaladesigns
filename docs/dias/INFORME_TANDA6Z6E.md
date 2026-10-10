# Informe de la Tanda 6z6e

Dos respuestas de la 6z6d: las fotos propias sin crédito y la lluvia en la campana.

## 1. Las fotos propias, sin crédito
- Una sola regla en `placePhoto.ts`: una foto propia (de Eric) devuelve **siempre sin crédito**, aunque los datos traigan autor. En la ficha de la parada quité el trozo que pintaba «Foto: {autor} · {licencia}» y solo queda el crédito de Unsplash. Nada vacío ni a medias.
- «Créditos» no habla de las fotos propias.
- Visto a 375 px: la ficha de la Fontana de Trevi (foto propia) no lleva ninguna línea de crédito. Pedí al servidor 3 lugares con foto propia (Coliseo de noche, Terraza del Altar, Trevi): los tres llegan con el crédito vacío.
- **Una cosa que tu mensaje daba por hecha y no es así:** las fotos de **Wikipedia/Wikimedia Commons NO llevan hoy el autor debajo** (solo las de Unsplash). Nuestro servidor, cuando saca una foto de Wikipedia, solo trae la dirección de la imagen, sin autor ni licencia. Lo comprobé a mano con el Mausoleo de Cecilia Metela, el Palacio Massimo y Sant'Ivo: foto sin ninguna línea. En la 6z6d escribí en «Créditos» que el autor sale bajo cada foto de Wikimedia; **era inexacto** y lo he corregido: ahora dice que las de Unsplash llevan su autor y su enlace bajo la foto, y que las otras son de Wikipedia (Wikimedia Commons). Qué hacer con eso, en las preguntas.

## 2. La lluvia, también en la campana
- Gratis y de pago: un aviso por día del viaje. El día antes, «Mañana llueve en Roma por la tarde»; el mismo día, «Hoy llueve en Roma por la tarde». La parte del día sale de las horas con lluvia de la previsión de nuestro servidor: por la mañana, por la tarde, por la noche, «por la tarde y por la noche», o «todo el día» (mañana y tarde, o las tres). Las franjas: mañana 8-13 h, tarde 14-20 h, noche 21-23 h (la misma frontera de las 14 h del aviso de HOY).
- Solo se mira hoy y mañana (y solo si ese día es del viaje y tiene una parada con coordenadas de verdad). Sin previsión (servidor caído, o no llueve), ningún aviso. Un aviso por día: cada uno con su id propio, nunca dos iguales.
- En la de pago, HOY conserva su aviso de siempre, sin tocarlo.
- Con «Lluvia de prueba: sí» del panel, sale en la campana. Con «No», nada.
- Una sola regla: `src/lib/avisosDeLluvia.ts` (todo puro) y la campana (`useAppNotices.ts`) solo pide el tiempo y lo pasa.
- Visto a 375 px con «Lluvia de prueba: sí»: gratis, el mismo día («Hoy llueve en Roma todo el día» y «Mañana llueve en Roma todo el día», porque mañana también es día del viaje); el día antes, solo «Mañana…»; de pago, igual; con «No», 0 avisos.
- La lluvia de prueba llueve todo el día, así que ahí sale «todo el día». Las otras redacciones («por la tarde», etc.) las cubre la prueba automática, no las vi en pantalla.

## 3. El enlace del proveedor del tiempo
Se queda en «Créditos». No he cambiado nada (se pregunta al contratar su plan de pago, ya está en PENDIENTES).

## 4. Pruebas
- Nueva `pruebaFase6z6e.mjs` (27 comprobaciones, 0 fallos): las fotos propias no llevan crédito aunque los datos traigan autor, ni en la ficha ni en «Créditos» (y Unsplash conserva el suyo); el aviso de la campana el día antes y el mismo día, una vez por día, con las franjas; sin previsión, servidor caído o seco, 0 avisos; no depende de la versión de pago.
- Las de siempre, a 0 fallos (con 6z6, 6z6b, 6z6c y 6z6d). Capturas: `docs/dias/img/6z6e-*.jpg`. Viaje de prueba borrado.
- Invariantes 554 retocada y 556 y 557 nuevas.

## 5. Lo que NO pude comprobar
- El aviso de lluvia con lluvia real del servidor (hoy no hay lluvia prevista): lo probé con la lluvia de prueba.
- Las redacciones «por la mañana», «por la noche», etc. en pantalla (solo en la prueba automática).
