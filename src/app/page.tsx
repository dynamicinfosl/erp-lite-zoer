'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  ArrowRight,
  CheckCircle,
  Zap,
  Package,
  TrendingUp,
  Lock,
  Sparkles,
  Crown,
  Star,
  ChevronRight,
  Mail,
  Building2,
  Phone
} from 'lucide-react';
import Link from 'next/link';

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
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: cardBg,
        borderBottom: `1px solid ${borderColor}`,
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#2563eb',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield style={{ color: 'white', width: '24px', height: '24px' }} />
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: textColor,
              margin: 0
            }}>
              ERP Lite
            </h1>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <Link href="/admin/login">
              <Button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                <Lock style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                Acesso Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: `linear-gradient(135deg, ${bgColor} 0%, #1e293b 100%)`
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <Badge style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            <Sparkles style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
            Sistema Completo de Gestão
          </Badge>
          
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: textColor,
            marginBottom: '1rem',
            lineHeight: '1.2'
          }}>
            Gerencie seu Depósito de Bebidas com{' '}
            <span style={{ color: '#2563eb' }}>Inteligência</span>
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: textSecondary,
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Sistema ERP completo para controle de estoque, vendas, clientes e muito mais. 
            Desenvolvido especificamente para depósitos de bebidas.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link href="/admin/login">
              <Button style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}>
                Começar Agora
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </Button>
            </Link>
            
            <Button style={{
              backgroundColor: 'transparent',
              color: textColor,
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              border: `1px solid ${borderColor}`,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Ver Demonstração
              <ChevronRight style={{ width: '20px', height: '20px' }} />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '4rem 2rem',
        backgroundColor: bgColor
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: textColor,
              marginBottom: '1rem'
            }}>
              Recursos Poderosos
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: textSecondary
            }}>
              Tudo que você precisa para gerenciar seu negócio com eficiência
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#2563eb',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Package style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Gestão de Estoque
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Controle completo do seu estoque com alertas automáticos e relatórios detalhados
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#16a34a',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <TrendingUp style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Vendas e Faturamento
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Sistema completo de vendas com controle de comissões e relatórios de performance
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#9333ea',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Users style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Gestão de Clientes
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Cadastro completo de clientes com histórico de compras e controle de crédito
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#ea580c',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <BarChart3 style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Relatórios Avançados
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Dashboards e relatórios em tempo real para tomada de decisões estratégicas
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#dc2626',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Zap style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Automação
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Processos automatizados para aumentar a produtividade e reduzir erros
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
              padding: '2rem'
            }}>
              <CardHeader>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: '#0891b2',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Settings style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <CardTitle style={{ color: textColor, fontSize: '1.25rem' }}>
                  Configuração Flexível
                </CardTitle>
                <CardDescription style={{ color: textSecondary }}>
                  Sistema totalmente personalizável para atender às suas necessidades específicas
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '4rem 2rem',
        backgroundColor: cardBg,
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: textColor,
            marginBottom: '1rem'
          }}>
            Pronto para Transformar seu Negócio?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: textSecondary,
            marginBottom: '2rem'
          }}>
            Comece hoje mesmo e veja a diferença que um sistema profissional pode fazer.
          </p>
          <Link href="/admin/login">
            <Button style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none'
            }}>
              Acessar Sistema
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: bgColor,
        borderTop: `1px solid ${borderColor}`,
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Shield style={{ color: '#2563eb', width: '24px', height: '24px' }} />
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: textColor
            }}>
              ERP Lite
            </span>
          </div>
          <p style={{
            color: textSecondary,
            marginBottom: '1rem'
          }}>
            Sistema de gestão completo para depósitos de bebidas
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: textSecondary
            }}>
              <Mail style={{ width: '16px', height: '16px' }} />
              <span>contato@erplite.com</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: textSecondary
            }}>
              <Phone style={{ width: '16px', height: '16px' }} />
              <span>(11) 99999-9999</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: textSecondary
            }}>
              <Building2 style={{ width: '16px', height: '16px' }} />
              <span>São Paulo, SP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}