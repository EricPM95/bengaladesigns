Hola. ARREGLO URGENTE: NO SE PUEDE CREAR UN VIAJE A LANZAROTE (5-nov, 11:56). Va ANTES de la HOY2. Si estás con otra cosa, acaba lo que tengas a medias, haz su push y ponte con esto. Este mensaje acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Lo que ve Eric** (administrador, de Barcelona a Lanzarote): en el paso «Conectando Barcelona con Lanzarote» sale «No hemos podido saber qué tipo de destino es Lanzarote ahora mismo. Reintentar», y no puede seguir.

**Lo que he visto en el código:**
- `/api/classify-destination` solo se salta Claude si el destino tiene `destination_config.classification` en su `data/pipeline_v2/<clave>.json`.
- Roma la tiene. `lanzarote.json` NO la tiene, así que pregunta a Claude, y esa llamada ha fallado (502).
- Aunque no fallara, un destino curado no puede depender de lo que diga Claude. Por ejemplo, si contestara «ambiguous», le saldría a Eric «¿Ruta panorámica en coche o explorar desde una base?», que no queremos.

## 1. La clasificación de Lanzarote
- Añade `classification` a `destination_config` de `lanzarote.json`, como la de Roma.
- Pon los valores que den EXACTAMENTE lo decidido el 4-nov:
  - Lanzarote se da por hecho con coche y sin pregunta de coche en el formulario;
  - en RESERVAS, el bloque del coche con «Coche de alquiler | Mi coche»;
  - para llegar desde la Península, avión.
- Mi idea es `base_y_excursiones`, con `vehiculo_altamente_recomendado: true`. Pero mira qué hace cada valor en `vehicleFlow.ts`, `transportRows.ts` y `readiness.ts`, elige lo que cuadre y dime qué has puesto y por qué.

## 2. Que un destino curado nunca dependa de Claude en el formulario
- Si a un destino curado le faltara `classification`, usa un valor por defecto y escríbelo en el log. Nunca la llamada a Claude ni el «Reintentar».
- Para todos los destinos curados, la prueba de que tienen `classification`.

## 3. Por qué ha fallado la llamada a Claude
Mira el log (`logAnthropicError`) y dime en palabras sencillas qué ha sido: la clave, el saldo, un límite o un fallo suyo. Si afecta a otras partes de la app (destinos no curados, experiencias…), dímelo también. **Nunca pegues claves ni en el chat ni en el código.**

## 4. La prueba
- **Crea de verdad, como administrador, hasta ver la ruta:**
  - Barcelona → Lanzarote;
  - Madrid → Lanzarote;
  - el viaje de Eric (ACE, domingo 8-nov a las 08:25 → viernes 13-nov a las 19:40, Costa Teguise, coche de alquiler, con pase).
- **Sin administrador,** Lanzarote sigue oculto.
- **Roma,** igual que antes (la muestra de 60, idéntica).
- `pruebaJutrip` y las de Lanzarote en 0.
- **En el REPASO:**
  - capturas de móvil del paso de transporte y de la ruta creada;
  - qué valores has puesto;
  - qué falló con Claude;
  - tu lista de comprobación de este arreglo.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Si algo falla, no hagas push y explícalo. Después, sigue con la HOY2. Al final, reinicia el api-server.
