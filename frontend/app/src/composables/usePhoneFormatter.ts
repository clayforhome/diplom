/**
 * Composable for phone number formatting
 * Default format: +7 (xxx) xxx xxxx
 */
export function usePhoneFormatter() {
  const formatPhone = (value: string): string => {
    // Keep only digits
    const digitsOnly = value.replace(/\D/g, '')

    // Remove leading 7 or 8 if present (common for Russian numbers)
    let digits = digitsOnly
    if (digits.startsWith('7') || digits.startsWith('8')) {
      digits = digits.slice(1)
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10)

    // Format as +7 (xxx) xxx xxxx
    if (digits.length === 0) return ''
    if (digits.length <= 3) return `+7 (${digits}`
    if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`
  }

  const getPhoneDigits = (value: string): string => {
    return value.replace(/\D/g, '')
  }

  const isPhoneComplete = (value: string): boolean => {
    const digits = getPhoneDigits(value)
    return digits.length === 10
  }

  return {
    formatPhone,
    getPhoneDigits,
    isPhoneComplete,
  }
}
