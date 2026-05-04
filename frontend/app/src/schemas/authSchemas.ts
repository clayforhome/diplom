import { z } from 'zod'

// Phone regex: 10-11 digits
const phoneRegex = /^\d{10,11}$/

export const LoginSchema = z.object({
  login: z.string().min(1, 'Логин обязателен').email('Введите корректный email адрес'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export const RegisterSchema = z
  .object({
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email адрес'),
    name: z.string().min(1, 'Имя обязательно').min(2, 'Имя должно содержать минимум 2 символа'),
    age: z
      .number()
      .int('Возраст должен быть целым числом')
      .min(13, 'Минимальный возраст 13 лет')
      .max(150, 'Введите корректный возраст'),
    phoneNumber: z
      .string()
      .regex(phoneRegex, 'Номер телефона должен содержать минимум 10 цифр')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(1, 'Пароль обязателен')
      .min(6, 'Пароль должен содержать минимум 6 символов')
      .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
      .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
      .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру')
      .regex(/[@$!%*?&]/, 'Пароль должен содержать хотя бы один спецсимвол (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof LoginSchema>
export type RegisterFormData = z.infer<typeof RegisterSchema>
