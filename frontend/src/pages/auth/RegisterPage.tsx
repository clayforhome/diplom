import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

function validateRegisterForm(form: RegisterFormState): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const trimmedName = form.name.trim();
  const trimmedEmail = form.email.trim();
  const normalizedPhone = normalizePhone(form.phoneNumber);
  const age = Number(form.age);

  if (!trimmedName) {
    errors.name = 'Укажите имя';
  }

  if (!trimmedEmail) {
    errors.email = 'Укажите email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Введите корректный email';
  }

  if (!form.password) {
    errors.password = 'Укажите пароль';
  } else if (form.password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Добавьте хотя бы одну заглавную букву';
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = 'Добавьте хотя бы одну строчную букву';
  } else if (!/\d/.test(form.password)) {
    errors.password = 'Добавьте хотя бы одну цифру';
  } else if (!/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Добавьте хотя бы один специальный символ';
  }

  if (form.phoneNumber.trim() && (!normalizedPhone || extractDigits(normalizedPhone).length !== 11)) {
    errors.phoneNumber = 'Телефон должен быть заполнен полностью';
  }

  if (!form.age.trim()) {
    errors.age = 'Укажите возраст';
  } else if (!Number.isInteger(age)) {
    errors.age = 'Возраст должен быть целым числом';
  } else if (age <= 0) {
    errors.age = 'Возраст должен быть больше нуля';
  }

  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
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
    document.title = 'Регистрация - Система управления встречами';
  }, []);

  useEffect(() => {
    if (!isSubmitted) {
      return;
    }

    setErrors(validateRegisterForm(form));
  }, [form, isSubmitted]);

  return (
    <div className="auth-page">
      <Card>
        <form
          className="auth-page__form"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSubmitted(true);

            const nextErrors = validateRegisterForm(form);
            setErrors(nextErrors);

            if (Object.keys(nextErrors).length > 0) {
              toast('Проверьте форму регистрации', 'error');
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
              toast('Аккаунт создан, можно входить', 'success');
              navigate('/auth/login');
            } catch (error) {
              if (error instanceof ApiError) {
                toast(error.message || 'Не удалось создать аккаунт', 'error');
                return;
              }

              toast('Не удалось создать аккаунт', 'error');
            }
          }}
        >
          <div className="auth-page__hero">
            <span className="auth-page__eyebrow">Новый аккаунт</span>
            <h1 className="auth-page__title">Создание аккаунта</h1>
          </div>
          <Input label="Имя" value={form.name} error={errors.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <Input label="Эл. почта" type="email" value={form.email} error={errors.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <Input label="Пароль" type="password" value={form.password} error={errors.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          <Input
            label="Телефон"
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
            label="Возраст"
            type="text"
            inputMode="numeric"
            value={form.age}
            error={errors.age}
            onChange={(event) => setForm((current) => ({ ...current, age: extractDigits(event.target.value).slice(0, 3) }))}
            required
          />
          {Object.keys(errors).length > 0 ? <p className="auth-page__validation">Исправьте ошибки в форме перед отправкой.</p> : null}
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
          </Button>
          <p className="auth-page__switch">
            Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
