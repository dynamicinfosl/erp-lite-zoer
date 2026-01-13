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

async function getTransfer(tenant_id: string, transferId: number) {
  const { data, error } = await supabaseAdmin
    .from('stock_transfers')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('id', transferId)
    .maybeSingle();
  return { data, error };
}

async function getTransferItems(tenant_id: string, transferId: number) {
  const { data, error } = await supabaseAdmin
    .from('stock_transfer_items')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('transfer_id', transferId);
  return { data: data || [], error };
}

async function getBranchName(tenant_id: string, branchId: number) {
  const { data } = await supabaseAdmin
    .from('branches')
    .select('id,name')
    .eq('tenant_id', tenant_id)
    .eq('id', branchId)
    .maybeSingle();
  return data?.name || `Filial #${branchId}`;
}

async function applyStockDelta(params: {
  tenant_id: string;
  branch_id: number;
  product_id: number;
  delta: number;
}) {
  const { tenant_id, branch_id, product_id, delta } = params;
  const { data: row, error } = await supabaseAdmin
    .from('product_stocks')
    .select('id, quantity')
    .eq('tenant_id', tenant_id)
    .eq('branch_id', branch_id)
    .eq('product_id', product_id)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message };

  const current = Number(row?.quantity || 0);
  const next = current + delta;
  if (next < 0) {
    return { ok: false as const, error: 'Estoque insuficiente para enviar' };
  }

  const now = new Date().toISOString();
  const payload: any = {
    tenant_id,
    branch_id,
    product_id,
    quantity: next,
    updated_at: now,
  };
  if (!row?.id) payload.created_at = now;

  const { error: upsertError } = await supabaseAdmin
    .from('product_stocks')
    .upsert(payload, { onConflict: 'tenant_id,branch_id,product_id' });

  if (upsertError) return { ok: false as const, error: upsertError.message };

  return { ok: true as const, next };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transferId: string }> },
) {
  try {
    const { transferId } = await params;
    const id = Number(transferId);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { tenant_id, user_id, action } = body || {};

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }
    if (!action || !['send', 'receive', 'cancel'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action deve ser send | receive | cancel' },
        { status: 400 },
      );
    }

    const { data: transfer, error: transferError } = await getTransfer(tenant_id, id);
    if (transferError || !transfer) {
      return NextResponse.json(
        { success: false, error: 'Transferência não encontrada' },
        { status: 404 },
      );
    }

    const { data: items, error: itemsError } = await getTransferItems(tenant_id, id);
    if (itemsError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar itens: ' + itemsError.message },
        { status: 400 },
      );
    }

    if ((items || []).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transferência sem itens' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // CANCEL: apenas draft por enquanto (simples e seguro)
    if (action === 'cancel') {
      if (transfer.status !== 'draft') {
        return NextResponse.json(
          { success: false, error: 'Só é possível cancelar quando estiver em rascunho' },
          { status: 400 },
        );
      }
      const { error } = await supabaseAdmin
        .from('stock_transfers')
        .update({ status: 'cancelled', updated_at: now })
        .eq('tenant_id', tenant_id)
        .eq('id', id);
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Erro ao cancelar: ' + error.message },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, id, status: 'cancelled' });
    }

    // SEND: baixa do estoque da ORIGEM e marca como sent
    if (action === 'send') {
      if (transfer.status !== 'draft') {
        return NextResponse.json(
          { success: false, error: 'Só é possível enviar quando estiver em rascunho' },
          { status: 400 },
        );
      }

      const fromName = await getBranchName(tenant_id, Number(transfer.from_branch_id));
      const toName = await getBranchName(tenant_id, Number(transfer.to_branch_id));

      // Validar + aplicar deltas (saida) na origem
      for (const it of items as any[]) {
        const productId = Number(it.product_id);
        const qty = Number(it.quantity);
        if (!Number.isFinite(productId) || !Number.isFinite(qty) || qty <= 0) continue;

        const result = await applyStockDelta({
          tenant_id,
          branch_id: Number(transfer.from_branch_id),
          product_id: productId,
          delta: -qty,
        });
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: `Estoque insuficiente na origem (${fromName})` },
            { status: 400 },
          );
        }
      }

      // Registrar movimentações (saida) na origem
      const movementPayload = (items as any[]).map((it) => ({
        tenant_id,
        branch_id: Number(transfer.from_branch_id),
        product_id: it.product_id,
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        movement_type: 'saida',
        quantity: Number(it.quantity),
        notes: `Transferência #${id} enviada (${fromName} → ${toName})`,
        reference_type: 'stock_transfer',
        reference_id: id,
        created_at: now,
      }));
      await supabaseAdmin.from('stock_movements').insert(movementPayload);

      const { error: updateError } = await supabaseAdmin
        .from('stock_transfers')
        .update({
          status: 'sent',
          sent_at: now,
          sent_by: user_id || null,
          updated_at: now,
        })
        .eq('tenant_id', tenant_id)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Erro ao marcar como enviado: ' + updateError.message },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, id, status: 'sent' });
    }

    // RECEIVE: dá entrada no estoque do DESTINO e marca como received
    if (action === 'receive') {
      if (transfer.status !== 'sent') {
        return NextResponse.json(
          { success: false, error: 'Só é possível receber quando estiver enviado' },
          { status: 400 },
        );
      }

      const fromName = await getBranchName(tenant_id, Number(transfer.from_branch_id));
      const toName = await getBranchName(tenant_id, Number(transfer.to_branch_id));

      // Aplicar deltas (entrada) no destino
      for (const it of items as any[]) {
        const productId = Number(it.product_id);
        const qty = Number(it.quantity);
        if (!Number.isFinite(productId) || !Number.isFinite(qty) || qty <= 0) continue;

        const result = await applyStockDelta({
          tenant_id,
          branch_id: Number(transfer.to_branch_id),
          product_id: productId,
          delta: qty,
        });
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: 'Falha ao aplicar entrada no destino' },
            { status: 400 },
          );
        }
      }

      // Registrar movimentações (entrada) no destino
      const movementPayload = (items as any[]).map((it) => ({
        tenant_id,
        branch_id: Number(transfer.to_branch_id),
        product_id: it.product_id,
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        movement_type: 'entrada',
        quantity: Number(it.quantity),
        notes: `Transferência #${id} recebida (${fromName} → ${toName})`,
        reference_type: 'stock_transfer',
        reference_id: id,
        created_at: now,
      }));
      await supabaseAdmin.from('stock_movements').insert(movementPayload);

      const { error: updateError } = await supabaseAdmin
        .from('stock_transfers')
        .update({
          status: 'received',
          received_at: now,
          received_by: user_id || null,
          updated_at: now,
        })
        .eq('tenant_id', tenant_id)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Erro ao marcar como recebido: ' + updateError.message },
          { status: 400 },
        );
      }

      return NextResponse.json({ success: true, id, status: 'received' });
    }

    return NextResponse.json({ success: false, error: 'Ação não suportada' }, { status: 400 });
  } catch (error) {
    console.error('Erro em ação da transferência:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

