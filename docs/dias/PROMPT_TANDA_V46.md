Hola. TANDA V46: CINCO ARREGLOS QUE ERIC HA VISTO EN EL MÓVIL TRAS LA V45 (tanda corta: hazlos todos y compruébalos uno a uno). Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** sube la nota `_estado_v46.md` a la rama `estado` al empezar y cada 30 minutos. 2 agentes como mucho, 1 Chrome, un servidor. **No apagues el PC ni programes el apagado.** Ninguna prueba toca el Supabase de producción. Nunca escribas ni enseñes una clave. Consulta nueva a Supabase: cada cuánto y cuánto baja.

## 1. Devolver «¿Para quién es?» (lo quitaste en la V45 y nadie lo pidió)
- En la V45 quitaste de la hoja de grupo las pastillas «¿Para quién es?» porque no salían en el dibujo. **Eso estaba en la app (10N §8: `AddReservationSheet`, `BloqueDinero`) y es fundamental:** si de cuatro amigos solo dos van al Vaticano, la entrada sale en la ruta solo de esos dos y el gasto se reparte solo entre ellos.
- **Devuélvelo como estaba,** en el paso «Casi lista», junto a «¿A qué cuenta lo sumamos?» y «¿Quién la ha pagado?», con un cambio: **quien la añade sale marcado al abrir, pero también se puede desmarcar** (si la compra para otros). Siempre queda al menos una persona marcada.
- Mira que siga en vuelo, alojamiento, coche, entradas y excursiones.
- **Regla nueva en CLAUDE.md:** nunca se quita algo que funciona porque no salga en un dibujo de Design. Si el dibujo no lo enseña, se mantiene y se apunta en DECISIONES.

## 2. «Pasar a otro día»
- **FALLO:** con hoy martes 24, la lista ofrece el **lunes 23, que ya pasó**. Nunca salen días pasados ni el de hoy.
- **El día recomendado, como el dibujo 26a** (Design, «ULTIMO»): en su propia tarjeta destacada, con el borde dorado, la etiqueta «Te lo recomendamos» encima del nombre y su flecha. Hoy es una fila más, con la etiqueta en el lugar de la flecha.
- Los días en que el sitio está cerrado, en gris con «Cerrado ese día». Pruébalo con un sitio que cierre algún día.

## 3. La tarjeta de la parada (HOY)
- **El recuadro de la ubicación** («Sin tu ubicación…» o «Estás lejos…») va **debajo de las cajas y encima de «Escucha su historia»**, como en el dibujo. Hoy sale debajo de [Cómo llegar] y [Cambiar plan].
- **La caja HORARIO sale siempre.** En los sitios sin horario (plazas, calles, fuentes) pone solo **«Abierto»**. Hoy en la Plaza del Campidoglio no sale y la caja A PIE ocupa todo el ancho.

## 4. «Aquí ganas 1 pedazo»
Al llegar a una parada («Ya estás aquí»), la línea «Aquí ganas 1 pedazo: «La Roma de Miguel Ángel»» aparece un segundo tarde y empuja lo de debajo. Que salga a la vez que la tarjeta, o con su hueco reservado. Dime en el REPASO de dónde venía el retraso.

## 5. La prueba
- **`pruebaJutrip`, `pruebaV36_cliente`, `pruebaV43`, `pruebaV44`, `pruebaV45` y las de lo que toques, en 0.**
- **Nueva `pruebaV46`:**
  - en un viaje de cuatro, una entrada para dos sale solo en su ruta y su gasto solo se reparte entre ellos; quien la añade se puede desmarcar;
  - «Pasar a otro día» nunca ofrece un día pasado ni el de hoy, y el recomendado va en su tarjeta;
  - la caja HORARIO sale en una plaza con «Abierto»;
  - el recuadro de la ubicación va encima de la historia.
- **En el REPASO:** capturas en tamaño iPhone de cada punto, tu lista de comprobación DE ESTA TANDA y qué cambia, en palabras sencillas.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
