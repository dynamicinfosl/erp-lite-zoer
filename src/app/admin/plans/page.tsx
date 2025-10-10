'use client';

import React, { useEffect } from 'react';

export default function AdminPlansPage() {
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
          💳 Gerenciar Planos
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Gerenciar planos e assinaturas do sistema
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `2px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: textSecondary
            }}>
              📦 Básico
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: textColor
              }}>R$ 29</span>
              <span style={{ color: textSecondary }}>/mês</span>
            </div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginBottom: '1.5rem',
              color: textSecondary
            }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Até 100 produtos</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Relatórios básicos</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Suporte por email</li>
            </ul>
            <button style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Selecionar
            </button>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '2px solid #2563eb',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.25rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              MAIS POPULAR
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#2563eb'
            }}>
              🚀 Profissional
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: textColor
              }}>R$ 79</span>
              <span style={{ color: textSecondary }}>/mês</span>
            </div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginBottom: '1.5rem',
              color: textSecondary
            }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Produtos ilimitados</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Relatórios avançados</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Suporte prioritário</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ API personalizada</li>
            </ul>
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Selecionar
            </button>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '2px solid #9333ea',
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#9333ea'
            }}>
              👑 Empresarial
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: textColor
              }}>R$ 199</span>
              <span style={{ color: textSecondary }}>/mês</span>
            </div>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              marginBottom: '1.5rem',
              color: textSecondary
            }}>
              <li style={{ marginBottom: '0.5rem' }}>✓ Tudo do Profissional</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Múltiplos usuários</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Integrações avançadas</li>
              <li style={{ marginBottom: '0.5rem' }}>✓ Suporte 24/7</li>
            </ul>
            <button style={{
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Selecionar
            </button>
          </div>
        </div>
        
        <div style={{
          padding: '1rem',
          backgroundColor: isDark ? '#16a34a' : '#dcfce7',
          border: `1px solid ${isDark ? '#15803d' : '#16a34a'}`,
          borderRadius: '0.375rem'
        }}>
          <p style={{ color: isDark ? '#f9fafb' : '#166534', margin: 0 }}>
            <strong>✅ Página funcionando!</strong> Tema escuro ativo. 
            Esta é uma versão temporária da gestão de planos.
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
