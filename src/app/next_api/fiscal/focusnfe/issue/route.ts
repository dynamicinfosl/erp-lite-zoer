import { NextRequest, NextResponse } from 'next/server';
import { emitFiscalDocument, DocType } from '@/lib/fiscal/issue-orchestrator';

export const runtime = 'nodejs';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, doc_type, payload, ref } = body as {
      tenant_id?: string;
      doc_type?: DocType;
      payload?: any;
      ref?: string;
    };

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'tenant_id inválido' }, { status: 400, headers: jsonHeaders });
    }

    if (doc_type !== 'nfe' && doc_type !== 'nfce' && doc_type !== 'nfse') {
      return NextResponse.json({ error: 'doc_type inválido (use nfe, nfce ou nfse)' }, { status: 400, headers: jsonHeaders });
    }

    if (!payload) {
      return NextResponse.json({ error: 'payload é obrigatório' }, { status: 400, headers: jsonHeaders });
    }

    // Executar emissão via Orquestrador (Provedor Ativo + Fallback Automático)
    const result = await emitFiscalDocument({
      tenant_id,
      doc_type,
      payload,
      ref,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Erro ao emitir documento fiscal',
          provider_used: result.provider,
          fallback_used: result.fallback_used,
          details: result.details,
          fiscal_document_id: result.fiscal_document_id,
          ref: result.ref,
        },
        { status: 400, headers: jsonHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Documento fiscal enfileirado/enviado com sucesso',
        provider_used: result.provider,
        fallback_used: result.fallback_used,
        fiscal_document_id: result.fiscal_document_id,
        ref: result.ref,
        data: result.response_data,
      },
      { status: 200, headers: jsonHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno ao processar emissão fiscal', details: error?.message },
      { status: 500, headers: jsonHeaders }
    );
  }
}
