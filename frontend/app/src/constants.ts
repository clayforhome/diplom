export const Roles = {
  Admin: 'Admin',
  User: 'User',
} as const

export type Roles = (typeof Roles)[keyof typeof Roles]

export type Id = string & { readonly __brand: 'Id' }
