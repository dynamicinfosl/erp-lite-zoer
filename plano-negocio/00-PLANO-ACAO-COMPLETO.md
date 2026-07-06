# Plano de Ação — Transformar o ERP Lite em Empresa

> Documento estratégico. Meta: sair de "sistema que funciona para clientes migrados" para **produto vendável, seguro e com aquisição previsível de clientes**.

---

## 1. Diagnóstico atual (dados reais do sistema)

**Produto (o que já existe e funciona):**
- PDV, Vendas, Produtos (2.547), Clientes (4.204), Estoque + movimentações (13.257)
- Entregas + entregadores + manifestos (8.136 entregas, 1.457 manifestos)
- Financeiro (2.531 transações), Caixa (abertura/fechamento/sangria)
- NF-e / Fiscal (117 documentos, integração FocusNFe, certificados)
- Multi-tenant (61 tenants), Multi-filial (52 filiais), Planos + Assinaturas
- API keys, permissões por usuário, painel admin
- Escala real de dados: **14.161 vendas** e **54.395 itens de venda**

**Sinais de alerta (o que trava a virada para empresa):**
| Métrica | Situação | Implicação |
|---|---|---|
| Tenants ativos (30d) | **3** de 61 | Base "inflada"; receita real é pequena |
| Assinaturas `past_due` | **49** | Cobrança não é imposta / clientes não pagam |
| Assinaturas `active` | 9 | MRR real baixo — precisa validar quanto entra de fato |
| Criação de tenants | 50 em out/2025 (migração) | Foi migração em massa, não aquisição orgânica |
| Segurança | Falhas críticas (ver checklist) | **Não divulgar para fora antes de corrigir** |

**Conclusão:** o produto é bom o suficiente para vender. O gargalo é **(a) segurança/cobrança**, **(b) posicionamento/design**, e **(c) máquina de aquisição inexistente**. A prioridade nas primeiras 2 semanas é técnica+jurídica; só depois liga-se o marketing.

---

## 2. Regra de ouro da sequência

**NÃO faça tráfego pago antes de:**
1. Corrigir as falhas de segurança críticas (checklist 01).
2. Impor a cobrança (bloquear quem não paga) — senão você paga anúncio para dar produto de graça.
3. Ter uma landing page que converte + onboarding de trial funcionando sozinho.

Ordem correta: **Consolidar → Provar → Divulgar → Escalar → Contratar.**

---

## 3. Roadmap em 4 fases (90 dias)

### Fase 0 — Fundação (Semana 1–2) · "Não vaze e não dê de graça"
- Corrigir segurança crítica (RPC `anon`, view SECURITY DEFINER, middleware, RLS). Ver `01-CHECKLIST-TECNICO`.
- Impor billing: trial expira e bloqueia; `past_due` perde acesso após X dias.
- Limpar base: separar tenants reais dos de teste/migração morta.
- Jurídico/marca: definir nome comercial, registrar CNPJ (MEI ou ME), conta PJ, definir Termos de Uso + Política de Privacidade (LGPD) + contrato de assinatura.
- Definir preços oficiais (3 planos) e página de preços.

### Fase 1 — Consolidação de produto (Semana 3–6) · "Pronto para estranho usar"
- Onboarding self-service: cadastro → trial → primeiros passos guiados (sem você intervir).
- Polir design das telas de maior contato (Login, Dashboard, PDV, Landing).
- Landing page de vendas nova (proposta de valor + prova social + CTA de trial).
- Coletar 3–5 depoimentos dos clientes reais atuais + 2 estudos de caso.
- Suporte: canal único (WhatsApp Business + e-mail), FAQ e base de ajuda.

### Fase 2 — Aquisição (Semana 7–12) · "Entrar clientes toda semana"
- Redes sociais no ar (Instagram + Google Perfil da Empresa) com calendário de conteúdo.
- Tráfego pago inicial (Google Search primeiro, depois Meta) com orçamento controlado.
- Programa de indicação para clientes atuais.
- Prospecção ativa no nicho que você já conhece (mesmo segmento dos clientes migrados).
- Métricas: CAC, conversão de trial, churn, MRR (dashboard semanal).

### Fase 3 — Escala e time (Mês 4+) · "Não depender só de você"
- Contratar 1º: **Suporte/Customer Success** (libera seu tempo). Depois **Dev** e **Tráfego/Social**.
- Processos documentados (onboarding de cliente, suporte, deploy, financeiro).
- Metas de MRR e funil previsível antes de aumentar investimento em ads.

---

## 4. Posicionamento e oferta

