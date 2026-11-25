# Decisiones de la pasada final (noche 24-25 nov)

Pasada completa: 341 pruebas corridas de 349 (las 8 del Supabase real se saltan por orden), 122,9 min. Salieron 18 en rojo; 8 son de DECISIONES (sección B) y las otras 10 pasan ya (varias solas: son de carga). Al final solo quedan en rojo las 10 de la sección B.

## Siguen en rojo (decisiones de Eric, ver DECISIONES_NOCHE_PRUEBAS.md)
`pruebaCuentas3`, `pruebaPantallas8b`, `pruebaTanda10S` (peso al abrir 341,3 KB frente a 340), `pruebaLogros2` (1.029 KB frente a 1 MB), `pruebaFase6y10_ficha` (empate 21/22), `pruebaTanda6z2` (`€` en `paginaDestino.ts`), `pruebaRevisionLargos`, `pruebaRevisionRutas` (regenerar las páginas del 23-oct), `pruebaTanda10N5_perfil` (describe el Perfil de antes de la V31; reescribirla es grande). (`pruebaTandaHOY2b_D` ya pasa con el arreglo 1d.)

## Cambios en la app
- `BilleteDeVuelo.tsx`: horas a 36 px (Design «Billete QR»); cada lado lleva `data-billete-lado` (roma/fuera) para las pruebas.
- `ui/AvisoArriba.tsx`: el aspecto claro (tarjeta clara, filo dorado) es el de por defecto; HOY ya no pasa `estilo` (`AvisoDeAbajo.tsx`); `visto/Hojas.tsx` (NotaCorta) pasa de oscuro a claro (decisión mía: una sola forma).
- `ListaDeDias.tsx`: sin colores a mano (MARFIL, ORO_BORDE nuevo en `ui/botonesOro.ts`, `text-accent-warm` en «Cerrado ese día»; ese texto pasa de terracota `#B5704A` a marrón del tema).
- `HoyDuranteV2.tsx`: los sitios de atardecer usan `ubicacionReal` si la zona no es `fuera` ni `sin`.
- `reservas/TarjetaBillete.tsx`: con el código guardado la papelera quedaba a la IZQUIERDA (`flex-col`): ahora a la derecha (`justify-end`). Fallo real.
- `hoy/CamaraViaje.tsx`: el aviso «Guardada…» no se iba solo si el padre se repintaba (el temporizador se reiniciaba con cada `onFin` nuevo): ahora usa una ref. Fallo real.

## Pruebas puestas al día (la app cambió a propósito)
- Textos/estructura V45-V50 y la noche: `pruebaPantallas8c` (la X de la hoja es `CruzDeHoja`, 48 px), `pruebaV44` (reproductor en degradado), `pruebaV46`/`pruebaV2Hoy` (cajas HORARIO · A PIE · VISITA, «Aquí · Ya has llegado», botones con nombre, pedazos «AQUÍ GANAS N PEDAZOS», foto de pendientes a 38, aviso ámbar #FBF1D8), `pruebaTandaHOY2_B` («Pasar a otro día» con tarjeta del sitio; ya no lista «Si te sobra tiempo» en la hoja del caso b, solo en el texto del caso c: decidido por el dibujo V50), `pruebaTanda10S3_C` (abrir con [Añadir mi vuelo]; medidas sobre el billete), `pruebaTanda10N11_b` (billete «15:40 FCO»; «Cómo llegar desde el aeropuerto» ya no está en la tarjeta de DÍAS: V48), `pruebaTanda10S5_L`/`10S8_C` (papelera en la misma fila que el botón; ✓ guarda la hora, Escape/fuera no; «Esta tarjeta de embarque…»), `pruebaV27` (V38: tarjetas desplazadas 10 px por el asa), `pruebaV9` (Cueva de los Verdes «Día 4 · mié 11»), `pruebaTanda10N9_pantallas` (selector de la hoja por `data-hoja-cuantos-sois`: «Comprar» NO pisaba a nada; el selector buscaba radio 30).
- `pruebaTanda10N6_entradas`: el buffer de recursos de Chrome (250) ya no guarda los módulos tardíos; se importa directo.
- `pruebaV40`: instantes comparados a la millonésima (ruido de decimales).
- `pruebaTanda10N9_vuelo`: la rueda «40» NO falló en ninguna de las 3 pasadas siguientes; fue carga. No se tocó la rueda.

## Flaky por carga (pasan solas, fallan con 2 Chrome + 3 de Node)
`pruebaV13`, `pruebaV40B`, `pruebaV9` (instante), `pruebaV39B`, `pruebaV39B_coliseo`, `pruebaV41_globo`, `pruebaTanda10N6_confirmar`, `pruebaTandaHOY1_B` (K4 sin conexión, 20 s). Todas OK solas.

## Para Eric
- «Cómo llegar desde el aeropuerto» ya no sale en la tarjeta de DÍAS (billete V48): ¿se quiere de vuelta dentro del billete?
- La hoja «Pasar a otro día» (caso b) no dice ya que lo quitado queda en «Si te sobra tiempo» (V50): ¿se añade a la franja?
- Dos formas del aviso de arriba: NotaCorta y «Enlace copiado» pasan a claro.
