import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Headers JSON padrão
const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const fiscal_document_id = searchParams.get('fiscal_document_id');
    const tenant_id = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('fiscal_document_events')
      .select('id, fiscal_document_id, tenant_id, event_type, event_status, event_data, provider_response, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fiscal_document_id && isUuid(fiscal_document_id)) {
      query = query.eq('fiscal_document_id', fiscal_document_id);
    }

    if (tenant_id && isUuid(tenant_id)) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json({ error: 'Erro ao buscar eventos', details: error.message }, { status: 400 });
    }

    // Contar total de eventos
    let countQuery = supabaseAdmin
      .from('fiscal_document_events')
      .select('id', { count: 'exact', head: true });

    if (fiscal_document_id && isUuid(fiscal_document_id)) {
      countQuery = countQuery.eq('fiscal_document_id', fiscal_document_id);
    }

    if (tenant_id && isUuid(tenant_id)) {
      countQuery = countQuery.eq('tenant_id', tenant_id);
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
    console.error('Erro interno na rota GET events:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}

