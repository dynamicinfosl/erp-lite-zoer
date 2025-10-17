import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// GET - buscar ordens de serviço
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    console.log('🔍 Buscando ordens...');
    
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id') || '00000000-0000-0000-0000-000000000000';

    console.log('🔍 Buscando ordens para tenant:', tenant_id);

    // Buscar diretamente do Supabase
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Erro ao buscar ordens:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Ordens encontradas:', data?.length || 0);
    return NextResponse.json({ success: true, data: data || [] });

  } catch (error) {
    console.log('❌ Erro geral na busca:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// POST - criar nova ordem de serviço
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    console.log('🚀 Criando ordem...');
    
    const body = await request.json();
    console.log('📝 Dados recebidos:', body);

    // Validar dados obrigatórios
    if (!body.cliente || !body.tipo || !body.descricao) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campos obrigatórios não preenchidos' 
      }, { status: 400 });
    }

    // Validar valor estimado (não pode ser negativo)
    const valorEstimado = parseFloat(body.valor_estimado) || 0;
    if (valorEstimado < 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valor estimado não pode ser negativo' 
      }, { status: 400 });
    }

    // Gerar número da OS
    const currentYear = new Date().getFullYear();
    
    // Buscar contagem de ordens do tenant
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', body.tenant_id || '00000000-0000-0000-0000-000000000000');

    const numero = `OS-${currentYear}-${String((count || 0) + 1).padStart(3, '0')}`;

    const orderData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      tenant_id: body.tenant_id || '00000000-0000-0000-0000-000000000000',
      numero: numero,
      cliente: body.cliente,
      tipo: body.tipo,
      descricao: body.descricao,
      prioridade: body.prioridade || 'media',
      valor_estimado: valorEstimado,
      data_prazo: body.data_prazo || null,
      tecnico: body.tecnico || null,
      status: 'aberta',
      data_abertura: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('💾 Salvando no banco:', orderData);

    // Inserir diretamente no Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.log('❌ Erro do Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Ordem salva com sucesso:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.log('❌ Erro geral:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// PUT - atualizar ordem de serviço
export async function PUT(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }

    console.log('🔄 Atualizando ordem...');
    
    const body = await request.json();
    console.log('📝 Dados recebidos:', body);

    if (!body.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da ordem é obrigatório' 
      }, { status: 400 });
    }

    // Validar valor estimado se fornecido (não pode ser negativo)
    if (body.valor_estimado !== undefined) {
      const valorEstimado = parseFloat(body.valor_estimado);
      if (isNaN(valorEstimado) || valorEstimado < 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Valor estimado deve ser um número positivo' 
        }, { status: 400 });
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Adicionar apenas campos que foram enviados
    if (body.cliente !== undefined) updateData.cliente = body.cliente;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.prioridade !== undefined) updateData.prioridade = body.prioridade;
    if (body.valor_estimado !== undefined) updateData.valor_estimado = body.valor_estimado;
    if (body.data_prazo !== undefined) updateData.data_prazo = body.data_prazo;
    if (body.tecnico !== undefined) updateData.tecnico = body.tecnico;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.valor_final !== undefined) updateData.valor_final = body.valor_final;
    if (body.data_conclusao !== undefined) updateData.data_conclusao = body.data_conclusao;

    console.log('💾 Atualizando no banco:', updateData);

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.log('❌ Erro do Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Ordem atualizada com sucesso:', data);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.log('❌ Erro geral:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - deletar ordem de serviço
export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Cliente Supabase não configurado' },
        { status: 500 }
      );
    }
    console.log('🗑️ Deletando ordem...');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID da ordem é obrigatório' 
      }, { status: 400 });
    }

    console.log('🗑️ Deletando ordem ID:', id);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.log('❌ Erro do Supabase:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Ordem deletada com sucesso');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.log('❌ Erro geral:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}