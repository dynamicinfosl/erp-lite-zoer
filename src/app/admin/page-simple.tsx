'use client';

import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔐 Painel Administrativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">👥 Usuários</h2>
            <p className="text-gray-600">156 usuários cadastrados</p>
            <div className="mt-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Gerenciar
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-green-600">💰 Vendas</h2>
            <p className="text-gray-600">89 vendas realizadas</p>
            <div className="mt-4">
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Ver Relatórios
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">📦 Produtos</h2>
            <p className="text-gray-600">234 produtos cadastrados</p>
            <div className="mt-4">
              <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Gerenciar
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📊 Estatísticas do Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">156</div>
              <div className="text-sm text-gray-600">Usuários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">89</div>
              <div className="text-sm text-gray-600">Vendas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">234</div>
              <div className="text-sm text-gray-600">Produtos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-gray-600">Alertas</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-green-100 border border-green-400 rounded">
          <p className="text-green-800">
            <strong>✅ Sistema funcionando!</strong> Esta é uma versão temporária do admin. 
            O sistema completo será restaurado após a correção da autenticação Supabase.
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">← Voltar ao sistema</a>
        </div>
      </div>
    </div>
  );
}
