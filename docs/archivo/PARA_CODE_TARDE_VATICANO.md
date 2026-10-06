# Fuera la regla de «no repetir de noche»

**Decisión del usuario:** se quita la regla que impide ver de noche un sitio que ya has visto de día, sea esa misma tarde o a la mañana siguiente.

Ver algo de día y volver de noche es otra experiencia y vale la pena. Por ejemplo: bajar por Via della Conciliazione al Castillo y al Puente Sant'Angelo con el atardecer, cenar cerca y volver al Puente de noche, o irse al centro de noche.

El ejemplo que lo ha destapado: un viaje de 4 días en verano, día 1 (Vaticano).
- La Basílica termina a las 19:25 y luego solo hay «De camino · Borgo Pio».
- La cena es a las 20:30 («12 min andando desde el aperitivo», pero no se ve ningún aperitivo).
- El Puente Sant'Angelo va a las 22:00 como nocturna, con la etiqueta «Revisita».
- Falta el paseo de la tarde por Via della Conciliazione, el Castillo por fuera y el Puente al atardecer.

Qué hacer:

1. **Quitar la regla.** Quítala del motor y de INVARIANTES (la 413 o la que sea), y la comprobación «noche y mañana siguiente» de la prueba de repeticiones. Las otras dos comprobaciones se quedan, porque son de día: Trevi a las 8:30 el día del Free Tour que pasa por Trevi, y el mismo barrio dos veces de día.
2. **El día del Vaticano lleva siempre Via della Conciliazione, el Castillo de Sant'Angelo y el Puente.**
   - Via della Conciliazione es el camino lógico entre San Pedro y el Castillo: siempre se va por ella, en el orden que toque (de San Pedro al Castillo o al revés).
   - **El atardecer, solo si cae bien.** Si la hora del atardecer de esas fechas encaja con la salida de la Basílica, el Castillo y el Puente van con esa luz. Si no encaja, van a su hora y no pasa nada: no se fuerza ni se estira nada para que coincida.
   - Después, la cena cerca. La nocturna después de cenar puede volver al Puente o ir al centro, lo que el motor elija como mejor.
3. **Sin huecos antes de cenar.** Si después de la última visita queda más de 45 min antes de cenar y hay un sitio de la ruta a un paseo, va ese sitio. Busca en las 365 fechas cuántos días tenían ese hueco y cuántos quedan.
4. **Revisita en la nocturna:** la etiqueta «Revisita» no sale en las experiencias nocturnas. Ver de noche lo que viste de día es la gracia de la nocturna, no una repetición.
5. **El aperitivo invisible:** si la cena dice «desde el aperitivo», el texto tiene que decir desde dónde se va de verdad (la parada o el paseo de justo antes). El aperitivo pasa a «Pasea y piérdete por {zona}» en PARA_CODE_PASEO_Y_FOTOS.
6. **El día escrito se respeta:** el día del Vaticano lleva siempre Via della Conciliazione, el Castillo de Sant'Angelo (por dentro o por fuera) y el Puente, como está escrito. Nunca se quitan para cumplir una regla general. Busca en las 365 fechas cuántos días del Vaticano salen hoy sin alguno de los tres, dime por qué, y que queden en 0 (si el Castillo está cerrado ese día, va por fuera). Añádelo a la prueba para que salte solo.
7. **Pruebas:** las de siempre, igual o mejor.

Commit y push si sale bien. Informe corto con ese día antes y después, parada a parada.
