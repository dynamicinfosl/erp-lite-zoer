'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface AdminPageWrapperProps {
  children: (theme: {
    isDark: boolean;
    bgColor: string;
    cardBg: string;
    textColor: string;
    textSecondary: string;
    borderColor: string;
  }) => ReactNode;
}

export function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('admin-theme') || 'light';
    setTheme(savedTheme);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';
  const themeColors = {
    isDark,
    bgColor: isDark ? '#0f172a' : '#f9fafb',
    cardBg: isDark ? '#1e293b' : 'white',
    textColor: isDark ? '#f8fafc' : '#111827',
    textSecondary: isDark ? '#cbd5e1' : '#6b7280',
    borderColor: isDark ? '#334155' : '#e5e7eb',
  };

  return <>{children(themeColors)}</>;
}
