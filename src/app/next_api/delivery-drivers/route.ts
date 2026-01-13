import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// GET - buscar entregadores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: "tenant_id é obrigatório" },
        { status: 400 }
      );
    }

    const { data: drivers, error } = await supabaseAdmin
      .from('delivery_drivers')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar entregadores:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao buscar entregadores" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: drivers || [] });
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao buscar entregadores" },
      { status: 500 }
    );
  }
}

// POST - criar entregador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: "tenant_id é obrigatório" },
        { status: 400 }
      );
    }
    
    if (!body.name || !body.phone || !body.vehicle_type) {
      return NextResponse.json(
        { success: false, errorMessage: "Nome, telefone e tipo de veículo são obrigatórios" },
        { status: 400 }
      );
    }
    
    const driverData = {
      tenant_id: body.tenant_id,
      name: body.name,
      phone: body.phone,
      vehicle_type: body.vehicle_type,
      vehicle_plate: body.vehicle_plate || null,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: driver, error } = await supabaseAdmin
      .from('delivery_drivers')
      .insert([driverData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar entregador:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao criar entregador" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: driver }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entregador:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao criar entregador" },
      { status: 500 }
    );
  }
}

// PUT - atualizar entregador
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: "ID do entregador é obrigatório" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updateData = {
      name: body.name,
      phone: body.phone,
      vehicle_type: body.vehicle_type,
      vehicle_plate: body.vehicle_plate || null,
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: driver, error } = await supabaseAdmin
      .from('delivery_drivers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar entregador:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao atualizar entregador" },
        { status: 500 }
      );
    }

    if (!driver) {
      return NextResponse.json(
        { success: false, errorMessage: "Entregador não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error('Erro ao atualizar entregador:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao atualizar entregador" },
      { status: 500 }
    );
  }
}

// DELETE - excluir entregador
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, errorMessage: "ID do entregador é obrigatório" },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    const { data: driver, error } = await supabaseAdmin
      .from('delivery_drivers')
      .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao excluir entregador:', error);
      return NextResponse.json(
        { success: false, errorMessage: "Erro ao excluir entregador" },
        { status: 500 }
      );
    }

    if (!driver) {
      return NextResponse.json(
        { success: false, errorMessage: "Entregador não encontrado" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Erro ao excluir entregador:', error);
    return NextResponse.json(
      { success: false, errorMessage: "Erro ao excluir entregador" },
      { status: 500 }
    );
  }
}
