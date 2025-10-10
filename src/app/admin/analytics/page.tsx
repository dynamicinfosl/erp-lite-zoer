'use client';

import React, { useEffect } from 'react';

export default function AdminAnalyticsPage() {
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
          📊 Analytics e Relatórios
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Análise de dados e performance do sistema
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: textSecondary
            }}>
              👥 Usuários Ativos
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>1,247</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+12% este mês</div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: textSecondary
            }}>
              💰 Receita Mensal
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>R$ 45,230</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+8% este mês</div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: textSecondary
            }}>
              📈 Taxa de Conversão
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>3.2%</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+0.3% este mês</div>
        </div>

          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: textSecondary
            }}>
              🎯 Taxa de Churn
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: '0.5rem'
            }}>2.1%</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>-0.5% este mês</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
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
              marginBottom: '1rem'
            }}>
              📊 Gráfico de Vendas
            </h3>
            <div style={{
              height: '200px',
              backgroundColor: isDark ? '#0f172a' : '#f3f4f6',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textSecondary
            }}>
              📈 Gráfico de vendas seria exibido aqui
            </div>
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
              marginBottom: '1rem'
            }}>
              👥 Usuários por Região
            </h3>
            <div style={{
              height: '200px',
              backgroundColor: isDark ? '#0f172a' : '#f3f4f6',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textSecondary
            }}>
              🗺️ Mapa de usuários seria exibido aqui
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            📋 Relatórios Disponíveis
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              'Relatório de Vendas',
              'Análise de Usuários',
              'Performance do Sistema',
              'Relatório Financeiro',
              'Análise de Churn',
              'Relatório de Suporte'
            ].map((report, index) => (
              <button key={index} style={{
                backgroundColor: isDark ? '#0f172a' : '#f3f4f6',
                border: '1px solid #d1d5db',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem'
              }}>
                📄 {report}
              </button>
            ))}
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
            Esta é uma versão temporária dos analytics.
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