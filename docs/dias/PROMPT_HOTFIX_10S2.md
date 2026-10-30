# Hotfix 10S2 (Eric, 29 y 30-oct): «Algo ha ido mal» al entrar

Resumen de lo pedido (los textos íntegros llegaron como mensajes sucesivos de Eric en la conversación; el último, con «al volver de Entrar con Google», manda sobre los anteriores):
1. Reproducirlo con el Supabase real y una cuenta de prueba (nunca la de Eric; si no sale, cargar sus datos solo leyendo) y decir la causa en palabras sencillas.
2. Arreglarlo; un dato raro o una respuesta inesperada no debe tumbar la app entera (como mucho, esa pieza se queda sin pintar).
3. Cerrar todas las sesiones de la cuenta de Eric (pegó por error una dirección con sus llaves en un chat privado).
4. «Algo ha ido mal» guarda en el servidor qué ha fallado y en qué pantalla, sin datos privados y sin guardar nunca la dirección con llaves.
5. `ArrivalReturnSheet.tsx`: `useEnlaceDeTraslados` fuera de la condición; `npx oxlint src` sin errores de `rules-of-hooks` y que la batería lo compruebe.
6. Pruebas nuevas en la batería: volver de Google (o simularlo con su `#access_token`) sin «Algo ha ido mal»; registrarse con una cuenta nueva y crear un viaje hasta ver la ruta, con el Supabase real.
7. Dudas de la 10S: Catacumbas (evitarlas cuando el viaje, o su mes, cae en el cierre 13-ene a 10-feb; apuntado en PENDIENTES_MOTOR.md); el OK* en amarillo, nunca en verde, y que la prueba se cierre sola; hoja del vuelo con tren o autobús «Ref. del billete» y «Compañía», con coche ninguno.
Al acabar: solo las pruebas de lo tocado, más pruebaJutrip y las nuevas, en 0 fallos, y push sin --force. «No apagues el PC»; después, Eric: «yo me voy, cuando acabes puedes apagar el pc» (permiso para esta tanda).
