# Integração com API de Nota Fiscal (NFe)

Este documento descreve como o ERP Lite está preparado para se integrar com um provedor externo de emissão de Nota Fiscal eletrônica.

## Visão Geral

- **Camada de configuração** em `src/constants/nfe.ts` lê variáveis de ambiente e habilita/desabilita a integração.
- **Cliente HTTP dedicado** em `src/lib/nfe/client.ts` centraliza chamadas ao provedor (emitir, consultar status e cancelar).
- **Serviço de orquestração** em `src/lib/nfe/service.ts` recebe os dados da venda, monta o payload esperado pela API e cuida de filas locais quando a integração estiver desabilitada.
- **Endpoint Next.js** em `src/app/next_api/nfe/route.ts` expõe uma interface REST interna (`POST /next_api/nfe`) para que o frontend ou outras partes do backend solicitem emissão.

## Variáveis de Ambiente

Configure os valores no `.env.local`:

```
NFE_API_ENABLED=false
NFE_API_BASE_URL=https://sandbox.seu-provedor-nfe.com.br
NFE_API_KEY=chave-ou-token
NFE_API_TIMEOUT=15000
NFE_API_ENVIRONMENT=homologation # ou production
```

Quando `NFE_API_ENABLED=false`, as requisições são enfileiradas em memória (útil durante o desenvolvimento). Em produção recomenda-se apontar `NFE_API_BASE_URL` para o ambiente do provedor e habilitar o recurso.

## Fluxo de Emissão

1. O frontend envia uma venda para `POST /next_api/nfe` contendo cliente, itens, pagamentos e totais.
2. O serviço `emitInvoiceForSale` transforma o payload e tenta emitir a nota via `NFEClient`.
3. Em caso de sucesso, o serviço retorna protocolo/status do provedor; em caso de indisponibilidade ou quando a integração estiver desligada, a requisição é armazenada em uma fila local através de `queueInvoiceEmission`.
4. A rota `GET /next_api/nfe` expõe o conteúdo da fila para debugging ou reprocessamento manual.

## Próximos Passos

- Persistir a fila de emissão em Supabase ou Redis para tolerar reinícios do servidor.
- Criar job/cron para reprocessar itens da fila.
- Implementar telas de histórico e reenvio dentro do painel administrativo.
- Mapear os campos fiscais (NCM/CFOP/tributação) dos produtos/vendas para preencher automaticamente o payload.

