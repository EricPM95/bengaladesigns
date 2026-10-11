# Tanda 6y4, punto 15: el Perfil con el diseño nuevo

Palabras sencillas. Solo Roma. Sin navegador: lo visual a 375 px lo tiene que mirar Eric.

## Qué se ha hecho

El Perfil (`PerfilSheet.tsx`) sigue el diseño `Perfil.dc.html`, de arriba abajo:

1. Cabecera: «PERFIL» en letra pequeña de datos y la ✕ en un círculo crema de 44 px.
2. «Hola, *viajero*» en letra grande, con el círculo oscuro con la «V» y su aro dorado.
3. El mapa: nuestro globo de Mapbox, dentro del marco del diseño (esquinas de 26 px). **286 px de alto** (220 × 1,3). Lleva la chincheta («Roma ×5») y las tres cifras abajo a la izquierda.
4. «Mis viajes» con su número a la derecha y una tarjeta por viaje: bandera, destino en grande, fecha y días, cámara con «155 fotos» (o «Sin fotos», «1 foto»), «Abierto» si es el viaje que está en la app, y la flecha.
5. «Créditos» al final de la lista.
6. Abajo del todo, fijo, el botón grande oscuro [+ Nuevo viaje].

Fuera: «Pronto podrás guardar tus viajes en tu cuenta», los rótulos «Próximos» / «Ya hechos» (el diseño no los lleva; el orden sigue igual: primero los que vienen, luego los hechos) y el botón [+ Nuevo viaje] de arriba.

### La bandera
Es la misma pieza que la de la tarjeta del destino de RUTA. Estaba escrita dentro de `RouteOverview`; la he sacado a `src/components/ui/BanderaDestino.tsx` y ahora la usan los dos sitios (RUTA y cada viaje del Perfil). No se parece en nada a la franja cortada del diseño.

### El mapa
- Alto del marco: 286 px. El globo se recalcula para esa caja (343 × 286): la bola mide unos 322 px y solo pierde unos 18 px arriba y abajo; los lados siguen curvos.
- **Una chincheta por destino**, no una por viaje. Cinco viajes a Roma son una sola chincheta, «Roma ×5». Un viaje a Roma y Florencia aporta a «Roma» y a «Florencia». El «×N» solo sale si hay más de un viaje a ese destino (con uno solo, «Roma» a secas; si prefieres «Roma ×1», es una línea).
- Punto oscuro con anillo claro y latido dorado (como el diseño); verde si todos los viajes a ese destino están hechos. Tocarla abre el álbum del viaje más cercano de ese destino.
- Las cifras salen de un componente aparte (`CifrasDelMapa.tsx`) para poder probarlas.

## Qué cuenta cada cifra
Todas salen de los viajes de este dispositivo (los guardados y, si no está guardado aún, el que está abierto):

- **Países**: los países distintos de todos los viajes. El país de cada tramo es el mismo que usa la bandera de RUTA (el del día o, en rutas viejas, el del destino de Roma). Un destino sin país conocido no cuenta.
- **Lugares**: los destinos (ciudades) distintos de todos los viajes. Roma en cinco viajes es **un** lugar; Roma y Florencia son dos. (Ojo: el diseño pone «4 lugares» con solo la chincheta de Roma; no he podido saber qué quería contar. Ver pregunta 2.)
- **Días**: la suma de los días de todos los viajes (los días de verdad de cada ruta; el día suelto de la vuelta no cuenta).

