Hola. Tanda pequeña: TANDA 8B4, FOTOS DE UNSPLASH Y LOS ÚLTIMOS ARREGLOS DE LA 8B. Claude ha revisado las capturas de la 8B3: ha quedado muy bien. Quedan las fotos que faltan y cinco cosas pequeñas. Todo sigue detrás de los mismos interruptores. No toques el motor de rutas.

## 0. Antes de empezar
- Lee tu INFORME_TANDA8B3.md y docs/dias/notas_8b/fotos.md.
- Claude ha dejado este prompt en docs/dias/PROMPT_TANDA8B4.md. Inclúyelo en tu commit tal cual.

## 1. Las fotos que faltan, de Unsplash (Eric: sí)
Eric quiere que las fotos que faltan salgan de Unsplash. Él elige cuál va en cada sitio, como hizo con las del 2 de octubre.

**Los sitios:**
- los importantes sin foto propia: Foro Romano y Palatino, Arco de Constantino, Panteón, Piazza Navona (la de día, para todo el año; la de Navidad se queda en sus fechas) y Museos Vaticanos (la fachada o los patios, nunca dentro de la Capilla Sixtina);
- los que dejaste sin foto en la 8B3: Columna de Trajano, Via del Babuino, Terraza de Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio.

**Qué haces:**
- Busca en Unsplash 3 candidatas por sitio. Que sean:
  - de día;
  - del sitio de verdad, que se reconozca, y nunca de otro sitio parecido;
  - que se puedan recortar en horizontal;
  - sin gente en primer plano y sin marcas de agua.
- Guarda de cada una el autor, el enlace y la licencia, como las del 2 de octubre en `_fotos.json`. La licencia de Unsplash deja usarlas en una app que cobra; aun así, apunta siempre el autor.
- Haz una página para elegir, `docs/dias/FOTOS_CANDIDATAS_8B4.html`, como `FOTOS_ROMA_CANDIDATAS.html`: cada sitio con sus 3 fotos grandes, numeradas, y cómo se verán recortadas en HOY v2 y en la miniatura.
- Si de un sitio no encuentras ninguna buena, dilo y déjalo sin foto.
- **No pongas ninguna en la app todavía.** Eric elige, y luego te dirá cuál va en cada sitio. Entonces la pones, con su miniatura WebP como las demás.

## 2. Lo que queda de la 8B
- **El Patrimonio del Coliseo:** en la 8B2, al marcar el Coliseo salía «Patrimonio de la Humanidad: Centro histórico de Roma»; en la 8B3 ya no sale, y es el primer sitio que marca ese día. Mira por qué. Si el Patrimonio ya estaba ganado en tu viaje de prueba, dilo; si no, arréglalo y ponle su prueba.
- **Los artículos delante del nombre del sitio:** «Sube una foto en Coliseo», «Parece que no estás en Panteón», «en Basílica de San Pedro». Tiene que ser «en el Coliseo», «en el Panteón», «en la Basílica de San Pedro». Pon el artículo de cada sitio en los datos (por ejemplo `articulo: "el"`), revisa todos los textos que llevan nombre de sitio y no lo pongas donde no va: «en Trastevere», «en Piazza Navona», «en Roma».
- **La cuenta atrás durante el viaje:** en A2 (sábado 17, durante el viaje) sale «Te quedan 9 días para reclamar tu premio». Durante el viaje no hay cuenta atrás; solo después, «Te quedan 10 días para reclamar tu premio».
- **El viaje de pruebas, con una ruta de verdad:** ahora pone la Basílica de San Pedro el mismo día que el Coliseo, Trevi y el Panteón, y por eso sale su aviso en el día del Centro histórico. Que `window.__rutaPrueba()` use una ruta hecha por el motor (Roma, 17 al 20 de octubre), sin paradas puestas a mano. Si para una serie hace falta un caso especial, que se vea que es especial.
- **El sello que nace:** en el resumen del día sale «1 sello subido de grado» cuando es el primer sello. Si es nuevo, «sello nuevo»; si sube, «sello subido de grado».

## 3. La prueba
- No toca el motor: la batería rápida.
- `pruebaLogros1` y las pruebas de pantallas, con lo de arriba: el Patrimonio del Coliseo, los artículos, sin cuenta atrás durante el viaje y el sello nuevo.
- Rehaz las capturas que cambien, con el viaje de verdad, y la serie entera del Coliseo.
- Que siga fallando la prueba si dos capturas son idénticas.
- Comprueba que no hay errores en la consola.

## 4. El informe (docs/dias/INFORME_TANDA8B4.md)
En español sencillo:
- qué has cambiado;
- por qué no salía el Patrimonio;
- las fotos: cuántas candidatas por sitio, y los sitios sin ninguna buena;
- las capturas nuevas;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
