# Invariantes del motor de rutas

Lo que el motor nuevo (Prompt 9, Entrega B) tiene que seguir cumpliendo aunque se reescriba desde
cero. **No son preferencias de estilo: cada línea de esta lista se escribió después de ver el fallo
en pantalla.** Reescribir sin portarlas es volver a comprarlas de una en una.

Formato: **qué** debe cumplirse · *por qué* (el fallo real que lo motivó) · dónde vive hoy.

---

## A. Lo que nunca puede salir mal en pantalla

1. **El Free Tour es siempre la PRIMERA parada de su día.**
   *Se probó sin red y Claude lo colocaba a media mañana, detrás de un museo que abría antes: un
   free tour al que llegas tarde no existe.* Hoy: la regla en el prompt + `enforceFreeTourFirst`
   como red de seguridad que reordena si aun así se cuela algo antes.

2. **Ninguna parada empieza antes de que el sitio abra.**
   *El Coliseo programado a las 07:30 (abre 08:30) y anunciado como "Acceso libre" — una entrada de
   18€ presentada como gratis.* Hoy: `validateStopHours` en el servidor + `parseOpeningMinutes` en
   el cliente, con parser **multi-tramo** (un horario partido "07:30-12:30, 16:00-19:30" tiene que
   leerse entero; leer solo el primer tramo cerraba iglesias a mediodía para siempre).

3. **`closed_on` se respeta cuando el viaje tiene fechas exactas.**
   8 lugares lo llevan (Vaticanos: domingo; Borghese, Mercados de Trajano, Ara Pacis, Capitolinos,
   Caracalla, Domus Aurea: lunes; Villa Farnesina: domingo). Sin fechas, la regla no aplica.

4. **Ningún lugar se repite entre días** salvo que sea una revisita explícita.
   *Plaza Colonna salió los días 2 y 3 del mismo viaje.* Ojo: el nombre es la clave de unión en toda
   la app (fichas, likes, caché de fotos), así que el deduplicado va por nombre exacto.

5. **Las horas que se muestran son las que se usan.** Si el motor decide 09:30, la ficha, el mapa,
   RESERVAS y Modo Hoy dicen 09:30.

6. **Nada se pinta en (0,0).** Las coordenadas placeholder se filtran antes del mapa y antes de
   cualquier cálculo de distancia (`hasRealCoordinates`), o el mapa se va al Golfo de Guinea y los
   "a 5 min a pie" salen en miles de km.

---

## B. Lo que manda sobre el algoritmo

7. **El pool del viajero va sí o sí**, por encima del reparto curado. Si no cabe, hay que
   **desalojar**, no solo reubicar — hoy solo sabe reubicar y por eso en 2 días la Galería Borghese
   se descarta con un log de "ningún día tiene hueco".

8. **Los `level` mandan el orden de relleno**: 12 lugares de nivel 1, 28 de nivel 2, 27 de nivel 3.
   Nivel 1 es "si vienes a Roma y no lo ves, la ruta ha fallado".

9. **`NEVER_MISS_LANDMARKS`**: la red que impide que un imprescindible desaparezca por un ajuste de
   ritmo. *Se perdió el Coliseo en una ruta real.*

10. **Los restaurantes NUNCA son paradas de la ruta.** Hoy está garantizado por estructura: viven en
    su propio array `restaurants` y `routeAlgorithm.js` no lo menciona ni una vez. **Mantener esa
    separación física** es más seguro que cualquier condición.

---

## C. Relaciones entre lugares que el JSON ya codifica

11. **`group` + `group_order` (13 lugares)**: un grupo es un bloque indivisible que se visita en su
    orden interno. Coliseo → Foro → Palatino no se separan ni se reordenan.

12. **`contained_in` (2 lugares)**: un lugar que está DENTRO de otro no se programa como parada
    suelta a otra hora del día.

13. **`related_to` (8 lugares)**: pareja natural (Castillo ↔ Puente Sant'Angelo). Se usa para
    sustituir una elección del pool por su pareja cuando encaja mejor con los intereses.

14. **`search_aliases`**: la tabla de equivalencias que hace que un viaje guardado con nombres
    antiguos siga resolviendo. Si el motor nuevo cambia nombres, los alias se actualizan **en el
    mismo commit**.

15. **Nombres en español en todas partes.** Nunca "Colosseum" ni "Fontana di Trevi" en pantalla.

---

## D. Cómo está construido el pipeline (restricciones de arquitectura)

16. **Un día por llamada, sin estado compartido.** `BLOCK_SIZE=1`: cada día se genera aislado, así
    que **toda decisión que cruce días tiene que ser determinista y recalculable desde cero**
    (reparto de noches, reparto de relleno, asignación de zonas). Si dos llamadas calculan cosas
    distintas, salen duplicados o huecos.

17. **`contentDays = días - 1`**: el último día es la vuelta (`appendReturnLegDay`) y no lleva ruta.
    *Se cayó una vez y generó un día fantasma.*

18. **El servidor no tiene Mapbox para tiempos a pie del cliente**: los tiempos reales de trayecto
    que usa la UI se calculan en el cliente (`stopScheduling.ts`). El motor produce horas; el
    cliente las afina con distancias reales.

19. **Las excursiones y las experiencias de noche no son `places`**: catálogos aparte
    (`excursions.options`, `night_experiences`, `default_free_tour`). No entran en la selección
    normal ni se pueden añadir como parada.

20. **`is_free_access` es derivado, no un campo**: `is_free_access ?? type === 'exterior'`. Solo 4
    de los 67 lo traen escrito. La misma regla alimenta el filtro "Entradas" de la UI — si el motor
    cambia el criterio, cambian las dos cosas a la vez.

---

## E. Lo que SÍ se tira (y hay que reemplazar, no solo borrar)

- **`zone_walks` (11 paseos)**: fuera. Pero eran el tapón de un agujero real — medido: en
  `tranquilo` 5 días, el día 4 acaba a las **13:45**. La tolerancia de 45 minutos no cubre seis
  horas. **Quitarlos sin resolver los días sin tarde deja esos días peor que hoy.**
- **`best_time` como restricción**: solo lo llevan 3 lugares (Coliseo, Fontana, Vaticanos) y ningún
  mirador. Pasa a bonus.
- **El redondeo al cuarto más cercano** (`:15`/`:45`, hoy el 38% de las horas): pasa a :00/:30 hacia
  arriba.
- **Los parches de reparto de relleno** (tope de tarde, fase antihuérfanos): se van con el motor
  viejo. Lo que NO se va es el problema que resolvían — que un día se quede sin contenido mientras
  otro se queda con el doble.

---

## F. Contrato de aceptación

El harness actual corre las 8 variantes × 2 ritmos y comprueba: solapes de horario, repetidos entre
días, mirador dentro de ventana, mañana dentro del corte, cena después de la última parada.

**Línea base hoy: 9 fallos conocidos** (mañanas de núcleo curado que se pasan de las 13:20 en ritmo
tranquilo — el núcleo no se recorta por diseño), 0 solapes, 0 duplicados.

El motor nuevo **no se da por bueno hasta que pasa este mismo harness ampliado a 1 día y a 6-7
días**, con esos 9 fallos resueltos o justificados uno a uno.
