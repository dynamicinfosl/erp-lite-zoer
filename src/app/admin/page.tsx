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
<<<<<<< HEAD
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
=======
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                  <AdminStatCard
                    title="Total de Usuários"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-5 w-5" />}
                    color="blue"
                    change="+12%"
                    changeType="positive"
                  />
                  <AdminStatCard
                    title="Usuários Ativos"
                    value={stats?.activeUsers || 0}
                    icon={<Activity className="h-5 w-5" />}
                    color="green"
                    change="+8%"
                    changeType="positive"
                  />
                  <AdminStatCard
                    title="Vendas Totais"
                    value={stats?.totalSales || 0}
                    icon={<BarChart3 className="h-5 w-5" />}
                    color="purple"
                    change="+15%"
                    changeType="positive"
                  />
                  <AdminStatCard
                    title="Produtos"
                    value={stats?.totalProducts || 0}
                    icon={<Package className="h-5 w-5" />}
                    color="orange"
                    change="+5%"
                    changeType="positive"
                  />
                  <AdminStatCard
                    title="Bebidas"
                    value={stats?.totalBeverages || 0}
                    icon={<Database className="h-5 w-5" />}
                    color="cyan"
                    change="+3%"
                    changeType="positive"
                  />
          <AdminStatCard
            title="Valor do Estoque"
            value={`R$ ${stats?.totalInventoryValue?.toLocaleString('pt-BR') || 0}`}
            icon={<CreditCard className="h-5 w-5" />}
            color="emerald"
            change="+7%"
            changeType="positive"
          />
        </div>

        {/* Alertas Específicos */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Estoque Baixo</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <AlertTriangle className="h-4 w-4" />
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-juga-primary">{stats?.complianceRate}%</div>
                <p className="text-sm text-caption">Taxa de conformidade</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Alertas de Temperatura</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-juga-primary">{stats?.temperatureAlerts}</div>
                <p className="text-sm text-caption">Alertas ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Informações do Sistema */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <StorageCard
            title="Armazenamento"
            used={75}
            total={100}
            unit="GB"
            description="Espaço utilizado no servidor"
          />
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Último Backup</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <Database className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-juga-primary">
                  {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('pt-BR') : 'N/A'}
                </div>
                <p className="text-sm text-caption">Backup automático</p>
              </div>
            </CardContent>
          </Card>
          <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-juga-text-secondary">Status do Sistema</CardTitle>
                <div className="p-2 rounded-lg text-juga-primary bg-juga-primary/10">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600 capitalize">{stats?.systemHealth || 'unknown'}</div>
                <p className="text-sm text-caption">Sistema operacional</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividades Recentes */}
        <Card className="juga-card transition-all hover:juga-shadow-glow border-juga-primary/20 bg-gradient-to-br from-juga-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-juga-text-primary">
              <Activity className="h-5 w-5 text-juga-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-juga-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-juga-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-heading">Novo usuário cadastrado</div>
                  <div className="text-xs text-caption">Há 4 horas</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-juga-primary/10 rounded-lg">
                  <Database className="h-4 w-4 text-juga-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-heading">Backup automático realizado</div>
                  <div className="text-xs text-caption">Há 6 horas</div>
>>>>>>> origin/main
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