// Page liste des projets (admin=all, client=own only)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, MapPin, Wifi, Activity, AlertTriangle, WifiOff, Eye } from 'lucide-react';
import { sitesApi } from '@/services/api';
import type { Site } from '@/types';

export default function ProjectsPage() {
  const { profile } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdminOrEngineer = profile?.role === 'admin' || profile?.role === 'engineer' || profile?.role === 'technician';

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await sitesApi.getAll();
      setSites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <Activity className="h-4 w-4 text-success" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-error" />;
      default:
        return <WifiOff className="h-4 w-4" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-success/10 text-success border-success/20';
      case 'alert':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'offline':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdminOrEngineer ? 'Tous les Projets' : 'Mon Projet'}
          </h1>
          <p className="text-muted-foreground">
            {isAdminOrEngineer
              ? `${sites.length} site(s) solaire(s) enregistré(s)`
              : 'Consultez les informations de votre installation'}
          </p>
        </div>
        {isAdminOrEngineer && (
          <Link to="/add-site">
            <Button asChild>
              <span>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Centrale
              </span>
            </Button>
          </Link>
        )}
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {isAdminOrEngineer
                ? 'Aucun projet enregistré'
                : 'Vous n\'avez pas encore de projet assigné'}
            </p>
            {isAdminOrEngineer && (
              <Link to="/add-site" className="mt-4">
                <Button asChild>
                  <span>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une Centrale
                  </span>
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card key={site.id} className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-balance">{site.name}</CardTitle>
                  <Badge variant="outline" className={getStatusColor(site.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(site.status)}
                      {getStatusLabel(site.status)}
                    </span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {site.location}
                </p>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {/* Capacity */}
                {site.capacity_kw && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Capacité</span>
                    <span className="font-medium">{site.capacity_kw} kW</span>
                  </div>
                )}

                {/* Monitor */}
                {site.monitor_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moniteur</span>
                    <span className="font-medium">{site.monitor_type} {site.monitor_model}</span>
                  </div>
                )}

                {/* WiFi */}
                {site.wifi_ssid && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">WiFi</span>
                    <span className="font-medium flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      {site.wifi_ssid}
                    </span>
                  </div>
                )}

                {/* Equipment count */}
                {site.equipment_list && site.equipment_list.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Équipements</span>
                    <span className="font-medium">{site.equipment_list.length} type(s)</span>
                  </div>
                )}

                {/* SCADA */}
                {site.scada_enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SCADA</span>
                    <Badge variant="outline" className="text-xs">
                      {site.scada_protocol?.toUpperCase()}
                    </Badge>
                  </div>
                )}

                {/* Last communication */}
                {site.last_communication && (
                  <div className="text-xs text-muted-foreground">
                    Dernière communication : {new Date(site.last_communication).toLocaleString('fr-FR')}
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Link to={`/monitoring?site=${site.id}`}>
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les données
                    </span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
