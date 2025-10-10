'use client';

import React, { useEffect } from 'react';

export default function AdminMonitoringPage() {
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
          📡 Monitoramento do Sistema
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Monitorar performance e status do sistema em tempo real
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
              🟢 Status do Servidor
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>Online</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Última verificação: agora</div>
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
              ⚡ Tempo de Resposta
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>127ms</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Média dos últimos 5 min</div>
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
              💾 Uso de Memória
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>68%</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>2.1GB de 3.0GB</div>
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
              🖥️ CPU
            </h3>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: '0.5rem'
            }}>23%</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Últimos 5 minutos</div>
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
              📊 Performance em Tempo Real
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
              📈 Gráfico de performance seria exibido aqui
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
              🚨 Alertas Recentes
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {[
                { type: 'info', message: 'Backup automático realizado com sucesso', time: '2 min atrás' },
                { type: 'warning', message: 'Uso de memória acima de 70%', time: '15 min atrás' },
                { type: 'success', message: 'Sistema atualizado para v2.1.0', time: '1 hora atrás' },
                { type: 'info', message: 'Novo usuário cadastrado', time: '2 horas atrás' }
              ].map((alert, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: alert.type === 'warning' ? '#fef3c7' : 
                                 alert.type === 'success' ? '#dcfce7' : '#dbeafe',
                  borderRadius: '0.375rem',
                  border: `1px solid ${alert.type === 'warning' ? '#f59e0b' : 
                                         alert.type === 'success' ? '#16a34a' : '#2563eb'}`
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: alert.type === 'warning' ? '#92400e' : 
                           alert.type === 'success' ? '#166534' : '#1e40af'
                  }}>
                    {alert.message}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: textSecondary,
                    marginTop: '0.25rem'
                  }}>
                    {alert.time}
                  </div>
                </div>
              ))}
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
            🔧 Ações de Sistema
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <button style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              🔄 Reiniciar Serviços
            </button>
            
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              💾 Fazer Backup
            </button>
            
            <button style={{
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              📊 Gerar Relatório
            </button>
            
            <button style={{
              backgroundColor: '#ea580c',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              🧹 Limpar Cache
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
            Esta é uma versão temporária do monitoramento.
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