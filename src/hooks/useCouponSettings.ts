import { useState, useEffect } from 'react';

export interface CouponSettings {
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  companyEmail: string;
  fontSize: number;
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showDate: boolean;
  showTime: boolean;
  showCashier: boolean;
  showCustomer: boolean;
  footerText: string;
}

const defaultSettings: CouponSettings = {
  companyName: 'Minha Empresa',
  companyAddress: 'Rua Exemplo, 123',
  companyCity: 'Cidade - Estado',
  companyPhone: '(11) 99999-9999',
  companyEmail: 'contato@empresa.com',
  fontSize: 12,
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showEmail: true,
  showDate: true,
  showTime: true,
  showCashier: true,
  showCustomer: true,
  footerText: 'Obrigado pela preferência!',
};

export const useCouponSettings = () => {
  const [settings, setSettings] = useState<CouponSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('couponSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do cupom:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = (newSettings: CouponSettings) => {
    try {
      localStorage.setItem('couponSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Erro ao salvar configurações do cupom:', error);
      return false;
    }
  };

  const updateSettings = (updates: Partial<CouponSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return {
    settings,
    loading,
    saveSettings,
    updateSettings,
    loadSettings,
  };
};
