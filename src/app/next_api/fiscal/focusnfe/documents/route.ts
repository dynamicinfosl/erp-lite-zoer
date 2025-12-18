import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    let supabaseAdmin;
    try {
      supabaseAdmin = getSupabaseClient();
    } catch (envError: any) {
      console.error('Erro ao configurar Supabase:', envError);
      return NextResponse.json({ 
        error: 'Configuração do servidor incompleta', 
        details: envError?.message || 'Variáveis de ambiente do Supabase não configuradas' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const doc_type = searchParams.get('doc_type'); // opcional: filtrar por tipo
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('fiscal_documents')
      .select('id, tenant_id, provider, doc_type, ref, status, payload, xml_path, pdf_path, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (doc_type) {
      query = query.eq('doc_type', doc_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar documentos fiscais:', error);
      return NextResponse.json({ error: 'Erro ao buscar documentos fiscais', details: error.message }, { status: 400 });
    }

    // Contar total de documentos
    let countQuery = supabaseAdmin
      .from('fiscal_documents')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('provider', 'focusnfe');

    if (doc_type) {
      countQuery = countQuery.eq('doc_type', doc_type);
    }

    const { count } = await countQuery;

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error: any) {
    console.error('Erro interno na rota GET documents:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}

