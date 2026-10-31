Hola. TANDA 10S7b, rápida: respuestas a tus dudas de la 10S7. Solo las pruebas de lo tocado y `pruebaJutrip`, sin migraciones. La nota de estado (`_estado_10s7b.md`) a la rama `estado` cada 30 minutos. No apagues el PC.
1. Los vuelos: sí, que vuelvan a adaptar el primer y el último día, pero preguntando.

* Lo que solo informa se actualiza solo, siempre, como antes: el plan de llegada y de vuelta, «Hoy vuelves a casa», el resumen del vuelo y cualquier texto que salga de la hora del vuelo. No mueve paradas, así que no hace falta preguntar.
* Lo que mueve paradas, solo con el pase y preguntando. Al guardar o cambiar el vuelo, si adaptar el primer o el último día cambiaría algo, sale la alerta «¿Adaptamos tu primer y tu último día a tus vuelos?» con [Sí, adaptarlos] y [Ahora no].
   * «Sí» cambia solo el día de llegada y el de vuelta, nunca la ruta entera. Después sale la franja «Hemos adaptado tus días a tus vuelos» con Deshacer.
   * «Ahora no» no cambia nada, y en esos dos días se queda el botón «Reorganizar».
   * Si no cambiaría nada, no sale ninguna alerta.
* El botón «Reorganizar» tiene que mirar el vuelo en el primer y el último día: no pone nada antes de la llegada (más el tiempo hasta la ciudad) ni después de la hora de irse al aeropuerto.
* Reutiliza lo que hacía `rehacerPorCambioDeVuelo`, limitado a esos dos días. Si para eso hay que tocar el motor más de la cuenta, déjalo a medias y dímelo.
* En un viaje compartido, la alerta solo le sale a quien ha cambiado el vuelo.

2. Los cierres de cada día en «Reorganizar»: de momento así. Apúntalo como pendiente antes del lanzamiento: «Reorganizar» no puede poner un sitio a una hora en que ese día está cerrado.
3. La frase de la lista del pase: vale, «Ordenamos tus días según tu llegada, tu vuelta y los cierres de los monumentos.»
4. «Empezar de cero»: quita del diálogo «el día de prueba» y cualquier cosa que ya no se borre, y añade una línea: «Las pruebas gratis que ya has usado no vuelven.» «Reiniciar mis pruebas» del panel de administrador se queda como está, porque es para probar.
5. La lectura de una entrada y de un hotel: la pruebo yo con una real.
6. La reserva del hotel en un viaje compartido: el nombre, la dirección, las fechas y el teléfono los ve todo el viaje, porque todos tienen que llegar al hotel. El localizador y el documento solo los ve quien lo añadió. Si eso necesita una tabla nueva, sigue la regla de `CLAUDE.md` (empezar_de_cero desde la 0072 y pruebaTanda10J). Si no, mejor sin migración.
7. Iluminar: sí, ilumina también la parada cuando una reserva trae el Free Tour o una entrada de otro día. El «+» de la franja y el del hueco entre tarjetas como «entre dos paradas» está bien.
8. Las reservas:

* Una reserva grande en otra fecha que mueve el día entero (regla 6j): se queda así.
* Quitar una reserva no puede rehacer nada. Se quita la reserva (su hora y su billete) y la parada se queda donde está, en su día y en su sitio. Arréglalo.

La prueba: `pruebaTanda10S7b` con estos casos:

* con pase, cambiar la hora de llegada → sale la alerta; «Sí» cambia solo el día 1 y el último, y Deshacer los deja como estaban;
* «Ahora no» no cambia nada;
* sin cambios, no sale alerta;
* sin pase, nunca sale la alerta, pero «Hoy vuelves a casa» se actualiza;
* «Reorganizar» el día 1 no pone nada antes de la llegada;
* quitar una reserva no mueve ningún día;
* el texto nuevo de «Empezar de cero»;
* en el hotel compartido, el otro ve la dirección pero no el localizador.

Añade el informe en «10S7b» de `INFORME_TANDA10B.md`, con su lista de comprobación. Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Al final, reinicia el api-server.
