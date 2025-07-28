import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginProps {
  onLogin: (success: boolean, token?: string) => void;
}

export const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Вызываем функцию генерации токена в базе данных
      const { data, error: rpcError } = await supabase
        .rpc('generate_admin_token', {
          p_username: username,
          p_password: password
        });

      if (rpcError) {
        throw rpcError;
      }

      if (data) {
        // Успешная аутентификация
        const token = data as string;
        const loginTime = Date.now();
        
        // Сохраняем в sessionStorage для безопасности
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminLoginTime', loginTime.toString());
        sessionStorage.setItem('adminUsername', username);
        
        onLogin(true, token);
      } else {
        // Неверные учетные данные
        setError('Неверный логин или пароль');
        onLogin(false);
      }
    } catch (error) {
      console.error('Ошибка аутентификации:', error);
      setError('Ошибка подключения к серверу');
      onLogin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Админ панель</CardTitle>
          <CardDescription>
            Введите данные для входа в административную панель
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Логин
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  placeholder="Введите логин"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <Alert className="border-destructive/50 text-destructive dark:border-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Войти'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Пароли защищены криптографическим хешированием
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};