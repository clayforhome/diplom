import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell/AppShell';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { SessionsPage } from '../pages/sessions/SessionsPage';
import { SessionDetailPage } from '../pages/sessions/SessionDetailPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminDeletedUsersPage } from '../pages/admin/AdminDeletedUsersPage';
import { AdminMessagesPage } from '../pages/admin/AdminMessagesPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/auth/login',
    element: <LoginPage />
  },
  {
    path: '/auth/register',
    element: <RegisterPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: 'sessions',
        element: <SessionsPage />
      },
      {
        path: 'sessions/:id',
        element: <SessionDetailPage />
      },
      {
        path: 'profile',
        element: <ProfilePage />
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/users/deleted',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDeletedUsersPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admin/messages',
        element: (
          <ProtectedRoute allowedRoles={['Admin', 'Organizer']}>
            <AdminMessagesPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
