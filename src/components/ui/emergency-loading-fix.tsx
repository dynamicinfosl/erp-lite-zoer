'use client';

import React, { useEffect, useState } from 'react';
import { Button } from './button';

interface EmergencyLoadingFixProps {
  onForceStop: () => void;
}

export function EmergencyLoadingFix({ onForceStop }: EmergencyLoadingFixProps) {
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    // Mostrar botão de emergência após 5 segundos
    const timer = setTimeout(() => {
      setShowEmergency(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showEmergency) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-2">Loading demorado?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          O sistema está demorando para carregar. Você pode forçar a parada do loading.
        </p>
        <Button 
          onClick={() => {
            onForceStop();
            setShowEmergency(false);
          }}
          className="w-full"
        >
          Continuar sem loading
        </Button>
      </div>
    </div>
  );
}

