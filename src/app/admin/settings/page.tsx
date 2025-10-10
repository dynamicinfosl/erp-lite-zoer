'use client';

import React, { useEffect } from 'react';

export default function AdminSettingsPage() {
  useEffect(() => {
    // Sempre aplicar tema escuro
    document.documentElement.classList.add('dark');
  }, []);

  // Cores fixas do tema escuro
  const bgColor = '#0f172a';
  const cardBg = '#1e293b';
  const textColor = '#f8fafc';
  const textSecondary = '#cbd5e1';
  const borderColor = '#334155';
  const isDark = true;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: bgColor, 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: textColor, 
          marginBottom: '1rem' 
        }}>
          ⚙️ Configurações do Sistema
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Gerenciar configurações e preferências do sistema
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#2563eb'
            }}>
              🔐 Segurança
            </h3>
            <p style={{ color: textSecondary, marginBottom: '1rem' }}>
              Configurações de segurança e autenticação
            </p>
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              Configurar
            </button>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#16a34a'
            }}>
              📧 Notificações
            </h3>
            <p style={{ color: textSecondary, marginBottom: '1rem' }}>
              Configurar alertas e notificações
            </p>
            <button style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              Configurar
            </button>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#9333ea'
            }}>
              🎨 Interface
            </h3>
            <p style={{ color: textSecondary, marginBottom: '1rem' }}>
              Personalizar aparência do sistema
            </p>
            <button style={{
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              Configurar
            </button>
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          backgroundColor: isDark ? '#16a34a' : '#dcfce7',
          border: `1px solid ${isDark ? '#15803d' : '#16a34a'}`,
          borderRadius: '0.375rem',
          marginTop: '2rem'
        }}>
          <p style={{ color: isDark ? '#f9fafb' : '#166534', margin: 0 }}>
            <strong>✅ Página funcionando!</strong> Tema escuro ativo. 
            Esta é uma versão temporária das configurações.
          </p>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/admin" style={{ color: '#2563eb', textDecoration: 'none' }}>
            ← Voltar ao Admin
          </a>
        </div>
      </div>
    </div>
  );
}