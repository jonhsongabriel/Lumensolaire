-- Insérer des sites d'exemple
INSERT INTO public.sites (name, location, latitude, longitude, status, system_type, capacity_kw, installation_date) VALUES
  ('Site Solaire Paris Nord', 'Paris, Île-de-France', 48.8566, 2.3522, 'operational', 'hybrid', 150.00, '2024-01-15'),
  ('Installation Lyon Est', 'Lyon, Auvergne-Rhône-Alpes', 45.7640, 4.8357, 'operational', 'grid-connected', 200.00, '2023-06-20'),
  ('Centrale Marseille', 'Marseille, Provence-Alpes-Côte d''Azur', 43.2965, 5.3698, 'alert', 'autonomous', 100.00, '2024-03-10'),
  ('Parc Toulouse Sud', 'Toulouse, Occitanie', 43.6047, 1.4442, 'operational', 'hybrid', 180.00, '2023-11-05'),
  ('Station Bordeaux', 'Bordeaux, Nouvelle-Aquitaine', 44.8378, -0.5792, 'offline', 'grid-connected', 120.00, '2024-02-28');

-- Insérer des données de monitoring récentes pour chaque site
INSERT INTO public.monitoring_data (site_id, production_kw, consumption_kw, battery_level_percent, battery_voltage, temperature_celsius, grid_status, timestamp)
SELECT 
  s.id,
  (random() * 100 + 50)::numeric(10,3) as production_kw,
  (random() * 80 + 30)::numeric(10,3) as consumption_kw,
  (random() * 40 + 60)::numeric(5,2) as battery_level_percent,
  (random() * 10 + 48)::numeric(10,2) as battery_voltage,
  (random() * 15 + 20)::numeric(5,2) as temperature_celsius,
  CASE WHEN random() > 0.5 THEN 'connected' ELSE 'disconnected' END as grid_status,
  now() - (interval '1 minute' * generate_series(0, 60))
FROM public.sites s
CROSS JOIN generate_series(0, 60);

-- Insérer des alertes d'exemple
INSERT INTO public.alerts (site_id, severity, status, title, message, threshold_value, actual_value)
SELECT 
  id,
  'warning',
  'new',
  'Température élevée détectée',
  'La température du système dépasse le seuil recommandé',
  35.0,
  38.5
FROM public.sites
WHERE status = 'alert'
LIMIT 1;

INSERT INTO public.alerts (site_id, severity, status, title, message, threshold_value, actual_value)
SELECT 
  id,
  'critical',
  'new',
  'Perte de communication',
  'Le site ne répond plus depuis plus de 5 minutes',
  NULL,
  NULL
FROM public.sites
WHERE status = 'offline'
LIMIT 1;

-- Insérer des configurations de site
INSERT INTO public.site_configurations (site_id, parameter_name, parameter_value, unit, description, min_value, max_value)
SELECT 
  id,
  'seuil_temperature_max',
  '35',
  '°C',
  'Température maximale avant déclenchement d''alerte',
  20,
  50
FROM public.sites;

INSERT INTO public.site_configurations (site_id, parameter_name, parameter_value, unit, description, min_value, max_value)
SELECT 
  id,
  'seuil_batterie_min',
  '20',
  '%',
  'Niveau minimum de batterie avant alerte',
  10,
  50
FROM public.sites;

INSERT INTO public.site_configurations (site_id, parameter_name, parameter_value, unit, description, min_value, max_value)
SELECT 
  id,
  'intervalle_collecte',
  '60',
  'secondes',
  'Fréquence de collecte des données',
  30,
  300
FROM public.sites;