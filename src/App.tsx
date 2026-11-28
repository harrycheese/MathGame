import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProgressProvider } from './contexts/UserProgressContext';
import { ReloadPrompt } from './components/ReloadPrompt';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy Load Screens
const IntroScreen = lazy(() => import('./screens/IntroScreen').then(module => ({ default: module.IntroScreen })));
const GameScreen = lazy(() => import('./screens/GameScreen').then(module => ({ default: module.GameScreen })));
const LoginScreen = lazy(() => import('./screens/LoginScreen').then(module => ({ default: module.LoginScreen })));
const RegisterScreen = lazy(() => import('./screens/RegisterScreen').then(module => ({ default: module.RegisterScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));

// Full app only screens
const GameModesScreen = lazy(() => import('./screens/GameModesScreen').then(module => ({ default: module.GameModesScreen })));
const LevelSelectScreen = lazy(() => import('./screens/LevelSelectScreen').then(module => ({ default: module.LevelSelectScreen })));

// Loading Component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const isStandalone = import.meta.env.VITE_APP_MODE === 'standalone';

  return (
    <AuthProvider>
      <UserProgressProvider>
        <BrowserRouter>
          {isStandalone && <ReloadPrompt />}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {isStandalone ? (
                <>
                  {/* Standalone PWA Routes */}
                  <Route path="/" element={<IntroScreen />} />
                  <Route path="/login" element={<LoginScreen />} />
                  <Route path="/register" element={<RegisterScreen />} />
                  <Route path="/play" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              ) : (
                <>
                  {/* Original MathGame Routes */}
                  <Route path="/" element={<IntroScreen />} />
                  <Route path="/login" element={<LoginScreen />} />
                  <Route path="/register" element={<RegisterScreen />} />
                  <Route path="/modes" element={<ProtectedRoute><GameModesScreen /></ProtectedRoute>} />
                  <Route path="/campaign" element={<ProtectedRoute><LevelSelectScreen /></ProtectedRoute>} />
                  <Route path="/play" element={<ProtectedRoute><GameScreen /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UserProgressProvider>
    </AuthProvider>
  );
}

export default App;
