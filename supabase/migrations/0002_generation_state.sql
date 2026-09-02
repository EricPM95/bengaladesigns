-- Progreso de generación en curso — la ruta ahora se construye encadenando varias llamadas
-- pequeñas (anclas → esqueleto → bloques de días, ver routeGenerationOrchestrator.ts) en vez de una
-- única llamada gigante. Este campo guarda todo lo necesario para retomar exactamente donde se dejó
-- si el usuario cierra la pestaña a mitad de generación — null cuando no hay ninguna generación en
-- curso (ruta completa, o ninguna empezada todavía).
alter table public.trips add column if not exists generation_state jsonb;
