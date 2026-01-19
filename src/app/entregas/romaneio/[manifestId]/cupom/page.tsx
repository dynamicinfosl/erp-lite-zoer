'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { DeliveryManifestCupomLayout } from '@/components/deliveries/DeliveryManifestCupomLayout';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext-Fixed';

export default function RomaneioCupomPage() {
  const params = useParams();
  const router = useRouter();
  const { tenant } = useSimpleAuth();
  const manifestId = params.manifestId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!tenant?.id || !manifestId) return;
      try {
        setLoading(true);
        const res = await fetch(
          `/next_api/delivery-manifests/${encodeURIComponent(manifestId)}?tenant_id=${encodeURIComponent(tenant.id)}`
        );
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json?.data || json);
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenant?.id, manifestId]);

  // Removido impressão automática para evitar duplicação
  // O usuário pode usar o botão "Imprimir Cupom" quando necessário

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando romaneio...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar romaneio</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print p-6 text-center bg-gray-100 sticky top-0 z-10 border-b">
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Cupom
          </Button>
        </div>
      </div>

      <DeliveryManifestCupomLayout
        manifest={data.manifest}
        driver={data.driver}
        deliveries={data.deliveries || []}
        sales={data.sales || []}
        saleItems={data.sale_items || []}
        companyName="JUGA"
      />
    </div>
  );
}
