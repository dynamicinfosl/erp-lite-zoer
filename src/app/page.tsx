'use client';

import React, { useEffect } from 'react';

export default function HomePage() {
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: bgColor, 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: textColor,
            margin: '0 0 1rem 0'
          }}>
            🏢 ERP Lite
          </h1>
          <p style={{ 
            color: textSecondary, 
            fontSize: '1.25rem',
            margin: 0
          }}>
            Sistema completo de gestão para depósitos de bebidas
          </p>
        </div>

        {/* Cards de Funcionalidades */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '2rem',
            borderRadius: '1rem',
            border: `1px solid ${borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>👥</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: textColor,
              marginBottom: '1rem'
            }}>
              Gestão de Clientes
            </h3>
            <p style={{
              color: textSecondary,
              marginBottom: '1.5rem'
            }}>
              Controle completo de clientes, pedidos e entregas
            </p>
            <a href="/clientes" style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Acessar →
            </a>
          </div>

          <div style={{
            backgroundColor: cardBg,
            padding: '2rem',
            borderRadius: '1rem',
            border: `1px solid ${borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>💰</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: textColor,
              marginBottom: '1rem'
            }}>
              Financeiro
            </h3>
            <p style={{
              color: textSecondary,
              marginBottom: '1.5rem'
            }}>
              Controle de receitas, despesas e relatórios financeiros
            </p>
            <a href="/financeiro" style={{
              display: 'inline-block',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Acessar →
            </a>
          </div>

          <div style={{
            backgroundColor: cardBg,
            padding: '2rem',
            borderRadius: '1rem',
            border: `1px solid ${borderColor}`,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>📊</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: textColor,
              marginBottom: '1rem'
            }}>
              Relatórios
            </h3>
            <p style={{
              color: textSecondary,
              marginBottom: '1.5rem'
            }}>
              Análises e relatórios detalhados do negócio
            </p>
            <a href="/relatorios" style={{
              display: 'inline-block',
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Acessar →
            </a>
          </div>
        </div>

        {/* Link para Admin */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <a href="/admin" style={{
            display: 'inline-block',
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            fontSize: '1.125rem',
            fontWeight: '600'
          }}>
            🔐 Acessar Painel Administrativo
          </a>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: cardBg,
          borderRadius: '0.75rem',
          border: `1px solid ${borderColor}`
        }}>
          <p style={{
            color: textSecondary,
            margin: 0,
            fontSize: '0.875rem'
          }}>
            <strong style={{ color: textColor }}>✅ Sistema funcionando!</strong> Tema escuro ativo.
            Sistema de gestão completo para depósitos de bebidas.
          </p>
        </div>
      </div>
    </div>
  );
}