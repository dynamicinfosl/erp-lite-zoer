import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import {
  fetchFocusBackups,
  getFullFileUrl,
  getMonthRange,
  getSupabaseAdmin,
  isAuthorizedFiscalStatus,
  isUuid,
  resolveFocusCredentials,
  type FocusCredentials,
} from '@/lib/fiscal/focusnfe-client';

export const runtime = 'nodejs';
export const maxDuration = 120;

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const MAX_FALLBACK_XMLS = 500;
const FETCH_TIMEOUT_MS = 25_000;

type ManifestEntry = {
  id: string;
  doc_type: string;
  numero: string | null;
  serie: string | null;
  chave: string | null;
  status: string;
  file?: string;
  ok: boolean;
  error?: string;
};

function zipResponse(buffer: ArrayBuffer | Buffer | Uint8Array, fileName: string) {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return new NextResponse(bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function tryDownloadFocusZip(
  zipUrl: string,
  credentials: FocusCredentials,
  fileName: string
): Promise<NextResponse | null> {
  // Links temporários da Focus costumam ser pré-assinados e rejeitam Authorization (HTTP 400).
  const attempts: RequestInit[] = [
    { method: 'GET' },
    { method: 'GET', headers: { Authorization: credentials.authHeader } },
  ];

  for (const init of attempts) {
    try {
      const resp = await fetchWithTimeout(zipUrl, init, 60_000);
      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        console.warn(`[backups/download] ZIP HTTP ${resp.status}:`, text.slice(0, 200));
        continue;
      }
      const contentType = (resp.headers.get('content-type') || '').toLowerCase();
      // Se voltar JSON de erro com 200, não tratar como ZIP
      if (contentType.includes('application/json')) {
        const text = await resp.text().catch(() => '');
        console.warn('[backups/download] ZIP retornou JSON:', text.slice(0, 200));
        continue;
      }
      const arrayBuffer = await resp.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength < 22) {
        console.warn('[backups/download] ZIP vazio ou inválido');
        continue;
      }
      return zipResponse(arrayBuffer, fileName);
    } catch (e: any) {
      console.warn('[backups/download] falha ao baixar ZIP:', e?.message);
    }
  }

  return null;
}

async function assembleZipFromDocuments(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  credentials: FocusCredentials,
  tenantId: string,
  month: string,
  fileName: string
): Promise<NextResponse> {
  const range = getMonthRange(month);
  if (!range) {
    return NextResponse.json({ error: 'Mês inválido. Selecione um mês válido.' }, { status: 400, headers: jsonHeaders });
  }

  const { data: docs, error } = await supabase
    .from('fiscal_documents')
    .select('id, doc_type, numero, serie, chave, status, caminho_xml, created_at')
    .eq('tenant_id', tenantId)
    .eq('provider', 'focusnfe')
    .in('doc_type', ['nfe', 'nfce'])
    .not('caminho_xml', 'is', null)
    .gte('created_at', range.start)
    .lt('created_at', range.end)
    .order('created_at', { ascending: true })
    .limit(MAX_FALLBACK_XMLS);

  if (error) {
    return NextResponse.json(
      { error: 'Não foi possível buscar as notas deste mês.' },
      { status: 400, headers: jsonHeaders }
    );
  }

  const eligible = (docs || []).filter(
    (d) => d.caminho_xml && isAuthorizedFiscalStatus(d.status)
  );

  if (eligible.length === 0) {
    return NextResponse.json(
      {
        error: 'Nenhum XML disponível para este mês. Verifique se há notas emitidas e autorizadas no período.',
      },
      { status: 404, headers: jsonHeaders }
    );
  }

  const zip = new JSZip();
  const folder = zip.folder(`xmls-${month}`) || zip;
  const manifest: ManifestEntry[] = [];
  let successCount = 0;

  for (const doc of eligible) {
    const path = String(doc.caminho_xml);
    const url = getFullFileUrl(path);
    const baseName =
      (doc.chave && String(doc.chave).replace(/\D/g, '')) ||
      `nota_${doc.numero || doc.id}`;
    const fileNameXml = `${baseName}-${doc.doc_type}.xml`;

    try {
      // Paths /arquivos costumam ser públicos; auth às vezes quebra o download
      let resp = await fetchWithTimeout(url, { method: 'GET' });
      if (!resp.ok) {
        resp = await fetchWithTimeout(url, {
          method: 'GET',
          headers: { Authorization: credentials.authHeader },
        });
      }

      if (!resp.ok) {
        manifest.push({
          id: doc.id,
          doc_type: doc.doc_type,
          numero: doc.numero,
          serie: doc.serie,
          chave: doc.chave,
          status: doc.status,
          ok: false,
          error: `HTTP ${resp.status}`,
        });
        continue;
      }

      const buf = await resp.arrayBuffer();
      folder.file(fileNameXml, buf);
      successCount += 1;
      manifest.push({
        id: doc.id,
        doc_type: doc.doc_type,
        numero: doc.numero,
        serie: doc.serie,
        chave: doc.chave,
        status: doc.status,
        file: fileNameXml,
        ok: true,
      });
    } catch (e: any) {
      manifest.push({
        id: doc.id,
        doc_type: doc.doc_type,
        numero: doc.numero,
        serie: doc.serie,
        chave: doc.chave,
        status: doc.status,
        ok: false,
        error: e?.message || 'Falha ao baixar XML',
      });
    }
  }

  if (successCount === 0) {
    return NextResponse.json(
      {
        error: 'Não foi possível baixar nenhum XML deste mês.',
        manifest,
      },
      { status: 502, headers: jsonHeaders }
    );
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        month,
        source: 'erp_fallback',
        cnpj: credentials.cnpj,
        total: eligible.length,
        success: successCount,
        failed: eligible.length - successCount,
        generated_at: new Date().toISOString(),
        files: manifest,
      },
      null,
      2
    )
  );

  const out = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return zipResponse(out, fileName);
}

