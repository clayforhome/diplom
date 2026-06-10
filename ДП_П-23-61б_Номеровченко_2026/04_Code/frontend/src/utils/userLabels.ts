import i18n from '../i18n';
import type { UserRole } from '../types';

export function getUserRoleLabel(role: UserRole): string {
  return i18n.t(`roles.${role}`);
}
