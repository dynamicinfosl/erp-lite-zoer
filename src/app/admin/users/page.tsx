'use client';

import React, { useEffect } from 'react';

export default function AdminUsersPage() {
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
          👥 Gerenciar Usuários
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Gerenciar usuários e permissões do sistema
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
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#2563eb'
            }}>
              📊 Estatísticas
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>156</div>
                <div style={{ fontSize: '0.875rem', color: textSecondary }}>Total</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#16a34a'
                }}>142</div>
                <div style={{ fontSize: '0.875rem', color: textSecondary }}>Ativos</div>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#16a34a'
            }}>
              🆕 Novo Usuário
            </h3>
            <p style={{ color: textSecondary, marginBottom: '1rem' }}>
              Adicionar novo usuário ao sistema
            </p>
            <button style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              width: '100%'
            }}>
              Criar Usuário
            </button>
          </div>
        </div>
        
        <div style={{
          backgroundColor: cardBg,
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${borderColor}`,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: textColor
          }}>
            📋 Lista de Usuários
          </h3>
          
          <div style={{
            display: 'grid',
            gap: '0.75rem'
          }}>
            {[
              { name: 'João Silva', email: 'joao@empresa.com', role: 'Admin', status: 'Ativo' },
              { name: 'Maria Santos', email: 'maria@empresa.com', role: 'Vendedor', status: 'Ativo' },
              { name: 'Pedro Costa', email: 'pedro@empresa.com', role: 'Financeiro', status: 'Inativo' },
              { name: 'Ana Oliveira', email: 'ana@empresa.com', role: 'Vendedor', status: 'Ativo' }
            ].map((user, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr auto',
                gap: '1rem',
                padding: '0.75rem',
                backgroundColor: isDark ? '#0f172a' : '#f9fafb',
                borderRadius: '0.375rem',
                alignItems: 'center',
                border: `1px solid ${borderColor}`
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: textColor }}>{user.name}</div>
                  <div style={{ fontSize: '0.875rem', color: textSecondary }}>{user.email}</div>
                </div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  }}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    backgroundColor: user.status === 'Ativo' ? '#dcfce7' : '#fef3c7',
                    color: user.status === 'Ativo' ? '#166534' : '#92400e'
                  }}>
                    {user.status}
                  </span>
                </div>
        <div>
                  <button style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
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
            Esta é uma versão temporária da gestão de usuários.
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