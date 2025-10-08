import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientComponentClient();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

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
    const supabase = createClientComponentClient();
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





