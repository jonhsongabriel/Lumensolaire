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
import logo from '@/image/logo-lumen-vert.png';

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
    <SidebarHeader className="border-b border-sidebar-border p-4">
  <div className="flex items-center gap-3">

    {/* LOGO clickable (retour dashboard) */}
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 transition cursor-pointer overflow-hidden"
      onClick={() => navigate('/')}
    >
      <img
        src={logo}
        alt="LUMEN"
        className="h-8 w-8 object-contain"
      />
    </div>

    {/* Texte branding */}
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-bold text-sidebar-foreground tracking-wide">
        LUMEN
      </span>
      <span className="text-xs text-sidebar-foreground/70">
        Supervision Énergétique
      </span>
    </div>

  </div>
</SidebarHeader>
  );
}
