import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";
import { requestMiddleware } from "@/lib/api-utils";

// Função para validar e obter configuração do Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  // Verificar se as variáveis estão configuradas
  const hasEnvUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!hasEnvUrl || (!hasServiceKey && !hasAnonKey)) {
    console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas completamente:');
    console.warn(`  - NEXT_PUBLIC_SUPABASE_URL: ${hasEnvUrl ? '✅' : '❌'}`);
    console.warn(`  - SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅' : '❌'}`);
    console.warn(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅' : '❌'}`);
    console.warn('  Usando valores fallback (hardcoded)');
  }

  if (!supabaseServiceKey) {
    const error = new Error('Nenhuma chave do Supabase configurada. Configure SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('❌ Erro de configuração:', error.message);
    throw error;
  }

  return { supabaseUrl, supabaseServiceKey };
}

// Função para criar cliente Supabase com tratamento de erro
function createSupabaseClient() {
  try {
    const { supabaseUrl, supabaseServiceKey } = getSupabaseConfig();
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente Supabase:', error.message);
    throw error;
  }
}

interface CashSessionQuery {
  register_id?: string;
  status?: string;
}

export const GET = requestMiddleware(async (request, context) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const register_id = searchParams.get("register_id");
    const status = searchParams.get("status");
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenant_id é obrigatório" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    let query = supabaseAdmin
      .from('cash_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (register_id) {
      query = query.eq('register_id', register_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erro ao listar sessões de caixa:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error.details || null,
          hint: error.hint || null
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao listar sessões de caixa:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Erro ao listar sessões de caixa",
        details: error instanceof Error ? error.stack : null
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}, false);

interface CashSessionBody {
  register_id: string;
  opened_at: string;
  initial_amount: number;
  status?: string;
  notes?: string;
}

export const POST = requestMiddleware(async (request, context) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    const body: any = await request.json();
    
    // Log do body recebido para debug
    console.log('🔍 [DEBUG] Body recebido completo:', JSON.stringify(body, null, 2));
    console.log('🔍 [DEBUG] Context params:', JSON.stringify(context, null, 2));
    
    const tenantId = body.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenant_id é obrigatório" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Preparar dados apenas com campos válidos para criação
    const openingData: any = {
      register_id: body.register_id || '1',
      opened_at: body.opened_at || new Date().toISOString(),
      opening_amount: body.initial_amount || body.opening_amount || 0,
      opened_by: body.opened_by || 'Operador',
      status: body.status || 'open',
      tenant_id: tenantId,
      notes: body.notes || null,
    };

    // ⚠️ IMPORTANTE: user_id é UUID, não enviar se não for válido
    // Se o body contiver user_id e for um UUID válido, incluir
    // Caso contrário, deixar NULL (o campo é opcional na tabela)
    if (body.user_id) {
      // Validar se é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof body.user_id === 'string' && uuidRegex.test(body.user_id)) {
        openingData.user_id = body.user_id;
      } else {
        console.warn('⚠️ user_id inválido ignorado (não é UUID):', body.user_id);
        // Não incluir user_id se não for UUID válido
      }
    }

    // Se for um fechamento (status = 'closed'), incluir todos os campos de fechamento
    if (body.status === 'closed') {
      openingData.status = 'closed';
      openingData.closed_at = body.closed_at || new Date().toISOString();
      openingData.closed_by = body.closed_by || body.opened_by || 'Operador';
      
      // Campos de valores contados
      openingData.closing_amount_cash = body.closing_amount_cash ?? null;
      openingData.closing_amount_card_debit = body.closing_amount_card_debit ?? null;
      openingData.closing_amount_card_credit = body.closing_amount_card_credit ?? null;
      openingData.closing_amount_pix = body.closing_amount_pix ?? null;
      openingData.closing_amount_other = body.closing_amount_other ?? null;
      
      // Campos de valores esperados
      if (body.expected_cash !== undefined) openingData.expected_cash = body.expected_cash;
      if (body.expected_card_debit !== undefined) openingData.expected_card_debit = body.expected_card_debit;
      if (body.expected_card_credit !== undefined) openingData.expected_card_credit = body.expected_card_credit;
      if (body.expected_pix !== undefined) openingData.expected_pix = body.expected_pix;
      if (body.expected_other !== undefined) openingData.expected_other = body.expected_other;
      
      // Campos de diferenças
      if (body.difference_amount !== undefined) openingData.difference_amount = body.difference_amount;
      if (body.difference_cash !== undefined) openingData.difference_cash = body.difference_cash;
      if (body.difference_card_debit !== undefined) openingData.difference_card_debit = body.difference_card_debit;
      if (body.difference_card_credit !== undefined) openingData.difference_card_credit = body.difference_card_credit;
      if (body.difference_pix !== undefined) openingData.difference_pix = body.difference_pix;
      if (body.difference_other !== undefined) openingData.difference_other = body.difference_other;
      if (body.difference_reason !== undefined) openingData.difference_reason = body.difference_reason || null;
      
      // Campos de estatísticas
      if (body.total_sales !== undefined) openingData.total_sales = body.total_sales;
      if (body.total_sales_amount !== undefined) openingData.total_sales_amount = body.total_sales_amount;
      if (body.total_refunds !== undefined) openingData.total_refunds = body.total_refunds;
      if (body.total_refunds_amount !== undefined) openingData.total_refunds_amount = body.total_refunds_amount;
      if (body.total_withdrawals !== undefined) openingData.total_withdrawals = body.total_withdrawals;
      if (body.total_withdrawals_amount !== undefined) openingData.total_withdrawals_amount = body.total_withdrawals_amount;
      if (body.total_supplies !== undefined) openingData.total_supplies = body.total_supplies;
      if (body.total_supplies_amount !== undefined) openingData.total_supplies_amount = body.total_supplies_amount;
    }

    // Remover qualquer campo que possa ter sido adicionado incorretamente
    // Garantir que não há campos inválidos sendo enviados
    const cleanData: any = { ...openingData };
    
    // Lista de campos permitidos na tabela cash_sessions
    const allowedFields = [
      'id', 'tenant_id', 'user_id', 'register_id', 'status',
      'opened_by', 'opened_at', 'opening_amount',
      'closed_by', 'closed_at',
      'closing_amount_cash', 'closing_amount_card_debit', 'closing_amount_card_credit',
      'closing_amount_pix', 'closing_amount_other',
      'expected_cash', 'expected_card_debit', 'expected_card_credit', 'expected_pix', 'expected_other',
      'difference_amount', 'difference_cash', 'difference_card_debit', 'difference_card_credit',
      'difference_pix', 'difference_other', 'difference_reason',
      'total_sales', 'total_sales_amount', 'total_refunds', 'total_refunds_amount',
      'total_withdrawals', 'total_withdrawals_amount', 'total_supplies', 'total_supplies_amount',
      'notes', 'created_at', 'updated_at'
    ];
    
    // Remover TODOS os campos que não estão na lista permitida
    Object.keys(cleanData).forEach(key => {
      if (!allowedFields.includes(key)) {
        console.warn(`⚠️ Removendo campo não permitido: ${key} = ${cleanData[key]}`);
        delete cleanData[key];
      }
    });
    
    // Remover campos específicos que podem causar problemas
    delete cleanData.user_email;
    delete cleanData.email;
    delete cleanData.user;
    
    // Garantir que tenant_id é UUID válido
    if (cleanData.tenant_id && typeof cleanData.tenant_id !== 'string') {
      cleanData.tenant_id = String(cleanData.tenant_id);
    }
    
    // Garantir que user_id não está presente se não for UUID válido
    if (cleanData.user_id !== undefined && cleanData.user_id !== null) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof cleanData.user_id !== 'string' || !uuidRegex.test(cleanData.user_id)) {
        console.warn(`⚠️ Removendo user_id inválido: ${cleanData.user_id}`);
        delete cleanData.user_id;
      }
    }

    console.log('📝 Body recebido:', JSON.stringify(body, null, 2));
    console.log('📝 Dados limpos para inserção:', JSON.stringify(cleanData, null, 2));
    
    // Verificação final: garantir que não há campos problemáticos
    const finalData: any = {};
    for (const key of allowedFields) {
      if (key in cleanData && cleanData[key] !== undefined) {
        // Validação especial para campos UUID
        if (key === 'user_id') {
          // ⚠️ CRÍTICO: user_id deve ser NULL se não for UUID válido
          // Não incluir o campo se não for válido (deixa o banco usar NULL)
          if (cleanData[key] !== null && cleanData[key] !== undefined) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (typeof cleanData[key] === 'string' && uuidRegex.test(cleanData[key])) {
              finalData[key] = cleanData[key];
            } else {
              console.error(`❌ Campo ${key} com valor inválido (não é UUID):`, cleanData[key]);
              // NÃO incluir user_id se não for UUID válido - deixa NULL no banco
              // Explicitamente não adicionar ao finalData
            }
          }
          // Se for null, também não incluir (campo opcional)
        } else if (key === 'tenant_id') {
          // tenant_id é obrigatório, validar
          if (cleanData[key] !== null) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (typeof cleanData[key] === 'string' && uuidRegex.test(cleanData[key])) {
              finalData[key] = cleanData[key];
            } else {
              console.error(`❌ Campo ${key} com valor inválido (não é UUID):`, cleanData[key]);
              throw new Error(`tenant_id inválido: ${cleanData[key]}`);
            }
          } else {
            throw new Error('tenant_id é obrigatório');
          }
        } else {
          finalData[key] = cleanData[key];
        }
      }
    }
    
    // ⚠️ GARANTIR que user_id NÃO está presente se não for válido
    // Isso previne que o Supabase tente usar algum valor inválido
    // Se user_id estiver presente, validar rigorosamente
    if ('user_id' in finalData) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (finalData.user_id === null || finalData.user_id === undefined) {
        // NULL é permitido, mas vamos remover para deixar o banco usar o default
        delete finalData.user_id;
      } else if (typeof finalData.user_id !== 'string' || !uuidRegex.test(finalData.user_id)) {
        console.error('❌ Removendo user_id inválido do finalData:', finalData.user_id);
        delete finalData.user_id;
      }
    }
    
    // ⚠️ VERIFICAÇÃO FINAL: Garantir que não há nenhum campo que possa ser interpretado como user_id
    // Remover qualquer campo que contenha email ou valores não-UUID
    Object.keys(finalData).forEach(key => {
      if (key.toLowerCase().includes('user') && key !== 'opened_by' && key !== 'closed_by') {
        const value = finalData[key];
        if (value && typeof value === 'string' && value.includes('@')) {
          console.error(`❌ Removendo campo ${key} que contém email:`, value);
          delete finalData[key];
        }
      }
    });

    console.log('📝 Dados finais para inserção:', JSON.stringify(finalData, null, 2));
    console.log('📝 Campos no finalData:', Object.keys(finalData));
    
    const { data: created, error } = await supabaseAdmin
      .from('cash_sessions')
      .insert(finalData)
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao criar sessão de caixa:", error);
      console.error("❌ Dados enviados:", JSON.stringify(openingData, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao criar sessão de caixa: ${error.message}`,
          details: error.details || null,
          hint: error.hint || null
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json(
      { success: true, data: created }, 
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao criar sessão de caixa:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Erro desconhecido ao criar sessão de caixa',
        details: error instanceof Error ? error.stack : null
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}, false);

export const PATCH = requestMiddleware(async (request, context) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da sessão é obrigatório' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const body: any = await request.json();
    const tenantId = body.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenant_id é obrigatório" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Lista de campos válidos que podem ser atualizados na tabela cash_sessions
    const validFields = [
      'status',
      'closed_by',
      'closed_at',
      'closing_amount_cash',
      'closing_amount_card_debit',
      'closing_amount_card_credit',
      'closing_amount_pix',
      'closing_amount_other',
      'expected_cash',
      'expected_card_debit',
      'expected_card_credit',
      'expected_pix',
      'expected_other',
      'difference_amount',
      'difference_cash',
      'difference_card_debit',
      'difference_card_credit',
      'difference_pix',
      'difference_other',
      'difference_reason',
      'total_sales',
      'total_sales_amount',
      'total_refunds',
      'total_refunds_amount',
      'total_withdrawals',
      'total_withdrawals_amount',
      'total_supplies',
      'total_supplies_amount',
      'notes',
      // user_id pode ser atualizado, mas apenas se for UUID válido
    ];

    // Filtrar apenas campos válidos e remover undefined/null desnecessários
    const updateData: any = {};
    for (const field of validFields) {
      if (field in body && body[field] !== undefined) {
        // Converter null strings para null real
        updateData[field] = body[field] === 'null' || body[field] === '' ? null : body[field];
      }
    }

    // ⚠️ IMPORTANTE: Se user_id estiver no body, validar se é UUID válido
    // Caso contrário, não incluir (evita erro "invalid input syntax for type uuid")
    if (body.user_id !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof body.user_id === 'string' && uuidRegex.test(body.user_id)) {
        updateData.user_id = body.user_id;
      } else if (body.user_id === null) {
        // Permitir null explicitamente
        updateData.user_id = null;
      } else {
        console.warn('⚠️ user_id inválido ignorado no PATCH (não é UUID):', body.user_id);
        // Não incluir user_id se não for UUID válido ou null
      }
    }

    // Garantir que status seja 'closed' se estiver fechando
    if (body.status === 'closed' && !updateData.closed_at) {
      updateData.closed_at = new Date().toISOString();
    }

    console.log('📝 Atualizando sessão de caixa:', {
      id,
      tenantId,
      fields: Object.keys(updateData),
      updateData
    });

    const { data: updated, error } = await supabaseAdmin
      .from('cash_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId) // Garantir que só atualiza do tenant correto
      .select()
      .single();

    if (error) {
      console.error("❌ Erro ao atualizar sessão de caixa:", error);
      console.error("❌ Dados enviados:", JSON.stringify(updateData, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao atualizar sessão de caixa: ${error.message}`,
          details: error.details || null,
          hint: error.hint || null
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Sessão de caixa não encontrada ou não pertence ao tenant informado' 
        },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json(
      { success: true, data: updated },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao atualizar sessão de caixa:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Erro ao atualizar sessão de caixa",
        details: error instanceof Error ? error.stack : null
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}, false);

export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const supabaseAdmin = createSupabaseClient();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da sessão é obrigatório' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { error } = await supabaseAdmin
      .from('cash_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("❌ Erro ao excluir sessão de caixa:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao excluir sessão de caixa: ${error.message}`,
          details: error.details || null
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error("❌ Erro ao excluir sessão de caixa:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "Erro ao excluir sessão de caixa",
        details: error instanceof Error ? error.stack : null
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}, false);


