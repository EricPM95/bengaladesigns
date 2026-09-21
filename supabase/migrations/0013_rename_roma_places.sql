-- 0013: renombrado de lugares de Roma a la convención en español (Prompt 2, Tarea D).
--
-- `place_content_cache` (0009) y `place_likes` (0012) guardan el lugar por NOMBRE, no por id, así
-- que renombrar los lugares en data/pipeline_v2/roma.json dejaría esas filas huérfanas: las fichas
-- cacheadas (que costaron llamadas de pago a Claude) no se volverían a encontrar y los "me gusta"
-- de los viajeros apuntarían a un lugar inexistente. Esto las mueve al nombre nuevo.
--
-- Idempotente: si no queda ninguna fila con el nombre viejo, cada sentencia no hace nada.
-- En place_likes se borra antes el posible choque con el unique (place_name, destination, user_id)
-- — el caso raro de un usuario que ya hubiera dado like al nombre nuevo.

-- Altar de la Patria (Vittoriano) -> Altar de la Patria
update public.place_content_cache set place_name = 'Altar de la Patria'
  where destination ilike 'roma' and place_name = 'Altar de la Patria (Vittoriano)'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Altar de la Patria');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Altar de la Patria (Vittoriano)';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Altar de la Patria (Vittoriano)'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Altar de la Patria' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Altar de la Patria' where destination ilike 'roma' and place_name = 'Altar de la Patria (Vittoriano)';

-- Piazza Venezia -> Plaza Venecia
update public.place_content_cache set place_name = 'Plaza Venecia'
  where destination ilike 'roma' and place_name = 'Piazza Venezia'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza Venecia');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Piazza Venezia';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Piazza Venezia'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza Venecia' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza Venecia' where destination ilike 'roma' and place_name = 'Piazza Venezia';

-- Piazza del Campidoglio -> Plaza del Campidoglio
update public.place_content_cache set place_name = 'Plaza del Campidoglio'
  where destination ilike 'roma' and place_name = 'Piazza del Campidoglio'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza del Campidoglio');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Piazza del Campidoglio';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Piazza del Campidoglio'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza del Campidoglio' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza del Campidoglio' where destination ilike 'roma' and place_name = 'Piazza del Campidoglio';

-- San Pietro in Vincoli -> Iglesia de San Pietro in Vincoli
update public.place_content_cache set place_name = 'Iglesia de San Pietro in Vincoli'
  where destination ilike 'roma' and place_name = 'San Pietro in Vincoli'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de San Pietro in Vincoli');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'San Pietro in Vincoli';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'San Pietro in Vincoli'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de San Pietro in Vincoli' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de San Pietro in Vincoli' where destination ilike 'roma' and place_name = 'San Pietro in Vincoli';

-- Teatro Marcelo -> Teatro de Marcelo
update public.place_content_cache set place_name = 'Teatro de Marcelo'
  where destination ilike 'roma' and place_name = 'Teatro Marcelo'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Teatro de Marcelo');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Teatro Marcelo';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Teatro Marcelo'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Teatro de Marcelo' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Teatro de Marcelo' where destination ilike 'roma' and place_name = 'Teatro Marcelo';

-- Santa Maria della Vittoria -> Iglesia de Santa Maria della Vittoria
update public.place_content_cache set place_name = 'Iglesia de Santa Maria della Vittoria'
  where destination ilike 'roma' and place_name = 'Santa Maria della Vittoria'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de Santa Maria della Vittoria');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Santa Maria della Vittoria';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Santa Maria della Vittoria'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de Santa Maria della Vittoria' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de Santa Maria della Vittoria' where destination ilike 'roma' and place_name = 'Santa Maria della Vittoria';

-- Fontana di Trevi -> Fontana de Trevi
update public.place_content_cache set place_name = 'Fontana de Trevi'
  where destination ilike 'roma' and place_name = 'Fontana di Trevi'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Fontana de Trevi');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Fontana di Trevi';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Fontana di Trevi'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Fontana de Trevi' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Fontana de Trevi' where destination ilike 'roma' and place_name = 'Fontana di Trevi';

-- Plaza España y Escalinata -> Plaza de España
update public.place_content_cache set place_name = 'Plaza de España'
  where destination ilike 'roma' and place_name = 'Plaza España y Escalinata'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza de España');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Plaza España y Escalinata';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Plaza España y Escalinata'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza de España' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza de España' where destination ilike 'roma' and place_name = 'Plaza España y Escalinata';

-- San Luigi dei Francesi -> Iglesia de San Luigi dei Francesi
update public.place_content_cache set place_name = 'Iglesia de San Luigi dei Francesi'
  where destination ilike 'roma' and place_name = 'San Luigi dei Francesi'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de San Luigi dei Francesi');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'San Luigi dei Francesi';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'San Luigi dei Francesi'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de San Luigi dei Francesi' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de San Luigi dei Francesi' where destination ilike 'roma' and place_name = 'San Luigi dei Francesi';

