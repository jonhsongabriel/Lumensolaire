-- LUMEN Database Schema for PostgreSQL
-- PostgreSQL 15+: gen_random_uuid() is built-in, no extensions needed

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'engineer', 'technician', 'client');
CREATE TYPE site_status AS ENUM ('operational', 'alert', 'offline');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('new', 'acknowledged', 'resolved');
CREATE TYPE system_type AS ENUM ('hybrid', 'autonomous', 'grid-connected');
CREATE TYPE report_type AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE scada_protocol AS ENUM ('modbus', 'opc-ua', 'mqtt', 'http', 'tcp');
CREATE TYPE scada_connection_status AS ENUM ('connected', 'disconnected', 'error', 'connecting');

-- Profiles table (users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  role user_role DEFAULT 'client',
  theme VARCHAR(20) DEFAULT 'light',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMPTZ,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites table (Projects)
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status site_status DEFAULT 'offline',
  system_type system_type DEFAULT 'hybrid',
  capacity_kw DECIMAL(10, 2),
  installation_date DATE,
  last_communication TIMESTAMPTZ,
  -- SCADA fields
  serial_number VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  scada_enabled BOOLEAN DEFAULT FALSE,
  scada_protocol scada_protocol DEFAULT 'modbus',
  scada_connection_status scada_connection_status DEFAULT 'disconnected',
  scada_last_connected TIMESTAMPTZ,
  scada_config JSONB DEFAULT '{}',
  -- Project details
  wifi_ssid VARCHAR(100),
  wifi_password VARCHAR(100),
  wifi_ip INET,
  monitor_type VARCHAR(50),
  monitor_model VARCHAR(100),
  monitor_serial VARCHAR(100),
  equipment_list JSONB DEFAULT '[]',
  mqtt_topic_prefix VARCHAR(100) DEFAULT 'centrale',
  photo_url TEXT,
  description TEXT,
  client_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring data table
CREATE TABLE IF NOT EXISTS monitoring_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  production_kw DECIMAL(10, 2),
  consumption_kw DECIMAL(10, 2),
  battery_level_percent DECIMAL(5, 2),
  battery_voltage DECIMAL(6, 2),
  temperature_celsius DECIMAL(5, 2),
  grid_status VARCHAR(50),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  severity alert_severity DEFAULT 'info',
  status alert_status DEFAULT 'new',
  title VARCHAR(200) NOT NULL,
  message TEXT,
  threshold_value DECIMAL(10, 2),
  actual_value DECIMAL(10, 2),
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  site_id UUID REFERENCES sites(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sites association
CREATE TABLE IF NOT EXISTS user_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, site_id)
);

-- Site configurations
CREATE TABLE IF NOT EXISTS site_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  parameter_name VARCHAR(100) NOT NULL,
  parameter_value TEXT NOT NULL,
  unit VARCHAR(50),
  description TEXT,
  min_value DECIMAL(10, 2),
  max_value DECIMAL(10, 2),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_type report_type DEFAULT 'daily',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  file_url TEXT,
  generated_by UUID REFERENCES profiles(id),
  sent_to TEXT[],
  send_status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_data_site_id ON monitoring_data(site_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_data_timestamp ON monitoring_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_site_id ON alerts(site_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sites_serial_number ON sites(serial_number);
CREATE INDEX IF NOT EXISTS idx_sites_scada_enabled ON sites(scada_enabled);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: 'admin123' - will be hashed in init script)
INSERT INTO profiles (username, email, role, password_hash)
VALUES ('admin', 'admin@lumen.local', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (username) DO NOTHING;
