// Type definitions for LUMEN Energy Monitoring Platform

export type UserRole = 'admin' | 'engineer' | 'technician' | 'client';
export type SiteStatus = 'operational' | 'alert' | 'offline';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type SystemType = 'hybrid' | 'autonomous' | 'grid-connected';
export type ReportType = 'daily' | 'weekly' | 'monthly';
export type ScadaProtocol = 'modbus' | 'opc-ua' | 'mqtt' | 'http' | 'tcp';
export type ScadaConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  theme: string;
  two_factor_enabled: boolean;
  failed_login_attempts: number;
  account_locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  type: string;
  brand: string;
  model: string;
  serial?: string;
  count?: number;
  capacity_w?: number;
  capacity_kw?: number;
  capacity_kwh?: number;
}

export interface Site {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: SiteStatus;
  system_type: SystemType;
  capacity_kw: number | null;
  installation_date: string | null;
  last_communication: string | null;
  // SCADA fields
  serial_number: string | null;
  password: string | null;
  scada_enabled: boolean;
  scada_protocol: ScadaProtocol;
  scada_connection_status: ScadaConnectionStatus;
  scada_last_connected: string | null;
  scada_config: Record<string, unknown>;
  // Project details
  wifi_ssid: string | null;
  wifi_password: string | null;
  wifi_ip: string | null;
  monitor_type: string | null;
  monitor_model: string | null;
  monitor_serial: string | null;
  equipment_list: Equipment[];
  mqtt_topic_prefix: string;
  photo_url: string | null;
  description: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoringData {
  id: string;
  site_id: string;
  production_kw: number | null;
  consumption_kw: number | null;
  battery_level_percent: number | null;
  battery_voltage: number | null;
  temperature_celsius: number | null;
  grid_status: string | null;
  timestamp: string;
  created_at: string;
}

export interface Alert {
  id: string;
  site_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  threshold_value: number | null;
  actual_value: number | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  site_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserSite {
  id: string;
  user_id: string;
  site_id: string;
  created_at: string;
}

export interface SiteConfiguration {
  id: string;
  site_id: string;
  parameter_name: string;
  parameter_value: string;
  unit: string | null;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface Report {
  id: string;
  site_id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  file_url: string | null;
  generated_by: string | null;
  sent_to: string[] | null;
  send_status: string;
  error_message: string | null;
  created_at: string;
}

// Extended types with relations
export interface SiteWithData extends Site {
  latest_data?: MonitoringData;
  alert_count?: number;
}

export interface AlertWithSite extends Alert {
  site?: Site;
}

export interface AuditLogWithUser extends AuditLog {
  user?: Profile;
  site?: Site;
}
