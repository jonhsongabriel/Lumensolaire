import { lazy } from 'react';
import type { ReactNode } from 'react';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MonitoringPage = lazy(() => import('./pages/MonitoringPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const AddProjectPage = lazy(() => import('./pages/AddProjectPage'));
const ScadaConnectPage = lazy(() => import('./pages/ScadaConnectPage'));
const RealTimeMonitoringPage = lazy(() => import('./pages/RealTimeMonitoringPage'));

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false
  },
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />
  },
  {
    name: 'Projects',
    path: '/projects',
    element: <ProjectsPage />
  },
  {
    name: 'Add Project',
    path: '/projects/add',
    element: <AddProjectPage />,
    visible: false
  },
  {
    name: 'Ajouter Centrale',
    path: '/add-site',
    element: <AddProjectPage />
  },
  {
    name: 'Relier Appareil',
    path: '/connect',
    element: <ScadaConnectPage />,
    visible: false
  },
  {
    name: 'Temps Réel',
    path: '/realtime',
    element: <RealTimeMonitoringPage />
  },
  {
    name: 'Monitoring',
    path: '/monitoring',
    element: <MonitoringPage />
  },
  {
    name: 'History',
    path: '/history',
    element: <HistoryPage />
  },
  {
    name: 'Configuration',
    path: '/configuration',
    element: <ConfigurationPage />
  },
  {
    name: 'User Management',
    path: '/users',
    element: <UserManagementPage />
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: <NotificationsPage />
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <ProfilePage />
  }
];

export default routes;
