import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import emitter from '@/services/emitter.ts'

export type UserProfileData = {
  language?: string | null
}

const userStateKey = 'user_state'

export const getStoredValue = (): UserProfileData | null => {
  return JSON.parse(localStorage.getItem(userStateKey) as string)
}

export const setStoredValue = (value: UserProfileData) => {
  localStorage.setItem(userStateKey, JSON.stringify(value))
  emitter.emit('languageUpdated', value)
}

export const useUserStore = defineStore('user', () => {
  const language = ref<string | null>(null)

  function initializeState() {
    const previousState = getStoredValue()

    language.value = previousState?.language || null
  }

  initializeState()

  /*const isAuthorized = computed(() => jwtService.getToken().value != null)
  watch(
    isAuthorized,
    (isAuthorized) => {
      if (!isAuthorized) {
        // TODO посмотреть что можно сюда воткнуть
      }
    },
    { immediate: true },
  )*/

  emitter.emit('languageUpdated', { language: language.value })

  watch(
    [language],
    ([newLanguage]) => {
      const value = getStoredValue() || {}
      setStoredValue({
        ...value,
        language: newLanguage,
      })
    },
    { deep: true },
  )

  function setLanguage(lang: string) {
    language.value = lang
  }

  function resetState() {
    setStoredValue({
      language: language.value,
    })
    initializeState()
  }

  /*function updateUserInfo(userInfo: UserInfoModel) {

  }*/

  // Сеттеры и геттеры для отдельного доступа к полям по необходимости
  /*function setName(n: string) {
    name.value = n
  }

  function setAge(n: number) {
    age.value = n
  }*/

  return {
    language,
    setLanguage,
    resetState,
  }
})
