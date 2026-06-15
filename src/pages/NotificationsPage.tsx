// Page de notifications et d'alertes
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAlerts, acknowledgeAlert, resolveAlert, subscribeToAlerts } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AlertWithSite, AlertStatus, AlertSeverity } from '@/types';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<AlertWithSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all');

  useEffect(() => {
    loadAlerts();

    // S'abonner aux nouvelles alertes
    const unsubscribe = subscribeToAlerts((newAlert) => {
      setAlerts(prev => [newAlert as AlertWithSite, ...prev]);
      
      // Afficher une notification toast
      if (newAlert.severity === 'critical') {
        toast.error(`Alerte critique: ${newAlert.title}`);
      } else if (newAlert.severity === 'warning') {
        toast.warning(`Alerte: ${newAlert.title}`);
      } else {
        toast.info(`Info: ${newAlert.title}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await getAlerts();
    setAlerts(data);
    setLoading(false);
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!profile) return;

    const success = await acknowledgeAlert(alertId, profile.id as string);
    if (success) {
      toast.success('Alerte acquittée');
      await loadAlerts();
    } else {
      toast.error('Erreur lors de l\'acquittement');
    }
  };

  const handleResolve = async (alertId: string) => {
    const success = await resolveAlert(alertId);
    if (success) {
      toast.success('Alerte résolue');
      await loadAlerts();
    } else {
      toast.error('Erreur lors de la résolution');
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-error" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'warning':
        return <Badge className="bg-warning text-warning-foreground">Avertissement</Badge>;
      case 'info':
        return <Badge variant="outline">Information</Badge>;
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">Nouveau</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary">Acquitté</Badge>;
      case 'resolved':
        return <Badge variant="default">Résolu</Badge>;
    }
  };

  const filterAlerts = (status?: AlertStatus) => {
    if (!status) return alerts;
    return alerts.filter(alert => alert.status === status);
  };

  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'new':
        return filterAlerts('new');
      case 'acknowledged':
        return filterAlerts('acknowledged');
      case 'resolved':
        return filterAlerts('resolved');
      default:
        return alerts;
    }
  };

  const filteredAlerts = getFilteredAlerts();
  const newAlertsCount = alerts.filter(a => a.status === 'new').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Centre de notifications et d'alertes</p>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Centre de notifications et d'alertes</p>
        </div>
        {newAlertsCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {newAlertsCount} nouvelle{newAlertsCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Toutes ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="new">
            Nouvelles ({filterAlerts('new').length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged">
            Acquittées ({filterAlerts('acknowledged').length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Résolues ({filterAlerts('resolved').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune alerte dans cette catégorie</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                          {alert.site && (
                            <Badge variant="outline">{alert.site.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-4">{alert.message}</p>

                  {(alert.threshold_value !== null || alert.actual_value !== null) && (
                    <div className="flex gap-4 text-sm mb-4">
                      {alert.threshold_value !== null && (
                        <div>
                          <span className="text-muted-foreground">Seuil: </span>
                          <span className="font-medium">{alert.threshold_value}</span>
                        </div>
                      )}
                      {alert.actual_value !== null && (
                        <div>
                          <span className="text-muted-foreground">Valeur actuelle: </span>
                          <span className="font-medium">{alert.actual_value}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {alert.acknowledged_at && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Acquitté le {format(new Date(alert.acknowledged_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  )}

                  {alert.resolved_at && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Résolu le {format(new Date(alert.resolved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {alert.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Acquitter
                      </Button>
                    )}
                    {(alert.status === 'new' || alert.status === 'acknowledged') && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(alert.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Résoudre
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