**Nicho-alvo (comece estreito):** o mesmo segmento dos seus clientes atuais (aparentemente distribuição/varejo com entregas — ex.: distribuidoras de bebidas/água, mercados de bairro, atacado com entrega). Vender para um nicho que você já domina converte muito mais que "ERP para todos".

**Proposta de valor (rascunho):**
> "O ERP completo para [distribuidoras/varejo com entrega]: PDV, estoque, entregas, financeiro e nota fiscal em um só lugar — mais simples e mais barato que o GestãoClick, com suporte de verdade em português."

**Diferenciais vs GestãoClick (validar e destacar):**
- Módulo de **entregas + manifesto** forte (você já tem 8k entregas rodando).
- Preço competitivo + suporte próximo.
- Migração assistida (você já migrou clientes — vire isso em serviço/oferta).

**Planos sugeridos (validar números com sua margem):**
- **Essencial** — PDV + Estoque + Vendas (1 usuário/1 filial).
- **Profissional** — + Financeiro + Entregas + NF-e (multiusuário).
- **Enterprise/Multi-filial** — multi-filial + API + suporte prioritário.
- Oferta de entrada: 7–14 dias de trial + desconto anual.

---

## 5. Marca e presença digital (o que criar)

- **Nome + domínio + logo** (logo simples já resolve; evoluir depois).
- **Instagram** comercial (@) + **Google Perfil da Empresa** (aparece no Maps/Search).
- **Landing page** própria (a atual `page.tsx` de 45k pode virar isso, mas precisa foco em conversão).
- **WhatsApp Business** com catálogo/mensagem automática.
- (Opcional fase 2) LinkedIn da empresa + canal no YouTube com tutoriais (viram suporte + SEO).

**Pilares de conteúdo (Instagram/Reels):**
1. Dor do dono de negócio (controle de estoque, caixa que não fecha, entrega bagunçada).
2. Bastidores/uso real do sistema (tela gravada — "como fechar o caixa em 30s").
3. Prova social (depoimento de cliente).
4. Educação (dicas de gestão para o nicho).
5. Oferta/CTA (teste grátis).

---

## 6. Aquisição de clientes (canais em ordem de prioridade)

1. **Base atual + indicação** (mais barato): reative os 49 `past_due`, peça indicações.
2. **Prospecção ativa no nicho** (você conhece o mercado): lista + abordagem WhatsApp/visita.
3. **Google Search Ads** (intenção alta: "sistema para distribuidora", "erp com controle de entrega").
4. **Meta Ads (Instagram/Facebook)** para remarketing + topo de funil.
5. **SEO/Conteúdo** (longo prazo): artigos e comparativos ("alternativa ao GestãoClick").

**Orçamento inicial sugerido de ads:** comece pequeno (ex.: R$ 30–50/dia em Google Search), meça CAC, só escale o que prova retorno.

---

## 7. Métricas que você deve olhar toda semana

- **MRR** (receita recorrente mensal) e nº de assinaturas `active` pagas de verdade.
- **Trials iniciados → convertidos** (%).
- **CAC** (quanto gastou / quantos clientes pagantes entraram).
- **Churn** (cancelamentos/mês).
- **Leads** por canal (WhatsApp, form da landing).

---

## 8. Contratação (quando e quem)

- **Gatilho:** contrate quando o processo estiver documentado e o custo couber no MRR (regra prática: nova contratação ≤ ~1/3 do MRR novo previsível).
- **Ordem:** 1) Suporte/CS (meio período) → 2) Dev (freela/PJ por demanda) → 3) Tráfego+Social (freela/agência pequena).
- **Como:** comece com PJ/freelancer e part-time antes de CLT. Documente tudo (os `.md` do repo já ajudam).

---

## 9. Riscos e como mitigar

- **Segurança/LGPD:** dados de 4k clientes e fiscais — vazamento é risco legal. Corrigir antes de divulgar.
- **Dependência de 1 pessoa (você):** documentar e automatizar onboarding/suporte.
- **Churn alto se onboarding for ruim:** invista no "primeiro valor em 10 minutos".
- **Queimar caixa em ads sem billing:** só anuncie depois de impor cobrança.

---

## 10. Próximos passos imediatos (esta semana)

1. Ler e executar `01-CHECKLIST-TECNICO-PRE-LANCAMENTO.md` (bloco Crítico).
2. Definir nome comercial + registrar CNPJ + abrir conta PJ.
3. Definir preços oficiais dos 3 planos.
4. Importar `notion-tarefas.csv` no Notion e seguir `02-ROTINA-DIARIA.md`.

> Observação: alguns números do plano (orçamento de ads, salários, preços) são sugestões iniciais. Ajuste conforme sua margem real e seu tempo disponível por dia.
