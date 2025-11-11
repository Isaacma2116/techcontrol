import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { useEffect, useState } from 'react';
import { authService } from './services/auth.service';
import LoadingSpinner from './components/auth/LoadingSpinner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simplified auth check - just verify if user is authenticated
        const isAuth = authService.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        // If not authenticated, ensure we're logged out
        if (!isAuth) {
          authService.logout();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        authService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const ProtectedRoute = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
  };

  const AuthRoute = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    return !isAuthenticated ? <Outlet /> : <Navigate to="/home" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home handleLogout={handleLogout} />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;