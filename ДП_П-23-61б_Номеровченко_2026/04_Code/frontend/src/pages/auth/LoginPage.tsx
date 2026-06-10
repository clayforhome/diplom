import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../../components/i18n/LanguageSwitcher/LanguageSwitcher';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useAppDispatch } from '../../store/hooks';
import { fetchCurrentUserThunk, loginThunk } from '../../store/slices/authSlice';
import './AuthPage.scss';

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = `${t('auth.loginTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

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
              toast(t('auth.loginSuccess'), 'success');
              navigate('/');
            } catch {
              toast(t('auth.loginError'), 'error');
            }
          }}
        >
          <div className="auth-page__topbar">
            <LanguageSwitcher />
          </div>
          <div className="auth-page__hero">
            <h1 className="auth-page__title">{t('auth.loginHeading')}</h1>
          </div>
          <Input label={t('auth.loginField')} value={login} onChange={(event) => setLogin(event.target.value)} required />
          <Input label={t('auth.passwordField')} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" fullWidth disabled={isLoading}>
            {t('auth.loginButton')}
          </Button>
          <p className="auth-page__switch">
            {t('auth.noAccount')} <Link to="/auth/register">{t('auth.registerLink')}</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
