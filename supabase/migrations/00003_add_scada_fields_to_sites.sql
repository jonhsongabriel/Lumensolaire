
-- Add SCADA fields to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS serial_number TEXT UNIQUE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS scada_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS scada_protocol TEXT DEFAULT 'modbus' CHECK (scada_protocol IN ('modbus', 'opc-ua', 'mqtt', 'http', 'tcp'));
ALTER TABLE sites ADD COLUMN IF NOT EXISTS scada_connection_status TEXT DEFAULT 'disconnected' CHECK (scada_connection_status IN ('connected', 'disconnected', 'error', 'connecting'));
ALTER TABLE sites ADD COLUMN IF NOT EXISTS scada_last_connected TIMESTAMPTZ;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS scada_config JSONB DEFAULT '{}';

-- Update existing sites to have scada_enabled = FALSE by default
UPDATE sites SET scada_enabled = FALSE WHERE scada_enabled IS NULL;
