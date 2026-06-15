// Page de gestion des utilisateurs (admin uniquement)
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllProfiles,
  updateUserRole,
  getAllSites,
  getUserSiteIds,
  assignUserToSite,
  removeUserFromSite
} from '@/db/api';
import type { Profile, Site, UserRole } from '@/types';
import { Users, Edit, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function UserManagementPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [userSites, setUserSites] = useState<string[]>([]);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [usersData, sitesData] = await Promise.all([
      getAllProfiles(),
      getAllSites()
    ]);
    setUsers(usersData);
    setSites(sitesData);
    setLoading(false);
  };

  const handleEditUser = async (user: Profile) => {
    setEditingUser(user);
    setSelectedRole(user.role as UserRole);
    
    // Charger les sites de l'utilisateur
    const siteIds = await getUserSiteIds(user.id as string);
    setUserSites(siteIds);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setLoading(true);

    try {
      // Mettre à jour le rôle
      await updateUserRole(editingUser.id as string, selectedRole);

      // Mettre à jour les attributions de sites
      const currentSiteIds = await getUserSiteIds(editingUser.id as string);
      
      // Ajouter les nouveaux sites
      for (const siteId of userSites) {
        if (!currentSiteIds.includes(siteId)) {
          await assignUserToSite(editingUser.id as string, siteId);
        }
      }

      // Supprimer les sites non sélectionnés
      for (const siteId of currentSiteIds) {
        if (!userSites.includes(siteId)) {
          await removeUserFromSite(editingUser.id as string, siteId);
        }
      }

      toast.success('Utilisateur mis à jour avec succès');
      setEditingUser(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const toggleSite = (siteId: string) => {
    setUserSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'engineer':
        return 'secondary';
      case 'technician':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: UserRole) => {
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Administration des comptes</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les administrateurs peuvent gérer les utilisateurs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">Administration des comptes et des permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom d'utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id as string}>
                    <TableCell className="font-medium">{user.username as string}</TableCell>
                    <TableCell>{(user.email as string) || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role as UserRole)}>
                        {getRoleLabel(user.role as UserRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(user.two_factor_enabled as boolean) ? (
                        <Badge variant="default">
                          <Shield className="mr-1 h-3 w-3" />
                          Activé
                        </Badge>
                      ) : (
                        <Badge variant="outline">Désactivé</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at as string).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Modifier l'utilisateur</DialogTitle>
                            <DialogDescription>
                              Modifier le rôle et les sites assignés à {user.username as string}
                            </DialogDescription>
                          </DialogHeader>

                          {editingUser?.id === user.id && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Rôle</Label>
                                <Select
                                  value={selectedRole}
                                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="engineer">Ingénieur</SelectItem>
                                    <SelectItem value="technician">Technicien</SelectItem>
                                    <SelectItem value="client">Client</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Sites assignés</Label>
                                <div className="rounded-lg border border-border p-4 space-y-2 max-h-[300px] overflow-y-auto">
                                  {sites.map((site) => (
                                    <div key={site.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`site-${site.id}`}
                                        checked={userSites.includes(site.id)}
                                        onCheckedChange={() => toggleSite(site.id)}
                                      />
                                      <label
                                        htmlFor={`site-${site.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {site.name} - {site.location}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Les administrateurs ont accès à tous les sites par défaut
                                </p>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingUser(null)}
                                >
                                  Annuler
                                </Button>
                                <Button onClick={handleSaveUser} disabled={loading}>
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
