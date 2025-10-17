'use client';

import React, { useState } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AuthDebugInfo() {
  const { user, tenant, loading, session } = useSimpleAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return null; // Não mostrar em produção
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setShowDebug(!showDebug)}
        variant="outline"
        size="sm"
        className="mb-2"
      >
        🔧 Debug Auth
      </Button>
      
      {showDebug && (
        <Card className="w-80 max-h-96 overflow-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <strong>Loading:</strong> 
              <Badge variant={loading ? "destructive" : "default"} className="ml-1">
                {loading ? "Sim" : "Não"}
              </Badge>
            </div>
            
            <div>
              <strong>Usuário:</strong>
              <div className="ml-2 text-gray-600">
                {user ? (
                  <>
                    <div>Email: {user.email}</div>
                    <div>ID: {user.id}</div>
                  </>
                ) : (
                  "Não logado"
                )}
              </div>
            </div>
            
            <div>
              <strong>Tenant:</strong>
              <div className="ml-2 text-gray-600">
                {tenant ? (
                  <>
                    <div>ID: {tenant.id}</div>
                    <div>Nome: {tenant.name}</div>
                    <div>Status: {tenant.status}</div>
                  </>
                ) : (
                  "Não carregado"
                )}
              </div>
            </div>
            
            <div>
              <strong>Sessão:</strong>
              <div className="ml-2 text-gray-600">
                {session ? (
                  <>
                    <div>Válida: Sim</div>
                    <div>Expira: {new Date(session.expires_at! * 1000).toLocaleString()}</div>
                  </>
                ) : (
                  "Não encontrada"
                )}
              </div>
            </div>
            
            <div>
              <strong>Variáveis:</strong>
              <div className="ml-2 text-gray-600">
                <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌"}</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅" : "❌"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
