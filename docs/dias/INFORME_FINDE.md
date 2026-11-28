# Informe del finde de pruebas (27 y 28 de noviembre)

En palabras sencillas. Los informes largos de cada paso están en `INFORME_FINDE_PASO1.md`, `_PASO3`, `_PASO4`, `_PASO5` y `_PASO6`.

## Qué se hizo
1. **Barrido de 365 días:** salían 42 fallos de «orden» y 2 de «mañana vacía». Ninguno era un fallo del motor: la prueba tenía una frase vieja. Arreglada la prueba: 25.887 viajes, 0 fallos. Pregunta abierta: con vuelo a las 15:00 desde el norte de Lanzarote, esa mañana puede quedar sin paradas porque lo bueno ya se vio.
2. **Pruebas viejas (paso 3):** todas estaban desfasadas o eran impacientes. Ningún fallo de la app.
3. **App más rápida (paso 4):** lo único lento de verdad eran las fotos de las tarjetas de DÍAS (bajaban la foto grande en vez de la de tarjeta). Arreglado.
4. **Supabase (paso 5):** la prueba de la V36 medía con el reloj parado y daba un gasto falso de 92 KB. Medido bien, «cerca de aquí» costaba 5 MB por viajero y día. Arreglado además el billete (QR) y los «me gusta».
5. **Probador de Reorganizar (paso 6):** arreglado que salieran COMIDA y CENA después de «Fin del día» en el día de vuelta.
6. **Batería completa:** 355 pruebas corridas, 271 bien, 84 mal. No se ha arreglado ninguna (tú lo pediste). Lista en `_bateria_365.md`.

## Tabla de velocidad (Roma, iPhone 390 px, 4G simulado, máquina cargada)
| Qué | Antes | Después |
|---|---|---|
| Pestaña DÍAS, 1.ª vez | 2.207 ms · 1.876 KB | 1.384 ms · 899 KB |
| Día abierto en DÍAS, otro día | 2.693 ms · 2.697 KB | 1.358 ms · 1 KB |
| Abrir la app con caché | 8.575 ms · 295 KB | 6.864 ms · 233 KB |
| Peso de arranque en producción | 263,2 KB | 263,2 KB (tope 340) |

El resto de pantallas no cambia.

## Tabla de Supabase (simulador, no el gráfico real)
| Qué | Antes | Después |
|---|---|---|
| «Cerca de aquí» (HOY, ~100 llamadas/día) | 5,3 MB por viajero y día | 1,4 MB (−74 %) |
| Billete con QR al cambiar de pestaña | 2 a 12 MB al día | 150 KB la 1.ª vez, ~0 después |
| Suma por viajero activo | 7 a 12 MB al día | 2,5 a 4 MB |

**No he podido mirar el panel real de Supabase.** Mira el «egress» unos días: si no baja de ~160 a ~80 MB al día, la causa sigue siendo otra.

## Qué queda y qué hay que decidir
- Las 21 decisiones y los riesgos están en `CHECKLIST_V77_V81.md` (final) y `_decisiones_V77_V81.md`.
- **84 pruebas de la batería fallan.** Mi lectura: unas 55 están desfasadas por decisiones tuyas (contador «x de 4 listo», Lanzarote con 35 sitios, borrar reserva sin «Deshacer», estudio de sonidos…). **Unas 8 parecen fallos reales:** «Quitar la hora» deja la casilla vacía (`10S3_C`, `10S6_O`, `10S9_C`, `10S9b_B`), «null» en el aviso del atardecer (`10P_hoy`, `HOY2b_E`), `V46`, `V42`, `V27`, `HOY2b_D`, `V2Hoy`, `Fase6y2_formulario`. Propuesta: una tanda para actualizarlas y arreglar esas.
- Probador, sin arreglar: Lanzarote con vuelo a las 17:30 deja el día vacío con cabecera vieja; nota de Teguise dice «cerrado»; Roma con «DE CAMINO» huérfano; terminal «1» en HOY y «T1» en RESERVAS.
- 6.615 carpetas viejas de Chrome en Temp (se pueden borrar).
