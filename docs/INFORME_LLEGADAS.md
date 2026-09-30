# Informe: llegadas y vueltas de Roma (PARA_CODE_LLEGADAS)

Datos en `data/dias/roma/_llegada.json`, consultados el 30-09-2026. Regla nueva: la 414.

| Qué | Antes | Ahora | Fuente |
|---|---|---|---|
| Tip del DNI | «ahora mismo los dos países han vuelto a controlar…» | Dos tips: «Lleva el DNI o el pasaporte: la aerolínea te lo pide para embarcar» (siempre) y «Controles en los vuelos con España», con `hasta: 2026-10-01`. Deja de salir solo pasada esa fecha | Comisión Europea (lista de controles: aire y mar con España, 16-09 a 01-10-2026); Ministerio del Interior |
| Resumen de Tiburtina (tren) | «Casi todos los trenes llegan a Roma Termini…» | Con Tiburtina elegida, su propio texto: el metro B desde Tiburtina FS. Sin reserva, un texto que vale para las dos estaciones | — |
| Del centro a Tiburtina (tren y autobús) | «Metro B (Tiburtina FS) a Termini» (el de ida, al revés) | «Metro B hasta Tiburtina FS» | ATAC |
| Consigna, «De la estación a tu alojamiento», maleta, «Tu última hora» | Salían en Tiburtina y en el crucero | Solo si se pasa por Termini | — |
| Tips de Termini («M» roja, cartera, andén en la pantalla, consigna) | Salían en Tiburtina | Solo con Termini (`solo_en`) | — |
| Tren de Civitavecchia | «compruébalo en trenitalia.com» | 4,60 €, lo mismo hasta San Pietro, Ostiense o Termini; se compra antes de subir. `verificar`: la tarifa no da los km (con más de 80 km serían 5,10 €) | Tarifa 39/8 Lazio de Trenitalia (desde el 05-07-2026) |
| Leonardo Express, último desde Fiumicino | 23:23 | 23:23 se queda: es el último de todos los días en el horario oficial. Las 23:27 de la web no salen en el horario. Los de las 23:53 y 0:23 no salen todos los días | Horario PDF de Trenitalia (14 jun-12 dic 2026) |
| KiPoint Termini | 7:00-21:00, desde 6 € | Igual, con la fuente buena | kibag.it (KiPoint) |
| Terravision | desde 4 € (Fiumicino) y desde 6,50 € (Ciampino) | Igual, comprobado | terravision.eu |
| Rome Airport Bus | 8 € | Igual: es precio fijo, no «desde» | romeairportbus.it |
| ATRAL a Anagnina | 1,20 € | Igual, comprobado | atral-lazio.com |
| ZTL de Trastevere en agosto | «sin ZTL de noche» | Igual, comprobado | romamobilita.it (29-07-2026) |
| Traslado privado de Fiumicino (45 €) | Salía a la venta con enlace «#» | La pantalla no enseña un traslado sin enlace de afiliado; la pestaña «Traslados» desaparece | — |

La ventana (`ArrivalReturnSheet.tsx`):
- con un solo punto a la vista, usa su resumen propio;
- filtra los tips por punto y por fecha;
- enseña los bloques de Termini solo si se pasa por Termini;
- enseña el traslado privado solo si tiene enlace.

`docs/LLEGADAS_ROMA.html` lleva los textos nuevos del DNI, del tren y de Civitavecchia.
