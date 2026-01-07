'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Credenciais de superadmin
const ADMIN_CREDENTIALS = {
  username: 'superadmin',
  password: 'admin2024',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // Verificar se já está autenticado
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      router.push('/admin');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Normalizar credenciais (remover espaços e converter para minúsculas)
      const normalizedUsername = formData.username.trim().toLowerCase();
      const normalizedPassword = formData.password.trim();
      const expectedUsername = ADMIN_CREDENTIALS.username.toLowerCase();
      
      // Verificar credenciais
      if (normalizedUsername === expectedUsername && 
          normalizedPassword === ADMIN_CREDENTIALS.password) {
        
        // Salvar autenticação no sessionStorage
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminUser', ADMIN_CREDENTIALS.username);
        
        // Log para debug
        console.log('✅ Login admin bem-sucedido');
        console.log('SessionStorage adminAuthenticated:', sessionStorage.getItem('adminAuthenticated'));
        
        // Aguardar um pouco para garantir que o sessionStorage foi salvo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Tentar redirecionar com router.push primeiro
        try {
          router.push('/admin');
          // Se router.push não funcionar, usar window.location como fallback
          setTimeout(() => {
            if (window.location.pathname !== '/admin') {
              window.location.href = '/admin';
            }
          }, 500);
        } catch (redirectError) {
          console.error('Erro no router.push, usando window.location:', redirectError);
          window.location.href = '/admin';
        }
      } else {
        console.log('❌ Credenciais inválidas');
        console.log('Username recebido:', normalizedUsername);
        console.log('Password recebido:', normalizedPassword ? '***' : 'vazio');
        setError('Credenciais inválidas. Verifique usuário e senha.');
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔐 Super Admin
          </h1>
          <p className="text-gray-300">
            Acesso administrativo ao sistema
          </p>
        </div>

        {/* Credenciais para desenvolvimento */}
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6">
          <h3 className="text-blue-300 font-semibold mb-2">Credenciais de Desenvolvimento:</h3>
          <div className="text-blue-200 text-sm space-y-1">
            <p><strong>Usuário:</strong> {ADMIN_CREDENTIALS.username}</p>
            <p><strong>Senha:</strong> {ADMIN_CREDENTIALS.password}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Usuário
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu usuário"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Voltar ao sistema
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Status: ✅ Página funcionando</p>
          <p>Rota: /admin/login</p>
          <button
            onClick={() => {
              console.log('🔍 Debug SessionStorage:');
              console.log('  - adminAuthenticated:', sessionStorage.getItem('adminAuthenticated'));
              console.log('  - adminUser:', sessionStorage.getItem('adminUser'));
              alert(`SessionStorage:\nadminAuthenticated: ${sessionStorage.getItem('adminAuthenticated')}\nadminUser: ${sessionStorage.getItem('adminUser')}`);
            }}
            className="mt-2 text-blue-400 hover:text-blue-300 underline text-xs"
          >
            🔍 Verificar SessionStorage
          </button>
        </div>
      </div>
    </div>
  );
}