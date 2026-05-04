import type { Roles } from '@/constants'

export interface JwtPayload {
  sub: string
  name?: string
  exp?: number
  iat?: number
  role?: Roles
  [key: string]: unknown
}
