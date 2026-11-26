# REPASO V59 (25-nov): el cierre del dia, «Voy con retraso» y la hora de comer y de cenar

Modo rapido: sin pruebas, solo `tsc` y `npm run build`. Capturas en modo iPhone (390x844) en `docs/dias/V59_capturas/`, cada `*_app.jpg` junto a su `*_design.jpg`.

## Que ha cambiado
1. **Una sola hoja** (`HojaDelDia.tsx`) para «Hoy ya no da tiempo a todo» (H1), «Por hoy ya esta» (H2, a las 22:00 o al acabar la ultima parada), «Ayer te quedaron…» (H3), «Voy con retraso» que da tiempo (H4) y que no (H5). Fuera `HoyYaNoDaTiempo.tsx`, [Ver otra opcion] y [Ver lo que queda hoy]. Una entrada cuya hora ya paso ya no sale como «Sigue igual» (arreglado en `hoyCambiarPlan.ts`, sirve tambien al plan de lluvia).
2. **Resumen del dia** (`ResumenDia.tsx`) al dibujo R1/R1b/R2: sale tras H2/H3 o directo si se vio todo; por la noche «Tu dia en…», a la manana «Tu dia de ayer en…»; filas solo con lo ganado; no sale si no gano nada. El servidor (`server/logros`) da la frase de los logros de viajero: **hay que reiniciar el api-server**.
3. **Comida y cena** con la tarjeta de la parada y una imagen fija (`ImagenComida.tsx`): C1/C2 con restaurante, C3/C4 sin restaurante, C5/C6 ya en el sitio. Tambien en DIAS y en «Tu dia».

## Lanzarote
H2 («Por hoy ya esta», 4 sitios), resumen de la noche (L2) y la comida en coche (con y sin restaurante) comprobados: capturas `LH2`, `LR1`, `L1/L3/L5_lanzarote`.

## Sin comprobar
H1, H3, H4, H5 y el resumen de la manana en Lanzarote; el resumen real con servidor y fotos (las capturas usan datos de ejemplo); GPS real; que la tarjeta de comida se vaya sola al pasar la hora; el paso de elegir restaurante a C1/C2; el peso de arranque; la bandera del pais (en el Chrome de pruebas sale «IT»). La franja verde de H1 dice «La tarde sigue igual» sin el «desde {lugar}». Las pruebas viejas que mencionan `HoyYaNoDaTiempo` (p. ej. `pruebaV43`) ya no encajan.

Decisiones para Eric: `docs/dias/DECISIONES_V59.md`.
