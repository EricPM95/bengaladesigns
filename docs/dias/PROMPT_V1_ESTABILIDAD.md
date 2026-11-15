Hola. TANDA V1: ESTABILIDAD DESPUÉS DEL VIAJE (15-nov). Eric ya ha vuelto de Lanzarote. Es lo primero: la app se cayó durante el viaje y Supabase va por encima de su límite gratuito. Este prompt acaba con «reinicia el api-server»: si no te llega hasta ahí, dímelo antes de empezar.

**Como siempre:** 2 agentes como mucho, 1 Chrome, un servidor. Nota `_estado_v1.md` a la rama `estado`. No apagues el PC. Nunca pegues claves en el chat, en archivos ni en commits. Los cambios en Vercel o en Supabase de producción, solo con el «sí» de Eric y dejando apuntado qué has cambiado.

## 1. Primero mirar, sin cambiar nada
**Lo que pasó:**
- **El miércoles 11-nov por la tarde,** la app en el iPhone de Eric cerró su sesión: al abrir salía un momento el formulario de origen y destino y luego pedía el correo. Al entrar, «upstream request timeout» y no cargaba nada. El jueves 12 volvía a funcionar.
- **El panel de Supabase (plan gratuito, instancia NANO)** decía:
  - Egress **9,69 GB de 5 GB**;
  - «Organization exceeded its quota in the previous billing cycle · Projects will be restricted from **11 Dec, 2026** if your organization remains over quota».
  - Lo demás, bien: base de datos 85 MB, 3 usuarios, 0 GB de archivos.
- **Eric no sabe si llegó a parar la tarea** (`select cron.unschedule('avisos-viaje')`) **ni a reiniciar el proyecto.** Míralo tú.

**Dime, en palabras sencillas:**
- **La tarea `avisos-viaje`:** si sigue activa (`cron.job`) y cuántas filas y cuánto ocupa `net._http_response`.
- **Qué pasó el 11-nov:** los registros de Vercel (funciones de `/api`) y lo que puedas ver de Supabase de ese día.
- **Cuánto lee de Supabase cada llamada a `/api/cron/avisos-viaje`,** y cuánto suma al día.
- **Qué otras llamadas gastan salida de datos y cuánto:** al abrir un viaje, HOY, DÍAS, los logros, las fotos, la sincronización… Ordénalas de más a menos, con una cuenta aproximada al mes con 3 usuarios.
- **Si te hace falta ver el panel de Supabase** (Usage › Egress por servicio: Database, Auth, Storage, Realtime), dile a Eric qué captura sacar.

## 2. Los avisos del viaje: leer lo mínimo
- **Que el aviso no lea viajes enteros con sus rutas cada vez.** Al guardar o cambiar un viaje (o una vez al día), calcula los avisos del día con su hora y guárdalos en una tabla pequeña (por ejemplo `avisos_programados`: usuario, viaje, hora, texto, enviado). La tarea solo busca los que tocan ahora y los manda.
- **Cada 5 minutos,** no cada minuto (el servidor ya admite retraso).
- **Mismas reglas de la HOY3:**
  - la hora de Canarias;
  - como mucho 4 al día y nada de noche;
  - las 4 decisiones de Eric;
  - los compañeros del viaje compartido.
- **Si hace falta una migración,** el SQL listo para pegar, con su número, y el SQL para volver a poner la tarea cada 5 minutos.
- **Prueba de un día entero simulado:** cuántos bytes lee la tarea en 24 h. Objetivo: unos pocos MB al día, no GB.

## 3. Bajar el resto de la salida de datos
- **Arregla lo que más gaste,** sin cambiar lo que ve el viajero. Por ejemplo:
  - pedir solo las columnas que hacen falta;
  - no volver a descargar el viaje entero si no ha cambiado;
  - guardar en el móvil lo que no cambia.
- **El objetivo:** que con el uso de ahora el proyecto quede muy por debajo de 5 GB al mes. Dime tu cuenta, antes y después.
- **Si no se puede llegar sin pasar a Pro,** dímelo antes del 11-dic.

## 4. Que una caída no eche al viajero
- **Al abrir la app:** mientras comprueba la sesión, el logo cargando. Con sesión, Mis viajes; sin sesión, la pantalla de entrar. NUNCA el formulario de origen y destino un momento.
- **Si Supabase no contesta** (tiempo de espera, «upstream request timeout», sin red):
  - no se cierra la sesión;
  - se enseña lo guardado en el móvil (el viaje, HOY de hoy, como en sin internet, H15), con la línea «No llegamos al servidor. Lo de hoy está guardado en tu móvil.»;
  - se reintenta solo.
- **Para todos los destinos.**

## 5. Dos comprobaciones
- **Administradores:** el 7-nov `LOGROS_ADMIN_EMAILS` se reescribió entero con dos correos (el de Eric de la app y el de su pareja), porque no se podía leer. Pregúntale a Eric si falta algún correo y, si falta, añádelo con su «sí» y redespliega.
- **El Pase Dúo de cortesía para Eric** (0 €, para leer documentos): mira, solo leyendo, si llegó a crearse. Si no, el SQL listo para pegar, como te pedí el 7-nov, marcado como cortesía y no como venta.

## 6. La prueba
- **`pruebaJutrip` en 0** y la muestra de 60 de Roma, idéntica.
- **Nueva `pruebaEstabilidad`:**
  - la tarea lee solo los avisos que tocan;
  - los avisos salen a su hora en un día simulado de Lanzarote;
  - al abrir la app no sale el formulario;
  - con Supabase caído (simulado) no se cierra la sesión y se ve HOY guardado.
- **En el REPASO:**
  - lo que encontraste en el apartado 1;
  - la cuenta de salida de datos antes y después;
  - qué has cambiado en Vercel o Supabase;
  - tu lista de comprobación DE ESTA TANDA.

Cuando acabe, con la prueba en 0 fallos, git status limpio y nada privado, haz push de main a origin, sin --force. Después comprueba en producción, en modo iPhone, que la app carga, que se entra con la sesión y que la tarea va cada 5 minutos. Si algo falla, no hagas push y explícalo. Al final, reinicia el api-server.
