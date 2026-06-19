import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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
          error: 'Supabase não configurado.',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawTenantId = searchParams.get('tenant_id');
    const tenant_id = rawTenantId ? rawTenantId.trim() : '';
    const doc_type = searchParams.get('doc_type');
    const provider = searchParams.get('provider'); // Opcional
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        pagination: { total: 0, limit, offset, hasMore: false } 
      }, { headers: jsonHeaders });
    }

    let query = supabaseAdmin
      .from('fiscal_documents')
      .select('id, tenant_id, provider, doc_type, ref, status, numero, serie, chave, payload, caminho_xml, caminho_pdf, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (doc_type) {
      query = query.eq('doc_type', doc_type);
    }

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar documentos fiscais gerais:', error);
      return NextResponse.json({ 
        success: true, 
        data: [], 
        pagination: { total: 0, limit, offset, hasMore: false },
        error_logged: error.message 
      }, { headers: jsonHeaders });
    }

    // Contar total de documentos
    let countQuery = supabaseAdmin
      .from('fiscal_documents')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id);

    if (doc_type) {
      countQuery = countQuery.eq('doc_type', doc_type);
    }

    if (provider) {
      countQuery = countQuery.eq('provider', provider);
    }

    const { count } = await countQuery;

    // Mapear caminho_xml e caminho_pdf para os nomes esperados pelo frontend (xml_path/pdf_path)
    const mappedData = data?.map((doc) => ({
      ...doc,
      xml_path: doc.caminho_xml,
      pdf_path: doc.caminho_pdf,
    })) || [];

    return NextResponse.json({ 
      success: true, 
      data: mappedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    }, { headers: jsonHeaders });
  } catch (error: any) {
    console.error('Erro interno na rota GET global documents:', error);
    return NextResponse.json({ 
      success: true, 
      data: [], 
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
      error_logged: error?.message || 'Erro desconhecido' 
    }, { headers: jsonHeaders });
  }
}
