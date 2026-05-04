import { useI18n, type NamedValue } from 'vue-i18n'
import type { AvailableLocales, MessagesSchema } from '@/types/i18n.generated'

export type TypedT = <K extends Path<MessagesSchema>>(key: K, params?: NamedValue) => string

export function useTypedI18n() {
  const { t, ...rest } = useI18n<[MessagesSchema], AvailableLocales>()

  const typedT = <K extends Path<MessagesSchema>>(key: K, params: NamedValue = {}) => t(key, params)
  return { t: typedT, ...rest }
}

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}` | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : `${K}`
  : never

export type Path<T> = PathImpl<T, keyof T>
