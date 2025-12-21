import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProgressProvider } from './contexts/UserProgressContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy Load Screens
const IntroScreen = lazy(() => import('./screens/IntroScreen').then(module => ({ default: module.IntroScreen })));
const GameScreen = lazy(() => import('./screens/GameScreen').then(module => ({ default: module.GameScreen })));
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen').then(module => ({ default: module.RegisterScreen })));
const GameModesScreen = lazy(() => import('./screens/GameModesScreen').then(module => ({ default: module.GameModesScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const LevelSelectScreen = lazy(() => import('./screens/LevelSelectScreen').then(module => ({ default: module.LevelSelectScreen })));

// Loading Component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <UserProgressProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<IntroScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                <Route path="/modes" element={<GameModesScreen />} />
                <Route path="/campaign" element={<LevelSelectScreen />} />
                <Route path="/play" element={<GameScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UserProgressProvider>
    </AuthProvider>
  );
}

export default App;
