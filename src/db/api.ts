// Wrapper vers le backend REST (remplace Supabase)
import { authApi, sitesApi, monitoringApi } from '@/services/api';
import type {
  Profile,
  Site,
  MonitoringData,
  Alert,
  AuditLog,
  SiteConfiguration,
  SiteWithData,
  AlertWithSite,
  AuditLogWithUser,
  UserRole,
  AlertStatus,
  SiteStatus,
  ScadaProtocol,
  ScadaConnectionStatus,
} from '@/types';

// ==================== Profiles ====================

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    return await authApi.getMe();
  } catch {
    return null;
  }
}

export async function getAllProfiles(): Promise<Profile[]> {
  // TODO: add usersApi to backend if needed
  return [];
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
  try {
    await authApi.updateMe(updates);
    return true;
  } catch {
    return false;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  // TODO: add usersApi endpoint
  return false;
}

// ==================== Sites ====================

export async function getAllSites(): Promise<Site[]> {
  try {
    return await sitesApi.getAll();
  } catch {
    return [];
  }
}

export async function getSitesWithLatestData(): Promise<SiteWithData[]> {
  try {
    const sites: Site[] = await sitesApi.getAll();
    const sitesWithData: SiteWithData[] = [];
    for (const site of sites) {
      const latest = await monitoringApi.getLatest(site.id);
      sitesWithData.push({
        ...site,
        latest_data: latest || undefined,
        alert_count: 0,
      });
    }
    return sitesWithData;
  } catch {
    return [];
  }
}

export async function getSiteById(id: string): Promise<Site | null> {
  try {
    return await sitesApi.getById(id);
  } catch {
    return null;
  }
}

export async function createSite(site: Omit<Site, 'id' | 'created_at' | 'updated_at'>): Promise<Site | null> {
  try {
    return await sitesApi.create(site as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function updateSite(id: string, updates: Partial<Site>): Promise<boolean> {
  try {
    await sitesApi.update(id, updates as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
}

export async function updateSiteStatus(id: string, status: SiteStatus): Promise<boolean> {
  return updateSite(id, { status, last_communication: new Date().toISOString() });
}

// ==================== SCADA ====================

export async function registerScadaSite(
  name: string,
  location: string,
  serialNumber: string,
  password: string,
  protocol: ScadaProtocol = 'modbus',
): Promise<Site | null> {
  return createSite({
    name,
    location,
    latitude: 0,
    longitude: 0,
    status: 'offline',
    system_type: 'hybrid',
    capacity_kw: null,
    installation_date: null,
    last_communication: null,
    serial_number: serialNumber,
    password,
    scada_enabled: true,
    scada_protocol: protocol,
    scada_connection_status: 'disconnected' as ScadaConnectionStatus,
    scada_last_connected: null,
    scada_config: {},
    wifi_ssid: null,
    wifi_password: null,
    wifi_ip: null,
    monitor_type: null,
    monitor_model: null,
    monitor_serial: null,
    equipment_list: [],
    mqtt_topic_prefix: 'centrale',
    photo_url: null,
    description: null,
    client_id: null,
  });
}

export async function getScadaSites(): Promise<Site[]> {
  try {
    return await sitesApi.getScadaEnabled();
  } catch {
    return [];
  }
}

export async function verifyScadaCredentials(serialNumber: string, password: string): Promise<Site | null> {
  try {
    return await sitesApi.verifyScada(serialNumber, password);
  } catch {
    return null;
  }
}

export async function updateScadaConnectionStatus(
  siteId: string,
  status: ScadaConnectionStatus,
): Promise<boolean> {
  try {
    await sitesApi.updateScadaStatus(siteId, status);
    return true;
  } catch {
    return false;
  }
}

export async function updateScadaConfig(siteId: string, config: Record<string, unknown>): Promise<boolean> {
  try {
    await sitesApi.updateScadaConfig(siteId, { config });
    return true;
  } catch {
    return false;
  }
}

// ==================== Monitoring Data ====================

export async function getLatestMonitoringData(siteId: string): Promise<MonitoringData | null> {
  try {
    return await monitoringApi.getLatest(siteId);
  } catch {
    return null;
  }
}

export async function getMonitoringDataByPeriod(
  siteId: string,
  startDate: string,
  endDate: string,
): Promise<MonitoringData[]> {
  try {
    return await monitoringApi.getBySite(siteId, 1000, 0);
  } catch {
    return [];
  }
}

export async function insertMonitoringData(data: Omit<MonitoringData, 'id' | 'created_at'>): Promise<MonitoringData | null> {
  try {
    return await monitoringApi.create(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

// ==================== Alerts ====================

export async function getAlerts(siteId?: string, status?: AlertStatus): Promise<AlertWithSite[]> {
  // TODO: implement via backend alertsApi
  return [];
}

export async function getUnresolvedAlertCount(siteId: string): Promise<number> {
  // TODO: implement via backend
  return 0;
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
  // TODO: implement via backend
  return false;
}

export async function resolveAlert(alertId: string): Promise<boolean> {
  // TODO: implement via backend
  return false;
}

export async function createAlert(alert: Omit<Alert, 'id' | 'created_at'>): Promise<Alert | null> {
  // TODO: implement via backend
  return null;
}

// ==================== Audit Logs ====================

export async function getAuditLogs(
  entityType?: string,
  entityId?: string,
  limit: number = 100,
): Promise<AuditLogWithUser[]> {
  // TODO: implement via backend
  return [];
}

export async function createAuditLog(auditLog: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog | null> {
  // TODO: implement via backend
  return null;
}

// ==================== Site Configuration ====================

export async function getSiteConfigurations(siteId: string): Promise<SiteConfiguration[]> {
  // TODO: implement via backend
  return [];
}

export async function updateSiteConfiguration(
  configId: string,
  value: string,
  userId: string,
): Promise<boolean> {
  // TODO: implement via backend
  return false;
}

// ==================== Subscriptions (Realtime - disabled in REST mode) ====================

export function subscribeToSiteStatus(callback: (site: Site) => void): () => void {
  // TODO: implement WebSocket or polling
  return () => {};
}

export function subscribeToMonitoringData(siteId: string, callback: (data: MonitoringData) => void): () => void {
  // TODO: implement WebSocket or polling
  return () => {};
}

export function subscribeToAlerts(callback: (alert: Alert) => void): () => void {
  // TODO: implement WebSocket or polling
  return () => {};
}

// ==================== User Sites ====================

export async function getUserSites(userId: string): Promise<Site[]> {
  try {
    return await sitesApi.getAll();
  } catch {
    return [];
  }
}

export async function getUserSiteIds(userId: string): Promise<string[]> {
  const sites = await getUserSites(userId);
  return sites.map(s => s.id);
}

export async function assignUserToSite(userId: string, siteId: string): Promise<boolean> {
  // TODO: implement via backend
  return false;
}

export async function assignSiteToUser(userId: string, siteId: string): Promise<boolean> {
  return assignUserToSite(userId, siteId);
}

export async function removeUserFromSite(userId: string, siteId: string): Promise<boolean> {
  // TODO: implement via backend
  return false;
}
