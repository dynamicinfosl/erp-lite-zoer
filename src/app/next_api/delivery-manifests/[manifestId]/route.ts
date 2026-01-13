import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  // fallback hardcoded (dev only) - same as delivery-drivers API route
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams, pathname } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    // Extrair manifestId da URL
    const parts = pathname.split('/');
    const manifestId = parts[parts.length - 1];

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, errorMessage: 'tenant_id é obrigatório' },
        { status: 400 }
      );
    }
    if (!manifestId) {
      return NextResponse.json(
        { success: false, errorMessage: 'manifestId é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar o romaneio
    const { data: manifest, error: manifestError } = await supabaseAdmin
      .from('delivery_manifests')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('id', manifestId)
      .single();

    if (manifestError || !manifest) {
      return NextResponse.json(
        { success: false, errorMessage: 'Romaneio não encontrado' },
        { status: 404 }
      );
    }

    // Buscar o entregador
    let driver = null;
    if (manifest.driver_id) {
      // Buscar entregador - converter ID para número
      const { data: driverData } = await supabaseAdmin
        .from('delivery_drivers')
        .select('*')
        .eq('id', Number(manifest.driver_id))
        .eq('tenant_id', tenant_id)
        .maybeSingle();
      
      if (driverData) {
        driver = driverData;
      } else {
        // Fallback: buscar sem tenant_id
        const { data: fallback } = await supabaseAdmin
          .from('delivery_drivers')
          .select('*')
          .eq('id', Number(manifest.driver_id))
          .maybeSingle();
        
        if (fallback) {
          driver = fallback;
        }
      }
    }

    // Buscar as entregas do romaneio
    const { data: deliveries } = await supabaseAdmin
      .from('deliveries')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('manifest_id', manifestId)
      .order('created_at', { ascending: true });

    const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
    const saleIds = safeDeliveries.map((d: any) => d.sale_id).filter(Boolean);

    let sales: any[] = [];
    let sale_items: any[] = [];

    if (saleIds.length > 0) {
      const salesRes = await supabaseAdmin
        .from('sales')
        .select('*')
        .in('id', saleIds);
      if (!salesRes.error && Array.isArray(salesRes.data)) sales = salesRes.data;

      const itemsRes = await supabaseAdmin
        .from('sale_items')
        .select('*')
        .in('sale_id', saleIds);
      if (!itemsRes.error && Array.isArray(itemsRes.data)) sale_items = itemsRes.data;
    }

    return NextResponse.json({
      success: true,
      data: {
        manifest,
        driver: driver || null,
        deliveries: safeDeliveries,
        sales,
        sale_items,
      }
    });
  } catch (e) {
    console.error('Erro ao buscar romaneio detalhado:', e);
    return NextResponse.json(
      { success: false, errorMessage: 'Erro ao buscar romaneio' },
      { status: 500 }
    );
  }
}
