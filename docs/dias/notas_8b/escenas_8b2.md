# Tanda 8B2 · Las escenas de los emblemas, ahora como las de Design

Sin commit ni push. La película del Coliseo (`escenas/coliseo.tsx`) no se ha tocado.

## Qué se ha hecho

Antes las 11 escenas eran dibujos más simples hechos a ojo. Ahora son un traslado fiel de «Emblema Cine» (`docs/diseno/proyecto/Piezas/Emblema Cine.dc.html`): mismos trazos, mismos tiempos, mismas partículas, mismas frases y mismos colores. Cada escena sigue en su archivo y se carga solo al abrirla (`escenas/index.ts` no cambia).

Archivos:
- `escenas/cine.tsx`: lo común. Ahora cada escena trae sus propias capas (ya no van todas dentro de un solo `<svg>`) y puede ajustar sus tiempos: cuándo se aleja la escena (`dim`), cuándo estalla el destello (`fl`), cuándo entran el nombre, la línea y [Seguir] (`x`), la luz que llega al centro (`orbe`, `orbeD`, `orbeL`; sin `orbe` no hay luz) y la sacudida (`shake`, solo la Boca de la Verdad). Ayudas nuevas: `D`, `GH`, `toC`, `CapaComun`, `Chispas`.
- `escenas/escenas.css`: las animaciones del diseño que faltaban. `ecDust2` es el polvo del diseño (con luz que late); no se ha cambiado `ecDust`, que usa el Coliseo.
- `escenas/ciudad.ts`: la silueta de Roma (Coliseo, Foro, Panteón) que comparten Madrugador y Nocturno.
- Una escena por emblema, reescritas.

El contrato no cambia: `EscenaDeEmblema.tsx` está igual; tocar la pantalla salta al emblema; [Seguir] al final; `data-vuelo="logros"` en el emblema; «Saltar todo»; frase de suspense solo con `primeraVez`; sin fuegos. Con «reducir movimiento» la escena sale ya puesta (el emblema con su texto y [Seguir], sin moverse).

## Qué hay en cada escena (segundos aproximados)

1. **Panteón**: 5 anillos de casetones que se dibujan uno a uno y se oscurecen, el óculo, el rayo de luz que gira con polvo flotando, rayos finos girando despacio detrás, el óculo late tres veces. La luz llega al centro y estalla.
2. **Fontana de Trevi**: bajo el agua, ondas de luz, 5 rayos que se mecen, 14 burbujas que suben, fondo con destellos de monedas. Una moneda rompe la superficie (3 ondas y salpicaduras), baja girando por una curva con su estela de burbujas y se queda brillando. Estalla a los 8,45 s (más tarde que las demás, como en el diseño).
3. **Foro Romano**: ruinas en fantasma (punteado), el Miliario de Oro en oro, cinco calzadas con sus losas que se abren hacia ti, lucecitas como viajeros, chispas que suben al centro.
4. **Museos Vaticanos**: marco de la bóveda, 9 paneles que se dibujan y se llenan de color, las dos manos llegan desde los lados, chispa que late tres veces.
5. **Plaza de San Pedro**: columnata de Bernini y obelisco que se dibujan, huellas que suben desde ITALIA, la raya blanca que brilla y la palabra VATICANO.
6. **Basílica de San Pedro**: cúpula, baldaquino con columnas retorcidas, rayo de luz que baja al altar, la tumba que se enciende.
7. **Boca de la Verdad**: cara de piedra en oro, la mano entra, los ojos se encienden, la boca se cierra de golpe con temblor de toda la pantalla, la mano sale.
8. **Ojo de la Cerradura**: puerta verde con su cerradura brillando; la cámara entra por el ojo y aparece el paseo de setos con la cúpula al fondo.
9. **Catacumbas**: oscuridad, lamparilla con llama que parpadea y chispas, la luz (máscara) va descubriendo galerías, nichos y la cruz que se ilumina. Luz que sube al centro.
10. **Madrugador**: noche con estrellas, el cielo se tiñe y el sol sale detrás de la silueta de Roma.
11. **Nocturno**: estrellas que parpadean, sale la luna, se encienden las ventanas del Coliseo, el Foro y el Panteón.

