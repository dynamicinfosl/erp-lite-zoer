import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiKeyAuth, ApiKeyContext } from '@/lib/api-key-middleware';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/v1/customers/[customerId]
 * Busca um cliente específico por ID
 */
async function getCustomerHandler(
  request: NextRequest,
  context: ApiKeyContext
) {
  try {
    const { tenant_id } = context;
    // Extrair customerId da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const customerId = pathParts[pathParts.length - 1];

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente inválido' },
        { status: 400 }
      );
    }

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerIdNum)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar cliente: ' + error.message },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('❌ Erro no handler de busca de cliente:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export const GET = withApiKeyAuth(getCustomerHandler, 'customers:read');
