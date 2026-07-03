import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateStripeCustomer, createStripeCheckoutSession, getStripePriceId } from '@/lib/stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, plan_slug, plan_id, billing_period = 'monthly' } = body as {
      tenant_id: string;
      plan_slug: string;
      plan_id: string;
      billing_period: 'monthly' | 'yearly';
    };

    if (!tenant_id || !plan_slug || !plan_id) {
      return NextResponse.json({ error: 'tenant_id, plan_slug e plan_id são obrigatórios' }, { status: 400 });
    }

    console.log(`💳 [STRIPE CHECKOUT] Iniciando checkout para tenant ${tenant_id}, plano ${plan_slug} (${billing_period})`);

    // 1. Buscar tenant no Supabase para pegar nome/email e verificar se já possui stripe_customer_id
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error('❌ Tenant não encontrado:', tenantError);
      return NextResponse.json({ error: 'Tenant (empresa) não encontrado' }, { status: 404 });
    }

    const email = tenant.email || `financeiro@${tenant.slug || 'juga'}.com.br`;
    const name = tenant.name || tenant.razao_social || 'JUGA Cliente';
    
    let stripeCustomerId = tenant.settings?.stripe_customer_id;

    // 2. Se não possuir stripe_customer_id, criar no Stripe e salvar no tenant.settings
    if (!stripeCustomerId) {
      console.log('🔄 Tenant sem Stripe Customer ID. Criando no Stripe...');
      stripeCustomerId = await getOrCreateStripeCustomer(email, name, tenant_id);
      
      const newSettings = {
        ...(tenant.settings || {}),
        stripe_customer_id: stripeCustomerId,
      };

      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({ settings: newSettings })
        .eq('id', tenant_id);

      if (updateError) {
        console.error('⚠️ Falha ao salvar stripe_customer_id no tenant:', updateError);
        // Continuar mesmo se falhar o salvamento temporariamente, mas idealmente salvar
      } else {
        console.log('✅ stripe_customer_id salvo com sucesso no tenant settings:', stripeCustomerId);
      }
    } else {
      console.log('✅ stripe_customer_id recuperado do tenant settings:', stripeCustomerId);
    }

    // 3. Obter o Price ID correspondente ao plano e intervalo
    const priceId = getStripePriceId(plan_slug, billing_period);
    console.log(`🏷️ Price ID mapeado: ${priceId}`);

    // 4. Criar a sessão de checkout
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/pagamento-sucesso?session_id={CHECKOUT_SESSION_ID}&plan=${plan_id}&tenant=${tenant_id}`;
    const cancelUrl = `${appUrl}/assinatura`;

    const session = await createStripeCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      tenantId: tenant_id,
      planId: plan_id,
      billingPeriod: billing_period,
      successUrl,
      cancelUrl,
    });

    console.log('✅ Sessão de Checkout criada com sucesso:', session.id);

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('❌ Erro no endpoint Stripe Checkout:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
