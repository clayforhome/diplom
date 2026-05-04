export function useValidation() {
  // Placeholder validation composable. Implement project-specific validators here.
  const validate = (_data: Record<string, unknown>): boolean => {
    // default: no validation, always true
    return true
  }

  return {
    validate,
  }
}

export default useValidation