## Qué cambia en el álbum
Al tocar un viaje de «Mis viajes» (o su chincheta) se abre una pantalla con **solo el título («Roma»), la fecha («2 – 10 sep 2026») y el álbum**.
- Todas las fotos del viaje juntas, en una cuadrícula de 3 columnas (la copia pequeña de cada foto; la grande solo al tocarla). Orden: por día y, dentro del día, por hora de subida.
- Sin selector de día, sin selector de parada, sin títulos por día ni por lugar, sin «Una foto por parada», sin resumen («4 días · 11 paradas») y sin la lista de destinos. Cada foto conserva «Eliminar» (con su pregunta de una línea).
- Por dentro, cada foto sigue guardándose con su día y su parada (`day_number`, `stop_name`); la gratis las sigue contando por parada. Solo que no se enseña así.
- **Gratis**: el álbum **no** lleva [Añadir fotos]. Si no hay fotos dice «Aquí irán las fotos de tu viaje. Se añaden desde la ficha de cada parada.»
- **De pago**: lleva [Añadir fotos] (varias a la vez), y no hay límite.
- Todas las fotos van al mismo viaje (el del álbum, o el abierto si se suben desde la ficha, HOY o «Guarda tus recuerdos»).
- A qué día se apuntan las fotos sueltas (las que no vienen de una parada: el [Añadir fotos] del álbum y [Subir mis fotos] de «Guarda tus recuerdos»): al día de hoy si el viaje está en marcha, y si no, al primero. En la gratis (una foto sin parada por día), se salta los días que ya tienen la suya. Está en `diaParaFotoSuelta` (`viajesPerfil.ts`).

### «Guarda tus recuerdos» ahora sube las fotos de verdad
Hasta ahora [Subir mis fotos] y las tres casillas de rayas solo abrían el álbum, y allí se subía. Como el álbum de la gratis ya no tiene [Añadir fotos], eso habría dejado a la gratis sin camino. Ahora la tarjeta (en RUTA gratis tras el viaje y en HOY de pago tras el viaje) abre directamente el selector de fotos. Para eso `BotonFoto` ha ganado dos opciones pequeñas, `claseContenedor` y `style` (opcionales; nada cambia donde no se usan).

## Cómo se dispara el efecto «la foto vuela al Perfil»

Piezas nuevas (no he tocado `precioVuela.ts` ni `PrecioVuela.tsx`):
- `src/lib/fotoVuela.ts`: el cálculo y el dibujo, con pruebas sin navegador.
- `src/components/perfil/FotoVuela.tsx`: se monta una vez en `App.tsx`, justo debajo de `<PrecioVuela />`. No pinta nada salvo un aviso oculto para lectores de pantalla («Foto añadida a tu Perfil»).
- `src/lib/fotosViaje.ts`: nuevo `alAnadirFoto(oyente)`. Salta **una vez por foto subida de verdad**, justo después de guardarla en `subirFotoPreparada` (por donde pasan todas las vías: ficha de parada, «✓ Visto», «Tus fotos de hoy», «Guarda tus recuerdos» y el álbum, todas con `BotonFoto`). No salta al cargar, ni al contar, ni al borrar, ni cuando una subida falla. En la gratis, cambiar una foto cuenta como una foto añadida (se sube la nueva y se borra la vieja, y solo la nueva avisa). Lleva la miniatura local de esa foto (la `_min` o, si no hay, la grande).
- `Header.tsx`: el botón del Perfil lleva `data-boton-perfil="1"` (una línea) para que el efecto sepa dónde llegar.

Cómo vuela: la miniatura (56 px, con borde crema) sale del último sitio pulsado (o del centro si no hay un toque reciente), se queda un momento, vuela al botón del Perfil encogiéndose a un 15 % y se desvanece, en 0,8 s. Al llegar, el botón da su saltito (el mismo que la cartera).
- **Con «reducir movimiento»**: sin miniatura ni vuelo, solo el saltito.
- **Si el botón queda tapado por una hoja** (el propio Perfil, una ficha…): mira cada 250 ms qué hay encima del centro del botón; mientras haya algo, espera. Cuando se cierra, vuela. Pasados 5 minutos se rinde. Esta función (`estaTapado`) lleva el comentario «se unificará con la de `precioVuela.ts`» para que la junte yo después. Consecuencia: una foto añadida desde el álbum del Perfil (de pago) vuela cuando se cierra el Perfil.
- **Muchas fotos a la vez** (por ejemplo, 30 de la galería): vuelan las 6 primeras, con 120 ms de desfase entre ellas; las demás no vuelan (el botón salta igual).
- La URL local de la miniatura se suelta al acabar (o si se cancela).

