import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuditTrailPage } from '../pages/AuditTrailPage';
import { LoginPage } from '../pages/LoginPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StrategiesPage } from '../pages/StrategiesPage';
import { TradeCalendarPage } from '../pages/TradeCalendarPage';
import { TradesPage } from '../pages/TradesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { useAuth } from '../providers/AuthProvider';

export const AppRouter = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/calendar" replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/calendar" element={<TradeCalendarPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/strategies" element={<StrategiesPage />} />
        <Route path="/trades" element={<TradesPage />} />
        <Route path="/audit-trail" element={<AuditTrailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/calendar' : '/login'} replace />} />
    </Routes>
  );
};
