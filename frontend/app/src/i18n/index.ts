import { createI18n } from 'vue-i18n'
import type { MessagesSchema, AvailableLocales } from '@/types/i18n.generated'
import { supportedLocales } from '@/i18n/supportedLocales.ts'
import enUs from '../locales/en-US.json'
import ruRu from '../locales/ru-RU.json'
import kzKz from '../locales/kz-KZ.json'
import { getStoredValue, setStoredValue } from '@/stores/user.ts'

const storedValue = getStoredValue()

const getDefaultLang = (storedValue?: { language?: string | null } | null): string => {
  const fallback = 'kz-KZ'
  const lang = storedValue?.language || navigator.language

  // in case navigator.language = ru-RU (chrome for example)
  if (lang.includes('-')) {
    return supportedLocales.some((locale) => locale.code === lang) ? lang : fallback
  }

  // in case navigator.language = ru (edge for example)
  const matched = supportedLocales.find((locale) =>
    locale.code.toLowerCase().startsWith(`${lang.toLowerCase()}-`),
  )

  return matched?.code || fallback
}

const defaultLang = getDefaultLang(storedValue)

if (storedValue?.language == null) {
  setStoredValue({
    language: defaultLang,
  })
}

export const i18n = createI18n<[MessagesSchema], AvailableLocales>({
  legacy: false,
  locale: defaultLang,
  fallbackLocale: defaultLang,
  messages: {
    'ru-RU': ruRu,
    'en-US': enUs,
    'kz-KZ': kzKz,
  },
})

export default i18n
