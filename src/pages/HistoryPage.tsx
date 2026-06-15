// Page d'historique et de rapports avec export de données
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataExport } from '@/components/features/DataExport';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllSites, getMonitoringDataByPeriod, getSiteById } from '@/db/api';
import type { Site, MonitoringData } from '@/types';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [data, setData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    const sitesData = await getAllSites();
    setSites(sitesData);
    if (sitesData.length > 0) {
      setSelectedSite(sitesData[0]);
    }
  };

  const handleSearch = async () => {
    if (!selectedSite) {
      toast.error('Veuillez sélectionner un site');
      return;
    }

    if (startDate > endDate) {
      toast.error('La date de début doit être antérieure à la date de fin');
      return;
    }

    setLoading(true);
    try {
      const historyData = await getMonitoringDataByPeriod(
        selectedSite.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setData(historyData);
      
      if (historyData.length === 0) {
        toast.info('Aucune donnée trouvée pour cette période');
      } else {
        toast.success(`${historyData.length} enregistrements chargés`);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteChange = async (siteId: string) => {
    const site = await getSiteById(siteId);
    setSelectedSite(site);
    setData([]); // Réinitialiser les données
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historique et rapports</h1>
        <p className="text-muted-foreground">Consultation et export des données historiques</p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site</label>
              <Select
                value={selectedSite?.id || ''}
                onValueChange={handleSiteChange}
              >
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'dd/MM/yyyy', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'dd/MM/yyyy', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                {loading ? 'Recherche...' : 'Rechercher'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {data.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Résultats ({data.length} enregistrements)</CardTitle>
            <DataExport
              data={data}
              siteName={selectedSite?.name || 'Site'}
              startDate={startDate}
              endDate={endDate}
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead className="text-right">Production (kW)</TableHead>
                    <TableHead className="text-right">Consommation (kW)</TableHead>
                    <TableHead className="text-right">Batterie (%)</TableHead>
                    <TableHead className="text-right">Tension (V)</TableHead>
                    <TableHead className="text-right">Température (°C)</TableHead>
                    <TableHead>Statut réseau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 100).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.production_kw?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.consumption_kw?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.battery_level_percent?.toFixed(0) || '0'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.battery_voltage?.toFixed(1) || '0.0'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.temperature_celsius?.toFixed(1) || '0.0'}
                      </TableCell>
                      <TableCell>{item.grid_status || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 100 && (
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Affichage des 100 premiers enregistrements. Utilisez l'export pour obtenir toutes les données.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {data.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Sélectionnez un site et une période, puis cliquez sur Rechercher
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
