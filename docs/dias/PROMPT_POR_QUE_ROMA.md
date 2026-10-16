Hola. Tanda pequeña: «POR QUÉ TE LO RECOMENDAMOS» EN ROMA. No toques el motor de rutas.

## 0. Antes de empezar
- Lee el apartado 3 y el 30 de docs/dias/APUNTES_TRAS_TANDA7.md. Los 95 textos están en docs/dias/POR_QUE_RECOMENDAMOS_ROMA.md y Eric los ha aprobado todos. Claude ha actualizado los apuntes y ha dejado este prompt: inclúyelos en tu commit tal cual.

## 1. Los textos de Roma, nuestros
- Un campo nuevo en los datos de cada sitio de Roma: `por_que_recomendamos`, con su texto del documento, tal cual, sin cambiar ni una palabra.
- En la ficha, «Por qué te lo recomendamos» sale de ese campo, sin IA al abrir la ficha. Si un sitio de Roma no tiene texto, dímelo en el informe (no lo inventes).
- «Plaza Colonna» y «Piazza Colonna»: mira si en los datos son el mismo sitio dos veces. Si lo son, deja uno solo (el que sale en las rutas), con el texto de «Plaza Colonna», y el otro nombre como alias de búsqueda. Comprueba que ninguna ruta se rompe. Si no son el mismo sitio, dímelo y no toques nada.

## 2. Los sitios que no son nuestros
- En los sitios sin texto nuestro sigue escribiendo la IA, pero con el pedido cambiado: dice por qué vale la pena ese sitio (un icono, lo que lo hace único…), nunca la logística de la ruta («desde aquí el Panteón está a cinco minutos…»).
- Borra los textos viejos guardados de la IA para que se vuelvan a escribir con el pedido nuevo.

## 3. La prueba
Los datos de Roma cambian pero el motor no: la batería rápida. Y una comprobación nueva: los 95 sitios tienen su texto, igual que en el documento, y ninguno habla de la ruta.

## 4. El informe (docs/dias/INFORME_POR_QUE_ROMA.md)
Corto y en español sencillo: cuántos textos has metido, qué ha pasado con Plaza Colonna y lo que no has podido hacer.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
