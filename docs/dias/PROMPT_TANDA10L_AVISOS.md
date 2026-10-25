Hola. TANDA 10L, pequeña: FUERA LAS TARJETAS DE LAS ESTACIONES Y CAPTURA DE TODOS LOS AVISOS. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10L_AVISOS.md e inclúyelo en tu commit.

## 1. Fuera las estaciones
- Quita las tarjetas de primavera, verano, otoño e invierno que salen arriba de la ruta (`server/engine/seasonNote.js`, `SEASON_CARD_TEXTS`). No aportan nada: el tiempo de verdad ya lo da HOY.
- La de Navidad se queda (`destination_config.nota_temporada` de roma.json), pero sin la parte de «como anochece sobre las {hora_atardecer}», porque ya no trabajamos con el atardecer. Por ejemplo: «¡Vas a vivir Roma en Navidad! Las calles se llenan de luces, las plazas estrenan árbol y Piazza Navona tiene su mercadillo. Hemos preparado tu ruta para que lo veas todo, también iluminado.» Lo mismo en las demás variantes.
- No cambies cómo se reparten los días: esto solo quita textos.

## 2. El último domingo de mes en los Vaticanos
- Los Museos Vaticanos cierran los domingos, salvo el último domingo de mes, que abren (gratis, por la mañana y con mucha cola).
- Comprueba que ese domingo no sale «Los domingos los Museos Vaticanos cierran», que la ruta no los quita ese día por el cierre y si hace falta un aviso propio (por ejemplo: «Último domingo de mes: los Museos Vaticanos abren gratis por la mañana, con mucha cola»). Con fuente oficial y la fecha en que lo has comprobado.
- Dime qué hace hoy la app y qué has cambiado.

## 3. La captura de todos los avisos
Quiero ver de una vez todos los avisos que pueden salir en la ruta al crear un viaje (arriba de la ruta y en DÍAS). Haz una página `docs/dias/AVISOS_REVISION.html`, a tamaño de móvil, con una captura de cada uno tal como sale en la app y su texto debajo:
- la tarjeta de Navidad, en cada una de sus variantes (con mercadillo, con árboles, solo luces, con noche y sin noche);
- cada día especial de `fechas_especiales` (Año Nuevo, Reyes, Semana Santa, 1 de mayo, 2 de junio, 29 de junio, Ferragosto, la Inmaculada, Nochebuena, Navidad, San Esteban, Nochevieja, el mercadillo de Navona, el primer domingo de mes…) y el del último domingo de mes, si lo pones;
- los avisos de cierre de cada semana (los domingos de los Vaticanos, los lunes de la Borghese y los demás), y los de «te lo enseñamos por fuera», «hoy ves…» y «se queda en su día y decides tú»;
- el aviso de los restaurantes (Navidad, Ferragosto);
- cualquier otro aviso que salga en la ruta y no esté en esta lista.
- Para cada uno, una línea: cuándo sale (qué fechas y qué condición) y dónde (arriba de la ruta o en qué día).
- Si para alguno hace falta un viaje de prueba con unas fechas concretas, créalo solo para la captura.

## 4. La prueba
- La batería rápida y `pruebaJutrip`.
- No hace falta la muestra de 60 fechas: solo cambian textos, no el reparto de los días.
- Prueba nueva: ninguna fecha del año saca ya la tarjeta de una estación; en Navidad sale la de Navidad sin la hora del atardecer; el último domingo de mes los Vaticanos no salen como cerrados.
- `pruebaFase6y5_motor`: si solo se queda sin tiempo, como antes de esta tanda, dilo y sigue. Se arregla en la Tanda 12.

## 5. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10L».

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
