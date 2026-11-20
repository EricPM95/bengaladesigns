# Resumen de la cola V28c, V28b, entradas de Roma, fotos y V29 (19-20 nov)

*(Este resumen no llegó a GitHub al acabar la cola; se sube ahora, en la V30.)*

## Lo que se hizo (todo subido a `main`, sin `--force`)

| Qué | Commit |
|---|---|
| V26b · avisos del viaje sin cerrar la app (`trip_cambios`) | `72512047` |
| V27 · la plaza del Pase Dúo para quien ya está en el viaje | `fe4db561` |
| V28 · entradas y fotos de Roma | `98fd5a5a` |
| V28c · baldosas de las 18 insignias (cada círculo con SU baldosa) | `1a8d9c26`, `1edb8b51` |
| V28b · el botón «Cuéntanos» solo dentro del viaje | `f3ea0353` |
| Entradas de Roma sin página exacta de Civitatis (Coliseo/Foro, Altar de la Patria, Cripta de los Capuchinos con candidata; Trevi, Cúpula de San Pedro, Catacumbas, Mercados de Trajano y Ara Pacis con «Entradas en la web oficial»; el resto sin botón; nunca el buscador) | `0b323e8b` |
| V29 · los sonidos encajan con cada animación (partituras, motor con el reloj de audio, página `/admin/sonidos`) | `8dfcff8f` |
| Migraciones 0087 y 0088 marcadas como aplicadas | `9abb2d56` |

## Lo que no se pudo

- **Las 4 fotos de Roma** (Lungotevere, Borgo Pio, mirador de San Pietro in Montorio, Colle Oppio): Wikimedia Commons limita la velocidad de descarga (error 429). Se retoma despacio en la V30.
- **Domus Aurea:** no se pudo verificar una página de entradas, se queda sin botón.
- **Los sonidos de la V29 no se pudieron oír** (no tengo altavoces): la V30 los sustituye por grabados de verdad.

## PARA ERIC (en orden)

1. Elegir los sonidos en `/admin/sonidos` (ahora con los candidatos de la V30).
2. Las entradas dudosas de Roma y los permisos de hoteles (ver el REPASO de cada tanda).
3. Revisar la foto del Free tour de Arrecife.
4. Mirar el gráfico de «egress» de Supabase (lo que sale de la base) tras estas tandas.
5. Probar en un iPhone y en un Android reales (modo silencio, barra de abajo).
6. El sorteo: decidir si se enseña (`SORTEO_VISIBLE` en el servidor y `VITE_SORTEO_VISIBLE` en la web).
