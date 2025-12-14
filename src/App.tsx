import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { IntroScreen } from './screens/IntroScreen';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { GameModesScreen } from './screens/GameModesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<IntroScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
            <Route path="/modes" element={<GameModesScreen />} />
            <Route path="/play" element={<GameScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
