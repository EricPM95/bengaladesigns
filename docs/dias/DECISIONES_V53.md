# DECISIONES V53 (dudas para Eric)

1. **Sombra de las hojas:** el prompt dice «la de Design, sin desenfoque (la de HOY, trazo-notice-backdrop)». `trazo-notice-backdrop` llevaba desenfoque; he tomado el color de las hojas de HOY de Design (negro cálido `rgba(20,16,10,.5)`, el de «Lugares Pendientes») y SIN desenfoque, para todas. Si querías otro tono, se cambia en un solo sitio (`ui/fondoDeHoja.ts`).
2. **«Ahora no» como texto en Fuera de ruta y el juego de «Cerca de ti»:** eran dos opciones (dorado + «Ahora no» en texto); por la regla nueva ahora son dos botones lado a lado. Los he dejado así.
3. **Confirmaciones de borrar (botón rojo + Cancelar)** no se han tocado: no son dorado/«no», y la regla 10N8 dice que las confirmaciones no llevan [Cancelar].
4. **Botón champán en tamaños distintos:** al hacer el champán dorado, los botones sueltos con forma de píldora (Seguir, Comprar…) conservan su forma; solo `BotonHoja` pasa a 52 px y esquinas de 16 (como el resto de dorados). Si quieres también esquinas de 16 en las píldoras, dímelo.
5. **Panel de administrador:** también usa ya `BOTON_ORO` en los botones dorados que tenía hechos a mano.
