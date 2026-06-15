-- Migration 002: Add project/site details (WiFi, Monitor, Equipment)

-- Add detailed fields to sites table
ALTER TABLE sites 
  ADD COLUMN IF NOT EXISTS wifi_ssid VARCHAR(100),
  ADD COLUMN IF NOT EXISTS wifi_password VARCHAR(100),
  ADD COLUMN IF NOT EXISTS wifi_ip INET,
  ADD COLUMN IF NOT EXISTS monitor_type VARCHAR(50), -- e.g., 'SMA', 'SolarEdge', 'Victron'
  ADD COLUMN IF NOT EXISTS monitor_model VARCHAR(100),
  ADD COLUMN IF NOT EXISTS monitor_serial VARCHAR(100),
  ADD COLUMN IF NOT EXISTS equipment_list JSONB DEFAULT '[]', -- array of equipment
  ADD COLUMN IF NOT EXISTS mqtt_topic_prefix VARCHAR(100) DEFAULT 'centrale',
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES profiles(id); -- owner client

-- Equipment items stored in JSONB example:
-- [
--   {"type": "onduleur", "brand": "SMA", "model": "Sunny Boy 5.0", "serial": "SB12345", "capacity_kw": 5},
--   {"type": "batterie", "brand": "Pylontech", "model": "US2000C", "count": 2, "capacity_kwh": 4.8},
--   {"type": "panneau", "brand": "Longi", "model": "LR6-72HBD-550M", "count": 20, "capacity_w": 550}
-- ]

-- Create index on client_id for filtering
CREATE INDEX IF NOT EXISTS idx_sites_client_id ON sites(client_id);

-- Update user_sites to support client ownership more explicitly
-- Already exists from schema.sql

-- Add helper view for project listing with client info
CREATE OR REPLACE VIEW v_projects AS
SELECT 
  s.*,
  p.username as client_username,
  p.email as client_email,
  CASE 
    WHEN s.scada_connection_status = 'connected' THEN 'En ligne'
    WHEN s.scada_connection_status = 'connecting' THEN 'Connexion...'
    WHEN s.scada_connection_status = 'error' THEN 'Erreur'
    ELSE 'Hors ligne'
  END as connection_status_label
FROM sites s
LEFT JOIN profiles p ON s.client_id = p.id;
