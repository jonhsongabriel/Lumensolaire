// Page de profil utilisateur
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/db/api';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [email, setEmail] = useState((profile?.email as string) || '');
  const [phone, setPhone] = useState((profile?.phone as string) || '');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState((profile?.two_factor_enabled as boolean) || false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);

    try {
      const success = await updateProfile(profile.id, {
        email: email || null,
        phone: phone || null,
        two_factor_enabled: twoFactorEnabled
      });

      if (success) {
        toast.success('Profil mis à jour avec succès');
        await refreshProfile();
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

  const getRoleLabel = (role: string | undefined) => {
    if (!role) return 'N/A';
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'engineer':
        return 'Ingénieur';
      case 'technician':
        return 'Technicien';
      case 'client':
        return 'Client';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string | undefined) => {
    if (!role) return 'outline';
    switch (role) {
      case 'admin':
        return 'default';
      case 'engineer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profil</h1>
        <p className="text-muted-foreground">Gérer vos informations personnelles</p>
      </div>

      {/* Informations du compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du compte
          </CardTitle>
          <CardDescription>
            Informations de base de votre compte LUMEN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input value={profile.username as string} disabled />
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <div>
                <Badge variant={getRoleBadgeVariant(profile.role as string) as 'default' | 'secondary' | 'outline'}>
                  {getRoleLabel(profile.role as string)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Membre depuis le {format(new Date(profile.created_at as string), 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Coordonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
          <CardDescription>
            Mettez à jour vos informations de contact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-2" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="inline h-4 w-4 mr-2" />
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Paramètres de sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa">Authentification à deux facteurs (2FA)</Label>
              <p className="text-sm text-muted-foreground">
                Ajouter une couche de sécurité supplémentaire à votre compte
              </p>
            </div>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
              disabled={loading}
            />
          </div>

          {(profile.failed_login_attempts as number) > 0 && (
            <div className="rounded-lg bg-warning/10 p-4">
              <p className="text-sm text-warning">
                {profile.failed_login_attempts as number} tentative(s) de connexion échouée(s) récente(s)
              </p>
            </div>
          )}

          {profile.account_locked_until && new Date(profile.account_locked_until as string) > new Date() && (
            <div className="rounded-lg bg-error/10 p-4">
              <p className="text-sm text-error">
                Compte verrouillé jusqu'à {format(new Date(profile.account_locked_until as string), 'dd/MM/yyyy HH:mm', { locale: fr })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
}