Madrugador y Nocturno no enseñan ninguna hora ni cifra de hora.

## Diferencias con Design (y por qué)

- Las escenas son idénticas en dibujo y tiempos. Lo que cambia es la envoltura: en el diseño [Seguir] hace volar el emblema; en la app lo hace el vuelo genérico (`data-vuelo`).
- El aviso «Saltar todo» y tocar para saltar son de la app (el diseño no los tiene).
- Textos: usan los del diseño. Han cambiado dos respecto a lo que había: la línea del Foro (ahora «Aquí estaba el Miliario de Oro: de él partían los caminos del Imperio.») y el lugar de Madrugador («Fontana de Trevi · Roma») y Nocturno («Coliseo · Roma»), que el diseño pone así. Si el servidor trae nombre y línea, mandan los del servidor, como antes.
- La espera de antes de la escena («¡Eh! Aquí hay algo…», `Suspense3` en `EscenaDeEmblema.tsx`) no se ha tocado: es más sencilla que la del diseño (le faltan los rayos que giran y el viñeteado). No es de las escenas y no quise tocar el archivo compartido; si se quiere igual, es un cambio pequeño.
- No he podido renderizar el diseño al lado para comparar píxel a píxel (la página de diseño no deja localizar cada pantalla de forma automática). Se ha comparado leyendo el código y la descripción de cada pantalla; el traslado de datos (trazos, tiempos, partículas) es literal.
- Sonido y vibración: las escenas anteriores no sonaban por su cuenta (lo hace quien las lanza), así que no cambia nada.

## Pesos (al construir, sin comprimir / comprimido)

Panteón 4,0 KB (1,8), Trevi 5,6 (2,3), Foro 1,9 (1,1), Museos 2,4 (1,3), Plaza 2,6 (1,3), Basílica 2,5 (1,3), Boca 2,7 (1,2), Cerradura 2,9 (1,3), Catacumbas 5,0 (2,0), Madrugador 1,6 (0,9), Nocturno 1,5 (0,9), silueta común 0,8 (0,4), `cine` 9,9 (4,1) con 3,3 KB de CSS (0,7). Antes cada escena medía entre 1,6 y 2,8 KB. Nada de esto entra al abrir la app: se carga al abrir un emblema. El cambio más pesado en pantalla es Catacumbas (máscara y textura de piedra); en móviles muy viejos podría ir justa, en el panel va bien.

## Pruebas

- `npx tsc -p tsconfig.app.json --noEmit` limpio. Las 11 escenas se abren con `window.__momentos.repetir(id)` (modo `?logrosDemo=1&hoy2=on&logros=on&cuentas=on`); la consola solo da un error ajeno (un recurso 400 de otra parte).
- Capturas con Chrome sin pantalla a 390 × 844 (escala 1,5), con el tiempo forzado: la 1 es el principio (≈2 s), la 2 la mitad (el momento clave de cada escena) y la 3 el final con el emblema, el texto y [Seguir]. En `docs/dias/capturas_8b/`:
  `E1-panteon-1/2/3.jpg`, `E2-trevi-…`, `E3-foro-…`, `E4-museos-…`, `E5-plaza-…`, `E6-basilica-…`, `E7-boca-…`, `E8-cerradura-…`, `E9-catacumbas-…`, `E10-madrugador-…`, `E11-nocturno-…`.
  Las capturas viejas con esos nombres ya no estaban en la carpeta.
- Con «reducir movimiento» no he podido probarlo en el navegador (no se puede emular desde aquí); está comprobado leyendo el código (la escena empieza ya en su final).
