'use client';

import React, { useEffect } from 'react';

export default function AdminPage() {
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
        {/* Header */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: textColor,
            margin: 0
          }}>
            🔐 Painel Administrativo
          </h1>
          <p style={{ 
            color: textSecondary, 
            margin: '0.5rem 0 0 0'
          }}>
            Sistema de gestão completo
          </p>
        </div>
        
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: textSecondary,
                margin: 0
              }}>
                👥 Usuários
              </h3>
              <div style={{
                fontSize: '1.5rem'
              }}>
                👥
              </div>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>156</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+12% este mês</div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: textSecondary,
                margin: 0
              }}>
                💰 Vendas
              </h3>
              <div style={{
                fontSize: '1.5rem'
              }}>
                💰
              </div>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>89</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+15% este mês</div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: textSecondary,
                margin: 0
              }}>
                📦 Produtos
              </h3>
              <div style={{
                fontSize: '1.5rem'
              }}>
                📦
              </div>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>234</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+5% este mês</div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${borderColor}`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: textSecondary,
                margin: 0
              }}>
                ⚠️ Alertas
              </h3>
              <div style={{
                fontSize: '1.5rem'
              }}>
                ⚠️
              </div>
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: '0.5rem'
            }}>12</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>Requerem atenção</div>
          </div>
        </div>

        {/* Cards de Ações Rápidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
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
              🚀 Ações Rápidas
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              <button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(0)';
              }}>
                👥 Usuários
              </button>
              
              <button style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#15803d';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#16a34a';
                e.target.style.transform = 'translateY(0)';
              }}>
                📊 Analytics
              </button>
              
              <button style={{
                backgroundColor: '#9333ea',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#7c3aed';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#9333ea';
                e.target.style.transform = 'translateY(0)';
              }}>
                ⚙️ Config
              </button>
              
              <button style={{
                backgroundColor: '#ea580c',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#c2410c';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ea580c';
                e.target.style.transform = 'translateY(0)';
              }}>
                📋 Logs
              </button>
            </div>
          </div>
          
          <div style={{
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '0.75rem',
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
              📈 Performance
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: textSecondary
                  }}>CPU</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: textColor
                  }}>23%</span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: '23%',
                    backgroundColor: '#2563eb',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
              
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: textSecondary
                  }}>Memória</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: textColor
                  }}>68%</span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: '68%',
                    backgroundColor: '#16a34a',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
              
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: textSecondary
                  }}>Disco</span>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: textColor
                  }}>45%</span>
                </div>
                <div style={{
                  height: '6px',
                  backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: '45%',
                    backgroundColor: '#9333ea',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status do Sistema */}
        <div style={{
          backgroundColor: cardBg,
          padding: '1.5rem',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${borderColor}`,
          marginBottom: '2rem',
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: textColor
          }}>
            🟢 Status do Sistema
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#16a34a',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                color: textColor
              }}>Servidor Online</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#16a34a',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                color: textColor
              }}>Banco de Dados</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#16a34a',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                color: textColor
              }}>API Funcionando</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#16a34a',
                borderRadius: '50%'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                color: textColor
              }}>Cache Ativo</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '1rem',
          backgroundColor: isDark ? '#16a34a' : '#dcfce7',
          border: `1px solid ${isDark ? '#15803d' : '#16a34a'}`,
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: isDark ? '#f9fafb' : '#166534',
            margin: 0
          }}>
            <strong>✅ Sistema funcionando!</strong> Tema escuro ativo. 
            O sistema completo será restaurado após a correção da autenticação.
          </p>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/" style={{ 
            color: '#2563eb', 
            textDecoration: 'none',
            fontSize: '0.875rem'
          }}>
            ← Voltar ao sistema
          </a>
        </div>
      </div>
    </div>
  );
}