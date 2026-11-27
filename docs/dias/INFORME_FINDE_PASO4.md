# INFORME FINDE · Paso 4 — App rápida

Medido en modo iPhone (390 px) con red 4G simulada (9 Mb/s de bajada, 1,5 Mb/s de subida, 60 ms), con el Vite y la API que ya estaban en marcha, un solo Chrome de prueba (cerrado al acabar) y SIN Supabase de producción (modo demo de los logros). **La máquina estaba cargada** (otro agente corría el barrido de 365 con dos procesos de node al máximo): los números absolutos valen poco; la comparación antes/después (mismas condiciones, mismo viaje de Roma) sí.

**Ojo con lo que mide cada cosa:**
- En desarrollo el Vite sirve cada archivo suelto (unas 530 peticiones y 13 MB al abrir): «Abrir la app» aquí NO es el de producción. El peso de arranque de producción lo mide `pruebaPantallas8b` con un build recién hecho: **263,2 KB comprimido (tope 340), sin cambio**.
- Los KB de las hojas perezosas (Perfil, logros, ficha grande…) son de código fuente sin minificar (en producción pesan bastante menos). Los KB de FOTOS sí son reales.

Script reutilizable: `scripts/destino/medirFindePaso4.mjs` (`fase=antes|despues [invitado=1] [capturas=1]`; datos en `docs/dias/_finde_paso4_*.json`; con `_conCola.mjs`).

## Tabla antes / después

«quieto» = ms hasta que dejan de llegar peticiones y de cambiar la pantalla. 1.ª vez = lo perezoso aún sin bajar; 2.ª vez = ya en el móvil.

| Qué | Antes (quieto · KB) | Después (quieto · KB) |
|---|---|---|
| Abrir la app, sin caché (dev) | 14 032 ms · 13 414 KB | 14 107 ms · 13 003 KB |
| Abrir la app, con caché (dev) | 8 575 ms · 295 KB | 6 864 ms · 233 KB |
| Pestaña HOY · 1.ª | 841 ms · 703 KB | 828 ms · 703 KB |
| Pestaña HOY · 2.ª | 119 ms · 0 | 54 ms · 0 |
| **Pestaña DÍAS · 1.ª** | **2 207 ms · 1 876 KB** | **1 384 ms · 899 KB** |
| Pestaña DÍAS · 2.ª | 1 358 ms · 2 KB | 1 336 ms · 794 KB (otro día; ver nota) |
| Pestaña EXPLORAR · 1.ª | 848 ms · 400 KB | 921 ms · 400 KB |
| Pestaña EXPLORAR · 2.ª | 16 ms | 135 ms |
| Pestaña RESERVAS · 1.ª / 2.ª | 132 ms · 13 KB / 16 ms | 127 ms · 13 KB / 21 ms |
| Perfil (Mis viajes) · 1.ª / 2.ª | 505 ms · 250 KB / 111 ms | 513 ms · 250 KB / 122 ms |
| Hoja de logros · 1.ª / 2.ª | 528 ms · 179 KB / 3 ms | 506 ms · 179 KB / 3 ms |
| Ajustes · 1.ª / 2.ª | 112 ms / 4 ms | 111 ms / 6 ms |
| Campana de avisos · 1.ª / 2.ª | 12 ms / 8 ms | 14 ms / 4 ms |
| «+ Añadir una reserva» · 1.ª / 2.ª | 3 ms / 4 ms | 3 ms / 2 ms |
| Hoja de un ferry · 1.ª / 2.ª | 332 ms · 89 KB / 10 ms | 348 ms · 89 KB / 8 ms |
| Hoja de invitar · 1.ª / 2.ª | 114 ms · 25 KB / 1 ms | 224 ms · 25 KB / 6 ms |
| Hoja de pago · 1.ª / 2.ª | 330 ms · 98 KB / 6 ms | 333 ms · 98 KB / 6 ms |
| Hoja de propuestas (viajero, con 1 cambio) · 1.ª / 2.ª | (no medida bien: la hoja sin cambios se cierra sola) | 125 ms · 0 KB / 2 ms |
| **Día abierto en DÍAS (2.ª vez, otro día)** | **2 693 ms · 2 697 KB** | **1 358 ms · 1 KB** |
| Ficha grande de un logro · 1.ª / 2.ª | 1 662 ms · 933 KB / 477 ms | 1 686 ms · 933 KB / 556 ms |

(Pestaña RUTA no tiene «marca» fiable: sale a la vez que la pestaña, sin descargas.)

## Lo que se ha arreglado

La única cosa lenta de verdad y común a muchas pantallas eran las **fotos**: la tarjeta de cada parada del día abierto de DÍAS (recuadro de 168 px de ancho) bajaba la foto GRANDE de la ficha (1 600 px, hasta 1 MB cada una) en lugar de la de tarjeta (`_p`, 640-800 px) que ya existía para las 156 fotos propias. Un día abierto bajaba 2-3 MB; ahora 0,8-0,9 MB (y la foto se ve igual: captura `FINDE_capturas/pestana_Días.jpg`).

