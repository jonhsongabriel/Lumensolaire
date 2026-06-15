// Page de configuration avec modification des paramètres et audit
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuditLog } from '@/components/features/AuditLog';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllSites,
  getSiteById,
  getSiteConfigurations,
  updateSiteConfiguration,
  createAuditLog
} from '@/db/api';
import type { Site, SiteConfiguration } from '@/types';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ConfigurationPage() {
  const { profile } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [configurations, setConfigurations] = useState<SiteConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  // Vérifier les permissions
  const canEdit = profile?.role === 'admin' || profile?.role === 'engineer';

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      loadConfigurations(selectedSite.id);
    }
  }, [selectedSite]);

  const loadSites = async () => {
    const sitesData = await getAllSites();
    setSites(sitesData);
    if (sitesData.length > 0) {
      setSelectedSite(sitesData[0]);
    }
  };

  const loadConfigurations = async (siteId: string) => {
    setLoading(true);
    const configs = await getSiteConfigurations(siteId);
    setConfigurations(configs);
    
    // Initialiser les valeurs éditées
    const initialValues: Record<string, string> = {};
    configs.forEach(config => {
      initialValues[config.id] = config.parameter_value;
    });
    setEditedValues(initialValues);
    
    setLoading(false);
  };

  const handleSiteChange = async (siteId: string) => {
    const site = await getSiteById(siteId);
    setSelectedSite(site);
  };

  const handleValueChange = (configId: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [configId]: value
    }));
  };

  const handleSave = async (config: SiteConfiguration) => {
    if (!profile || !canEdit) {
      toast.error('Vous n\'avez pas les permissions nécessaires');
      return;
    }

    const newValue = editedValues[config.id];
    const oldValue = config.parameter_value;

    // Valider les limites si définies
    if (config.min_value !== null || config.max_value !== null) {
      const numValue = parseFloat(newValue);
      if (isNaN(numValue)) {
        toast.error('Valeur invalide');
        return;
      }
      if (config.min_value !== null && numValue < config.min_value) {
        toast.error(`La valeur doit être supérieure ou égale à ${config.min_value}`);
        return;
      }
      if (config.max_value !== null && numValue > config.max_value) {
        toast.error(`La valeur doit être inférieure ou égale à ${config.max_value}`);
        return;
      }
    }

    setLoading(true);

    try {
      // Mettre à jour la configuration
      const success = await updateSiteConfiguration(config.id as string, newValue, profile.id as string);

      if (success) {
        // Créer une entrée dans le journal d'audit
        await createAuditLog({
          user_id: profile.id as string,
          site_id: selectedSite?.id || null,
          action: 'UPDATE',
          entity_type: 'site_configuration',
          entity_id: config.id as string,
          old_value: { parameter_name: config.parameter_name, value: oldValue },
          new_value: { parameter_name: config.parameter_name, value: newValue },
          ip_address: null,
          user_agent: navigator.userAgent
        });

        toast.success('Configuration mise à jour avec succès');
        
        // Recharger les configurations
        if (selectedSite) {
          await loadConfigurations(selectedSite.id);
        }
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
          <p className="text-muted-foreground">Paramètres des sites</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les administrateurs et ingénieurs peuvent modifier les configurations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuration</h1>
        <p className="text-muted-foreground">Modification des paramètres et journal d'audit</p>
      </div>

      {/* Sélection du site */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection du site</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedSite?.id || ''}
            onValueChange={handleSiteChange}
          >
            <SelectTrigger className="w-full md:w-[300px]">
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
        </CardContent>
      </Card>

      {/* Paramètres de configuration */}
      {selectedSite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de {selectedSite.name}
            </CardTitle>
            <CardDescription>
              Toutes les modifications sont enregistrées dans le journal d'audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configurations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun paramètre configuré pour ce site
              </p>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => {
                  const hasChanged = editedValues[config.id] !== config.parameter_value;
                  
                  return (
                    <div
                      key={config.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex-1">
                        <Label className="text-base font-semibold">
                          {config.parameter_name}
                        </Label>
                        {config.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        )}
                        {(config.min_value !== null || config.max_value !== null) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Plage: {config.min_value ?? '∞'} - {config.max_value ?? '∞'}
                            {config.unit && ` ${config.unit}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={editedValues[config.id] || ''}
                          onChange={(e) => handleValueChange(config.id, e.target.value)}
                          className="w-32"
                          disabled={loading}
                        />
                        {config.unit && (
                          <span className="text-sm text-muted-foreground min-w-[40px]">
                            {config.unit}
                          </span>
                        )}
                        <Button
                          onClick={() => handleSave(config)}
                          disabled={!hasChanged || loading}
                          size="sm"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Journal d'audit */}
      <AuditLog siteId={selectedSite?.id} />
    </div>
  );
}
