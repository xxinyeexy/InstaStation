import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';
export type UserRole = 'student' | 'staff';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance, role: UserRole) => {
  const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', isDark);
  
  // Always set data-appearance attribute
  document.documentElement.setAttribute('data-appearance', appearance);
  
  // Always set data-role attribute
  document.documentElement.setAttribute('data-role', role);
};

const mediaQuery = () =>
  typeof window === 'undefined' ? null : window.matchMedia('(prefers-color-scheme: dark)');

const handleSystemThemeChange = (role: UserRole) => {
  const currentAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
  applyTheme(currentAppearance, role);
};

export function initializeTheme() {
  const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system';
  const savedRole = (localStorage.getItem('role') as UserRole) || 'student';
  applyTheme(savedAppearance, savedRole);
  mediaQuery()?.addEventListener('change', () => handleSystemThemeChange(savedRole));
}

export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(
    () => (localStorage.getItem('appearance') as Appearance) || 'system'
  );
  const [role, setRole] = useState<UserRole>(
    () => (localStorage.getItem('role') as UserRole) || 'student'
  );

  const updateAppearance = useCallback((mode: Appearance) => {
    setAppearance(mode);
    localStorage.setItem('appearance', mode);
    setCookie('appearance', mode);
    applyTheme(mode, role);
  }, [role]);

  const updateRole = useCallback((r: UserRole) => {
    setRole(r);
    localStorage.setItem('role', r);
    setCookie('role', r);
    applyTheme(appearance, r);
  }, [appearance]);

  useEffect(() => {
    applyTheme(appearance, role);
  }, [appearance, role]);

  useEffect(() => {
    const mq = mediaQuery();
    const listener = () => handleSystemThemeChange(role);
    mq?.addEventListener('change', listener);
    return () => mq?.removeEventListener('change', listener);
  }, [role]);

  return { appearance, updateAppearance, role, updateRole } as const;
}