import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from '../../components/i18n/LanguageSwitcher/LanguageSwitcher';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { ApiError } from '../../http/httpClient';
import { useToast } from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerThunk } from '../../store/slices/authSlice';
import './AuthPage.scss';

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  age: string;
}

interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  age?: string;
}

const PHONE_MASK_PREFIX = '+7';

function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhone(value: string): string {
  const rawDigits = extractDigits(value);

  if (!rawDigits) {
    return '';
  }

  let digits = rawDigits;

  if (digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }

  if (!digits.startsWith('7')) {
    digits = `7${digits}`;
  }

  const limited = digits.slice(0, 11);
  const country = limited.slice(0, 1);
  const area = limited.slice(1, 4);
  const middle = limited.slice(4, 7);
  const tailFirst = limited.slice(7, 9);
  const tailSecond = limited.slice(9, 11);

  let result = `+${country}`;

  if (area) {
    result += ` (${area}`;
  }

  if (area.length === 3) {
    result += ')';
  }

  if (middle) {
    result += ` ${middle}`;
  }

  if (tailFirst) {
    result += `-${tailFirst}`;
  }

  if (tailSecond) {
    result += `-${tailSecond}`;
  }

  return result;
}

function normalizePhone(value: string): string | undefined {
  const digits = extractDigits(value);

  if (!digits || digits === '7') {
    return undefined;
  }

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }

  return digits.startsWith('7') ? `+${digits}` : `+7${digits}`;
}

function validateRegisterForm(form: RegisterFormState, t: TFunction): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const trimmedName = form.name.trim();
  const trimmedEmail = form.email.trim();
  const normalizedPhone = normalizePhone(form.phoneNumber);
  const age = Number(form.age);

  if (!trimmedName) {
    errors.name = t('auth.validation.nameRequired');
  }

  if (!trimmedEmail) {
    errors.email = t('auth.validation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = t('auth.validation.emailInvalid');
  }

  if (!form.password) {
    errors.password = t('auth.validation.passwordRequired');
  } else if (form.password.length < 6) {
    errors.password = t('auth.validation.passwordMin');
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = t('auth.validation.passwordUpper');
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = t('auth.validation.passwordLower');
  } else if (!/\d/.test(form.password)) {
    errors.password = t('auth.validation.passwordDigit');
  } else if (!/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = t('auth.validation.passwordSpecial');
  }

  if (form.phoneNumber.trim() && (!normalizedPhone || extractDigits(normalizedPhone).length !== 11)) {
    errors.phoneNumber = t('auth.validation.phoneIncomplete');
  }

  if (!form.age.trim()) {
    errors.age = t('auth.validation.ageRequired');
  } else if (!Number.isInteger(age)) {
    errors.age = t('auth.validation.ageInteger');
  } else if (age <= 0) {
    errors.age = t('auth.validation.agePositive');
  }

  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    age: '18'
  });
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.title = `${t('auth.registerTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    if (!isSubmitted) {
      return;
    }

    setErrors(validateRegisterForm(form, t));
  }, [form, isSubmitted, t, i18n.resolvedLanguage]);

  return (
    <div className="auth-page">
      <Card>
        <form
          className="auth-page__form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitted(true);

            const nextErrors = validateRegisterForm(form, t);
            setErrors(nextErrors);

            if (Object.keys(nextErrors).length > 0) {
              toast(t('auth.registerInvalid'), 'error');
              return;
            }

            try {
              await dispatch(
                registerThunk({
                  name: form.name.trim(),
                  email: form.email.trim(),
                  password: form.password,
                  phoneNumber: normalizePhone(form.phoneNumber),
                  age: Number(form.age)
                })
              ).unwrap();
              toast(t('auth.registerSuccess'), 'success');
              navigate('/auth/login');
            } catch (error) {
              if (error instanceof ApiError) {
                toast(error.message || t('auth.registerError'), 'error');
                return;
              }

              toast(t('auth.registerError'), 'error');
            }
          }}
        >
          <div className="auth-page__topbar">
            <LanguageSwitcher />
          </div>
          <div className="auth-page__hero">
            <span className="auth-page__eyebrow">{t('auth.registerEyebrow')}</span>
            <h1 className="auth-page__title">{t('auth.registerHeading')}</h1>
          </div>
          <Input label={t('auth.nameField')} value={form.name} error={errors.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <Input label={t('auth.emailField')} type="email" value={form.email} error={errors.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <Input label={t('auth.passwordField')} type="password" value={form.password} error={errors.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          <Input
            label={t('auth.phoneField')}
            type="tel"
            inputMode="tel"
            maxLength={18}
            value={form.phoneNumber}
            error={errors.phoneNumber}
            onChange={(event) => setForm((current) => ({ ...current, phoneNumber: formatPhone(event.target.value) }))}
            onFocus={() => {
              if (!form.phoneNumber.trim()) {
                setForm((current) => ({ ...current, phoneNumber: PHONE_MASK_PREFIX }));
              }
            }}
            onBlur={() => {
              if (normalizePhone(form.phoneNumber) === undefined) {
                setForm((current) => ({ ...current, phoneNumber: '' }));
              }
            }}
          />
          <Input
            label={t('auth.ageField')}
            type="text"
            inputMode="numeric"
            value={form.age}
            error={errors.age}
            onChange={(event) => setForm((current) => ({ ...current, age: extractDigits(event.target.value).slice(0, 3) }))}
            required
          />
          {Object.keys(errors).length > 0 ? <p className="auth-page__validation">{t('auth.confirmErrors')}</p> : null}
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? t('auth.submitting') : t('auth.submitRegister')}
          </Button>
          <p className="auth-page__switch">
            {t('auth.hasAccount')} <Link to="/auth/login">{t('auth.loginLink')}</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
