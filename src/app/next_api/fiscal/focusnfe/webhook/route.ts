import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Headers JSON padrão
const jsonHeaders = {
  'Content-Type': 'application/json',
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Verificar assinatura do webhook (opcional, mas recomendado)
function verifyWebhookSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return true; // Se não houver secret configurado, aceitar
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
          details: 'Variáveis de ambiente do Supabase não configuradas' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }

    // Ler o body como texto para verificação de assinatura
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Verificar assinatura do webhook (se configurada)
    const webhookSecret = process.env.FOCUSNFE_WEBHOOK_SECRET;
    const signature = request.headers.get('x-focusnfe-signature');
    
    if (webhookSecret && !verifyWebhookSignature(bodyText, signature, webhookSecret)) {
      console.warn('Webhook com assinatura inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // Extrair informações do webhook
    const { ref, status, doc_type, empresa_id } = body;

    if (!ref) {
      return NextResponse.json({ error: 'ref é obrigatório no webhook' }, { status: 400 });
    }

    // Buscar documento fiscal pelo ref
    const { data: fiscalDoc, error: docError } = await supabaseAdmin
      .from('fiscal_documents')
      .select('id, tenant_id, doc_type, ref, status')
      .eq('ref', ref)
      .maybeSingle();

    if (docError) {
      console.error('Erro ao buscar documento:', docError);
      return NextResponse.json({ error: 'Erro ao buscar documento', details: docError.message }, { status: 400 });
    }

    if (!fiscalDoc) {
      console.warn(`Documento não encontrado para ref: ${ref}`);
      // Retornar 200 mesmo se não encontrar, para não gerar retry infinito
      return NextResponse.json({ success: true, message: 'Documento não encontrado, mas webhook processado' });
    }

    // Atualizar status do documento se fornecido
    if (status && status !== fiscalDoc.status) {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Atualizar campos adicionais se presentes no webhook
      if (body.numero) updateData.numero = String(body.numero);
      if (body.serie) updateData.serie = String(body.serie);
      if (body.chave_nfe) updateData.chave = String(body.chave_nfe);
      if (body.chave) updateData.chave = String(body.chave);
      if (body.caminho_xml_nota_fiscal) updateData.xml_path = String(body.caminho_xml_nota_fiscal);
      if (body.caminho_danfe) updateData.pdf_path = String(body.caminho_danfe);
      if (body.caminho_xml) updateData.xml_path = String(body.caminho_xml);
      if (body.caminho_pdf) updateData.pdf_path = String(body.caminho_pdf);

      await supabaseAdmin
        .from('fiscal_documents')
        .update(updateData)
        .eq('id', fiscalDoc.id);
    }

    // Salvar evento no histórico
    const { error: eventError } = await supabaseAdmin
      .from('fiscal_document_events')
      .insert({
        fiscal_document_id: fiscalDoc.id,
        tenant_id: fiscalDoc.tenant_id,
        event_type: 'webhook',
        event_status: status || 'received',
        event_data: body,
        provider_response: body,
        created_at: new Date().toISOString(),
      });

    if (eventError) {
      console.error('Erro ao salvar evento:', eventError);
      // Não falhar o webhook se não conseguir salvar o evento
    }

    return NextResponse.json({ success: true, message: 'Webhook processado com sucesso' });
  } catch (error: any) {
    console.error('Erro interno na rota POST webhook:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error?.message || 'Erro desconhecido' 
    }, { status: 500 });
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'Webhook endpoint ativo',
    instructions: 'Configure este URL no painel da FocusNFe como webhook para receber notificações de eventos'
  });
}

