# REPASO V56 (modo rápido: sin pruebas; `tsc` y `npm run build` sin errores; capturas en iPhone 390x844)

1. ✅ **El panel no pesa a nadie.** El panel y el estudio ya se bajaban a demanda; faltaban `SeasonCardPreview`, `PruebaFotos` (ahora a demanda) y el código de «Solo para mí» del administrador (`reservasPrivadasAdmin`, ahora un trocito aparte). **Peso al abrir (index + react + supabase + css, comprimido): 341,7 KB antes → 338,1 KB después** (tope 340 KB; el JS de entrada sin comprimir 692 → 680 KB). Medido con `scripts/destino/_pesoAlAbrir.mjs` sobre `npm run build`. El json de sonidos (`estudio-*.js`, 19 KB) se baja al sonar el primer momento: es el sonido definitivo que usa la app, no el estudio.
2. ✅ **Atardecer.** Se cuenta desde el GPS si hay; si no, desde la última parada hecha (antes, con todo hecho, caía al alojamiento). Captura `2_atardecer_lanzarote.jpg`: salen 3 sitios (El Golfo, Los Hervideros, Salinas de Janubio).
3. ✅ **«Me gusta» de restaurantes.** Corte en 22: Taverna Trilussa (100) y Sgarro Bistrot (100) con cifra. Sin captura (es un dato); comprobado leyendo el JSON.
4. ✅ **Moneda según el país.** México → MXN (`monedaDelPais.ts`), en Ajustes sale «MXN Peso mexicano» (`4_ajustes_mexico_pesos.jpg`); manda lo último (cambiar moneda o país); los «desde» pasan por `precioEnVista`: «≈ 2.514 MXN · 119 €» (`4_actividad_otra_moneda.jpg`), y el «€» a mano ya no está. El pago no se toca.
5. ✅ **Fuera las páginas viejas.** Borrados los 4 RUTAS_REVISION y las 2 pruebas (nada más en esas pruebas).
6. ✅ **«Hoy vuelves a casa».** El último día en blanco de un viaje a mano (`6_hoy_vuelves_a_casa.jpg`); el de llegada sigue «Día de viaje».
7. ❌ **100 Presepi.** Las fechas 2026-27 no están publicadas todavía en la web oficial: dejado apuntado «revisar en diciembre» en el dato.
8. ✅ **«Hoy ya no da tiempo a todo».** No sale desde las 20:00 (no vi un tope 22:40 escrito: ver DECISIONES). Sin captura (es un corte de hora).
9. ❌ **A medias: pueblos que no cierran.** Regla nueva en CLAUDE.md para todos los destinos. Datos tocados: **Lanzarote › Teguise** (fuera `by_day`; Teguise se ve «Abierto · Sin horario», `9_pueblo_lanzarote_hoy.jpg`). **Roma:** revisadas todas las plazas, calles, barrios e isla: ya eran `abierto_24h` o sin horario, no hubo que tocar nada. **Lanzarote › Haría** sigue con el horario de la Casa-Museo (hay que separar pueblo y museo; ver DECISIONES).
10. ✅ **«¿Cómo vas?» / «¿Cómo vais?».** Solo: «¿Cómo vas?» (`10_como_vas_solo.jpg`); con más personas unidas: «¿Cómo vais?» (`10_como_vais_grupo.jpg`). Revisados los otros textos de HOY con «vosotros» (cansados, respiro, horarios, «tenéis restaurante», cena, «si no llegáis»): todos con su versión de una persona.

## Lo que no pude comprobar
Pruebas (modo rápido). Producción (sin push). La ficha de un país sin cambio de moneda. Cómo se ve «Sin fuerzas» en una captura de la hoja (solo el aviso).
