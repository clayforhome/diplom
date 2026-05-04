<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import authHttpService from '@/services/http/authHttpService.ts'
import { useToast } from 'primevue/usetoast'
import { useZodValidation } from '@/composables/useZodValidation.ts'
import { usePhoneFormatter } from '@/composables/usePhoneFormatter.ts'
import { useTypedI18n } from '@/i18n/useTypedI18n.ts'
import { RegisterSchema, type RegisterFormData } from '@/schemas/authSchemas.ts'
import type { RegisterRequest } from '@/services/http/httpResponses.ts'

const router = useRouter()
const toast = useToast()
const { t } = useTypedI18n()
const { validateField, hasError, getError, markFieldAsTouched, validateAll } =
  useZodValidation(RegisterSchema)
const { formatPhone } = usePhoneFormatter()

// Compute password strength for progress bar
const passwordStrength = computed(() => {
  const pwd = data.value.password
  let strength = 0
  if (pwd.length >= 6) strength += 25
  if (/[A-Z]/.test(pwd)) strength += 25
  if (/[a-z]/.test(pwd)) strength += 25
  if (/[@$!%*?&\d]/.test(pwd)) strength += 25
  return strength
})

const passwordStrengthLabel = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return 'Слабый'
  if (strength <= 25) return 'Очень слабый'
  if (strength <= 50) return 'Слабый'
  if (strength <= 75) return 'Средний'
  return 'Сильный'
})

const passwordStrengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 25) return 'text-red-600'
  if (strength <= 50) return 'text-orange-500'
  if (strength <= 75) return 'text-yellow-500'
  return 'text-green-600'
})

const data = ref<RegisterFormData>({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  age: NaN,
  phoneNumber: '',
})

const isLoading = ref(false)

const handleBlur = (fieldName: string) => {
  markFieldAsTouched(fieldName)
  const value = data.value[fieldName as keyof RegisterFormData]
  if (fieldName === 'phoneNumber' && !value) {
    return
  }
  validateField(fieldName, value)
}

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  data.value.phoneNumber = formatPhone(input.value)
}

const register = async () => {
  const submitData = {
    ...data.value,
    phoneNumber: data.value.phoneNumber || undefined,
  } as RegisterFormData

  if (!validateAll(submitData)) {
    return
  }

  isLoading.value = true
  try {
    const registerData: RegisterRequest = {
      email: data.value.email,
      password: data.value.password,
      name: data.value.name,
      age: data.value.age,
    }

    if (data.value.phoneNumber) {
      registerData.phoneNumber = data.value.phoneNumber
    }

    const response = await authHttpService.register(registerData)

    if (response.status !== 200 && response.status !== 201) {
      toast.add({
        severity: 'error',
        summary: t('errors.error'),
        detail: t('auth.registrationFailed'),
        life: 3000,
      })
      return
    }

    toast.add({
      severity: 'success',
      summary: t('auth.registrationSuccess'),
      detail: '',
      life: 2000,
    })

    setTimeout(() => {
      router.push('/u/auth/login')
    }, 2000)
  } catch (error) {
    const getErrorMessage = (err: unknown): string => {
      try {
        return (
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('auth.registrationFailed')
        )
      } catch {
        return t('auth.registrationFailed')
      }
    }

    const errorMessage = getErrorMessage(error)
    toast.add({
      severity: 'error',
      summary: t('errors.error'),
      detail: errorMessage,
      life: 3000,
    })
  } finally {
    isLoading.value = false
  }
}

