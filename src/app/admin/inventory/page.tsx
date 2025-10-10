'use client';

import React, { useEffect } from 'react';

export default function AdminInventoryPage() {
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
          📦 Gerenciar Estoque
        </h1>
        
        <p style={{ 
          color: textSecondary, 
          marginBottom: '2rem' 
        }}>
          Monitorar e gerenciar o inventário do sistema
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
              📦 Total de Produtos
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>2,847</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>+45 este mês</div>
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
              ⚠️ Estoque Baixo
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ea580c',
              marginBottom: '0.5rem'
            }}>23</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#dc2626'
            }}>Precisam reposição</div>
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
              💰 Valor Total
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>R$ 245K</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#16a34a'
            }}>Valor em estoque</div>
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
              🔄 Movimentações
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#9333ea',
              marginBottom: '0.5rem'
            }}>156</div>
            <div style={{
              fontSize: '0.875rem',
              color: textSecondary
            }}>Hoje</div>
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
              ⚠️ Produtos com Estoque Baixo
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {[
                { name: 'Cerveja Heineken', stock: 5, min: 20 },
                { name: 'Vodka Absolut', stock: 8, min: 15 },
                { name: 'Whisky Johnnie Walker', stock: 3, min: 10 },
                { name: 'Vinho Tinto', stock: 12, min: 25 }
              ].map((product, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.375rem',
                  border: '1px solid #f59e0b'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#92400e'
                  }}>
                    {product.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#92400e',
                    marginTop: '0.25rem'
                  }}>
                    Estoque: {product.stock} | Mínimo: {product.min}
                  </div>
                </div>
              ))}
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
              📊 Categorias de Produtos
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {[
                { category: 'Cervejas', count: 245, percentage: 35 },
                { category: 'Destilados', count: 189, percentage: 27 },
                { category: 'Vinhos', count: 156, percentage: 22 },
                { category: 'Refrigerantes', count: 112, percentage: 16 }
              ].map((cat, index) => (
                <div key={index} style={{
                  padding: '0.75rem',
                  backgroundColor: isDark ? '#0f172a' : '#f3f4f6',
                  borderRadius: '0.375rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {cat.category}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#2563eb'
                    }}>
                      {cat.count}
                    </div>
                  </div>
                  <div style={{
                    height: '4px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      backgroundColor: '#2563eb',
                      borderRadius: '2px'
                    }}></div>
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
            🔧 Ações Rápidas
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
              ➕ Adicionar Produto
            </button>
            
            <button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              📊 Relatório de Estoque
            </button>
            
            <button style={{
              backgroundColor: '#ea580c',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              🔄 Atualizar Estoque
            </button>
            
            <button style={{
              backgroundColor: '#9333ea',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}>
              📤 Exportar Dados
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
            Esta é uma versão temporária da gestão de estoque.
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