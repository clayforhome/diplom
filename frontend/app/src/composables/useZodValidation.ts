import { computed, ref } from 'vue'
import { ZodError } from 'zod'
import type { ZodObject, ZodRawShape } from 'zod'

export function useZodValidation<
  T extends Record<string, unknown>,
  U extends ZodObject<ZodRawShape>,
>(schema: U) {
  const errors = ref<Record<string, string>>({})
  const touched = ref<Set<string>>(new Set())

  const validateField = (fieldName: string, value: unknown): boolean => {
    try {
      // Create a partial schema for single field validation
      const fieldShape = (schema as unknown as { shape?: Record<string, unknown> }).shape ?? {}
      const fieldValidator = fieldShape[fieldName]

      if (!fieldValidator) {
        console.warn(`Field ${fieldName} not found in schema`)
        return true
      }

      const validator = fieldValidator as { parse: (v: unknown) => unknown }
      validator.parse(value)
      delete errors.value[fieldName]
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        // ZodError exposes `issues` (array of ZodIssue) with messages
        errors.value[fieldName] = error.issues[0]?.message || 'Ошибка валидации'
      }
      return false
    }
  }

  const validateAll = (data: T): boolean => {
    try {
      schema.parse(data)
      errors.value = {}
      return true
    } catch (error) {
      errors.value = {}
      if (error instanceof ZodError) {
        // Use `issues` instead of deprecated/incorrect `errors`
        error.issues.forEach((err) => {
          const path = err.path.join('.')
          errors.value[path] = err.message
        })
      }
      return false
    }
  }

  const markFieldAsTouched = (fieldName: string) => {
    touched.value.add(fieldName)
  }

  const getError = (fieldName: string): string | undefined => {
    return errors.value[fieldName]
  }

  const hasError = (fieldName: string): boolean => {
    return !!errors.value[fieldName]
  }

  const isFieldTouched = (fieldName: string): boolean => {
    return touched.value.has(fieldName)
  }

  const clearErrors = () => {
    errors.value = {}
    touched.value.clear()
  }

  const clearFieldError = (fieldName: string) => {
    delete errors.value[fieldName]
  }

  return {
    errors: computed(() => errors.value),
    touched: computed(() => touched.value),
    validateField,
    validateAll,
    markFieldAsTouched,
    getError,
    hasError,
    isFieldTouched,
    clearErrors,
    clearFieldError,
  }
}