const goToLogin = async () => {
  await router.push('/u/auth/login')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8 px-4">
    <Toast />
    <div class="flex justify-center">
      <Card class="w-full max-w-3xl shadow-2xl border-0">
        <template #header>
          <div class="text-center py-8 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
            <div class="text-5xl mb-3 font-bold text-white drop-shadow-lg">
              {{ t('auth.register') }}
            </div>
            <p class="text-blue-100 mt-2 text-base">
              {{ t('auth.alreadyHaveAccount') }}
              <a
                href="#"
                class="font-semibold text-white hover:text-blue-100 transition-colors underline"
                @click.prevent="goToLogin"
              >
                {{ t('auth.signIn') }}
              </a>
            </p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="register" class="flex flex-col gap-8 px-2">
            <!-- Personal Information Section -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-user text-blue-600 text-xl"></i>
                Личная информация
              </h3>
              <Divider />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Email with FloatLabel -->
                <div class="flex flex-col gap-2">
                  <FloatLabel>
                    <InputText
                      id="email"
                      v-model="data.email"
                      type="email"
                      :class="{ 'ng-invalid': hasError('email') }"
                      @blur="handleBlur('email')"
                    />
                    <label for="email">{{ t('auth.email') }}</label>
                  </FloatLabel>
                  <small v-if="hasError('email')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('email') }}
                  </small>
                </div>

                <!-- Name with FloatLabel -->
                <div class="flex flex-col gap-2">
                  <FloatLabel>
                    <InputText
                      id="name"
                      v-model="data.name"
                      :class="{ 'ng-invalid': hasError('name') }"
                      @blur="handleBlur('name')"
                    />
                    <label for="name">{{ t('auth.name') }}</label>
                  </FloatLabel>
                  <small v-if="hasError('name')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('name') }}
                  </small>
                </div>

                <!-- Age with FloatLabel and Tooltip -->
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <FloatLabel>
                      <InputNumber
                        id="age"
                        v-model="data.age"
                        :min="13"
                        :max="150"
                        :class="{ 'ng-invalid': hasError('age') }"
                        @blur="handleBlur('age')"
                      />
                      <label for="age">{{ t('auth.age') }}</label>
                    </FloatLabel>
                    <Tooltip text="Минимальный возраст 13 лет" position="left" />
                  </div>
                  <small v-if="hasError('age')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('age') }}
                  </small>
                </div>

                <!-- Phone Number with FloatLabel (Optional Badge) -->
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700">{{ t('auth.phoneNumber') }}</label>
                    <Badge value="Опционально" severity="info" />
                  </div>
                  <FloatLabel>
                    <InputText
                      id="phone"
                      :value="data.phoneNumber"
                      placeholder="+7 (xxx) xxx xxxx"
                      :class="{ 'ng-invalid': hasError('phoneNumber') }"
                      @input="handlePhoneInput"
                      @blur="handleBlur('phoneNumber')"
                    />
                    <label for="phone">{{ t('auth.phoneNumber') }}</label>
                  </FloatLabel>
                  <small v-if="hasError('phoneNumber')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('phoneNumber') }}
                  </small>
                </div>
              </div>
            </div>

            <!-- Security Section -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <i class="pi pi-lock text-blue-600 text-xl"></i>
                Безопасность
              </h3>
              <Divider />

              <div class="grid grid-cols-1 gap-6">
                <!-- Password with Strength Indicator -->
                <div class="flex flex-col gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-semibold text-gray-700">{{ t('auth.password') }}</label>
                    <span v-if="data.password" :class="`text-sm font-bold ${passwordStrengthColor}`">
                      {{ passwordStrengthLabel }}
                    </span>
                  </div>
                  <FloatLabel>
                    <InputText
                      id="password"
                      v-model="data.password"
                      type="password"
                      :class="{ 'ng-invalid': hasError('password') }"
                      @blur="handleBlur('password')"
                    />
                    <label for="password">{{ t('auth.password') }}</label>
                  </FloatLabel>
                  <ProgressBar
                    v-if="data.password"
                    :value="passwordStrength"
                    :show-value="false"
                    :style="{ height: '6px' }"
                    class="transition-all duration-500"
                  />
                  <small v-if="hasError('password')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('password') }}
                  </small>
                </div>

                <!-- Confirm Password -->
                <div class="flex flex-col gap-2">
                  <FloatLabel>
                    <InputText
                      id="confirm-password"
                      v-model="data.confirmPassword"
                      type="password"
                      :class="{ 'ng-invalid': hasError('confirmPassword') }"
                      @blur="handleBlur('confirmPassword')"
                    />
                    <label for="confirm-password">{{ t('auth.confirmPassword') }}</label>
                  </FloatLabel>
                  <small v-if="hasError('confirmPassword')" class="text-red-500 font-medium flex items-center gap-1 animate-pulse">
                    <i class="pi pi-exclamation-circle text-red-500 text-sm"></i>
                    {{ getError('confirmPassword') }}
                  </small>
                </div>

                <!-- Password Requirements Panel -->
                <Panel
                  header="📋 Требования к паролю"
                  :toggleable="true"
                  :collapsed="true"
                  class="border-blue-200"
                >
                  <div class="space-y-3">
                    <div class="flex items-center gap-3 transition-colors" :class="{ 'text-green-600 font-semibold': data.password.length >= 6 }">
                      <i :class="data.password.length >= 6 ? 'pi pi-check-circle text-green-600 text-lg' : 'pi pi-circle text-gray-300 text-lg'"></i>
                      <span>Минимум 6 символов</span>
                    </div>
                    <div class="flex items-center gap-3 transition-colors" :class="{ 'text-green-600 font-semibold': /[A-Z]/.test(data.password) }">
                      <i :class="/[A-Z]/.test(data.password) ? 'pi pi-check-circle text-green-600 text-lg' : 'pi pi-circle text-gray-300 text-lg'"></i>
                      <span>Минимум одна заглавная буква (A-Z)</span>
                    </div>
                    <div class="flex items-center gap-3 transition-colors" :class="{ 'text-green-600 font-semibold': /[a-z]/.test(data.password) }">
                      <i :class="/[a-z]/.test(data.password) ? 'pi pi-check-circle text-green-600 text-lg' : 'pi pi-circle text-gray-300 text-lg'"></i>
                      <span>Минимум одна строчная буква (a-z)</span>
                    </div>
                    <div class="flex items-center gap-3 transition-colors" :class="{ 'text-green-600 font-semibold': /\d/.test(data.password) }">
                      <i :class="/\d/.test(data.password) ? 'pi pi-check-circle text-green-600 text-lg' : 'pi pi-circle text-gray-300 text-lg'"></i>
                      <span>Минимум одна цифра (0-9)</span>
                    </div>
                    <div class="flex items-center gap-3 transition-colors" :class="{ 'text-green-600 font-semibold': /[@$!%*?&]/.test(data.password) }">
                      <i :class="/[@$!%*?&]/.test(data.password) ? 'pi pi-check-circle text-green-600 text-lg' : 'pi pi-circle text-gray-300 text-lg'"></i>
                      <span>Минимум один спецсимвол (@$!%*?&)</span>
                    </div>
                  </div>
                </Panel>
              </div>
            </div>

            <!-- Divider before submit -->
            <Divider />

            <!-- Submit Section -->
            <div class="pt-2">
              <Button
                type="submit"
                :label="t('auth.signUp')"
                :loading="isLoading"
                :disabled="isLoading"
                icon="pi pi-user-plus"
                class="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>

            <!-- Footer info -->
            <div class="text-center text-xs text-gray-500 mt-4">
              <p>
                <i class="pi pi-shield text-blue-600"></i>
                Ваши данные защищены и зашифрованы
              </p>
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-inputnumber input) {
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus),
:deep(.p-inputnumber input:focus) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  border-color: rgb(59, 130, 246);
}

:deep(.p-button) {
  border-radius: 8px;
}

:deep(.p-card) {
  border-radius: 12px;
}

.ng-invalid {
  border-color: rgb(239, 68, 68) !important;
}

small {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

