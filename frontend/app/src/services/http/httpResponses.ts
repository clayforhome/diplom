import type { Roles, Id } from '@/constants.ts'

export type LoginResponse = {
  status: string
  userName: string
  token: string
}

export type LanguagesResponse = { languages: { code: string; name: string; enabled: boolean }[] }

export type Translation = {
  languageCode: string
  value: string
}

export type UserModel = {
  id: Id
  email: string | null
  name: string | null
  role: Roles | null
  phoneNumber: string | null
}

export type UsersResponse = {
  users: UserModel[]
}

export type UserInfo = {
  name: string | null
  email: string | null
  phone: string | null
  isEmailConfirmed: boolean
  isPhoneConfirmed: boolean
}

export type RegisterRequest = {
  email: string
  password: string
  name: string
  age: number
  phoneNumber?: string
}

export type RegisterResponse = {
  status: string
  errors: string[]
}
