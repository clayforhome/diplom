import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { useAppDispatch } from '../../store/hooks';
import { fetchCurrentUserThunk, loginThunk } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import './AuthPage.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, isAuthenticated } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = 'Вход - Meeting Management System';
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="auth-page">
      <Card>
        <form
          className="auth-page__form"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await dispatch(loginThunk({ login, password })).unwrap();
              await dispatch(fetchCurrentUserThunk()).unwrap();
              toast('Добро пожаловать обратно', 'success');
              navigate('/');
            } catch {
              toast('Не удалось авторизоваться', 'error');
            }
          }}
        >
          <div className="auth-page__hero">
            <span className="auth-page__eyebrow">Secure access</span>
            <h1 className="auth-page__title">Войдите в систему встреч</h1>
          </div>
          <Input label="Email / Login" value={login} onChange={(event) => setLogin(event.target.value)} required />
          <Input label="Пароль" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" fullWidth disabled={isLoading}>
            Войти
          </Button>
          <p className="auth-page__switch">
            Нет аккаунта? <Link to="/auth/register">Зарегистрироваться</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
