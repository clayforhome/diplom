import type { UserRole } from '../types';

const roleLabels: Record<UserRole, string> = {
  User: 'Пользователь',
  Organizer: 'Организатор',
  Admin: 'Администратор'
};

export function getUserRoleLabel(role: UserRole): string {
  return roleLabels[role];
}
