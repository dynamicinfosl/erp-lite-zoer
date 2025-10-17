import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    // Primeiro, tentar buscar o tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    // Se não encontrar, retornar dados padrão
    if (error && error.code === 'PGRST116') {
      console.log('Tenant não encontrado, retornando dados padrão...');
      
      const defaultTenant = {
        id: tenantId,
        name: 'Empresa Exemplo',
        fantasy_name: 'Empresa Exemplo',
        document: '',
        document_type: 'CNPJ',
        corporate_email: '',
        corporate_phone: '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        number: '',
        status: 'trial'
      };

      return NextResponse.json({ data: defaultTenant });
    }

    if (error) {
      console.error('Erro ao buscar tenant:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados da empresa' }, { status: 500 });
    }

    return NextResponse.json({ data: tenant });
  } catch (error) {
    console.error('Erro na API tenants GET:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do tenant é obrigatório' }, { status: 400 });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar tenant:', error);
      return NextResponse.json({ error: 'Erro ao atualizar dados da empresa' }, { status: 500 });
    }

    return NextResponse.json({ data: tenant });
  } catch (error) {
    console.error('Erro na API tenants PUT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}





