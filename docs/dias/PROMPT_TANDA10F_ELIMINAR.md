Hola. TANDA 10F, pequeña: ELIMINAR UN VIAJE DESDE EL PERFIL. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10F_ELIMINAR.md e inclúyelo en tu commit.
- Claude ha puesto al día en docs/dias **NOTAS_REVISION_RUTAS.md** (para la Tanda 11) y **NOTAS_TANDAS_MENORES.md**: inclúyelos también en tu commit, tal cual.

## 0b. Antes, tres retoques de la 10E
- **Las tres capturas de la apertura salen en blanco** (`10e_01a`, `01b` y `01c`: todo el dibujo es blanco puro). La apertura en sí funciona (Claude la ha dibujado aparte con `aperturaInteriorHtml` y se ve bien en los cuatro momentos): el fallo está en la captura. Arréglala y rehaz las tres y `MARCA_COMPARA.html`.
- **Quedan dos colores fuera de la marca:** el pin de la siguiente parada en el mapa de HOY sale en frambuesa (los pines van en oro, o en el color del día si es la ruta del día), y en Crear el viaje el punto de «Destino» y el pin de «Roma» del mapa salen en naranja (van en oro). Búscalos y mira si hay más como estos.
- En el informe de la 10E no sale **la batería rápida**: córrela y di el resultado.

## 1. Lo que pasa hoy
- En **Perfil → Mis viajes** (`PerfilSheet` + `FilaDeViaje`) no hay manera de eliminar un viaje. Solo la pantalla antigua «Mis viajes» (`MyTripsScreen` + `TripCard`, con su papelera y `deleteTrip`) lo hace, y casi nadie llega a ella.

## 2. Lo que hay que hacer
- **Al lado del título «Mis viajes», [Editar].** Al tocarlo, cada viaje enseña a su derecha un botón para eliminarlo (la papelera) y [Editar] pasa a [Hecho]. Fuera del modo editar, la fila sigue como ahora.
- **Al tocar la papelera, una hoja de abajo** (como las demás de la app), no una ventana del navegador:
  - «¿Eliminar tu viaje a Roma?» con sus fechas («13 – 16 oct 2026»);
  - lo que **se borra**: la ruta, los días, las reservas que has apuntado y **las fotos de ese viaje**. Si tiene fotos: «Tienes 155 fotos en este viaje» con [Guardar en mi galería] antes de eliminar (el mismo camino que ya existe);
  - lo que **se queda**: tus logros, sellos y EXP, y **tu Pase de Roma** (se paga por destino, no por viaje: sigue valiendo para el próximo viaje a Roma). Dilo en una línea corta;
  - [Eliminar viaje] (en el rojo de los avisos importantes) y [Cancelar].
- **Se avisa, nunca se niega:**
  - si es el viaje que está abierto en la app, o si el viaje es ahora (estás en esas fechas), una línea más en la hoja («Es el viaje que tienes abierto» / «Estás de viaje ahora mismo»), y se deja eliminar igual;
  - si es un viaje compartido (Dúo o Grupo): quien lo creó ve «También desaparece para Ana y Luis»; quien está invitado no lo borra para los demás: su botón es **[Salir de este viaje]** (solo lo quita de su cuenta).
- **Después de eliminar:** se va de la lista, sale abajo «Viaje eliminado» con **[Deshacer]** unos segundos, y luego se borra de verdad. Si era el viaje abierto, la app abre el siguiente viaje guardado; si no queda ninguno, la primera pantalla (crear viaje).
- **Que se borre todo lo suyo de verdad:** comprueba qué pasa con cada cosa ligada al viaje en Supabase (`trip_photos` y los archivos de las fotos en Storage, `trip_photo_meta`, `stop_visits`, `trip_members`, `trip_invitations`, `trip_recommendations`, `logro_avisos`, `passes`, `achievements`…). Las fotos no se pueden quedar en Storage sin viaje. El pase y los logros tienen que seguir (hoy van con `on delete set null`: compruébalo). Si para el [Deshacer] o para borrar los archivos hace falta una migración, que sea la **0031** (la 0029 está guardada para la 9B), dime que la tiene que aplicar Eric y que la app funcione igual hasta que la aplique.
- **La pantalla antigua** (`MyTripsScreen`): que use el mismo camino para eliminar (la misma hoja y lo mismo de Supabase), o dime si ya sobra y se puede quitar.

## 3. La prueba
- La batería rápida y `pruebaJutrip`.
- Pruebas nuevas: eliminar un viaje cerrado; el abierto (abre el siguiente); el único (va a la primera pantalla); [Deshacer] lo devuelve entero; después de eliminar, el pase de Roma y los logros siguen y las fotos ya no están (ni en la tabla ni en Storage); un invitado con [Salir de este viaje] no lo borra para el que lo creó.
- Capturas en `docs/dias/capturas_jutrip/`: Mis viajes con [Editar], en modo editar, la hoja (con fotos y sin fotos, y la de un viaje compartido) y el aviso con [Deshacer].

## 4. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10F»: qué se borra y qué se queda en Supabase, si hace falta la 0031 y qué has hecho con la pantalla antigua.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
