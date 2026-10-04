# BORRADOR: trenes de Civitavecchia (acordeón del ferry)

**No está en la app. No se pone hasta que lo confirmes con Trenitalia.** Aquí solo está lo que ya constaba en el repositorio; no he inventado ningún horario.

## Lo que ya tenemos (de `data/dias/roma/_llegada.json` y `docs/INFORME_LLEGADAS.md`)

| Dato | Valor | Estado |
|---|---|---|
| Tren regional Civitavecchia ↔ Roma | Billete a 4,60 €, el mismo hasta San Pietro, Ostiense o Termini | Tarifa 39/8 Lazio (desde el 05-07-2026). **Por confirmar**: la tarifa no da los km; si fueran más de 80, serían 5,10 € |
| Dónde se compra | Antes de subir; en Civitavecchia no se vende a bordo | Texto ya en `_llegada.json` |
| Lanzadera del puerto | Gratuita, del muelle a la salida del puerto; de ahí a la estación, 10-20 min andando | Fuente: civitavecchia.portmobility.it/en/shuttles |
| Servicio «Civitavecchia Portlink» | Fuente: trenitalia.com/it/regionale/collegamenti-regionale/civitavecchia-portlink.html | Sin leer a fondo; hay que comprobar qué cubre |
| Margen para volver al puerto | Ferry 120 min + 110 de trayecto; crucero 30 min + 110 (hoy el viaje de vuelta usa los textos de ida al revés) | Dato del `BORRADOR_LLEGADAS_PUNTOS.md` |

## Lo que falta y hay que confirmar con Trenitalia antes de ponerlo

1. Horario real de los trenes regionales Roma (San Pietro / Ostiense / Termini) → Civitavecchia: primer y último tren, y cada cuánto sale uno. **No lo tengo.**
2. Duración real del trayecto (arriba he usado 110 min con el margen; falta el dato oficial por tipo de tren).
3. Km exactos Civitavecchia–Roma, para saber si el billete es de 4,60 € o de 5,10 €.
4. Si «Civitavecchia Portlink» cambia el trayecto andando desde la estación hasta el puerto.
5. Desde qué estación de Roma sale cada tren (San Pietro, Ostiense o Termini) y si hay diferencias en domingos y festivos.

Cuando lo tengas confirmado, el contenido iría en el acordeón del ferry de la vuelta (`medios.ferry.tips_vuelta`) y en el del crucero.
