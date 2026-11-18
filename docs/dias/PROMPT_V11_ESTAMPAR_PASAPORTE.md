Hola. TANDA V11: ESTAMPAR EL PASAPORTE (18-nov). Va después de la V10. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

- **Design:** el zip `ULTIMOS_RETOQUES.zip` (Descargas). Lleva también lo de otras tandas: aquí solo lo de estampar el pasaporte. Pon al día `docs/diseno/proyecto/`, sin `uploads/` ni `Archivo/`. El diseño, exactamente igual; los textos, los de este prompt; si no coinciden, manda el prompt.
- **Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v11.md` a la rama `estado`. No apagues el PC. Ninguna prueba toca el Supabase de producción. Para todos los destinos igual.
- **Regla de Eric para toda la tanda: aire entre bloques,** más que el que deja Design, para que todo se vea limpio.

## 1. El pasaporte se queda en blanco
- **Al abrir el pasaporte,** unos 2 segundos con la tapa granate y el círculo del globo en blanco, vacíos, hasta que carga. Parece un error.
- **Que abra al instante, como Logros (V9):**
  - guarda en el móvil lo último del pasaporte (países, sellos y el globo) y enséñalo enseguida;
  - lo nuevo llega por detrás.
  - La primera vez, el globo con su esqueleto suave, nunca un círculo en blanco.
- **Mide qué tarda** (los datos del servidor, el mapa del mundo o la animación de la tapa) y dime el antes y el después.

## 2. [Estampar mi sello] no estampa nada (fallo)
**Lo que pasa hoy, en el iPhone de Alicia** (viaje a Lanzarote del 9 al 13 de noviembre, terminado):
- en el resumen del viaje, [Estampar mi sello] abre el pasaporte en «Pasaporte · España»;
- pero el sello de Lanzarote sigue en gris, punteado, con «Por conseguir», y no se estampa nada;
- al tocar «Por conseguir», **se crea un viaje nuevo a Lanzarote**, que no debe pasar nunca.

**Encuentra por qué y arréglalo:**
- **[Estampar mi sello]** abre el pasaporte en la página de ese viaje (`sello:<id del viaje>`) y el sello SE ESTAMPA con su animación (P2e de Design), con la fecha del viaje. Después queda estampado para siempre.
- **Dime qué hace falta para ganar el sello de un destino** y por qué el de Alicia no salía. Si al reclamar con fotos (V5) o con [Yo también estaba] (V7) cambia algo, que el sello lo tenga en cuenta.
- **«Por conseguir»** es solo para destinos sin viaje terminado:
  - al tocarlo, una hoja pequeña: «Aún no has estado en Lanzarote» y [Planear un viaje] (que abre el formulario de siempre, sin crear nada);
  - nunca crea un viaje solo.
- **Busca más sitios donde un toque cree un viaje sin pedirlo** y quítalos.
- **Para todos:** también Eric (viaje a Lanzarote del 8 al 13).

## 3. El globo y los números
- **Los puntos de Italia son de los viajes de Roma y del Vaticano que Alicia tiene creados** (aún no hechos): está bien que salgan, pero distintos:
  - los viajes hechos, con un punto lleno;
  - los viajes por hacer, con un punto hueco o más suave, para que no parezca que ya ha estado.
- **Falta el punto de Lanzarote,** que es el viaje hecho. En España con Canarias, que se vea Canarias: gira o acerca el globo.
- **«1 país · 1 ciudad · 2 días viajando»:** el viaje de Alicia fueron 5 días (del 9 al 13). Dime de dónde sale el 2 y arréglalo.

## 9. La prueba
- `pruebaJutrip` y las de logros de Roma y de Lanzarote en 0. La muestra de 60 de Roma, idéntica.
- **Nueva `pruebaV11`:**
  - el pasaporte abre con lo guardado, sin blanco;
  - [Estampar mi sello] estampa el sello del viaje terminado y queda estampado;
  - «Por conseguir» nunca crea un viaje;
  - el punto lleno en Lanzarote (en Canarias) y los puntos huecos en los viajes por hacer;
  - los días del viaje bien contados.
- **En el REPASO:** capturas de móvil al lado de Design y tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
