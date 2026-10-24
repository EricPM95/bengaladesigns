Hola. TANDA 10I: LA PELÍCULA DEL PASE. No toques el motor de rutas. Si estás con otra tanda, acábala primero (con su push) y haz esta después.

## 0. Antes de empezar
- Guarda este prompt, tal cual, en docs/dias/PROMPT_TANDA10I_PELICULA.md e inclúyelo en tu commit.
- **Design, nuevo:** Eric ha dejado en la carpeta del proyecto el zip «Trazo_App__diseño_de_rutas_personalizadas_3ef724.zip». Pon al día con él `docs/diseno/proyecto/` (solo lo que cambia, sin `uploads/`) e inclúyelo en tu commit.
- **La película está en `Piezas/Pase Pelicula.dc.html`**, y se ve montada en la página «App Pase y cuenta». Mírala entera, de principio a fin, antes de tocar nada.

## 1. La película, tal cual la ha hecho Design
- Móntala en la app **igual que en Design**: las 6 escenas y el final, con sus animaciones, sus tiempos, sus títulos y sus subtítulos, el botón [Saltar] y la barra de arriba que marca por qué escena va.
- **Los textos, copiados tal cual del archivo de Design.** No reescribas ninguno.
- **Nada que se cargue de fuera mientras se ve:** el mapa del mundo (ahora `world-atlas` desde jsdelivr), las letras y las imágenes tienen que ir dentro de la app, para que la película salga entera aunque la conexión sea mala.
- Que vaya fluida en un móvil Android normal (Chrome). Ojo con las palabras en oro que entran letra a letra: el dorado tiene que ir en cada letra o en cada palabra, no en el bloque, o en Chrome salen como una barra maciza.
- Usa la pieza `<Marca>` de la 10H para «HOY» y «Pase de {Destino}».

## 2. Cuándo sale
- `abrirPase()` (la función única de la 10G, la que usan todos los candados, la pastilla de RUTA, [Ver el Pase de Roma] y [Escuchar historia] cerrado) **abre ahora la película, y ya no la hoja de compra directamente**.
- **La primera vez, la película entera. Después, directa al final** (la lista del pase con [Elegir mi pase]). Guarda en la cuenta si ya la ha visto (sin sesión, en el móvil).
- [Saltar] lleva al final.
- Al cerrar la película, vuelve a la pantalla donde estaba.

## 3. El final y la hoja «¿Cuántos sois?»
- **Sin el pase:** «Se paga una vez y no caduca», [Elegir mi pase] y [Ver todo lo que incluye].
- **Con el pase comprado:** «✓ Tu Pase de {Destino} está activo», [Verla otra vez] y [Ver todo lo que incluye]. Sin precio y sin «Se paga una vez…». La hoja de compra no se abre.
- **[Elegir mi pase]** abre la hoja «¿Cuántos sois?» nueva de Design (Pase de 1 persona, Pase Dúo · 2 personas, Pase Grupo · 3 o más, el tachado y el «Ahorras…» que cambian solos con − y +, el botón champán). **Sustituye a la hoja de compra de ahora (PagoHost)**, y [Comprar] sigue haciendo lo mismo que hace hoy. Los precios, de donde ya los tiene la app, no escritos dos veces.
- **[Ver todo lo que incluye]:** en el archivo de Design abre una lista con textos viejos («Tu ruta se ajusta a la hora de tu vuelo»…). **Que enseñe la misma lista del final, con los mismos nombres, las mismas líneas y el mismo orden.** Una sola lista para las dos.

## 4. Una sola película para todos los destinos
- La película es la misma para todos los destinos, y Roma es solo el ejemplo.
- Solo cambian dos textos, y salen del dato del destino:
  - «Pase de {Destino}»: en el final, en la hoja «¿Cuántos sois?» y en «✓ Tu Pase de {Destino} está activo»;
  - «Tu viaje a {Destino}»: en la tarjeta del resumen de la escena 6.
- Todo lo demás se queda de Roma, como ejemplo (la Fontana di Trevi, las paradas, Italia en el pasaporte…).

## 5. HOY sin pase: la lista «Con el pase tendrás»
- Ahora tiene nombres viejos («No me da tiempo» en vez de «Cambiar planes»…). Que use **la misma lista del final de la película** (los mismos nombres, líneas e iconos), o la parte que quepa, sacada del mismo sitio, para que nunca vuelvan a ir cada una por su lado.
- Captura de HOY sin pase con la lista nueva, en `GRATIS_REVISION.html`.

## 6. La prueba
- La batería rápida y `pruebaJutrip`.
- Prueba nueva `pruebaTanda10I`:
  - `abrirPase()` abre la película entera la primera vez y directa al final la segunda;
  - [Saltar] lleva al final;
  - sin pase: [Elegir mi pase] abre «¿Cuántos sois?», con los precios bien (1 persona 6,99 €; Dúo 10,99 €, tachado 13,98 €, ahorras 2,99 €; Grupo con 4: 19,96 €, tachado 27,96 €, ahorras 8,00 €);
  - con pase: sale «✓ Tu Pase de Roma está activo» y la hoja no se abre;
  - [Ver todo lo que incluye] tiene la misma lista que el final;
  - con un destino de prueba que no sea Roma, sale «Pase de {ese destino}» y «Tu viaje a {ese destino}»;
  - no se carga nada de fuera mientras se ve;
  - la lista «Con el pase tendrás» de HOY sale de la misma lista que el final.
- **Graba un vídeo de la película entera** (sin pase, de principio a fin, a tamaño de móvil) y déjalo en `docs/dias/capturas_jutrip/`, para que Eric la vea en el móvil.
- Capturas en `docs/dias/capturas_jutrip/`: el final sin pase, el final con pase, «¿Cuántos sois?» con 1, 2 y 4 personas, y «Todo lo que incluye».
- Añádelo todo a `GRATIS_REVISION.html`, en un apartado «La película del pase».

## 7. El informe
Añádelo a docs/dias/INFORME_TANDA10B.md, en un apartado «10I». Di cuánto dura la película entera y si algo de Design no se ha podido montar igual.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
