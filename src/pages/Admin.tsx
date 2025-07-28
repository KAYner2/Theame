import { useState, useEffect } from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { AdminLogin } from '../components/AdminLogin';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем существующую сессию при загрузке
    const checkAuth = () => {
      const token = sessionStorage.getItem('adminToken');
      const loginTime = sessionStorage.getItem('adminLoginTime');
      
      if (token && loginTime) {
        const timeElapsed = Date.now() - parseInt(loginTime);
        // Сессия действительна 8 часов
        if (timeElapsed < 8 * 60 * 60 * 1000) {
          setIsAuthenticated(true);
        } else {
          // Сессия истекла
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminLoginTime');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (success: boolean, token?: string) => {
    if (success && token) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminLoginTime');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Административная панель</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Выйти
          </button>
        </div>
        <AdminPanel />
      </div>
    </div>
  );
}