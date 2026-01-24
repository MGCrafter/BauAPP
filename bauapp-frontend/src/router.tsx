import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/auth';
import {
  Login,
  Dashboard,
  ProjectsPage,
  ProjectDetailPage,
  NewReportPage,
  AdminPage,
  ReportDetailPage,
  ProfilePage,
  UsersPage,
  AllReportsPage,
  SettingsPage,
  TimesheetPage,
  AdminTimesheetPage,
} from './pages';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: '/',
            element: <Dashboard />,
          },
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/projects/:id',
            element: <ProjectDetailPage />,
          },
          {
            path: '/projects/:id/new-report',
            element: <NewReportPage />,
          },
          {
            path: '/new-report',
            element: <NewReportPage />,
          },
          {
            path: '/reports/:id',
            element: <ReportDetailPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          // Admin Routes
          {
            path: '/admin',
            element: <AdminPage />,
          },
          {
            path: '/admin/users',
            element: <UsersPage />,
          },
          {
            path: '/admin/reports',
            element: <AllReportsPage />,
          },
          {
            path: '/admin/settings',
            element: <SettingsPage />,
          },
          {
            path: '/admin/timesheet',
            element: <AdminTimesheetPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
          {
            path: '/timesheet',
            element: <TimesheetPage />,
          },
          // Catch all
          {
            path: '*',
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
]);
