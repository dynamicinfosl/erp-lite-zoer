import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

type TransferRow = {
  id: number;
  tenant_id: string;
  from_branch_id: number;
  to_branch_id: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  requested_by?: string | null;
  sent_by?: string | null;
  received_by?: string | null;
  notes?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type TransferItemRow = {
  id: number;
  tenant_id: string;
  transfer_id: number;
  product_id: number;
  quantity: number;
  created_at?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const branch_id = searchParams.get('branch_id'); // opcional: filtra transferências relacionadas
    const branch_scope = searchParams.get('branch_scope'); // 'all' | 'branch'

    if (!tenant_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabaseAdmin
      .from('stock_transfers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (branch_scope !== 'all' && branch_id) {
      const bid = Number(branch_id);
      if (Number.isFinite(bid)) {
        // relacionadas = origem ou destino
        query = query.or(`from_branch_id.eq.${bid},to_branch_id.eq.${bid}`);
      }
    }

    const { data: transfers, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao listar transferências: ' + error.message },
        { status: 400 },
      );
    }

    const rows = (transfers || []) as TransferRow[];
    const ids = rows.map((t) => t.id);

    let itemsByTransferId: Record<number, TransferItemRow[]> = {};
    if (ids.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('stock_transfer_items')
        .select('*')
        .eq('tenant_id', tenant_id)
        .in('transfer_id', ids);

      if (!itemsError && items) {
        for (const it of items as any[]) {
          const tid = Number(it.transfer_id);
          if (!Number.isFinite(tid)) continue;
          if (!itemsByTransferId[tid]) itemsByTransferId[tid] = [];
          itemsByTransferId[tid].push(it as TransferItemRow);
        }
      }
    }

    const enriched = rows.map((t) => ({
      ...t,
      items: itemsByTransferId[t.id] || [],
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, from_branch_id, to_branch_id, user_id, notes, items } = body || {};

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    const fromId = Number(from_branch_id);
    const toId = Number(to_branch_id);
    if (!Number.isFinite(fromId) || !Number.isFinite(toId) || fromId <= 0 || toId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Filial origem e destino são obrigatórias' },
        { status: 400 },
      );
    }
    if (fromId === toId) {
      return NextResponse.json(
        { success: false, error: 'Origem e destino não podem ser a mesma filial' },
        { status: 400 },
      );
    }

    const parsedItems: Array<{ product_id: number; quantity: number }> = Array.isArray(items)
      ? items
          .map((it: any) => ({
            product_id: Number(it.product_id),
            quantity: Number(it.quantity),
          }))
          .filter(
            (it: any) =>
              Number.isFinite(it.product_id) &&
              it.product_id > 0 &&
              Number.isFinite(it.quantity) &&
              it.quantity > 0,
          )
      : [];

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Adicione ao menos 1 item (produto/quantidade)' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const transferPayload: Partial<TransferRow> = {
      tenant_id,
      from_branch_id: fromId,
      to_branch_id: toId,
      status: 'draft',
      requested_by: user_id || null,
      notes: notes || null,
      created_at: now,
      updated_at: now,
    };

    const { data: transfer, error: transferError } = await supabaseAdmin
      .from('stock_transfers')
      .insert(transferPayload)
      .select('*')
      .single();

    if (transferError || !transfer) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar transferência: ' + transferError?.message },
        { status: 400 },
      );
    }

    const itemsPayload = parsedItems.map((it) => ({
      tenant_id,
      transfer_id: transfer.id,
      product_id: it.product_id,
      quantity: it.quantity,
      created_at: now,
    }));

    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from('stock_transfer_items')
      .insert(itemsPayload)
      .select('*');

    if (itemsError) {
      // rollback simples: desativa/exclui transferência criada
      await supabaseAdmin.from('stock_transfers').delete().eq('id', transfer.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar itens da transferência: ' + itemsError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...(transfer as any), items: insertedItems || [] },
    });
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