-- Ghetto Ebraico -> Barrio Judío
update public.place_content_cache set place_name = 'Barrio Judío'
  where destination ilike 'roma' and place_name = 'Ghetto Ebraico'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Barrio Judío');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Ghetto Ebraico';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Ghetto Ebraico'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Barrio Judío' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Barrio Judío' where destination ilike 'roma' and place_name = 'Ghetto Ebraico';

-- Santa Maria sopra Minerva -> Iglesia de Santa Maria sopra Minerva
update public.place_content_cache set place_name = 'Iglesia de Santa Maria sopra Minerva'
  where destination ilike 'roma' and place_name = 'Santa Maria sopra Minerva'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de Santa Maria sopra Minerva');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Santa Maria sopra Minerva';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Santa Maria sopra Minerva'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de Santa Maria sopra Minerva' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de Santa Maria sopra Minerva' where destination ilike 'roma' and place_name = 'Santa Maria sopra Minerva';

-- Sant'Ignazio di Loyola -> Iglesia de San Ignacio de Loyola
update public.place_content_cache set place_name = 'Iglesia de San Ignacio de Loyola'
  where destination ilike 'roma' and place_name = 'Sant''Ignazio di Loyola'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de San Ignacio de Loyola');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Sant''Ignazio di Loyola';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Sant''Ignazio di Loyola'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de San Ignacio de Loyola' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de San Ignacio de Loyola' where destination ilike 'roma' and place_name = 'Sant''Ignazio di Loyola';

-- Fontana delle Tartarughe -> Fuente de las Tortugas
update public.place_content_cache set place_name = 'Fuente de las Tortugas'
  where destination ilike 'roma' and place_name = 'Fontana delle Tartarughe'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Fuente de las Tortugas');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Fontana delle Tartarughe';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Fontana delle Tartarughe'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Fuente de las Tortugas' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Fuente de las Tortugas' where destination ilike 'roma' and place_name = 'Fontana delle Tartarughe';

-- Fontana del Tritone -> Fuente del Tritón
update public.place_content_cache set place_name = 'Fuente del Tritón'
  where destination ilike 'roma' and place_name = 'Fontana del Tritone'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Fuente del Tritón');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Fontana del Tritone';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Fontana del Tritone'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Fuente del Tritón' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Fuente del Tritón' where destination ilike 'roma' and place_name = 'Fontana del Tritone';

-- Piazza Colonna -> Plaza Colonna
update public.place_content_cache set place_name = 'Plaza Colonna'
  where destination ilike 'roma' and place_name = 'Piazza Colonna'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza Colonna');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Piazza Colonna';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Piazza Colonna'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza Colonna' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza Colonna' where destination ilike 'roma' and place_name = 'Piazza Colonna';

-- Via dei Condotti -> Via Condotti
update public.place_content_cache set place_name = 'Via Condotti'
  where destination ilike 'roma' and place_name = 'Via dei Condotti'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Via Condotti');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Via dei Condotti';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Via dei Condotti'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Via Condotti' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Via Condotti' where destination ilike 'roma' and place_name = 'Via dei Condotti';

-- Piazza Farnese -> Plaza Farnese
update public.place_content_cache set place_name = 'Plaza Farnese'
  where destination ilike 'roma' and place_name = 'Piazza Farnese'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza Farnese');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Piazza Farnese';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Piazza Farnese'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza Farnese' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza Farnese' where destination ilike 'roma' and place_name = 'Piazza Farnese';

-- Galería Borghese (museo) -> Galería Borghese
update public.place_content_cache set place_name = 'Galería Borghese'
  where destination ilike 'roma' and place_name = 'Galería Borghese (museo)'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Galería Borghese');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Galería Borghese (museo)';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Galería Borghese (museo)'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Galería Borghese' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Galería Borghese' where destination ilike 'roma' and place_name = 'Galería Borghese (museo)';

-- Parque Villa Borghese -> Parque de Villa Borghese
update public.place_content_cache set place_name = 'Parque de Villa Borghese'
  where destination ilike 'roma' and place_name = 'Parque Villa Borghese'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Parque de Villa Borghese');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Parque Villa Borghese';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Parque Villa Borghese'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Parque de Villa Borghese' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Parque de Villa Borghese' where destination ilike 'roma' and place_name = 'Parque Villa Borghese';

-- Bioparco di Roma -> Bioparque de Roma
update public.place_content_cache set place_name = 'Bioparque de Roma'
  where destination ilike 'roma' and place_name = 'Bioparco di Roma'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Bioparque de Roma');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Bioparco di Roma';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Bioparco di Roma'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Bioparque de Roma' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Bioparque de Roma' where destination ilike 'roma' and place_name = 'Bioparco di Roma';

