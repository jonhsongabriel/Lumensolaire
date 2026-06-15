// Composant de carte interactive pour afficher les sites
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SiteWithData } from '@/types';
import { MapPin, Activity, AlertTriangle, WifiOff } from 'lucide-react';

interface SiteMapProps {
  sites: SiteWithData[];
  onSiteClick?: (site: SiteWithData) => void;
}

export function SiteMap({ sites, onSiteClick }: SiteMapProps) {
  const [selectedSite, setSelectedSite] = useState<SiteWithData | null>(null);

  // Calculer le centre de la carte basé sur tous les sites
  const centerLat = sites.length > 0
    ? sites.reduce((sum, site) => sum + Number(site.latitude), 0) / sites.length
    : 46.603354; // Centre de la France par défaut

  const centerLng = sites.length > 0
    ? sites.reduce((sum, site) => sum + Number(site.longitude), 0) / sites.length
    : 1.888334;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Activity className="h-4 w-4 text-success" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-error" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-success';
      case 'alert':
        return 'bg-warning';
      case 'offline':
        return 'bg-error';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'alert':
        return 'Alerte';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  };

  const handleSiteClick = (site: SiteWithData) => {
    setSelectedSite(site);
    onSiteClick?.(site);
  };

  return (
    <div className="space-y-4">
      {/* Carte Google Maps intégrée */}
      <Card>
        <CardContent className="p-0">
          <div className="relative h-[500px] w-full overflow-hidden rounded-lg">
            <iframe
              width="100%"
              height="500"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&center=${centerLat},${centerLng}&zoom=6&language=fr&region=fr`}
              title="Carte des sites LUMEN"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des sites avec marqueurs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sites.map((site) => (
          <Card
            key={site.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedSite?.id === site.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSiteClick(site)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-3 w-3 rounded-full ${getStatusColor(site.status)}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{site.name}</h3>
                    <p className="text-sm text-muted-foreground">{site.location}</p>
                  </div>
                </div>
                {getStatusIcon(site.status)}
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant={site.status === 'operational' ? 'default' : 'destructive'}>
                    {getStatusLabel(site.status)}
                  </Badge>
                </div>

                {site.latest_data && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Production:</span>
                      <span className="font-medium text-foreground">
                        {site.latest_data.production_kw?.toFixed(2) || '0.00'} kW
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Batterie:</span>
                      <span className="font-medium text-foreground">
                        {site.latest_data.battery_level_percent?.toFixed(0) || '0'}%
                      </span>
                    </div>
                  </>
                )}

                {site.alert_count !== undefined && site.alert_count > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Alertes:</span>
                    <Badge variant="destructive">{site.alert_count}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
