// Page d'ajout de projet / site solaire
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Minus, MapPin, Wifi, Monitor, Cpu, Save } from 'lucide-react';
import { sitesApi } from '@/services/api';
import type { Equipment } from '@/types';

export default function AddProjectPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Info générales
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capacityKw, setCapacityKw] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [description, setDescription] = useState('');

  // SCADA
  const [serialNumber, setSerialNumber] = useState('');
  const [password, setPassword] = useState('');
  const [scadaEnabled, setScadaEnabled] = useState(true);
  const [scadaProtocol, setScadaProtocol] = useState('modbus');

  // WiFi
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiIp, setWifiIp] = useState('');

  // Moniteur
  const [monitorType, setMonitorType] = useState('');
  const [monitorModel, setMonitorModel] = useState('');
  const [monitorSerial, setMonitorSerial] = useState('');

  // Équipements
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([
    { type: 'onduleur', brand: '', model: '' },
  ]);

  const addEquipment = () => {
    setEquipmentList([...equipmentList, { type: 'panneau', brand: '', model: '' }]);
  };

  const removeEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const updateEquipment = (index: number, field: keyof Equipment, value: string | number) => {
    const updated = [...equipmentList];
    updated[index] = { ...updated[index], [field]: value };
    setEquipmentList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !location) {
      setError('Le nom et l\'emplacement sont obligatoires');
      return;
    }

    setLoading(true);

    try {
      const siteData = {
        name,
        location,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        system_type: 'hybrid',
        capacity_kw: capacityKw ? parseFloat(capacityKw) : null,
        installation_date: installationDate || null,
        description: description || null,
        serial_number: serialNumber || null,
        password: password || null,
        scada_enabled: scadaEnabled,
        scada_protocol: scadaProtocol,
        wifi_ssid: wifiSsid || null,
        wifi_password: wifiPassword || null,
        wifi_ip: wifiIp || null,
        monitor_type: monitorType || null,
        monitor_model: monitorModel || null,
        monitor_serial: monitorSerial || null,
        equipment_list: equipmentList.filter(e => e.brand && e.model),
        mqtt_topic_prefix: 'centrale',
        photo_url: null,
        client_id: profile?.role === 'client' ? profile.id : null,
      };

      await sitesApi.create(siteData);
      toast.success('Projet créé avec succès');
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Nouveau Projet</h1>
        <p className="text-muted-foreground">Ajouter un nouveau site solaire avec ses équipements</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informations Générales
            </CardTitle>
            <CardDescription>Nom, emplacement et capacité du site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du projet *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement *</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité (kW)</Label>
                <Input id="capacity" type="number" step="0.1" value={capacityKw} onChange={(e) => setCapacityKw(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="installDate">Date d'installation</Label>
                <Input id="installDate" type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Connexion SCADA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Connexion SCADA
            </CardTitle>
            <CardDescription>Identifiants de connexion du site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="scadaEnabled"
                checked={scadaEnabled}
                onChange={(e) => setScadaEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="scadaEnabled">Activer la connexion SCADA</Label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="serial">Numéro de série (SN)</Label>
                <Input id="serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sitePassword">Mot de passe (PSW)</Label>
                <Input id="sitePassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocole</Label>
                <select
                  id="protocol"
                  value={scadaProtocol}
                  onChange={(e) => setScadaProtocol(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="modbus">Modbus</option>
                  <option value="mqtt">MQTT</option>
                  <option value="opc-ua">OPC-UA</option>
                  <option value="http">HTTP</option>
                  <option value="tcp">TCP</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WiFi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Connexion WiFi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="wifiSsid">SSID WiFi</Label>
                <Input id="wifiSsid" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifiPassword">Mot de passe WiFi</Label>
                <Input id="wifiPassword" type="password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifiIp">Adresse IP</Label>
                <Input id="wifiIp" value={wifiIp} onChange={(e) => setWifiIp(e.target.value)} placeholder="192.168.1.100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moniteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Moniteur / Onduleur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="monitorType">Type</Label>
                <Input id="monitorType" value={monitorType} onChange={(e) => setMonitorType(e.target.value)} placeholder="SMA, SolarEdge..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monitorModel">Modèle</Label>
                <Input id="monitorModel" value={monitorModel} onChange={(e) => setMonitorModel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monitorSerial">N° Série</Label>
                <Input id="monitorSerial" value={monitorSerial} onChange={(e) => setMonitorSerial(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Équipements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Équipements
            </CardTitle>
            <CardDescription>Panneaux, batteries, onduleurs...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {equipmentList.map((eq, index) => (
              <div key={index} className="flex gap-2 items-start p-4 border rounded-lg bg-muted/30">
                <div className="grid gap-2 flex-1 grid-cols-2 md:grid-cols-5">
                  <Input
                    placeholder="Type"
                    value={eq.type}
                    onChange={(e) => updateEquipment(index, 'type', e.target.value)}
                  />
                  <Input
                    placeholder="Marque"
                    value={eq.brand}
                    onChange={(e) => updateEquipment(index, 'brand', e.target.value)}
                  />
                  <Input
                    placeholder="Modèle"
                    value={eq.model}
                    onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                  />
                  <Input
                    placeholder="Quantité"
                    type="number"
                    value={eq.count || ''}
                    onChange={(e) => updateEquipment(index, 'count', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Capacité"
                    value={eq.capacity_w || eq.capacity_kw || eq.capacity_kwh || ''}
                    onChange={(e) => updateEquipment(index, 'capacity_w', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEquipment(index)}
                  disabled={equipmentList.length === 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEquipment} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un équipement
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Création...' : 'Créer le projet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
