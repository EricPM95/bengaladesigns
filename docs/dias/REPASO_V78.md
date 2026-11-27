# REPASO V78 (27-nov): que sitio cuenta cuando haces una foto, y los «puntos de foto»

Con pruebas: `pruebaV78` (67), `pruebaLogros1` (459), `pruebaLogros2` (53), `pruebaV5` (50), `pruebaV35A_logros` (126), V36, `pruebaJutrip` (130) y `pruebaPantallas8b` (arranque 262,3 KB), todas en 0. No hizo falta migracion ni consultas nuevas a Supabase.

- ✅ Una sola regla para la camara y la galeria: la parada de HOY si tiene algo por ganar (solo ella); si no, dentro del radio normal todos los que tengan algo por ganar, y desde un punto de foto solo el sitio de ese punto. Lo ya ganado nunca cuenta; una foto sin nada que ganar va al album sin aviso. La ubicacion se mira al hacer la foto y la parada de ahora la manda la app.
- ✅ El codigo de `puntos_de_foto` esta listo y probado con 2 puntos de ejemplo; ningun punto en los datos reales.
- 🟡 Via dei Fori: con los datos reales de hoy sigue yendo al Foro hasta que apruebes el punto «Via dei Fori Imperiali»; con el punto y el Coliseo de parada va SOLO al Coliseo (`via_dei_fori_antes_despues.txt`).
- 🟡 9 puntos propuestos con su fuente (Roma 5, Lanzarote 4), solo 3 con fuente abierta y confirmada: `docs/dias/PUNTOS_DE_FOTO_PROPUESTOS.md`.
- Sin comprobar: en un movil real ni con una foto real. Decisiones: `DECISIONES_V78.md`.
