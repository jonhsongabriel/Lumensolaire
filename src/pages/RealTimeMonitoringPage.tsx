import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Wifi, WifiOff, Zap, Gauge, Thermometer, Battery, Power } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { sitesApi } from '@/services/api';
import type { Site } from '@/types';

interface LiveDataPoint {
  timestamp: string;
  timeLabel: string;
  production_kw: number | null;
  consumption_kw: number | null;
  battery_level_percent: number | null;
  battery_voltage: number | null;
  temperature_celsius: number | null;
}

interface WsMessage {
  type: string;
  site_id?: string;
  site_name?: string;
  data?: LiveDataPoint;
  received_at?: string;
  message?: string;
}

const MAX_POINTS = 60; // Keep last 60 data points (~1 minute at 1 msg/sec)

export default function RealTimeMonitoringPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Load sites
  useEffect(() => {
    let cancelled = false;
    sitesApi.getAll()
      .then((data: Site[]) => {
        if (!cancelled) {
          setSites(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) setSites([]);
      })
      .finally(() => {
        if (!cancelled) setSitesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);
  const [dataPoints, setDataPoints] = useState<LiveDataPoint[]>([]);
  const [latestData, setLatestData] = useState<LiveDataPoint | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setWsStatus('connecting');

    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      console.log('[WS] Connecté au flux temps réel');

      // Subscribe to selected site if any
      if (selectedSiteId) {
        ws.send(JSON.stringify({ type: 'subscribe', siteId: selectedSiteId }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);

        if (msg.type === 'monitoring_data' && msg.data) {
          const point: LiveDataPoint = {
            ...msg.data,
            timeLabel: new Date(msg.data.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          };

          setDataPoints((prev) => {
            const next = [...prev, point];
            if (next.length > MAX_POINTS) next.shift();
            return next;
          });
          setLatestData(point);
        }
      } catch {
        // ignore malformed JSON
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      wsRef.current = null;
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWs();
      }, 3000);
    };

    ws.onerror = () => {
      setWsStatus('disconnected');
    };
  }, [selectedSiteId]);

  useEffect(() => {
    connectWs();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connectWs]);

  // Subscribe/unsubscribe when selected site changes
  useEffect(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      if (selectedSiteId) {
        ws.send(JSON.stringify({ type: 'subscribe', siteId: selectedSiteId }));
      } else {
        ws.send(JSON.stringify({ type: 'unsubscribe' }));
      }
    }
  }, [selectedSiteId]);

  const handleSiteChange = (value: string) => {
    setSelectedSiteId(value);
    setDataPoints([]);
    setLatestData(null);
  };

  const wsBadge = {
    connected: { label: 'Connecté', variant: 'default' as const, className: 'bg-green-600' },
    connecting: { label: 'Connexion...', variant: 'secondary' as const },
    disconnected: { label: 'Déconnecté', variant: 'destructive' as const },
  }[wsStatus];

  const selectedSite = sites.find((s: Site) => s.id === selectedSiteId);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Supervision Temps Réel
          </h1>
          <p className="text-muted-foreground">
            Données MQTT diffusées en direct depuis vos centrales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={wsBadge.variant} className={wsBadge.className}>
            {wsStatus === 'connected' ? (
              <Wifi className="h-3 w-3 mr-1" />
            ) : (
              <WifiOff className="h-3 w-3 mr-1" />
            )}
            {wsBadge.label}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              wsRef.current?.close();
              connectWs();
            }}
            disabled={wsStatus === 'connecting'}
          >
            {wsStatus === 'connecting' ? 'Connexion...' : 'Reconnexion'}
          </Button>
        </div>
      </div>

      {/* Site Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-full md:w-72">
              <label className="text-sm font-medium mb-1 block">Sélectionner un site</label>
              <Select
                value={selectedSiteId}
                onValueChange={handleSiteChange}
                disabled={sitesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un projet..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site: Site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} {site.serial_number ? `(${site.serial_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSite && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedSite.location}</Badge>
                <Badge variant={selectedSite.status === 'operational' ? 'default' : 'destructive'}>
                  {selectedSite.status}
                </Badge>
                {selectedSite.scada_enabled && (
                  <Badge variant="secondary">SCADA activé</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics Cards */}
      {latestData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            icon={<Power className="h-4 w-4" />}
            label="Production"
            value={latestData.production_kw?.toFixed(2) ?? '—'}
            unit="kW"
            color="text-green-500"
          />
          <MetricCard
            icon={<Zap className="h-4 w-4" />}
            label="Consommation"
            value={latestData.consumption_kw?.toFixed(2) ?? '—'}
            unit="kW"
            color="text-blue-500"
          />
          <MetricCard
            icon={<Battery className="h-4 w-4" />}
            label="Batterie"
            value={latestData.battery_level_percent?.toFixed(1) ?? '—'}
            unit="%"
            color="text-yellow-500"
          />
          <MetricCard
            icon={<Gauge className="h-4 w-4" />}
            label="Tension Batt"
            value={latestData.battery_voltage?.toFixed(1) ?? '—'}
            unit="V"
            color="text-purple-500"
          />
          <MetricCard
            icon={<Thermometer className="h-4 w-4" />}
            label="Température"
            value={latestData.temperature_celsius?.toFixed(1) ?? '—'}
            unit="°C"
            color="text-red-500"
          />
        </div>
      )}

      {/* Live Charts */}
      {dataPoints.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Production & Consommation (live)</CardTitle>
              <CardDescription>
                {dataPoints.length} points · dernières {Math.round(dataPoints.length / 1)}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} label={{ value: 'kW', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="production_kw"
                      name="Production (kW)"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="consumption_kw"
                      name="Consommation (kW)"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Niveau Batterie & Température (live)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 8 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="battery_level_percent"
                      name="Batterie (%)"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="temperature_celsius"
                      name="Température (°C)"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="py-12 text-center">
          <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">En attente de données</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {selectedSiteId
              ? 'Sélectionnez un site et attendez que l\'appareil envoie des données MQTT.'
              : 'Sélectionnez un site pour commencer la supervision temps réel.'}
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Assurez-vous que votre appareil est relié et que le broker MQTT est actif.
          </p>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className={`mb-2 ${color}`}>{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{unit}</div>
        <div className="text-xs font-medium mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
