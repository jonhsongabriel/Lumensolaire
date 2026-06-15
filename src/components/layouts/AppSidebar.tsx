// Barre latérale de navigation avec accès basé sur les rôles
import {
  LayoutDashboard,
  Activity,
  History,
  Settings,
  Users,
  Bell,
  Zap,
  FolderOpen,
  Link2,
  Radio,
  Factory,
  Plus,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export function AppSidebar() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation basée sur les rôles
  const navigationItems = [
    {
      title: 'Tableau de bord',
      icon: LayoutDashboard,
      path: '/',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Projets',
      icon: FolderOpen,
      path: '/projects',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Ajouter Centrale',
      icon: Factory,
      path: '/add-site',
      roles: ['admin', 'engineer']
    },
    {
      title: 'Relier Appareil',
      icon: Link2,
      path: '/connect',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Temps Réel',
      icon: Radio,
      path: '/realtime',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Supervision',
      icon: Activity,
      path: '/monitoring',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Historique',
      icon: History,
      path: '/history',
      roles: ['admin', 'engineer', 'technician', 'client']
    },
    {
      title: 'Configuration',
      icon: Settings,
      path: '/configuration',
      roles: ['admin', 'engineer']
    },
    {
      title: 'Utilisateurs',
      icon: Users,
      path: '/users',
      roles: ['admin']
    },
    {
      title: 'Notifications',
      icon: Bell,
      path: '/notifications',
      roles: ['admin', 'engineer', 'technician', 'client']
    }
  ];

  // Filtrer les éléments de navigation selon le rôle
  const visibleItems = navigationItems.filter(item =>
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">LUMEN</span>
            <span className="text-xs text-sidebar-foreground/70">Supervision Énergétique</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Bouton d'action principal : Ajouter une centrale */}
        {(profile?.role === 'admin' || profile?.role === 'engineer') && (
          <div className="px-3 pt-4">
            <Button
              className="w-full h-10 justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              onClick={() => navigate('/add-site')}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Ajouter Centrale</span>
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
