// ⚡ Auto generated file. DO NOT EDIT
export interface MessagesSchema {
  $name: string
  errors: {
    error: string
    userAlreadyExists: string
    pleaseTryAgain: string
    failedToStartTest: string
    initialConfirmationFailed: string
    askSupport: string
    somethingWentWrong: string
    incorrectCode: string
    tooManyIncorrectCodeAttempts: string
    confirmationIsNecessary: string
    codeSendTimerActive: string
  }
  auth: {
    login: string
    register: string
    email: string
    password: string
    confirmPassword: string
    name: string
    age: string
    phoneNumber: string
    dontHaveAccount: string
    alreadyHaveAccount: string
    signUp: string
    signIn: string
    registrationSuccess: string
    registrationFailed: string
    invalidLoginOrPassword: string
  }
}

export type AvailableLocales = 'en-US' | 'kz-KZ' | 'ru-RU'
