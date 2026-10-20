# Para las tandas menores (Claude, 19-oct-2026)

- **El número de personas en cada entrada (Eric, 19-oct, 12:37).** Por confirmar con Eric qué quiere exactamente: en RESERVAS, cada entrada dice para cuántas personas es (las del viaje, por ejemplo «2 personas»), y el enlace para comprar va ya con ese número.
- **«Parque de Villa Borghese» repetido** en los días escritos de Roma: `data/dias/roma/listas.json`, `dias.D4.partes.unica.manana[6]` y `[7]`. Quitar el repetido. Lo usa el motor: muestra de 60 fechas, push y las 365.
- **Las fotos de los 4 sitios que faltan:** Via del Babuino, Terraza Largo Gaetana Agnesi, Colle Oppio y Mirador de San Pietro in Montorio.
- **Los enlaces de afiliación:** lista de todos los botones de compra con su código y sin él (falta el de Booking, y los de GYG y los traslados privados).
- **EXPLORAR del invitado:** la barra «Tu propuesta» queda por debajo de EXPLORAR; mientras explora solo ve «Añadido al domingo 18 ✓». Mirar si se deja más claro.
- **Sin probar de la parte 3B:** la devolución de un pago (`charge.refunded` con `stripe listen`) y la prueba larga del motor (`pruebaFase6y5_motor`, con su lanzador `_correr6y5.mjs procesos=12`, unos 6 minutos).
- **Civitatis (respuesta de Magalí, 19-oct):**
  - con `aid=5206` y `cmp` en el `url`, la venta cuenta como nuestra;
  - descripciones y valoraciones (`description`, `score`, `reviews`): se pueden enseñar, **tal como vienen, sin cambiarlas** (ni resumirlas ni reescribirlas). Citar a Civitatis está permitido, no obligado: seguimos sin nombrarla en la app;
  - la caché, **4 horas como mucho** (detalle de actividades, destinos, categorías, idiomas y monedas). Precios y plazas, menos tiempo. Comprobar que lo que guarda Code en Supabase cumple esto;
  - pedimos el precio **PVP**. La moneda va en cada petición (`currency`): la del viajero (por su país o idioma), no la del destino. Un español en Cancún, en euros; un mexicano en Roma, en pesos. Afecta también al presupuesto de la app (hoy en euros). Para cuando lleguen los destinos de Latinoamérica;
  - fotos: tras la certificación, elegir «base completa» o «solo libres de derechos»;
  - certificación: avisarles cuando acabe el desarrollo; mandan un documento con casos de prueba. El límite, 20 peticiones por segundo, igual en producción.
- **Por decidir (Eric):** si añadir una reserva da EXP (propuesta: 15, como mucho 5 por viaje).