-- Galleria Nazionale d'Arte Moderna -> Galería Nacional de Arte Moderno
update public.place_content_cache set place_name = 'Galería Nacional de Arte Moderno'
  where destination ilike 'roma' and place_name = 'Galleria Nazionale d''Arte Moderna'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Galería Nacional de Arte Moderno');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Galleria Nazionale d''Arte Moderna';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Galleria Nazionale d''Arte Moderna'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Galería Nacional de Arte Moderno' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Galería Nacional de Arte Moderno' where destination ilike 'roma' and place_name = 'Galleria Nazionale d''Arte Moderna';

-- Castel Sant'Angelo -> Castillo de Sant'Angelo
update public.place_content_cache set place_name = 'Castillo de Sant''Angelo'
  where destination ilike 'roma' and place_name = 'Castel Sant''Angelo'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Castillo de Sant''Angelo');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Castel Sant''Angelo';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Castel Sant''Angelo'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Castillo de Sant''Angelo' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Castillo de Sant''Angelo' where destination ilike 'roma' and place_name = 'Castel Sant''Angelo';

-- Ponte Sant'Angelo -> Puente Sant'Angelo
update public.place_content_cache set place_name = 'Puente Sant''Angelo'
  where destination ilike 'roma' and place_name = 'Ponte Sant''Angelo'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Puente Sant''Angelo');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Ponte Sant''Angelo';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Ponte Sant''Angelo'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Puente Sant''Angelo' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Puente Sant''Angelo' where destination ilike 'roma' and place_name = 'Ponte Sant''Angelo';

-- Santa Maria in Trastevere -> Iglesia de Santa Maria in Trastevere
update public.place_content_cache set place_name = 'Iglesia de Santa Maria in Trastevere'
  where destination ilike 'roma' and place_name = 'Santa Maria in Trastevere'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Iglesia de Santa Maria in Trastevere');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Santa Maria in Trastevere';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Santa Maria in Trastevere'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Iglesia de Santa Maria in Trastevere' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Iglesia de Santa Maria in Trastevere' where destination ilike 'roma' and place_name = 'Santa Maria in Trastevere';

-- Piazza Trilussa -> Plaza Trilussa
update public.place_content_cache set place_name = 'Plaza Trilussa'
  where destination ilike 'roma' and place_name = 'Piazza Trilussa'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Plaza Trilussa');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Piazza Trilussa';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Piazza Trilussa'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Plaza Trilussa' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Plaza Trilussa' where destination ilike 'roma' and place_name = 'Piazza Trilussa';

-- Bocca della Verità -> Boca de la Verdad
update public.place_content_cache set place_name = 'Boca de la Verdad'
  where destination ilike 'roma' and place_name = 'Bocca della Verità'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Boca de la Verdad');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Bocca della Verità';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Bocca della Verità'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Boca de la Verdad' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Boca de la Verdad' where destination ilike 'roma' and place_name = 'Bocca della Verità';

-- Giardino degli Aranci -> Jardín de los Naranjos
update public.place_content_cache set place_name = 'Jardín de los Naranjos'
  where destination ilike 'roma' and place_name = 'Giardino degli Aranci'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Jardín de los Naranjos');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Giardino degli Aranci';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Giardino degli Aranci'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Jardín de los Naranjos' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Jardín de los Naranjos' where destination ilike 'roma' and place_name = 'Giardino degli Aranci';

-- Cerradura del Aventino -> Ojo de la Cerradura del Aventino
update public.place_content_cache set place_name = 'Ojo de la Cerradura del Aventino'
  where destination ilike 'roma' and place_name = 'Cerradura del Aventino'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Ojo de la Cerradura del Aventino');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Cerradura del Aventino';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Cerradura del Aventino'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Ojo de la Cerradura del Aventino' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Ojo de la Cerradura del Aventino' where destination ilike 'roma' and place_name = 'Cerradura del Aventino';

-- Santa Maria Maggiore -> Basílica de Santa María la Mayor
update public.place_content_cache set place_name = 'Basílica de Santa María la Mayor'
  where destination ilike 'roma' and place_name = 'Santa Maria Maggiore'
    and not exists (select 1 from public.place_content_cache c2 where c2.destination = place_content_cache.destination and c2.place_name = 'Basílica de Santa María la Mayor');
delete from public.place_content_cache where destination ilike 'roma' and place_name = 'Santa Maria Maggiore';

delete from public.place_likes l where l.destination ilike 'roma' and l.place_name = 'Santa Maria Maggiore'
  and exists (select 1 from public.place_likes l2 where l2.destination = l.destination and l2.place_name = 'Basílica de Santa María la Mayor' and l2.user_id = l.user_id);
update public.place_likes set place_name = 'Basílica de Santa María la Mayor' where destination ilike 'roma' and place_name = 'Santa Maria Maggiore';
