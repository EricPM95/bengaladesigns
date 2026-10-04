# Los textos del Castillo y el Puente en D2 («Por qué aquí»)

Para que los cures. **Dónde se escriben:** el texto de una parada sale, por este orden, de (1) el `texto` de la parada en el día escrito (`data/dias/roma/D2.json`), (2) `por_que_lugares` en `data/pipeline_v2/roma.json`, (3) el texto propio del lugar (`tip`), y (4) los textos de noche (`destination_config.night_view_texts`). Con el atardecer del Puente (D2 y D3), el `texto` está en la parada del Puente.

## Lo que hay escrito en los datos

### Castillo de Sant'Angelo

- **por_que_lugares:** "Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas. Desde el Vaticano sale un pasadizo elevado por el que huían los papas cuando Roma estaba en peligro. Sube hasta la terraza del ángel: las vistas son de las mejores de la ciudad."
- **por_fuera:** "Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Míralo por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante."
- **tip del lugar:** "La terraza superior tiene una de las mejores vistas de Roma. El puente de los ángeles (Puente Sant'Angelo) de Bernini es precioso — crúzalo sí o sí. Calcula 1h dentro + 15 min en el puente."
- **night_view_texts:** null

### Puente Sant'Angelo

- **por_que_lugares:** "El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo."
- **por_fuera:** null
- **tip del lugar:** "El puente de los ángeles de Bernini, justo saliendo de Castillo de Sant'Angelo — crúzalo despacio, cada ángel lleva un símbolo de la Pasión."
- **night_view_texts:** "Ya es de noche: los ángeles de Bernini iluminados, el Castillo encendido y el Tíber reflejándolo todo."

## Los `texto` escritos dentro de D2.json

- Puente Sant'Angelo (atardecer): Míralo desde el puente de los ángeles con la luz del atardecer: la fortaleza se vuelve naranja y el Tíber la refleja.
  - en: .tarde.A.paradas[3]
- Puente Sant'Angelo (atardecer): Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo.
  - en: .tarde.D.paradas[7] · .variantes.entrada:mediodia.tarde.A.paradas[2] · .variantes.entrada:mediodia.tarde.D.paradas[7] · .variantes.entrada:tarde.tarde.D.paradas[1]

## Lo que sale hoy en pantalla (campo «Por qué aquí»), por versión del día

| Versión | Fecha de prueba | Parada | Cómo sale | Texto |
|---|---|---|---|---|
| A (invierno) | 2027-01-14 15:55 | Castillo de Sant'Angelo | por fuera | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Míralo por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| A (invierno) | 2027-01-14 16:40 | Puente Sant'Angelo | atardecer | Míralo desde el puente de los ángeles con la luz del atardecer: la fortaleza se vuelve naranja y el Tíber la refleja. |
| B (entretiempo corto) | 2027-03-04 14:50 | Castillo de Sant'Angelo | por fuera | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Míralo por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| B (entretiempo corto) | 2027-03-04 15:15 | Puente Sant'Angelo | parada | El puente de los ángeles de Bernini, con el Castillo delante. Es el mejor sitio para la foto del Castillo. |
| C (entretiempo largo) | 2027-04-01 18:15 | Castillo de Sant'Angelo | por fuera | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Míralo por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| C (entretiempo largo) | 2027-04-01 18:40 | Puente Sant'Angelo | atardecer | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
| D (verano) | 2027-06-17 19:15 | Castillo de Sant'Angelo | por fuera | Empezó siendo la tumba del emperador Adriano y acabó como fortaleza de los papas, con un ángel en lo alto. Míralo por fuera: la mejor foto es desde el puente, con los ángeles de Bernini delante. |
| D (verano) | 2027-06-17 19:55 | Puente Sant'Angelo | atardecer | Al caer el sol, el puente de los ángeles de Bernini se queda con el Castillo iluminado detrás y la cúpula de San Pedro recortada al fondo, río abajo. |
