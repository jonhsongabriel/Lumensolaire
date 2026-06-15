// Tableau de bord global avec carte interactive et indicateurs
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteMap } from '@/components/features/SiteMap';
import { Skeleton } from '@/components/ui/skeleton';
import { getSitesWithLatestData, subscribeToSiteStatus } from '@/db/api';
import type { SiteWithData } from '@/types';
import { Activity, Zap, Battery, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [sites, setSites] = useState<SiteWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSites();

    // S'abonner aux mises à jour de statut des sites
    const unsubscribe = subscribeToSiteStatus((updatedSite) => {
      setSites(prev => prev.map(site =>
        site.id === updatedSite.id ? { ...site, ...updatedSite } : site
      ));
      
      if (updatedSite.status === 'offline') {
        toast.error(`Site ${updatedSite.name} est hors ligne`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadSites = async () => {
    setLoading(true);
    const data = await getSitesWithLatestData();
    setSites(data);
    setLoading(false);
  };

  const handleSiteClick = (site: SiteWithData) => {
    navigate(`/monitoring?site=${site.id}`);
  };

  // Calculer les statistiques globales
  const totalSites = sites.length;
  const operationalSites = sites.filter(s => s.status === 'operational').length;
  const totalProduction = sites.reduce((sum, site) =>
    sum + (site.latest_data?.production_kw || 0), 0
  );
  const totalAlerts = sites.reduce((sum, site) =>
    sum + (site.alert_count || 0), 0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble de tous les sites supervisés</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-4 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Skeleton className="h-[500px] w-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de tous les sites supervisés</p>
      </div>

      {/* Indicateurs synthétiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites totaux</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSites}</div>
            <p className="text-xs text-muted-foreground">
              {operationalSites} opérationnels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production totale</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProduction.toFixed(2)} kW</div>
            <p className="text-xs text-muted-foreground">
              En temps réel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacité installée</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.reduce((sum, s) => sum + (s.capacity_kw || 0), 0).toFixed(0)} kW
            </div>
            <p className="text-xs text-muted-foreground">
              Total des sites
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent une attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Carte interactive */}
      <SiteMap sites={sites} onSiteClick={handleSiteClick} />
    </div>
  );
}
