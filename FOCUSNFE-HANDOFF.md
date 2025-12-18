# Handoff — Integração FocusNFe (Emissão + Certificado por Tenant)

Este documento explica **o que já foi implementado** no projeto `erp-lite-zoer` para integração com a **FocusNFe (API v2)** e **o que ainda falta** para completar o MVP de emissão.

## Links oficiais (FocusNFe)

- Documentação API v2 (principal): https://focusnfe.com.br/doc/
- Guia “Passos iniciais”: https://focusnfe.com.br/guides/passos-iniciais/
- Painel FocusNFe (v2): https://app-v2.focusnfe.com.br/

## Objetivo do MVP

- **Multi-tenant**: cada tenant configura o token FocusNFe e sobe seu **certificado A1 (.pfx/.p12)**.
- Backend faz:
  - persistência de configuração e documentos
  - upload do certificado em **Supabase Storage (privado)**
  - provisionamento/cadastro do emitente na FocusNFe via endpoint **`/v2/empresas`** enviando `arquivo_certificado_base64` + `senha_certificado`
- Emissão inicial suportada via endpoints:
  - NFe, NFCe, NFSe (genérico)
  - NFSe Nacional (endpoint dedicado)

## Banco de dados (Supabase)

### Tabelas existentes/necessárias

- `public.fiscal_integrations`
  - guarda configuração por tenant (provider `focusnfe`)
  - campos principais usados: `tenant_id`, `environment`, `api_token`, `cnpj_emitente`, `enabled`
  - campos adicionados (via SQL no chat):
    - `focus_empresa_id` (text)
    - `focus_token_homologacao` (text)
    - `focus_token_producao` (text)
    - `cert_valid_from` (timestamptz)
    - `cert_valid_to` (timestamptz)
    - `cert_cnpj` (varchar(14))

- `public.fiscal_documents`
  - guarda cada documento fiscal emitido
  - `doc_type` inclui: `nfe`, `nfce`, `nfse`, `nfse_nacional`

- `public.fiscal_document_events`
  - histórico de eventos

- `public.fiscal_certificates`
  - guarda metadados do certificado por tenant (arquivo no storage + senha criptografada)
  - campos principais:
    - `storage_bucket`, `storage_path`, `original_filename`, `content_type`, `size_bytes`
    - senha criptografada: `password_ciphertext_b64`, `password_iv_b64`, `password_tag_b64`

### Storage

- Bucket **privado**: `fiscal-certificates`

## Variáveis de ambiente (obrigatórias)

No ambiente local, usar `.env.local` (gitignored):

- `NEXT_PUBLIC_SUPABASE_URL` (URL do projeto)
- `SUPABASE_SERVICE_ROLE_KEY` (**service role**, usado no backend)
- `FISCAL_CERT_ENCRYPTION_KEY` (string forte; usada para criptografar/decriptar senha do certificado)

Notas:
- **Não trocar** `FISCAL_CERT_ENCRYPTION_KEY` após começar a gravar certificados (senão não decripta o que já foi salvo).
- Rotas `next_api` de fiscal/agora **não possuem fallback hardcoded**. Se faltar env, o servidor vai falhar com erro.

## Backend — Rotas criadas (Next.js route handlers)

Base path: `src/app/next_api/fiscal/focusnfe/**`

### 1) Integração (token por tenant)

- Arquivo: `src/app/next_api/fiscal/focusnfe/integration/route.ts`
- `POST /next_api/fiscal/focusnfe/integration`
  - body JSON:
    - `tenant_id`
    - `api_token`
    - `environment`: `homologacao` | `producao`
    - `cnpj_emitente` (opcional)
    - `enabled` (opcional)
- `GET /next_api/fiscal/focusnfe/integration?tenant_id=...`

### 2) Upload/consulta de certificado (Supabase Storage + DB)

- Arquivo: `src/app/next_api/fiscal/focusnfe/certificate/route.ts`

- `POST /next_api/fiscal/focusnfe/certificate`
  - **multipart/form-data**:
    - `tenant_id` (uuid)
    - `password` (senha do PFX/P12)
    - `file` (.pfx/.p12)
  - salva arquivo em `fiscal-certificates/{tenant_id}/{timestamp-uuid}.pfx`
  - salva senha criptografada no Postgres (AES-256-GCM)

- `GET /next_api/fiscal/focusnfe/certificate?tenant_id=...`
  - retorna metadados/status do último certificado

### 3) Provisionamento da empresa na FocusNFe (envia certificado base64)

- Arquivo: `src/app/next_api/fiscal/focusnfe/company/provision/route.ts`

