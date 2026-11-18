Hola. TANDA V8: RETOQUES DEL PERFIL (18-nov). Va después de la V7. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `ULTIMOS_RETOQUES.zip` (Descargas). Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. El diseño, exactamente igual; los textos, los de este prompt; si no coinciden, manda el prompt. Design pone fotos de muestra: tú pones las de verdad.
- **Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v8.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción.
- **Regla de Eric para toda la tanda: aire entre bloques.** Más espacio entre un bloque y el siguiente que el que deja Design, para que todo se vea limpio. Por ejemplo, entre el bloque del viajero y «Mis viajes», y entre «Mis viajes» y «Mi vitrina».

## 1. El Perfil (Design: «Perfil», con el bloque del viajero, la hoja «Elige tu título» y el Perfil de nivel 1)
- **El bloque del viajero, en una tarjeta blanca:**
  - el avatar con su marco;
  - «Hola, Alice» y «Nivel 2 · Soñador»;
  - el título de viajero como distintivo pequeño (con su chapa);
  - y la barra de nivel dentro, con «285 / 900» a la izquierda y «Te faltan 615 EXP para el nivel 3» a la derecha.
  - Fuera la pastilla con flecha de desplegable.
- **El título:** se queda (decisión de Eric). Al tocarlo, la hoja «Elige tu título», con cada título, su chapa, su línea y la marca del elegido. Sin títulos ganados, no sale el distintivo.
- **«Mis viajes»:**
  - el lápiz redondo junto al título (en vez de «Editar»), que hace lo mismo que «Editar» hoy;
  - «Ver todos (3) ›» a la derecha;
  - **las tarjetas:**
    - sin la etiqueta «Hecho»;
    - la foto del viaje con el nombre y las fechas;
    - la cámara arriba a la derecha, como ahora;
    - debajo, «11 paradas · 5 fotos» en texto y una flecha redonda pequeña a la derecha, en vez del botón [Abrir este viaje];
    - toda la tarjeta abre el viaje.
- **«Mi vitrina»:** el «+» más pequeño, como Design. Sin logros, los huecos con su borde de puntos.

## 2. La prueba
- `pruebaJutrip` y las del Perfil en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV8`:**
  - el Perfil con título y sin título;
  - la hoja de títulos (cambiar y que se guarde);
  - las tarjetas sin «Hecho», con la flecha y abriendo el viaje al tocar;
  - el lápiz;
  - el «+».
- **En el REPASO:** capturas de móvil al lado de Design y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