## Pruebas
- Nueva: `scripts/destino/pruebaFase6y4_perfil.mjs` (+ `_6y4_perfil_entrada.tsx`): **157 comprobaciones, 0 fallos.** Cubre el Perfil con 0, 1 y 6 viajes, las filas, la bandera igual a RUTA, el mapa a 286 px, la chincheta «×N», las cifras (plural y singular), el álbum sin filtros ni títulos, [Añadir fotos] solo en la de pago, «Guarda tus recuerdos» que sube, y el efecto (vuelo, reducir movimiento, botón tapado, sin botón, cola, desfase) y su disparo (una vez por foto; ni al cargar ni al borrar ni si falla).
- Pruebas antiguas que he actualizado, **solo en lo que cambia**:
  - `pruebaCorr6z6_perfil.mjs`: el alto 220 → 286 y la caja 335×220 → 343×286; el relleno de abajo del Perfil (ahora la zona del botón fijo, no los 6 rem de la barra, que el Perfil ya tapa); las chinchetas (7 → 6: una por destino); la lista pintada en dos líneas; fuera «Próximos / Ya hechos»; el álbum sin [Añadir foto] en la gratis ni «Una foto por parada».
  - `pruebaTanda6z6b.mjs` (+ `_6z6b_entrada.tsx`): lo mismo para la lista y las chinchetas (5, con Roma ×2), y la ficha del viaje (solo título, fecha y álbum; sin resumen, sin [Abrir este viaje], sin selectores).
- Sin cambios y a 0 fallos: `pruebaTanda6z3`, `pruebaFotos6z3`, `pruebaFase6z6c/d/e`, `pruebaTanda6z6`, `pruebaTanda6z6a`.
- `npx tsc --noEmit -p tsconfig.app.json`: limpio.

## Lo que no he podido hacer ni comprobar
- **Nada visual**: no tengo navegador. Falta mirar a 375 px: el marco del mapa, la pastilla «Roma ×N» sobre el globo, las cifras tapando el sur del mapa, la tarjeta de cada viaje, la cuadrícula del álbum, y el vuelo de la foto.
- No he visto el vuelo real (solo con piezas falsas): hay que comprobar que la miniatura sale de donde se pulsó, que llega al botón y que el saltito se nota.
- La cuenta de fotos de «Mis viajes» usa una consulta nueva (`contarFotos`, un `select trip_id … in (…)`): probada con el cliente falso, no contra Supabase de verdad.
- No he tocado la ficha de cada parada: el botón redondo de cámara de la esquina de la foto lo pone el otro agente. Cuando esté, usará `BotonFoto` y el efecto saldrá solo.
- No he borrado `agruparFotos`/`paradasDelDia` de `viajesPerfil.ts` (ya no se usan en pantalla, pero una prueba antigua las comprueba).

## Preguntas abiertas
1. **¿Cómo se vuelve a abrir un viaje guardado?** Antes, la ficha del viaje tenía [Abrir este viaje]. Con «solo el título, la fecha y el álbum» se ha ido, y el diseño dice que tocar el viaje lo abre. Ahora tocar un viaje abre su álbum y no hay forma de cambiar de viaje desde el Perfil. ¿Dejo un [Abrir este viaje] pequeño en el álbum, o tocar el viaje abre el viaje y el álbum va por otro lado (la cámara de la fila, por ejemplo)? Lo he dejado como pedías, pero es una función perdida.
2. **«Lugares»**: he contado destinos (ciudades) distintos. El diseño pone «4 lugares» con una sola chincheta de Roma, así que quizá quería contar sitios distintos visitados. ¿Cuál?
3. **«Roma ×1»**: con un solo viaje la pastilla dice «Roma». ¿Quieres «×1» siempre?
4. **Gratis, «Guarda tus recuerdos»**: cada foto suelta ocupa «el día» (una por día). Con un viaje de 3 días son 3 fotos sueltas como mucho, y la cuarta cambia una. ¿Está bien, o prefieres que desde ahí la gratis también tenga que elegir parada?
5. **Fotos añadidas desde el álbum de pago con el Perfil abierto**: el vuelo espera a que se cierre el Perfil. ¿Prefieres que el botón de la cabecera no cuente como «tapado» para esto y la miniatura vuele hacia la ✕ del Perfil? (Hoy espera.)
6. Las banderas de países sin dato en la tabla de colores salen en gris neutro (igual que en RUTA).
