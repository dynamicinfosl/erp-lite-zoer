import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createStripePortalSession, getOrCreateStripeCustomer } from '@/lib/stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id } = body as { tenant_id: string };

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    console.log(`🌀 [STRIPE PORTAL] Solicitando portal do cliente para tenant: ${tenant_id}`);

    // 1. Buscar tenant no Supabase para verificar stripe_customer_id
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, email, settings')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error('❌ Tenant não encontrado:', tenantError);
      return NextResponse.json({ error: 'Tenant (empresa) não encontrado' }, { status: 404 });
    }

    let stripeCustomerId = tenant.settings?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log('⚠️ Tenant não possui Stripe Customer ID cadastrado. Criando um no Stripe...');
      
      const email = tenant.email || `contato+${tenant.id}@jugasistemas.com.br`;
      const name = tenant.name || 'Cliente JUGA';
      
      try {
        stripeCustomerId = await getOrCreateStripeCustomer(email, name, tenant_id);
        
        // Atualizar settings no banco de dados
        const updatedSettings = {
          ...(tenant.settings || {}),
          stripe_customer_id: stripeCustomerId
        };
        
        const { error: updateError } = await supabaseAdmin
          .from('tenants')
          .update({ settings: updatedSettings })
          .eq('id', tenant_id);
          
        if (updateError) {
          console.error('❌ Erro ao atualizar stripe_customer_id no tenant:', updateError);
        } else {
          console.log('✅ stripe_customer_id salvo com sucesso no tenant!');
        }
      } catch (err: any) {
        console.error('❌ Falha ao criar customer no Stripe:', err);
        return NextResponse.json({ error: 'Sua conta não possui faturamento ativo no Stripe. Escolha um plano primeiro.' }, { status: 400 });
      }
    }

    // 2. Criar a sessão do portal de faturamento
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/assinatura`;

    const session = await createStripePortalSession(stripeCustomerId, returnUrl);

    console.log('✅ Sessão do Stripe Portal criada com sucesso:', session.url);

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('❌ Erro no endpoint Stripe Portal:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
