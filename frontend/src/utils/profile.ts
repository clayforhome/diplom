import type { CSSProperties } from 'react';

const avatarPalette = [
  { start: '#0a84ff', end: '#64d2ff', shadow: 'rgba(10, 132, 255, 0.22)' },
  { start: '#5e5ce6', end: '#bf5af2', shadow: 'rgba(94, 92, 230, 0.2)' },
  { start: '#30b0c7', end: '#66d4cf', shadow: 'rgba(48, 176, 199, 0.2)' },
  { start: '#ff9f0a', end: '#ffd60a', shadow: 'rgba(255, 159, 10, 0.2)' },
  { start: '#34c759', end: '#66dda3', shadow: 'rgba(52, 199, 89, 0.2)' },
  { start: '#ff375f', end: '#ff7a8f', shadow: 'rgba(255, 55, 95, 0.2)' }
] as const;

type AvatarPaletteItem = (typeof avatarPalette)[number];

export function getDisplayName(name?: string | null, userName?: string | null, email?: string | null): string {
  return name ?? userName ?? email ?? 'Пользователь';
}

export function getProfileInitials(name?: string | null, userName?: string | null, email?: string | null): string {
  const displayName = getDisplayName(name, userName, email);
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'U';
}

function getAvatarSessionKey(identity: string) {
  return `avatar-theme:${identity}`;
}

function readAvatarTheme(identity: string): AvatarPaletteItem {
  if (typeof window === 'undefined') {
    return avatarPalette[0];
  }

  const sessionKey = getAvatarSessionKey(identity);
  const savedIndex = window.sessionStorage.getItem(sessionKey);

  if (savedIndex !== null) {
    const paletteItem = avatarPalette[Number(savedIndex)];
    if (paletteItem) {
      return paletteItem;
    }
  }

  const randomIndex = Math.floor(Math.random() * avatarPalette.length);
  window.sessionStorage.setItem(sessionKey, String(randomIndex));
  return avatarPalette[randomIndex];
}

export function getProfileAvatarStyle(name?: string | null, userName?: string | null, email?: string | null): CSSProperties {
  const identity = `${name ?? ''}|${userName ?? ''}|${email ?? ''}` || 'guest';
  const theme = readAvatarTheme(identity);

  return {
    '--avatar-start': theme.start,
    '--avatar-end': theme.end,
    '--avatar-shadow': theme.shadow
  } as CSSProperties;
}
