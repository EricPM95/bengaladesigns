Hola. TANDA V74: LAS DECISIONES QUE ERIC HA TOMADO SOBRE TUS PREGUNTAS (CHECKLIST_V52_V58 34-48, la V68 y las excursiones). Tanda corta, MODO RÁPIDO (salvo lo que toque el motor: §2). Empieza SOLO cuando la V73 esté subida a main. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:**
- nota `_estado_v74.md` en la rama `estado` al empezar y cada 30 minutos;
- 2 agentes como mucho, 1 Chrome, un servidor;
- **no apagues el PC ni programes el apagado**;
- ninguna prueba toca el Supabase de producción;
- nunca escribas ni enseñes una clave;
- **solo se cambia lo que se dice aquí:** nada que funcione se quita, y nada se inventa (CLAUDE.md);
- **todo vale para todos los destinos.**

**Migraciones:** Eric ha comprobado en Supabase que **TODAS están aplicadas, de la 0065 a la 0095** (la 0076 va dentro de la 0077). Quita de tus DECISIONES y CHECKLIST cualquier «sin aplicar».

**En el REPASO, una línea por cada punto con ✅, 🟡 o ❌ y por qué.**

## 1. Excursiones desde Roma y Civitatis
- **Pompeya:** la actividad 149.
- **Florencia:** la 3742.
- **Tívoli:** la 146.
- **Nápoles en tren y Costa Amalfitana:** ninguna. Quien vaya por su cuenta guardará su billete con «+ Añadir una reserva» (V75-V76).
- Son números del sandbox: al pasar a producción se repite la búsqueda (ya decidido, V60-4).
- **Radios de las zonas de Lanzarote:** 4, 4, 3,5, 4, 10 y 9 km, como los propusiste.
- **«Instalarse» en Roma se queda en 60 minutos** (Eric: «mejor prevenir que curar»). Lanzarote, 20.

## 2. El motor (con pruebas: pasa la `pruebaV68` y las de Reorganizar)
- **Vuelo tarde (V68):** un imprescindible (los Museos Vaticanos) o el Free Tour que no cabe el día de llegada **entra en el mejor día siguiente**. Lo que sale de ese día para hacerle sitio es lo MENOS importante (un «de camino», algo opcional), y eso va a Lugares pendientes. Un imprescindible o algo con reserva no va a pendientes mientras otro día tenga algo menos importante.
- **(34) Lanzarote sin Reorganizar:** la hora de salir al aeropuerto y el aviso «Tu vuelo sale a las … y hoy no te da tiempo a todo» los calcula el motor de coche, igual que en Roma.
  - Se calcula una vez y solo se repite si cambia el vuelo, el alojamiento o el coche.
  - Nunca a cada minuto.
- **(42) Una visita que acabaría después del cierre:**
  - si se queda con más de la mitad de su tiempo, se acorta hasta el cierre;
  - si no, va a otro día (y si no cabe, a Lugares pendientes).
- **(41) Minutos de Lanzarote:**
  - El Golfo, sin «hasta el atardecer» (el atardecer ya es su propia parada), con su tiempo normal de visita;
  - Playa de Papagayo, 180;
  - Salinas de Janubio, 30;
  - Montaña Bermeja, 20.
  - El resto, igual.

- **(CHECKLIST_V68_V71, 7) Al generar un viaje con vuelo,** la misma regla que Reorganizar (cambio mínimo, nada se pierde, lo importante primero), no la vieja «el día 1 pasa al día 2» de la V61. Una sola forma de adaptar los días al vuelo.
- **(V68_V71, 12) El sitio que sale por el viento o la lluvia va de verdad a Lugares pendientes** (con [Deshacer]), para poder hacerlo otro día. Así «A Lugares pendientes» es verdad.
- **(V68_V71, 17) Marca los «de camino»** en los datos de Roma (Fuente de las Tortugas, Elefantino…) y de Lanzarote con `passThrough`, para que nunca salgan como tarjeta. **No valen lo mismo que una visita:** cuando algo tiene que salir de un día, los «de camino» salen los primeros, sin preguntar ni avisar.