/**
 * GET /next_api/fiscal/focusnfe/backups/download?tenant_id=&month=YYYY-MM&type=xmls
 * Preferência: ZIP oficial FocusNFe. Fallback: monta ZIP a partir de fiscal_documents.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Serviço indisponível. Tente novamente em instantes.' },
        { status: 500, headers: jsonHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenant_id = (searchParams.get('tenant_id') || '').trim();
    const month = (searchParams.get('month') || '').trim();
    const type = (searchParams.get('type') || 'xmls').trim().toLowerCase();

    if (!tenant_id || !isUuid(tenant_id)) {
      return NextResponse.json({ error: 'Sessão inválida. Recarregue a página.' }, { status: 400, headers: jsonHeaders });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Selecione um mês válido.' }, { status: 400, headers: jsonHeaders });
    }

    if (type !== 'xmls' && type !== 'danfes') {
      return NextResponse.json({ error: 'Tipo de exportação inválido.' }, { status: 400, headers: jsonHeaders });
    }

    const creds = await resolveFocusCredentials(supabase, tenant_id);
    if (!creds.ok) {
      // Mensagens amigáveis sem expor provedor
      const friendly =
        creds.error.includes('CNPJ')
          ? 'CNPJ emitente não configurado. Ajuste a configuração fiscal.'
          : creds.error.includes('Token') || creds.error.includes('Integração') || creds.error.includes('global')
            ? 'Emissão fiscal não está configurada para esta empresa.'
            : 'Não foi possível iniciar a exportação. Verifique a configuração fiscal.';
      return NextResponse.json({ error: friendly }, { status: creds.status, headers: jsonHeaders });
    }

    const { credentials } = creds;
    const fileName = `${type}-${credentials.cnpj}-${month}.zip`;

    // 1) Tentar backup oficial FocusNFe
    const backupsResult = await fetchFocusBackups(credentials);
    if (backupsResult.ok) {
      const entry = backupsResult.backups.find((b) => b.month === month);
      const zipUrl = type === 'xmls' ? entry?.xmls_url : entry?.danfes_url;
      if (zipUrl) {
        const proxied = await tryDownloadFocusZip(zipUrl, credentials, fileName);
        if (proxied) return proxied;
        console.warn('[backups/download] backup oficial falhou; tentando fallback do ERP');
      }
    }

    // 2) Fallback só para XMLs
    if (type === 'danfes') {
      return NextResponse.json(
        {
          error: 'Arquivo de DANFEs ainda não disponível para este mês. Tente novamente mais tarde.',
        },
        { status: 404, headers: jsonHeaders }
      );
    }

    return await assembleZipFromDocuments(supabase, credentials, tenant_id, month, fileName);
  } catch (error: any) {
    console.error('Erro ao baixar backup XML mensal:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o ZIP de XMLs. Tente novamente.' },
      { status: 500, headers: jsonHeaders }
    );
  }
}
