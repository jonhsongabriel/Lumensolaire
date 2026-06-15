import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Link2, Unlink, AlertCircle, CheckCircle, Wifi, Router } from 'lucide-react';
import { sitesApi } from '@/services/api';
import { toast } from 'sonner';

export default function ScadaConnectPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectedSite, setConnectedSite] = useState<Record<string, unknown> | null>(null);
  const navigate = useNavigate();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConnectedSite(null);

    if (!serialNumber.trim() || !password.trim()) {
      setError('Veuillez saisir le SN et le PSW');
      return;
    }

    setLoading(true);

    try {
      const site = await sitesApi.verifyScada(serialNumber.trim(), password.trim());
      setConnectedSite(site);
      toast.success('Appareil relié avec succès !');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('incorrect') || errorMsg.includes('401')) {
        setError('SN ou PSW incorrect. Vérifiez les informations de votre appareil.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnectedSite(null);
    setSerialNumber('');
    setPassword('');
    setError('');
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Relier un Appareil SCADA</h1>
        <p className="text-muted-foreground">
          Connectez votre installation solaire (ESP32/centrale) avec son SN et PSW
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Router className="h-5 w-5" />
              Connexion Appareil
            </CardTitle>
            <CardDescription>
              Saisissez le numéro de série (SN) et le mot de passe (PSW) de votre centrale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="serial-number">Numéro de série (SN)</Label>
                <Input
                  id="serial-number"
                  type="text"
                  placeholder="Ex: CENT-2026-001"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-password">Mot de passe (PSW)</Label>
                <Input
                  id="device-password"
                  type="password"
                  placeholder="Mot de passe de l'appareil"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {loading ? 'Connexion...' : 'Relier l\'appareil'}
                </Button>
                {connectedSite && (
                  <Button type="button" variant="outline" onClick={handleDisconnect}>
                    <Unlink className="h-4 w-4 mr-2" />
                    Déconnecter
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Comment relier votre appareil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  1
                </span>
                <span>
                  <strong>Créez un projet</strong> dans la page Projets avec le SN et PSW de votre appareil
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <span>
                  <strong>Saisissez le SN et PSW</strong> dans le formulaire ci-contre
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                <span>
                  <strong>Cliquez sur "Relier"</strong> — le statut passe à "Connecté"
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  4
                </span>
                <span>
                  <strong>Les données live</strong> apparaissent automatiquement dans Supervision
                </span>
              </li>
            </ol>

            <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Communication MQTT</p>
              <p>Topic : centrale/{'{SN}'}/data</p>
              <p>Broker : mqtt://localhost:1883</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Result */}
      {connectedSite && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Appareil Relié avec Succès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projet</span>
                <span className="font-medium">{String(connectedSite.name || '—')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emplacement</span>
                <span className="font-medium">{String(connectedSite.location || '—')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SN</span>
                <span className="font-mono font-medium">{String(connectedSite.serial_number || '—')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Statut</span>
                <Badge variant="default" className="bg-green-600">
                  Connecté
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière connexion</span>
                <span className="font-medium">
                  {new Date().toLocaleString('fr-FR')}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => navigate('/monitoring')}>
                Voir les données en direct
              </Button>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                Voir mes projets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
