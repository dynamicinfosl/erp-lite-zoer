'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordRequirement {
  id: string;
  text: string;
  validator: (password: string) => boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  requirements?: PasswordRequirement[];
  className?: string;
}

const defaultRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    text: 'Mínimo 6 caracteres',
    validator: (password) => password.length >= 6,
  },
  {
    id: 'uppercase',
    text: 'Pelo menos 1 letra maiúscula',
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    text: 'Pelo menos 1 letra minúscula',
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    text: 'Pelo menos 1 número',
    validator: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    text: 'Pelo menos 1 caractere especial',
    validator: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function PasswordStrengthIndicator({ 
  password, 
  requirements = defaultRequirements,
  className = '' 
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-medium text-gray-700">
        Requisitos da senha:
      </div>
      <div className="space-y-1.5">
        {requirements.map((requirement) => {
          const isValid = requirement.validator(password);
          
          return (
            <div 
              key={requirement.id}
              className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                isValid ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-200 ${
                isValid 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isValid ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </div>
              <span className={isValid ? 'font-medium' : ''}>
                {requirement.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente simplificado para senhas básicas (apenas comprimento)
export function SimplePasswordIndicator({ 
  password, 
  minLength = 6,
  className = '' 
}: {
  password: string;
  minLength?: number;
  className?: string;
}) {
  if (!password) return null;

  const isValid = password.length >= minLength;
  
  return (
    <div className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
      isValid ? 'text-green-600' : 'text-gray-500'
    } ${className}`}>
      <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-colors duration-200 ${
        isValid 
          ? 'bg-green-100 text-green-600' 
          : 'bg-gray-100 text-gray-400'
      }`}>
        {isValid ? (
          <Check className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </div>
      <span className={isValid ? 'font-medium' : ''}>
        Mínimo {minLength} caracteres
      </span>
    </div>
  );
}

