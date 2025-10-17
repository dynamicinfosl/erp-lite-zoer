import React from 'react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  showSpinner?: boolean;
}

export function LoadingState({ 
  message = "Carregando...", 
  subMessage,
  showSpinner = true 
}: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        {showSpinner && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        <p className="text-gray-600 font-medium">{message}</p>
        {subMessage && (
          <p className="text-sm text-gray-500 mt-2">{subMessage}</p>
        )}
      </div>
    </div>
  );
}
