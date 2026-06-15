// Page de supervision temps réel d'un site
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RealTimeChart } from '@/components/features/RealTimeChart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getAllSites,
  getSiteById,
  getMonitoringDataByPeriod,
  subscribeToMonitoringData
} from '@/db/api';
import type { Site, MonitoringData } from '@/types';
import { Activity, Battery, Thermometer, Zap, WifiOff, Wifi } from 'lucide-react';
import { subHours, subDays } from 'date-fns';

export default function MonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [latestData, setLatestData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');

  const siteId = searchParams.get('site');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (siteId) {
      loadSiteData(siteId);
    }
  }, [siteId, timeRange]);

  const loadSites = async () => {
    const data = await getAllSites();
    setSites(data);
    
    // Si aucun site n'est sélectionné, sélectionner le premier
    if (!siteId && data.length > 0) {
      setSearchParams({ site: data[0].id });
    }
  };

  const loadSiteData = async (id: string) => {
    setLoading(true);
    
    const site = await getSiteById(id);
    setSelectedSite(site);

    // Charger les données historiques selon la plage temporelle
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = subHours(endDate, 1);
        break;
      case '24h':
        startDate = subHours(endDate, 24);
        break;
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      default:
        startDate = subHours(endDate, 1);
    }

    const data = await getMonitoringDataByPeriod(
      id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    setMonitoringData(data);
    if (data.length > 0) {
      setLatestData(data[data.length - 1]);
    }

    setLoading(false);

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = subscribeToMonitoringData(id, (newData) => {
      setLatestData(newData);
      setMonitoringData(prev => [...prev.slice(-100), newData]); // Garder les 100 dernières entrées
    });

    return () => {
      unsubscribe();
    };
  };

  const handleSiteChange = (value: string) => {
    setSearchParams({ site: value });
  };

  const isOnline = selectedSite?.status !== 'offline';

  if (loading && !selectedSite) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supervision temps réel</h1>
          <p className="text-muted-foreground">Données de monitoring en direct</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={siteId || ''} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Dernière heure</SelectItem>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSite && (
        <>
          {/* Indicateurs en temps réel */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production</CardTitle>
                <Zap className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestData?.production_kw?.toFixed(2) || '0.00'} kW
                </div>
                <p className="text-xs text-muted-foreground">Solaire</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consommation</CardTitle>
                <Activity className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestData?.consumption_kw?.toFixed(2) || '0.00'} kW
                </div>
                <p className="text-xs text-muted-foreground">Charge actuelle</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Batterie</CardTitle>
                <Battery className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestData?.battery_level_percent?.toFixed(0) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestData?.battery_voltage?.toFixed(1) || '0.0'}V
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Température</CardTitle>
                <Thermometer className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestData?.temperature_celsius?.toFixed(1) || '0.0'}°C
                </div>
                <p className="text-xs text-muted-foreground">
                  <Badge variant={isOnline ? 'default' : 'destructive'} className="mt-1">
                    {isOnline ? (
                      <>
                        <Wifi className="mr-1 h-3 w-3" />
                        En ligne
                      </>
                    ) : (
                      <>
                        <WifiOff className="mr-1 h-3 w-3" />
                        Hors ligne
                      </>
                    )}
                  </Badge>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques dynamiques */}
          <div className="grid gap-4 lg:grid-cols-2">
            <RealTimeChart
              data={monitoringData}
              title="Production vs Consommation"
              dataKeys={[
                { key: 'production_kw', label: 'Production (kW)', color: 'hsl(var(--chart-1))' },
                { key: 'consumption_kw', label: 'Consommation (kW)', color: 'hsl(var(--chart-2))' }
              ]}
            />

            <RealTimeChart
              data={monitoringData}
              title="État de la batterie"
              dataKeys={[
                { key: 'battery_level_percent', label: 'Niveau (%)', color: 'hsl(var(--chart-3))' }
              ]}
            />

            <RealTimeChart
              data={monitoringData}
              title="Température"
              dataKeys={[
                { key: 'temperature_celsius', label: 'Température (°C)', color: 'hsl(var(--chart-4))' }
              ]}
            />

            <Card>
              <CardHeader>
                <CardTitle>Informations du site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Localisation:</span>
                  <span className="text-sm font-medium">{selectedSite.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type de système:</span>
                  <span className="text-sm font-medium capitalize">{selectedSite.system_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Capacité:</span>
                  <span className="text-sm font-medium">{selectedSite.capacity_kw} kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Statut réseau:</span>
                  <span className="text-sm font-medium">{latestData?.grid_status || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
