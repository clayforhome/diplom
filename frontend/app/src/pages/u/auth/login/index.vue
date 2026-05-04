<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRouter} from 'vue-router'
import authHttpService from '@/services/http/authHttpService.ts'
import jwtService from '@/services/jwtService.ts'
import {useToast} from 'primevue/usetoast'
import {useZodValidation} from '@/composables/useZodValidation.ts'
import {LoginSchema, type LoginFormData} from '@/schemas/authSchemas.ts'
import {useTypedI18n} from '@/i18n/useTypedI18n.ts'
import {z} from 'zod'
import {zodResolver} from '@primevue/forms/resolvers/zod'

const router = useRouter()
const toast = useToast()
const {t} = useTypedI18n()
const {validateField, markFieldAsTouched, validateAll} =
  useZodValidation(LoginSchema)

const data = ref<LoginFormData>({
  login: '',
  password: '',
})

const isLoading = ref(false)

const handleBlur = (fieldName: string) => {
  markFieldAsTouched(fieldName)
  validateField(fieldName, data.value[fieldName as keyof LoginFormData])
}

const login = async ({
                       valid,
                       values,
                     }: {
  valid: boolean
  values: z.infer<typeof createUserSchema>
}) => {
  if (!validateAll(data.value)) {
    return
  }

  isLoading.value = true
  try {
    const response = await authHttpService.login(data.value.login, data.value.password)

    if (response.status !== 200) {
      toast.add({
        severity: 'error',
        summary: t('errors.error'),
        detail: t('auth.invalidLoginOrPassword'),
        life: 3000,
      })
      return
    }

    jwtService.saveToken(response.data.token)
    await router.push('/')
  } catch {
    toast.add({
      severity: 'error',
      summary: t('errors.error'),
      detail: t('auth.invalidLoginOrPassword'),
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

const goToSignUp = async () => {
  await router.push('/u/auth/sing-up')
}

const passwordRules = z
  .string()
  .min(6, {message: 'Пароль должен содержать минимум 6 символов'})
  .refine((value) => /[a-z]/.test(value), {
    message: 'Пароль должен содержать хотя бы одну строчную букву',
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: 'Пароль должен содержать хотя бы одну заглавную букву',
  })
  .refine((value) => /\d+/.test(value), {
    message: 'Пароль должен содержать хотя бы одну цифру',
  })
  .refine((value) => /\W/.test(value), {
    message: 'Пароль должен содержать хотя бы один специальный символ',
  })

// TODO доделать страницы входа с профориентации admin/src/pages/users/index.vue

const createUserSchema = z
  .object({
    email: z.email({message: 'Введите корректный email'}),
    name: z.string().optional(),
    password: passwordRules,
    confirmPassword: z.string().min(1, {message: 'Повторите пароль'}),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

const createUserResolver = zodResolver(createUserSchema)
</script>

<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
  >
    <Toast/>
    <Card class="w-full max-w-md shadow-lg">
      <div class="text-center py-8">
        <h1 class="text-3xl font-bold text-gray-900">Войти в систему</h1>
        <p class="text-gray-600 mt-2">
          Нет аккаунта?
          <a
            href="#"
            class="text-blue-600 hover:text-blue-800 font-semibold"
            @click.prevent="goToSignUp"
          >
            Зарегистрироваться
          </a>
        </p>
      </div>

      <Form
        v-slot="$form"
        :resolver="createUserResolver"
        @submit="login"
        class="flex flex-col gap-4"
      >
        <div class="flex flex-col gap-1">
          <label for="createEmail">Email</label>
          <InputText id="createEmail" name="email" type="email" class="w-full"/>
          <Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple">
            {{ $form.email?.error?.message }}
          </Message>
        </div>
        <div class="flex flex-col gap-1">
          <label for="createPassword">Пароль</label>
          <Password
            id="createPassword"
            name="password"
            class="w-full"
            :feedback="true"
            fluid
            toggle-mask
          />
          <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">
            {{ $form.password?.error?.message }}
          </Message>
        </div>
        <div class="flex gap-2">
          <Button class="w-full" type="submit" label="Войти"/>
        </div>
      </Form>
    </Card>
  </div>
</template>

<style scoped></style>
