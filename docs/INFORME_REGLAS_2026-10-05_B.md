# Informe: máximos, cierres, noche y Free Tour (5-oct-2026, tarde)

## 1. Reglas cambiadas o añadidas
R-1 (acortar, mínimo 20 min), R-8 (Free Tour), R-16 (mirador ±30 y esperas de 90), R-37 (cena a 20 min de la nocturna, taxi si no), R-38 a R-43 nuevas. Detalle en `REGLAS_RUTAS.md` y `reglas/CAMBIOS.md`.

## 2. Datos tocados
- `roma.json`: `min_max` en los 85 sitios; `noche_especial` (Nochebuena = Trevi); Enoteca Corsi pasa a «Centro Histórico»; Coppedè sin `zona` forzada; Villa Borghese 90.
- `D2.json`: variante del miércoles (Museos → comida → Plaza y Basílica → Castillo y Puente), sin volver atrás.
- `D3.json`: Trevi a las 8:00 antes del tour. `D6.json` y `D7.json`: `una_vez` en Monti, Via dei Fori, Navona, Campo de' Fiori, Plaza Farnese y el Puente.

## 3. Resultado de la prueba (6.987 viajes)
Ver `PRUEBA365.md`. Antes 6.120, ahora 8.968, porque hay 12 comprobaciones nuevas.

## 4. Dónde hay algo concreto en el código
- `writtenTrip.js`: un adelanto de lo del pool que cierra pronto (la última entrada antes de las 19:00) mueve la parada al principio de la tarde. Es una regla general (`last_entry`), no un sitio.
- Constantes de número: 1.500 m (nocturna cerca de la cena, experiencia cerca de la mitad del día), 90 min (descanso después de comer).
- En la prueba: «acortada a menos de 20» solo salta por debajo de 15 min, porque el redondeo de horas (de 10 en 10) cambia 5 min.
- La tabla de etiquetas de zona de restaurantes está en `auditoriaReglas.mjs` (solo en la prueba).
