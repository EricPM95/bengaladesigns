Hola. Nueva tanda pequeña: TANDA 8A2, LOS ARREGLOS TRAS LA 8A Y LO QUE DECIDIÓ ERIC ANOCHE. Sin pantallas de Design, todo detrás de los interruptores de siempre (apagados en producción). No toques el motor de rutas.

## 0. Antes de empezar
- Lee, en docs/dias:
  - tu INFORME_TANDA8A.md;
  - el apartado 33 de APUNTES_TRAS_TANDA7.md;
  - REVISION_DESIGN_PASO3.md;
  - GRATIS_Y_PASE.md.
- Si algo choca con la 8a o con las cuentas, manda esto.
- Claude ha actualizado APUNTES_TRAS_TANDA7.md y GRATIS_Y_PASE.md, y ha dejado REVISION_DESIGN_PASO3.md, MENSAJE_DESIGN_PASO3_ARREGLOS_17OCT.md y este prompt. Inclúyelos en tu commit tal cual.
- Si necesitas una migración nueva, escríbela (0024 o la que toque) sin aplicarla, y dime en qué orden va.

## 1. Los Patrimonios (Eric: sí)
- La ficha oficial de la UNESCO del Centro histórico de Roma (https://whc.unesco.org/en/list/91) dice que el sitio abarca «todo el centro histórico de Roma dentro de las murallas, en su extensión máxima del siglo XVII». Es decir, dentro de las murallas aurelianas y de las de Urbano VIII en el Janículo, que cierran Trastevere. Claude lo ha comprobado.
- Cuentan para el Centro histórico:
  - el Coliseo, Trevi, Piazza Navona, la Plaza de España y Trastevere, que pasan de «por comprobar» a «cuenta»;
  - todos los sitios de nuestros datos de Roma que estén dentro de esas murallas, aunque no estén en ninguna colección.
- La misma ficha incluye también la Basílica de San Pablo Extramuros: si está en los datos, cuenta.
- Quedan fuera: lo que esté fuera de las murallas, como la Galería Borghese (dentro de Villa Borghese, fuera de la Porta Pinciana).
- Las Catacumbas de San Calixto siguen «por comprobar».
- En el informe, la lista de los sitios que has marcado y de los que has dejado fuera, con el motivo de cada uno.

## 2. El Vaticano es capital (Eric: sí)
`capital: true` en los tres sitios del Vaticano.

## 3. El día de prueba, con la regla nueva
**Cambia lo que pusiste en la 8a.**
- **Una prueba de HOY por cuenta, para siempre**, no una por destino. Si ya la usó (en Roma o donde sea), no hay más pruebas.
- **Qué día es la prueba:**
  - si el día de llegada está libre antes de las 10:00, ese día;
  - si está libre más tarde, el día siguiente;
  - sin vuelo puesto, el día 1;
  - si no hay ningún día libre antes de las 10:00 (por ejemplo, 2 días con llegada tarde), el día con más horas libres.
- **Cuándo se gasta:** solo al usar HOY de verdad, es decir, al tocar [Visto] o [Cómo llegar]. Si la abre y la cierra, no se gasta.
- **Si pone o cambia el vuelo antes de gastarla,** el día de prueba se vuelve a calcular.
- **La pregunta de las 12:00:** si la primera vez que usa HOY en su día de prueba es a partir de las 12:00 (hora de Roma), se le pregunta una sola vez: «Te queda medio día. ¿Usas hoy tu día de prueba o lo guardas para mañana?», con [Hoy] y [Mañana].
  - Con [Mañana], la prueba pasa al día siguiente, si queda alguno en el viaje.
  - Lo de hoy se gana mañana con «Lo de ayer también cuenta», con las fotos de la galería.
  - Deja la lógica y la respuesta del servidor listas. La pantalla (P10) llega con Design.
- **Si ya la usó y abre HOY sin pase,** ninguna alerta: HOY enseña su tarjeta de siempre (la pantalla 12 de Design).
- Cambia `puedeGanarLogros` y lo que haga falta en el pase, con sus pruebas.

## 4. El pase: precios y quién paga
- Los precios, en un solo archivo de datos, fácil de cambiar:
  - 1 persona: 6,99 €;
  - Pase Dúo, 2 personas: 10,99 €;
  - Pase Grupo, 3 o más: 4,99 € por persona, con el máximo de plazas que ya tengas.
  - Fuera el escalón de 5 o más a 3,99 €.
- **Paga todo el que compra.** Los invitados entran con su plaza sin pagar nada. Si hay algo hecho para que cada uno pague su parte, quítalo.
- El cobro sigue apagado (va con las pantallas de las cuentas).

## 5. Recomendar cambios: fuera «ya no encaja»
**Cambia lo que hiciste en la parte 2 de las cuentas.**
- El que creó el viaje siempre puede aceptar una recomendación, aunque su ruta haya cambiado después. Al aceptarla, sustituye a lo que tiene ahora.
- El «antes» que se enseña es cómo está su ruta ahora, no cuando se mandó la recomendación.
- Si el día de la recomendación ya no existe en su viaje, al aceptarla tiene que elegir en qué día la pone. El servidor pide ese día y no la aplica sin él.
- Antes de cambiar nada, guarda cómo estaba, para que la varita siga funcionando.
- Que estén los tres tipos:
  - una parada (cambiarla por otra, quitarla o moverla);
  - un día (añadir o quitar paradas, cambiar el orden);
  - la ruta entera.
- Si falta «cambiar una parada por otra», añádelo.

## 6. «Sustituir el anterior» no borra
Cuando alguien crea un segundo viaje al mismo destino con fechas que se pisan y elige «Sustituir el anterior», el de antes no se borra: pasa a «Viajes guardados», igual que en la pregunta del primer día («¿Cuál haces?»). Si eso necesita un dato nuevo en la base de datos, va en la migración nueva.

## 7. Las fotos pequeñas de los sitios
Design va a poner la foto pequeña de cada sitio en todas las listas de paradas, en vez del círculo con ✓.
- Haz un script que saque de cada foto de los sitios una versión miniatura en WebP (el tamaño que haga falta para verse bien a unos 48 px en un móvil con pantalla de alta resolución).
- Que la app pueda pedir la miniatura en vez de la foto grande.
- En el informe: cuántas son y cuánto pesan en total y de media.

## 8. Lo que faltaba de la 8a
- **/admin/logros en Vercel:** añade la regla de reescritura en `vercel.json`. Es un archivo del repositorio: puedes tocarlo. Los ajustes de Vercel, no.
- **Los avisos en el móvil:**
  - añade el paquete `web-push`, con el envío apagado (`PUSH_ACTIVO`);
  - haz un script que genere las claves VAPID y las escriba en `.env.local`, nunca en git ni en la consola;
  - dile a Eric qué nombres tiene que poner en Vercel.
  - No me pegues las claves ni las enseñes en el informe.

## 9. La prueba
- No toca el motor: la batería rápida.
- Amplía `pruebaLogros1` y las pruebas de las cuentas con:
  - los Patrimonios nuevos;
  - el Vaticano como capital;
  - el día de prueba en sus casos: llegada a las 7:00, a las 14:00, sin vuelo, viaje de 2 días con llegada tarde, vuelo puesto después, la pregunta de las 12:00 con [Hoy] y con [Mañana], y una segunda prueba en otro destino que no se da;
  - los precios y el pago entero;
  - la recomendación sobre una ruta que cambió y sobre un día que ya no existe;
  - «Sustituir el anterior» sin borrar.

## 10. El informe (docs/dias/INFORME_TANDA8A2.md)
En español sencillo:
- qué has cambiado;
- la lista de los Patrimonios, sitio por sitio;
- las miniaturas (cuántas y cuánto pesan);
- las migraciones nuevas, sin aplicar, y su orden;
- lo que tiene que hacer Eric fuera del código;
- los riesgos.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado (.env, claves), haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
