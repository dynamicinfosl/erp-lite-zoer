'use client';

import { CompleteRegisterForm } from '@/components/auth/CompleteRegisterForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redireciona para o login após sucesso no registro
    router.push('/login?registered=true');
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header com botão de voltar */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Login
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full">
          <CompleteRegisterForm 
            onSuccess={handleSuccess}
            onSwitchToLogin={handleBackToLogin}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 ERP Lite. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}



