Hola. ARREGLO URGENTE: ERIC NO VE LAS FOTOS NUEVAS EN SU VIAJE (6-nov, 16:18). Va ya. Si estás con otra cosa, acaba lo que tengas a medias y haz su push. Este mensaje acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Lo que pasa:** Eric abre su viaje a Lanzarote (creado ANTES de `da5786a`) y no ve las fotos nuevas.

**Lo que sospecho** (mira el código y dime cuál es, o si son las dos):
1. **El viaje guarda la foto de cada parada al crearse.** `DayDetailPanel` y `StopAccordion` usan `stop.photoUrl`, que viene del viaje guardado, y el arreglo de `da5786a` se aplica en `writtenDays.js`, al generar. Los viajes ya creados se quedan con las fotos viejas (el mapa de Haría, la estatua…). Puedes leer su viaje en Supabase solo para mirar, sin cambiar nada.
2. **La caché.**
   - `vercel.json` sirve `/fotos/*` con `max-age=31536000, immutable`, y el service worker (`sw.js`, «fuente») da primero la copia guardada.
   - Las fotos que se han sustituido con el MISMO nombre (`montanas_del_fuego.jpg`, `jameos_del_agua.jpg`…) se quedan viejas en el móvil, en teoría durante un año.

## Lo que hay que hacer
1. **Viajes ya creados:** en los destinos curados (Lanzarote y Roma), la foto de cada parada se toma de NUESTROS datos al enseñarla, con el mismo cruce de `da5786a` (id o nombre normalizado), no de la foto guardada en el viaje.
   - Si nuestros datos no tienen foto: en Lanzarote, el fondo de color; en Roma, lo de ahora.
   - Que valga también para la ficha, HOY, la lista «Tu día», el álbum de cromos y el resto de sitios donde salga la foto de una parada.
   - En Roma, las fotos tienen que salir IGUAL que ahora: compruébalo.
2. **Que una foto cambiada se vea siempre:**
   - cada dirección de foto lleva su versión (por ejemplo `?v=` con un trozo del hash del archivo, sacado de `_fotos.json` o al construir);
   - así, cuando una foto cambia, la dirección cambia y el móvil la descarga de nuevo. Lo de `immutable` se puede quedar.
   - Que el service worker no se quede con la copia vieja de una dirección nueva.
3. **Nada que tenga que hacer Eric:** ni borrar datos del iPhone ni rehacer el viaje. Si de verdad hiciera falta algo, dímelo en una frase sencilla.

## La prueba (corta)
- Un viaje a Lanzarote creado con los datos de antes de `da5786a` (o uno con `photoUrl` viejos a mano) enseña las fotos nuevas.
- Una foto sustituida con el mismo nombre cambia de dirección.
- `pruebaJutrip`, `pruebaFotosLanzarote` y la muestra de 60 de Roma, idéntica.
- **Después del push, en producción y en modo iPhone:**
  - las fotos nuevas salen en un viaje a Lanzarote ya creado;
  - Haría tiene el pueblo con palmeras, no el mapa;
  - Timanfaya tiene su foto.
  - Captura en el REPASO.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