- `src/lib/miniatura.ts`: nueva `urlDeTarjeta(url)` (`foo.jpg` → `foo_p.jpg`, igual que `urlMiniatura` hace con la miniatura).
- `src/components/route/dayDetail/TrazoCards.tsx`: `FotoDeTarjeta` usa esa foto y, si la `_p` no existe (los huecos no la necesitan), vuelve a la grande con `onError` (como `ParadaFoto`). Misma pieza `ImagenConFundido`; ningún diseño nuevo; sin consultas a Supabase.
- Arranque de producción sin cambio (263,2 KB comprimido; tope 340).

## Lo que NO se ha arreglado (y por qué)

- **HOY, foto grande de la parada (Fontana di Trevi: 617 KB)**: es la foto de cabecera de la tarjeta, a todo el ancho; con la `_p` (640-800 px) quedaría blanda en un iPhone de 3x. Decisión de Eric: ¿se acepta la `_p` o se recomprimen las grandes?
- **Fotos grandes (`.jpg` de 1 600 px, hasta 1 MB; 78 de más de 300 KB; 100 de más de 1 600 px)**: se pueden recomprimir (calidad 78, máx. 1 600 px) y bajaría el peso del repo (70 MB) y de las fichas; no lo hago en sitio porque son fotos propias de Eric. Recomprimir las `_p` ahorra solo un 14 % (13,8 → 11,9 MB): no compensa.
- **Perfil, logros, ficha grande, hojas de pago/ferry (1.ª vez)**: ya son perezosas. Sus KB son de código fuente en desarrollo; en producción son trozos pequeños. No hay nada seguro que ganar sin precargar al abrir (subiría el consumo del que no abre esas hojas).
- **EXPLORAR 1.ª vez (400 KB)**: `_p` propias + 3 miniaturas de Wikipedia de 330 px (54, 41, 32 KB): de fuera, no controlamos su tamaño.
- **Abrir la app en desarrollo (14 s)**: es el Vite sin empaquetar; no representa producción.

## Comprobado que abre bien (capturas en `docs/dias/FINDE_capturas/`)

Invitar (`invitar.jpg`), pago (`pago.jpg`), propuestas (`propuestas.jpg`, con 1 cambio como invitado que recomienda), Ajustes (`ajustes.jpg`), ficha grande de logros (`ficha_grande.jpg`, vía Todos mis logros), «+ Añadir una reserva» (`anadir_reserva.jpg`), Perfil, hoja de logros y las cuatro pestañas.

## Pruebas

- `pruebaJutrip`: 130 comprobaciones, 0 fallos.
- `pruebaPantallas8b` (arranque): 172 comprobaciones, 0 fallos; 263,2 KB comprimido.
- `pruebaFase6y3_fotos` 0 fallos; `pruebaArregloFotosViaje` 0 fallos.
- `pruebaFase6y2_fotos`: 3 fallos (4d, 4e, 4f) — son comprobaciones por texto del código de la cabecera de excursiones, la ficha y el explorador (archivos que no he tocado; esperan un `<img>`/`placeholderPhoto` antiguo y desde la V67 usan `ImagenConFundido`). No son de este cambio; la prueba está vieja.
- `npx tsc -p tsconfig.app.json --noEmit`: limpio.
- No se toca Supabase: no hace falta `pruebaV36`.

## Riesgos y cosas que he visto

1. **La hoja de pago enseña «Texto pendiente»** (un recuadro gris entre las opciones y [Comprar], captura `pago.jpg`): un texto sin escribir visible para quien compra. Hay que ponerle texto o quitarlo antes de abrir los pagos.
2. La hoja de invitar sin viaje compartido real muestra el código con puntos (así en el probador); con un viaje real carga el código. No se ha podido ver con servidor real (no se toca producción).
3. Una hoja de propuestas sin cambios se cierra sola (a propósito): para medirla hace falta antes un cambio.
4. `pruebaFase6y2_fotos` está vieja (3 fallos de texto, ver arriba): conviene actualizarla o quitarla de la batería.
5. Si una foto propia no tuviera `_p` (los «huecos»), la tarjeta pide primero la `_p` (404) y luego la grande: una petición perdida, sin efecto visible. Hoy las 156 fotos de Roma y Lanzarote la tienen casi todas (Roma 110 de 111; Lanzarote 46 de 48).
6. `public/fotos` pesa 70 MB (510 archivos): cualquier foto nueva debería llevar siempre su `_p`.
7. Los tiempos se midieron con el PC al máximo; repetir sin otro agente si se quieren cifras finas.
8. Para ver la hoja de propuestas fuera del probador hay que ser invitado con permiso «recomendar» antes de empezar el viaje; el script lo finge con `sessionStorage` (`invitado=1`).
