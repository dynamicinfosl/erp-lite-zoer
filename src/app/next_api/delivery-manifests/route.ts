import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type ManifestStatus = 'aberta' | 'finalizada' | 'cancelada';

function genManifestNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ENT-${y}${m}${day}-${rand}`;
}

// GET - listar romaneios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') as ManifestStatus | null;
    const driver_id = searchParams.get('driver_id');

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('delivery_manifests')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (driver_id) query = query.eq('driver_id', driver_id);

    const { data: rows, error } = await query;

    if (error) {
      console.error('Erro ao buscar romaneios:', error);
      return NextResponse.json(
        { success: false, errorMessage: 'Erro ao buscar romaneios' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: rows || [] });
  } catch (e) {
    console.error('Erro ao buscar romaneios:', e);
    return NextResponse.json(
      { success: false, errorMessage: 'Erro ao buscar romaneios' },
      { status: 500 }
    );
  }
}

// POST - criar romaneio (1 aberto por entregador)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant_id = body.tenant_id;
    const driver_id = body.driver_id;
    const delivery_ids: Array<number> | undefined = Array.isArray(body.delivery_ids) ? body.delivery_ids : undefined;

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }
    if (!driver_id) {
      return NextResponse.json(
        { success: false, errorMessage: 'driver_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe romaneio aberto para esse driver (regra de negócio)
    const { data: openExisting } = await supabaseAdmin
      .from('delivery_manifests')
      .select('id, status')
      .eq('tenant_id', tenant_id)
      .eq('driver_id', driver_id)
      .eq('status', 'aberta')
      .limit(1);

    if (Array.isArray(openExisting) && openExisting.length > 0) {
      return NextResponse.json(
        { success: false, errorMessage: 'Já existe um romaneio aberto para este entregador. Finalize-o antes de criar um novo.' },
        { status: 400 }
      );
    }

    const manifest_number = genManifestNumber();

    const { data: created, error: createError } = await supabaseAdmin
      .from('delivery_manifests')
      .insert([{
        tenant_id,
        driver_id,
        status: 'aberta',
        manifest_number,
        notes: body.notes || null,
        created_by: body.created_by || null,
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (createError || !created) {
      console.error('❌ Erro ao criar romaneio:', createError);
      console.error('❌ Detalhes do erro:', {
        message: createError?.message,
        details: createError?.details,
        hint: createError?.hint,
        code: createError?.code
      });
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao criar romaneio';
      if (createError?.message?.includes('row-level security') || createError?.code === '42501') {
        errorMessage = 'Erro de permissão RLS. Execute o script SQL: scripts/fix-delivery-manifests-rls.sql';
      } else if (createError?.message) {
        errorMessage = `Erro ao criar romaneio: ${createError.message}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          errorMessage,
          error: createError?.message,
          details: process.env.NODE_ENV === 'development' ? createError?.details : undefined
        },
        { status: 500 }
      );
    }

    // Vincular entregas pendentes ao romaneio e marcar como em_rota
    let deliveriesQuery = supabaseAdmin
      .from('deliveries')
      .update({ manifest_id: created.id, status: 'em_rota', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenant_id)
      .eq('driver_id', driver_id)
      .eq('status', 'aguardando')
      .is('manifest_id', null);

    if (delivery_ids && delivery_ids.length > 0) {
      deliveriesQuery = deliveriesQuery.in('id', delivery_ids);
    }

    const { error: linkError } = await deliveriesQuery;
    if (linkError) {
      console.error('Erro ao vincular entregas ao romaneio:', linkError);
      // Não falhar totalmente: retorna o romaneio criado.
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e) {
    console.error('Erro ao criar romaneio:', e);
    return NextResponse.json(
      { success: false, errorMessage: 'Erro ao criar romaneio' },
      { status: 500 }
    );
  }
}

