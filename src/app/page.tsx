
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ENABLE_AUTH } from '@/constants/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AdminAccessButton } from '@/components/admin/AdminAccessButton';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ENABLE_AUTH && !loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } else if (!ENABLE_AUTH) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center juga-gradient">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando JUGA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen juga-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Shield className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            JUGA
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Sistema Moderno de Gestão Empresarial
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Link href="/dashboard">
                Começar
              </Link>
            </Button>
            <AdminAccessButton 
              size="lg" 
              variant="outline" 
              className="bg-red-600/20 hover:bg-red-600/30 text-white border-red-400/30"
            >
              Admin
            </AdminAccessButton>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 mx-auto" />
              <CardTitle className="text-white">Gestão de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Organize e gerencie sua base de clientes com facilidade
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 mx-auto" />
              <CardTitle className="text-white">Relatórios Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Análises detalhadas para tomada de decisões estratégicas
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <Settings className="h-8 w-8 mb-2 mx-auto" />
              <CardTitle className="text-white">Configuração Flexível</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-white/80">
                Personalize o sistema conforme suas necessidades específicas
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-white/70">
          <p>&copy; 2025 JUGA. Todos os direitos reservados.</p>
        </div>
      </div>

    </div>
  );
}
