'use client';

import React, { useEffect } from 'react';

export default function AdminAuditPage() {
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
          📋 Auditoria e Logs
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Monitorar atividades e logs do sistema
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
              📊 Total de Logs
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>12,847</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Últimos 30 dias</div>
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
              🚨 Eventos Críticos
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '0.5rem'
            }}>23</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>Requerem atenção</div>
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
              👥 Usuários Ativos
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>156</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>Hoje</div>
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
              🔐 Tentativas de Login
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>1,247</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Últimas 24h</div>
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
            📋 Logs Recentes
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {[
              { 
                type: 'success', 
                action: 'Login realizado', 
                user: 'joao@empresa.com', 
                time: '2 min atrás',
                details: 'Login bem-sucedido via interface web'
              },
              { 
                type: 'info', 
                action: 'Produto criado', 
                user: 'maria@empresa.com', 
                time: '5 min atrás',
                details: 'Novo produto "Cerveja Corona" adicionado'
              },
              { 
                type: 'warning', 
                action: 'Tentativa de login falhada', 
                user: 'usuario@desconhecido.com', 
                time: '8 min atrás',
                details: 'Senha incorreta inserida 3 vezes'
              },
              { 
                type: 'success', 
                action: 'Venda realizada', 
                user: 'sistema', 
                time: '12 min atrás',
                details: 'Venda de R$ 89,50 processada com sucesso'
              },
              { 
                type: 'info', 
                action: 'Backup automático', 
                user: 'sistema', 
                time: '15 min atrás',
                details: 'Backup diário realizado com sucesso'
              },
              { 
                type: 'error', 
                action: 'Erro de conexão', 
                user: 'sistema', 
                time: '18 min atrás',
                details: 'Falha temporária na conexão com banco de dados'
              }
            ].map((log, index) => (
              <div key={index} style={{
                padding: '1rem',
                backgroundColor: log.type === 'error' ? '#fef2f2' : 
                                 log.type === 'warning' ? '#fef3c7' : 
                                 log.type === 'success' ? '#dcfce7' : '#dbeafe',
                borderRadius: '0.375rem',
                border: `1px solid ${log.type === 'error' ? '#fca5a5' : 
                                        log.type === 'warning' ? '#fbbf24' : 
                                        log.type === 'success' ? '#86efac' : '#93c5fd'}`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: log.type === 'error' ? '#dc2626' : 
                             log.type === 'warning' ? '#d97706' : 
                             log.type === 'success' ? '#16a34a' : '#2563eb'
                    }}>
                      {log.action}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: textSecondary,
                      marginTop: '0.25rem'
                    }}>
                      {log.details}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: textSecondary
                  }}>
                    {log.time}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: textSecondary
                }}>
                  Usuário: {log.user}
                </div>
              </div>
            ))}
          </div>
        </div>
        
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
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              🔍 Filtros de Busca
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Tipo de Evento
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}>
                  <option>Todos os tipos</option>
                  <option>Login</option>
                  <option>Venda</option>
                  <option>Erro</option>
                  <option>Sistema</option>
                </select>
              </div>
              
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Usuário
                </label>
                <input type="text" placeholder="Digite o email do usuário" style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }} />
              </div>
              
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Período
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}>
                  <option>Últimas 24 horas</option>
                  <option>Últimos 7 dias</option>
                  <option>Últimos 30 dias</option>
                  <option>Últimos 3 meses</option>
                </select>
              </div>
              
              <button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}>
                🔍 Buscar Logs
              </button>
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
              📤 Exportar Dados
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
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
                📄 Exportar CSV
              </button>
              
              <button style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}>
                📊 Exportar PDF
              </button>
              
              <button style={{
                backgroundColor: '#9333ea',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}>
                📋 Relatório Completo
              </button>
            </div>
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
            Esta é uma versão temporária da auditoria.
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