// PUT - finalizar romaneio
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: 'id é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verificar se o romaneio existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('delivery_manifests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, errorMessage: 'Romaneio não encontrado' },
        { status: 404 }
      );
    }

    const nextStatus: ManifestStatus | undefined = body.status;
    if (nextStatus && !['aberta', 'finalizada', 'cancelada'].includes(nextStatus)) {
      return NextResponse.json(
        { success: false, errorMessage: 'Status inválido' },
        { status: 400 }
      );
    }

    const update: any = {
      updated_at: new Date().toISOString(),
    };
    if (body.notes !== undefined) update.notes = body.notes;
    if (nextStatus) update.status = nextStatus;
    if (nextStatus === 'finalizada') update.finalized_at = new Date().toISOString();
    if (body.driver_id !== undefined) update.driver_id = body.driver_id;

    const { data: updated, error } = await supabaseAdmin
      .from('delivery_manifests')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar romaneio:', error);
      return NextResponse.json(
        { success: false, errorMessage: 'Erro ao atualizar romaneio' },
        { status: 500 }
      );
    }

    // Se estiver trocando entregador ou adicionando/removendo entregas
    if (body.driver_id || body.delivery_ids !== undefined) {
      // Se trocou entregador, atualizar entregas vinculadas
      if (body.driver_id && body.driver_id !== existing.driver_id) {
        const { error: updateDeliveriesError } = await supabaseAdmin
          .from('deliveries')
          .update({ 
            driver_id: body.driver_id,
            updated_at: new Date().toISOString()
          })
          .eq('manifest_id', id);
        
        if (updateDeliveriesError) {
          console.error('Erro ao atualizar entregas:', updateDeliveriesError);
        }
      }

      // Se forneceu lista de delivery_ids, atualizar entregas vinculadas
      if (body.delivery_ids !== undefined && Array.isArray(body.delivery_ids)) {
        // Primeiro, remover todas as entregas deste romaneio
        await supabaseAdmin
          .from('deliveries')
          .update({ 
            manifest_id: null,
            status: 'aguardando',
            updated_at: new Date().toISOString()
          })
          .eq('manifest_id', id);

        // Depois, vincular apenas as entregas especificadas
        if (body.delivery_ids.length > 0) {
          const { error: linkError } = await supabaseAdmin
            .from('deliveries')
            .update({ 
              manifest_id: id,
              driver_id: body.driver_id || existing.driver_id,
              status: 'em_rota',
              updated_at: new Date().toISOString()
            })
            .in('id', body.delivery_ids)
            .eq('tenant_id', existing.tenant_id);
          
          if (linkError) {
            console.error('Erro ao vincular entregas:', linkError);
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error('Erro ao atualizar romaneio:', e);
    return NextResponse.json(
      { success: false, errorMessage: 'Erro ao atualizar romaneio' },
      { status: 500 }
    );
  }
}

// DELETE - deletar romaneio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteDeliveries = searchParams.get('delete_deliveries') === 'true';
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: 'id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o romaneio existe
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('delivery_manifests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, errorMessage: 'Romaneio não encontrado' },
        { status: 404 }
      );
    }

    // Buscar entregas vinculadas ao romaneio
    const { data: linkedDeliveries } = await supabaseAdmin
      .from('deliveries')
      .select('id, status')
      .eq('manifest_id', id);

    const deliveries = Array.isArray(linkedDeliveries) ? linkedDeliveries : [];

    // Se deve excluir entregas também
    if (deleteDeliveries && deliveries.length > 0) {
      const deliveryIds = deliveries.map((d: any) => d.id);
      const { error: deleteDeliveriesError } = await supabaseAdmin
        .from('deliveries')
        .delete()
        .in('id', deliveryIds);

      if (deleteDeliveriesError) {
        console.error('Erro ao deletar entregas:', deleteDeliveriesError);
        return NextResponse.json(
          { success: false, errorMessage: 'Erro ao deletar entregas vinculadas' },
          { status: 500 }
        );
      }
    } else {
      // Apenas desvincular entregas do romaneio (voltar para aguardando)
      if (deliveries.length > 0) {
        const { error: unlinkError } = await supabaseAdmin
          .from('deliveries')
          .update({ 
            manifest_id: null,
            status: 'aguardando',
            updated_at: new Date().toISOString()
          })
          .eq('manifest_id', id);

        if (unlinkError) {
          console.error('Erro ao desvincular entregas:', unlinkError);
        }
      }
    }

    // Deletar o romaneio
    const { error } = await supabaseAdmin
      .from('delivery_manifests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar romaneio:', error);
      return NextResponse.json(
        { success: false, errorMessage: 'Erro ao deletar romaneio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: deleteDeliveries 
        ? `Romaneio e ${deliveries.length} entrega(s) deletados com sucesso`
        : `Romaneio deletado. ${deliveries.length} entrega(s) voltaram para aguardando`
    });
  } catch (e) {
    console.error('Erro ao deletar romaneio:', e);
    return NextResponse.json(
      { success: false, errorMessage: 'Erro ao deletar romaneio' },
      { status: 500 }
    );
  }
}