## 3. Restaurantes
- **(44) Un restaurante sin horario o sin días confirmados YA NO se esconde.** Sale como los demás y en su caja de horario pone **«Revisa el horario»**, en vez de las horas.
  - Vale para `dias_sin_confirmar` (con `true` o con días) y para los que no tienen horario.
  - **Actualiza la regla V58 de CLAUDE.md** («con `true` no sale nunca» ya no vale).
  - Vale para todos los destinos.
  - Liken y Brisa Marina salen así.
- **(43) La comida del último día en Arrecife:** usa los restaurantes de Arrecife que, según sus datos, **abren a mediodía**.
  - Si son menos de 3, busca 3 o 4 más con datos reales (nombre, dirección, coordenadas y horario de la web oficial o de Google) y apúntalos en DECISIONES.
  - Nada inventado.
- **(45) Liken, Tacande, El Risco y los demás sin coordenadas:** busca sus coordenadas reales por su dirección y apúntalas en DECISIONES con la fuente.

## 4. HOY y textos
- **(35) Después del último vuelo:**
  - «Buen viaje de vuelta» se queda;
  - **el resumen del viaje sale 2 horas después de «Ya en el aeropuerto»** (VL3, con el GPS o tras salir hacia el aeropuerto);
  - y, si no ha pasado por ahí, **2 horas después de la hora del vuelo de vuelta**;
  - después, `HoyDespuesV2`.
- **(36)** El probador: traduce el código `free_tour_con_hora_ya_empezado` a una frase y arregla «El el día 1» (`contraer` / `lugarCon`).
- **(48)** El aviso de abajo: «Tu entrada del Coliseo, el domingo 18», igual que el título de la hoja E1.
- **(46 y 47)** Se quedan como están.

## 4b. Pequeños de la V68-V71
- **(27)** El fundido de las fotos también en las filas pequeñas (añadir parada, buscador, comidas y cerca), la galería y las fotos de personas.
- **(29)** Borra la rama «oculto» de `HojaDelVisto` (`logros/visto/Hojas.tsx`), que ya no se usa.
- **(13)** «Si te sobra tiempo» y «Lugares pendientes» NO se unen: son cosas distintas (extras del día y lo que no cupo).
- **(6, 8, 11, 14, 15, 16, 18, 19, 20, 23, 24, 28, 31)** Se quedan como los hiciste.
- **(30)** Sin tope de pantallas de logros: cada una la suya, con «Saltar todo».
- **(21)** El medio «coche» de verdad en el motor, más adelante (apúntalo).
- **«Si te sobra tiempo»:** Eric aún no lo ha visto. En el REPASO, una captura en modo iPhone de cómo se ve en HOY y en DÍAS, en Roma y en Lanzarote, con una frase de qué es y de dónde salen sus sitios.

## 5. Para el fin de semana de pruebas (NO en esta tanda; solo apúntalo en el CHECKLIST)
- **(37) App rápida:** medir cuánto tarda en abrir cada pantalla en modo iPhone y optimizar lo más lento, sin subir el tope de 340 KB (cargar más pantallas solo al abrirlas).
- **Supabase sigue al doble de lo que debería.** Busca qué consultas bajan más y redúcelas (reglas V36).
- **(38)** Lo que no se comprobó en el probador: el último día, Lanzarote, y el billete y el alojamiento dentro de sus tarjetas.
- **El barrido de 365** (V68_V71, 9).

## 6. Pruebas
- Las del §2: `pruebaV68`, las de Reorganizar y las de reservas, más `pruebaJutrip`. `npm run build` sin errores.
- **El REPASO, corto:** antes y después de:
  - Roma con el vuelo a las 17:30 (los Vaticanos ya no van a pendientes);
  - el último día de Lanzarote (hora de salir, comida en Arrecife);
  - un restaurante con «Revisa el horario».
- Qué no has podido comprobar.

Cuando acabe, con las pruebas en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción (jutrip.app), en modo iPhone, que carga. Si falla, no hagas push y explícalo. **No apagues el PC.** Al final, reinicia el api-server.
