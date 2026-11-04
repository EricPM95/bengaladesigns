Hola. TANDA HOY1: EL NUEVO HOY, PARTE 1 (4-nov). Va DESPUÉS de la LL (las dos partes) y de la LZ3b: si estás con ellas, acábalas primero con sus push. Eric la usará en Lanzarote desde el domingo 8: tiene que estar subida el VIERNES 6 por la noche como tarde. Si no llega todo, sube lo que funcione (en 0 fallos) en el orden de abajo y dime lo que falta. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `HOY_1.zip` (en la carpeta del proyecto o en Descargas). Pon al día `docs/diseno/proyecto/` (sin `uploads/` ni `Archivo/`). La página es `App HOY.dc.html`, apartado 04 (H y K) y, del 03, solo lo que se nombra aquí. **El diseño, exactamente igual; los textos y los datos, los nuestros.**
  - **Correcciones a Design (manda el prompt):**
    - del apartado 01 NO valen la 3b (la tarjeta vieja del día de llegada), la 5 (el «Hoy vuelves a casa» viejo) ni la 7 (la hoja vieja de «No me da tiempo»);
    - en el 02, la lógica del Visto y las fotos se queda, pero la lista es la «TU DÍA» del 04.
- **Como siempre:** HOY durante el viaje es del pase (y del día de prueba). Roma y Lanzarote. Lanzarote sigue oculto. 2 agentes como mucho, 1 Chrome, un servidor. Nota de estado (`_estado_hoy1.md`) a la rama `estado` cada 30 minutos y al acabar cada apartado. No apagues el PC.
- **Regla de siempre:** nada se mueve solo. Lo que cambia el día lo propone y lleva [Deshacer]. Las reservas no se tocan nunca.

## 1. La siguiente parada y sus estados (H1 a H6)
- **Por llegar** (H1, y H2 en coche):
  - el mapa pequeño y el trayecto a pie o en coche;
  - si el sitio tiene historia, la línea «¿Te cuento la historia mientras llegas? [Escuchar]» (idea de C2);
  - **«Sal ahora para llegar a tu turno de las 9:00»** solo cuando toca: desde 15 min antes de la hora a la que hay que salir; en rojo «Vas tarde para tu turno…» (H1b) si ya no llega. Solo con hora fija (turno o reserva).
- **Ya estás aquí** (H3):
  - por la ubicación, con permiso, dentro del radio del sitio (los radios de los logros), o tocando la tarjeta;
  - botones: [Tu entrada] (si la hay), [Qué vas a ver], [Escuchar historia] (si la hay), [Dónde has aparcado] (solo en coche), [Haz tu foto] (el camino de logros de siempre), [Necesito más tiempo] y [He terminado] (= el Visto de ahora).
- **Necesito más tiempo** (H3b):
  - +15 y +30 min;
  - con pase, el resto del día se corre, quitando primero lo opcional, con [Deshacer];
  - sin pase, solo se apunta.
- **Completada** (H4): la siguiente parada y, si ha ganado algo, la línea dorada del logro.
- **Saltada** (H5): la tarjeta pasa a la siguiente; en la lista, tachada con [Recuperar]; el aviso de abajo con [Deshacer].
- **Por la mañana** (H6): «Sal de casa a las…» (con pase y zona; en coche, con su trayecto).

## 2. La lista «TU DÍA» (H1, H4, H4b)
- Todas las paradas del día en orden:
  - las hechas, con ✓ y apagadas;
  - la de ahora, marcada con «Ahora»;
  - las que vienen, con su hora;
  - la comida y la cena incluidas;
  - las saltadas, tachadas.
- **Se cierra y se abre** (H4b: «Tu día · 2 de 6 · ver todo»). Que el número cuadre con «Parada X de Y».

## 3. La cámara de viaje (K1 a K4) y fuera de ruta (H8, H8b)
- **La cámara se ve SIEMPRE en HOY:** antes, durante y después del viaje, también sin pase.
  - **Sin pase:** con el candado y «Solo disponible con el Pase {destino}».
  - **Con pase, antes del viaje:** «Podrás usarla durante tu viaje, del … al …».
  - **Con pase, durante el viaje:** la hoja de explicación solo la primera vez.
