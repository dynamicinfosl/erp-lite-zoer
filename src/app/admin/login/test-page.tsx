'use client';

import React from 'react';

export default function AdminLoginTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Teste - Página de Login do Admin
        </h1>
        <p className="text-gray-600 mb-4">
          Se você está vendo esta página, a rota /admin/login/test-page está funcionando.
        </p>
        <div className="space-y-2">
          <p><strong>Status:</strong> ✅ Página carregando</p>
          <p><strong>Rota:</strong> /admin/login/test-page</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        </div>
        <div className="mt-6">
          <a 
            href="/admin/login" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Ir para Login Admin
          </a>
        </div>
      </div>
    </div>
  );
}

