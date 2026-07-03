import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStripeWebhookEvent } from '@/lib/stripe';
import { issueJugaSubscriptionInvoice } from '@/lib/fiscal/juga-nfe-issuer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://project1-n8n-editor.y7f9fe.easypanel.host/webhook/juga-boas-vindas';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const eventId = rawBody.id;

    if (!eventId) {
      console.warn('⚠️ Webhook recebido sem ID de evento');
      return NextResponse.json({ error: 'Falta o ID do evento' }, { status: 400 });
    }

    // 1. Verificar o evento diretamente na API do Stripe (Anti-Spoofing)
    const event = await verifyStripeWebhookEvent(eventId);
    if (!event) {
      console.error('❌ Falha na verificação de segurança do evento Stripe:', eventId);
      return NextResponse.json({ error: 'Evento do Stripe inválido ou não encontrado' }, { status: 400 });
    }

    console.log(`🔔 [STRIPE WEBHOOK] Evento verificado recebido: ${event.type} (ID: ${event.id})`);

    // 2. Processar tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata?.tenant_id;
        const planId = session.metadata?.plan_id;
        const billingPeriod = session.metadata?.billing_period || 'monthly';
        const stripeSubscriptionId = session.subscription;
        const amountTotal = (session.amount_total || 0) / 100; // converter de centavos

        if (!tenantId || !planId) {
          console.error('❌ Metadata incompleto na sessão de checkout:', session.metadata);
          return NextResponse.json({ error: 'Metadata incompleto na sessão de checkout' }, { status: 400 });
        }

        console.log(`✅ [STRIPE WEBHOOK] Checkout concluído para tenant ${tenantId}. Plano: ${planId}, Valor: R$ ${amountTotal}`);

        // Atualizar assinatura e faturamento no banco
        await handlePaymentSuccess({
          tenantId,
          planId,
          stripeSubscriptionId,
          amount: amountTotal,
          billingPeriod,
          gatewayPaymentId: session.id,
        });

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Ignorar se não for de uma assinatura
        if (!invoice.subscription) break;

        // Se for o pagamento inicial de um checkout concluído, o checkout.session.completed já lida com ele.
        // Mas se for uma renovação recorrente ou faturamento direto, atualizamos a assinatura aqui.
        if (invoice.billing_reason === 'subscription_cycle') {
          console.log(`🔄 [STRIPE WEBHOOK] Pagamento de renovação recebido para subscription: ${invoice.subscription}`);
          
          const stripeSubscriptionId = invoice.subscription;
          const amountPaid = (invoice.amount_paid || 0) / 100;

          // Buscar tenant pelo stripe_customer_id cadastrado nas configurações
          const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('id, name, email, phone')
            .eq('settings->stripe_customer_id', invoice.customer)
            .maybeSingle();

          if (tenantError || !tenant) {
            console.error(`❌ Tenant não encontrado para Stripe Customer ID: ${invoice.customer}`);
            break;
          }

          // Buscar plano ativo na assinatura do banco
          const { data: sub, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_id')
            .eq('tenant_id', tenant.id)
            .maybeSingle();

          if (subError || !sub) {
            console.error(`❌ Assinatura não encontrada no banco para tenant: ${tenant.id}`);
            break;
          }

          await handlePaymentSuccess({
            tenantId: tenant.id,
            planId: sub.plan_id,
            stripeSubscriptionId,
            amount: amountPaid,
            billingPeriod: 'monthly', // Padrão de ciclo
            gatewayPaymentId: invoice.id,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log(`🚫 [STRIPE WEBHOOK] Assinatura cancelada no Stripe: ${subscription.id}`);

        // Desativar assinatura no banco de dados
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('tenant_id', subscription.metadata?.tenant_id);

        if (updateError) {
          console.error('❌ Falha ao desativar assinatura após cancelamento do Stripe:', updateError);
        } else {
          console.log(`✅ Assinatura do tenant ${subscription.metadata?.tenant_id} desativada com sucesso.`);
        }
        break;
      }

      default:
        console.log(`ℹ️ [STRIPE WEBHOOK] Ignorando tipo de evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Erro crítico no Stripe Webhook:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}

// Auxiliar para atualizar banco de dados, emitir NFS-e e disparar n8n
async function handlePaymentSuccess(data: {
  tenantId: string;
  planId: string;
  stripeSubscriptionId: string;
  amount: number;
  billingPeriod: 'monthly' | 'yearly';
  gatewayPaymentId: string;
}) {
  const currentStart = new Date();
  const currentEnd = new Date();
  if (data.billingPeriod === 'yearly') {
    currentEnd.setFullYear(currentEnd.getFullYear() + 1);
  } else {
    currentEnd.setMonth(currentEnd.getMonth() + 1);
  }

  // 1. Atualizar ou criar registro em subscriptions
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      tenant_id: data.tenantId,
      plan_id: data.planId,
      status: 'active',
      current_period_start: currentStart.toISOString(),
      current_period_end: currentEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' })
    .select()
    .single();

  if (subError || !subscription) {
    console.error('❌ Erro ao atualizar subscriptions:', subError);
    throw new Error('Falha ao atualizar assinatura no banco');
  }

  // 2. Registrar pagamento em payment_records
  const { data: paymentRecord, error: payError } = await supabaseAdmin
    .from('payment_records')
    .insert({
      tenant_id: data.tenantId,
      subscription_id: subscription.id,
      amount: data.amount,
      currency: 'BRL',
      payment_method: 'credit_card',
      payment_date: new Date().toISOString(),
      reference_period_start: currentStart.toISOString(),
      reference_period_end: currentEnd.toISOString(),
      status: 'confirmed',
      gateway: 'stripe',
      gateway_payment_id: data.gatewayPaymentId,
      notes: `Assinatura de plano via Stripe Checkout (${data.billingPeriod})`,
    })
    .select()
    .single();

  if (payError || !paymentRecord) {
    console.error('❌ Erro ao registrar pagamento em payment_records:', payError);
    throw new Error('Falha ao registrar pagamento no banco');
  }

  console.log('✅ Assinatura e pagamento salvos no banco. ID Pagamento:', paymentRecord.id);

  // 3. Buscar dados de usuário para n8n e FocusNFe
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', data.tenantId)
    .maybeSingle();

  const { data: plan, error: planError } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', data.planId)
    .maybeSingle();

  if (tenant && plan) {
    const planName = plan.name || 'JUGA';

    // 4. Emitir nota fiscal automática via FocusNFe
    console.log('⚡ Disparando emissão de NFS-e FocusNFe...');
    const nfeResult = await issueJugaSubscriptionInvoice({
      tenantId: data.tenantId,
      amount: data.amount,
      paymentRecordId: paymentRecord.id,
      planName,
    });
    
    if (nfeResult.success) {
      console.log('✅ NFS-e emitida com sucesso via webhook do Stripe');
    } else {
      console.warn('⚠️ Falha na emissão automática da NFS-e:', nfeResult.error);
    }

    // 5. Enviar notificação para o n8n
    console.log('⚡ Disparando webhook para o n8n...');
    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment',
          tenant_id: data.tenantId,
          user_name: tenant.name || 'Cliente JUGA',
          user_email: tenant.email || 'cliente@jugasistemas.com.br',
          company_name: tenant.razao_social || tenant.name,
          amount: data.amount.toFixed(2),
          phone: tenant.phone || '',
          plan_name: planName,
          invoice_number: nfeResult.success ? nfeResult.data?.numero : null,
          receipt_url: nfeResult.success ? nfeResult.data?.caminho_pdf_nota_fiscal : null,
        }),
      });

      if (!n8nResponse.ok) {
        console.warn('⚠️ n8n webhook retornou erro:', n8nResponse.statusText);
      } else {
        console.log('✅ Notificação enviada ao n8n com sucesso');
      }
    } catch (n8nErr) {
      console.error('⚠️ Erro ao disparar webhook para n8n:', n8nErr);
    }
  }
}
