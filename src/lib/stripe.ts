import { Buffer } from 'buffer';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';

// Helper para chamadas REST para a API do Stripe
async function stripeRequest(path: string, options: RequestInit = {}) {
  const url = `https://api.stripe.com/v1${path}`;
  const authHeader = `Basic ${Buffer.from(`${STRIPE_SECRET_KEY}:`).toString('base64')}`;

  const defaultHeaders = {
    'Authorization': authHeader,
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    console.error(`❌ Erro no Stripe API (${path}):`, json);
    throw new Error(json.error?.message || 'Erro na chamada com o Stripe');
  }

  return json;
}

// Mapeamento dos Price IDs por plano e intervalo
export function getStripePriceId(planSlug: string, interval: 'monthly' | 'yearly'): string {
  const slug = planSlug.toLowerCase().trim();

  if (slug === 'basic' || slug === 'basico') {
    return interval === 'yearly'
      ? process.env.STRIPE_PRICE_BASIC_YEARLY || 'price_mock_basic_yearly'
      : process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_mock_basic_monthly';
  }

  if (slug === 'pro' || slug === 'profissional' || slug === 'professional') {
    return interval === 'yearly'
      ? process.env.STRIPE_PRICE_PRO_YEARLY || 'price_mock_pro_yearly'
      : process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_mock_pro_monthly';
  }

  if (slug === 'enterprise' || slug === 'empresarial') {
    return interval === 'yearly'
      ? process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_mock_enterprise_yearly'
      : process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_mock_enterprise_monthly';
  }

  throw new Error(`Plano inválido para faturamento no Stripe: ${planSlug}`);
}

/**
 * Cria ou recupera um cliente no Stripe
 */
export async function getOrCreateStripeCustomer(email: string, name: string, tenantId: string): Promise<string> {
  try {
    // 1. Procurar cliente por email no Stripe
    const searchParams = new URLSearchParams({ email });
    const searchResult = await stripeRequest(`/customers?${searchParams.toString()}`);
    
    if (searchResult.data && searchResult.data.length > 0) {
      const existingCustomer = searchResult.data[0];
      console.log('✅ Cliente existente encontrado no Stripe:', existingCustomer.id);
      return existingCustomer.id;
    }

    // 2. Se não existir, criar novo cliente
    console.log('📝 Criando novo cliente no Stripe:', email);
    const body = new URLSearchParams({
      email,
      name,
      'metadata[tenant_id]': tenantId,
    });

    const newCustomer = await stripeRequest('/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return newCustomer.id;
  } catch (error) {
    console.error('❌ Erro em getOrCreateStripeCustomer:', error);
    throw error;
  }
}

/**
 * Cria uma Sessão de Checkout do Stripe
 */
export async function createStripeCheckoutSession(params: {
  customerId: string;
  priceId: string;
  tenantId: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; id: string }> {
  const body = new URLSearchParams({
    mode: 'subscription',
    customer: params.customerId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    'subscription_data[metadata][tenant_id]': params.tenantId,
    'subscription_data[metadata][plan_id]': params.planId,
    'subscription_data[metadata][billing_period]': params.billingPeriod,
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    // Permitir códigos de cupom promocionais se configurado no painel
    allow_promotion_codes: 'true',
  });

  const session = await stripeRequest('/checkout/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  return { url: session.url, id: session.id };
}

/**
 * Cria uma Sessão do Portal de Faturamento do Stripe
 */
export async function createStripePortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const body = new URLSearchParams({
    customer: customerId,
    return_url: returnUrl,
  });

  const session = await stripeRequest('/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  return { url: session.url };
}

/**
 * Recupera um Evento diretamente do Stripe pelo ID para verificação de segurança (anti-spoofing)
 */
export async function verifyStripeWebhookEvent(eventId: string): Promise<any> {
  try {
    console.log('🔍 Verificando evento no Stripe via API:', eventId);
    const event = await stripeRequest(`/events/${eventId}`);
    return event;
  } catch (error) {
    console.error('❌ Falha ao verificar evento do Stripe:', error);
    return null;
  }
}
