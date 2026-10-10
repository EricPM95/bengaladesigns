# Progreso de la Tanda 6z2 (el precio de todo lo que se añade, la moneda y el presupuesto)

- ✔ **0. Documentos.** `PROMPT_TANDA6Z2_PARA_PEGAR.md`, `PENDIENTES_6K.md` y el diseño `docs/diseno/presupuesto/` subidos tal cual.
- ✔ **1. El campo «Precio (opcional)» en la hoja de la hora.** En las entradas y las excursiones (desde RESERVAS, la pestañita y la ficha: es la misma hoja). Total de todas las personas, en la moneda del viajero (con un toque, la del destino u otra). El Free Tour no lo lleva.
- ✔ **2. Dónde se ve.** La línea de lo reservado, en RESERVAS, lleva el precio al final («✓ Coliseo, Foro y Palatino · 13 oct · 09:30 · 54 €»). En DÍAS, no.
- ✔ **3. Llegada y vuelta (de pago).** El mismo campo en la hoja de la hora de la ida y de la vuelta; si es un mismo billete, se pone en la ida y la vuelta se deja vacía.
- ✔ **4. Todo lo demás.** Alojamiento (6z, ahora con moneda), seguro, eSIM, coche de alquiler (RESERVAS y el primer día), billetes de transporte de varios destinos. Lo que es solo un enlace a la tienda (seguro, eSIM, coche): al pulsarlo se marca como añadido (como siempre) y debajo sale «Añadir precio». Ver PREGUNTAS (tarjeta sin comisiones, traslados).
- ✔ **5. La moneda.** Moneda del viajero por su origen, cambiable; la del destino en los datos (`moneda`); formato único; Stay22 con `currency=`; cambio del BCE pedido por el servidor una vez al día. Ver el informe.
- ✔ **6. La pantalla del presupuesto.** Con el diseño: cabecera con destino, fechas y personas, tarjeta oscura con el total, el «por persona» escondido con el ojo y la barra de colores, los cuatro bloques, «Extras» con su formulario y el total otra vez. La abren la bolsa de la barra de abajo y la fila «Presupuesto · 54 €» de RESERVAS. **El presupuesto viejo (`BudgetPanel`) ya no existe.**
- ✔ **7. Pruebas.** Ver el informe.
