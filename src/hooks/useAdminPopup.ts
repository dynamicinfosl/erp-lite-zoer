import { useState, useCallback } from 'react';

interface AdminPopupState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export function useAdminPopup(): AdminPopupState {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    open,
    close
  };
}

// Hook para abrir admin popup em qualquer lugar da aplicação
export function useGlobalAdminAccess() {
  const openAdminPopup = useCallback(() => {
    // Criar um evento customizado para abrir o popup
    const event = new CustomEvent('openAdminPopup');
    window.dispatchEvent(event);
  }, []);

  return { openAdminPopup };
}