- **Haces la foto y la app mira tu ubicación:**
  - **en un sitio con logro, esté o no en tu ruta**, «¡Eh! Aquí hay algo…» y el logro como siempre. Incluye los `sitios_extra` de los logros, como La Graciosa;
  - **si no**, «Guardada en los recuerdos de hoy»;
  - **sin conexión**, se guarda y se comprueba al volver la conexión (K4).
- **Fuera de ruta** (H8 y H8b):
  - si estás en un sitio con logro que no está en tu ruta de hoy, la tarjeta «Estás en La Graciosa · Haz tu foto para ganar "La octava isla"»;
  - si pasas al lado de algo con recompensa, «Estás junto a… ¿Lo añadimos?» con [Añadir a mi ruta] y [Ahora no].

## 4. «Cerca de ti» (K5 a K8)
- La fila fija debajo de la tarjeta. **Roma:** Baños · Fuentes · Comer. **Lanzarote:** Gasolineras · Aparcar · Comer.
- Cada sitio de la hoja se toca entero y abre Google Maps o Apple Maps con el camino: a pie en Roma, en coche en Lanzarote.
- Sin pase, con candado.

## 5. El juego (C16, C17 y C18 del apartado 03)
- **Al acercarte a un sitio con un emblema oculto sin ganar:**
  - «Algo brilla cerca de aquí…» (a unos 500 m);
  - «Más cerca…» (a unos 150 m);
  - al llegar, la pantalla de siempre: «¡Aquí se esconde un Emblema Oculto!».
  - Una vez por sitio y por día, sin agobiar.
- **El reto del día** (C18): por la mañana, si una colección se puede completar hoy con las paradas del día, «Hoy puedes completar … te faltan 2».

## 6. Los avisos del tiempo en directo (H12, C14, C15)
- Con la previsión de Open-Meteo que ya usamos (añade las nubes y las rachas de viento):
  - **Lluvia:** [Ver alternativa] → C14, con un sitio a cubierto cerca. Lanzarote: Cueva de los Verdes, Jameos, la Fundación, el Campesino, el Castillo de San José o «Hoy toca descansar». Roma, lo de ahora. Y C15 cuando para de llover.
  - **Nubes en el norte de Lanzarote** sobre un mirador del día (Mirador del Río, Guinate, el Bosquecillo, la Ermita de las Nieves): el aviso y la alternativa (Guinate si solo está tapado el Río, o cambiarlo por algo que no sea mirador).
  - **Viento fuerte:** aviso en Las Grietas, Los Hervideros y los miradores de Famara.
- Dime los umbrales que pones.

## 7. El atardecer y mañana (H13)
- El sol del día con su sitio («Desde el Pincio, a 10 minutos» o El Golfo en Lanzarote) y [Cómo llegar].
- Al acabar el día: «Mañana: … · sales a las 9:26 · turno en la Cueva a las 11:30», con un consejo si lo hay.

## 8. «Hoy vuelves a casa» (H14, H14b)
- Una sola tarjeta, con pase y sin pase.
- En Lanzarote, con el coche: hasta qué hora, el trayecto al aeropuerto y «Devuelve el coche en la T1».

## 9. Sin internet (H15)
- Lo de hoy queda guardado en el móvil: la ruta del día, las fichas de sus paradas, el texto de sus historias y los billetes. Así HOY se ve sin cobertura.
- La línea «Sin conexión: lo de hoy está guardado en tu móvil».

## 10. Ajustes (C27)
- «Sonido de los momentos», «Avisos en el móvil» y «Sugerencias del compañero» (esta apaga los apartados 5 y 3-fuera de ruta).

**NO van en esta tanda (HOY2, después):** «Cambiar plan» y sus propuestas (H9, H10, C4-C6, C8-C12, C19-C25).

## 11. La prueba
- `pruebaJutrip` y las de HOY que ya hay, en 0. Las que cambien, con «antes → ahora → decisión de Eric».
- **Prueba nueva `pruebaTandaHOY1`:**
  - los estados de la tarjeta;
  - «Sal ahora» solo cuando toca y en rojo si tarde;
  - la lista completa y plegable;
  - la cámara con y sin pase, antes y durante, con logro, sin logro y sin conexión;
  - fuera de ruta con La Graciosa;
  - el juego, una vez por sitio y día;
  - los avisos de lluvia, nubes y viento con datos de mentira;
  - sin internet;
  - sin textos de Roma en Lanzarote.
- **En el REPASO, capturas de móvil** de cada estado, en Roma y en el viaje de Eric en Lanzarote (domingo 8 y lunes 9). Y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