- `POST /next_api/fiscal/focusnfe/company/provision`
  - body JSON: `{ "tenant_id": "..." }`
  - fluxo:
    - carrega dados do tenant (tabela `tenants`)
    - carrega integração (`fiscal_integrations`)
    - baixa certificado do storage
    - decripta senha usando `FISCAL_CERT_ENCRYPTION_KEY`
    - chama FocusNFe:
      - `POST /v2/empresas` (se `focus_empresa_id` não existe)
      - `PUT /v2/empresas/{focus_empresa_id}` (se já existe)
    - atualiza `fiscal_integrations` com `focus_empresa_id`, tokens e datas/infos do certificado (quando retornadas)

### 4) Emissão genérica (NFe/NFCe/NFSe)

- Arquivo: `src/app/next_api/fiscal/focusnfe/issue/route.ts`
- `POST /next_api/fiscal/focusnfe/issue`
  - body JSON:
    - `tenant_id`
    - `doc_type`: `nfe` | `nfce` | `nfse`
    - `payload` (JSON)
    - `ref` (opcional)
  - cria registro em `fiscal_documents`
  - chama FocusNFe `POST /v2/{doc_type}?ref=...`

### 5) Status genérico (NFe/NFCe/NFSe)

- Arquivo: `src/app/next_api/fiscal/focusnfe/status/route.ts`
- `GET /next_api/fiscal/focusnfe/status?fiscal_document_id=...&completa=...`
  - chama FocusNFe `GET /v2/{doc_type}/{ref}`
  - atualiza `fiscal_documents` com status, caminhos XML/PDF etc.

### 6) NFSe Nacional (emissão + status)

- Emissão: `src/app/next_api/fiscal/focusnfe/nfse-nacional/issue/route.ts`
  - `POST /next_api/fiscal/focusnfe/nfse-nacional/issue`
  - chama `POST /v2/nfsen?ref=...`

- Status: `src/app/next_api/fiscal/focusnfe/nfse-nacional/status/route.ts`
  - `GET /next_api/fiscal/focusnfe/nfse-nacional/status?fiscal_document_id=...&completa=...`
  - chama `GET /v2/nfsen/{ref}`

## Frontend

Ainda **não foi implementada** a página de configuração fiscal.

Recomendação:
- Criar uma página (ex.: `/configuracao-fiscal`) baseada no padrão do `src/app/perfil-empresa/page.tsx`.
- Campos esperados:
  - token FocusNFe + ambiente
  - upload do certificado + senha
  - botão para provisionar empresa
  - status (empresa_id, validade do certificado etc)

## Como testar o fluxo (manual)

1) Configurar integração:
- `POST /next_api/fiscal/focusnfe/integration`

2) Upload do certificado:
- `POST /next_api/fiscal/focusnfe/certificate` (form-data)

3) Provisionar empresa:
- `POST /next_api/fiscal/focusnfe/company/provision`

4) Emitir NFSe Nacional (após empresa habilitada):
- `POST /next_api/fiscal/focusnfe/nfse-nacional/issue`

## Segurança (importante)

- Nunca commitar `.env.local`.
- Antes de commitar, garantir que nenhum arquivo contém JWT/key hardcoded.
- Observação: existem arquivos no repo como `env.local.fixed`, `.env.backup`, `.env.local.backup` (já presentes no projeto) que podem conter segredos. Recomenda-se removê-los do repositório e rotacionar chaves se necessário.

---

# Prompt para outra IA continuar

Você é um(a) engenheiro(a) fullstack sênior.

Contexto:
- Projeto Next.js com Supabase.
- Integração FocusNFe iniciada.
- Backend já tem rotas para:
  - salvar integração por tenant (`/next_api/fiscal/focusnfe/integration`)
  - upload certificado A1 e salvar no Storage privado (`/next_api/fiscal/focusnfe/certificate`)
  - provisionar empresa na FocusNFe via `/v2/empresas` enviando `arquivo_certificado_base64` + `senha_certificado` (`/next_api/fiscal/focusnfe/company/provision`)
  - emissão/consulta de NFe/NFCe/NFSe e NFSe Nacional.

Tarefas:
1) Implementar UI `Configuração Fiscal` por tenant:
   - editar token/environment
   - upload certificado + senha
   - botão provisionar
   - exibir status (focus_empresa_id, validade etc)
2) Implementar UI de listagem de documentos fiscais (`fiscal_documents`) com:
   - emitir
   - consultar status
   - download de XML/PDF (quando existir)
3) Adicionar validações/guardrails:
   - impedir emissão se não tiver `fiscal_integrations` habilitada
   - impedir emissão se não tiver `focus_empresa_id` (ou certificado provisionado)
4) Opcional: webhooks + histórico (`fiscal_document_events`).

Requisitos:
- Não commitar segredos.
- Usar variáveis de ambiente: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FISCAL_CERT_ENCRYPTION_KEY`.
- Bucket `fiscal-certificates` é privado.

Entregáveis:
- Código frontend + rotas adicionais se necessário.
- Documentação e exemplos `curl`/PowerShell.
