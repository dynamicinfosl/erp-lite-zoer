'use client';

import React from 'react';

export default function SimpleAdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-6">
            🔐 Super Admin Login
          </h1>
          <p className="text-gray-300 mb-8">
            Página simplificada para teste
          </p>
          
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h3 className="text-white font-semibold mb-2">Credenciais de Teste:</h3>
            <div className="text-gray-300 space-y-1">
              <p><strong>Usuário:</strong> superadmin</p>
              <p><strong>Senha:</strong> admin2024</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Usuário
              </label>
              <input
                type="text"
                defaultValue="superadmin"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Senha
              </label>
              <input
                type="password"
                defaultValue="admin2024"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminUser', 'superadmin');
                window.location.href = '/admin';
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Entrar como Super Admin
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-400">
            <p>Status: ✅ Página funcionando</p>
            <p>Rota: /admin/login/simple-page</p>
          </div>
        </div>
      </div>
    </div>
  );
}

