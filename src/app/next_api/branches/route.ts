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

type BranchRow = {
  id: number;
  tenant_id: string;
  name: string;
  code: string | null;
  is_headquarters: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('branches')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('is_headquarters', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao listar filiais: ' + error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Erro ao listar filiais:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, name, code } = body || {};

    if (!tenant_id || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tenant e nome são obrigatórios' },
        { status: 400 },
      );
    }

    // ✅ Feature gate via SuperAdmin (tenant_feature_flags)
    const { data: flags, error: flagsError } = await supabaseAdmin
      .from('tenant_feature_flags')
      .select('features')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    if (flagsError) {
      console.warn('⚠️ tenant_feature_flags não disponível:', flagsError.message);
    }
    const enabled = flags?.features?.branches === true;
    if (!enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Recurso de filiais não está ativo para este tenant (habilitar no SuperAdmin).',
          errorCode: 'FEATURE_NOT_AVAILABLE',
        },
        { status: 403 },
      );
    }

    const payload: Partial<BranchRow> = {
      tenant_id,
      name: name.trim(),
      code: code?.trim() ? String(code).trim() : null,
      is_headquarters: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('branches')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar filial: ' + error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao criar filial:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    const allowed: Record<string, any> = {};
    if ('name' in body) allowed.name = String(body.name || '').trim();
    if ('code' in body) allowed.code = body.code ? String(body.code).trim() : null;
    if ('is_active' in body) allowed.is_active = Boolean(body.is_active);
    allowed.updated_at = new Date().toISOString();

    // Evitar desativar Matriz via PUT
    const { data: existing } = await supabaseAdmin
      .from('branches')
      .select('id,is_headquarters')
      .eq('id', id)
      .maybeSingle();

    if (existing?.is_headquarters && 'is_active' in allowed && allowed.is_active === false) {
      return NextResponse.json(
        { success: false, error: 'Não é permitido desativar a Matriz' },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.from('branches').update(allowed).eq('id', id);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar filial: ' + error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, id: Number(id) });
  } catch (error) {
    console.error('Erro ao atualizar filial:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('branches')
      .select('id,is_headquarters')
      .eq('id', id)
      .maybeSingle();

    if (existing?.is_headquarters) {
      return NextResponse.json(
        { success: false, error: 'Não é permitido excluir/desativar a Matriz' },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('branches')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao desativar filial: ' + error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, id: Number(id) });
  } catch (error) {
    console.error('Erro ao desativar filial:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  }
}

