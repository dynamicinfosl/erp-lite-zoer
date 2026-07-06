# Rotina Diária — Founder do ERP Lite

> Estrutura para você não se perder entre "programar" e "vender". Ajuste os horários ao seu dia.
> A ideia é dividir o dia em 3 blocos: **Produto (manhã)**, **Marketing/Vendas (tarde)**, **Gestão (fim do dia)**.

---

## Ritual fixo (todo dia útil)

**Manhã — Bloco Produto (2–4h)**
- [ ] Revisar erros/alertas do sistema (logs, e-mails de clientes travados).
- [ ] Trabalhar na tarefa técnica prioritária do dia (seguir ordem do `01-CHECKLIST`).
- [ ] Deploy só com teste; nada de mexer em produção sem revisar risco.

**Tarde — Bloco Marketing/Vendas (2–3h)**
- [ ] Publicar/agendar 1 conteúdo (Reels, story ou post).
- [ ] Responder leads e DMs em até algumas horas.
- [ ] Fazer 3–5 contatos de prospecção ativa (WhatsApp/ligação no nicho).
- [ ] Follow-up de trials em andamento (quem testou e sumiu).

**Fim do dia — Bloco Gestão (30 min)**
- [ ] Atualizar métricas no quadro semanal (leads, trials, MRR).
- [ ] Anotar 1 aprendizado do dia + definir a tarefa nº1 de amanhã.

---

## Ritual semanal

- **Segunda:** planejar a semana (revisar métricas, definir 3 metas da semana).
- **Quarta:** revisar campanhas de ads (pausar o que não converte).
- **Sexta:** revisão de MRR/churn + gravar 1 conteúdo "âncora" para a semana seguinte.
- **1x/semana:** falar com 1 cliente real (feedback qualitativo).

---

## Sprint de 30 dias (visão macro)

**Semana 1 — Segurança + Jurídico**
- Corrigir bloco 🔴 do checklist.
- Registrar CNPJ, abrir conta PJ, definir nome/marca.
- Definir preços dos 3 planos.

**Semana 2 — Billing + Base**
- Impor cobrança (bloqueio de trial/past_due no servidor).
- Limpar base (separar tenants reais x mortos).
- Termos de Uso + Política de Privacidade (LGPD).

**Semana 3 — Produto pronto para estranho**
- Onboarding self-service + polir Login/Dashboard/PDV.
- Coletar 3 depoimentos de clientes atuais.

**Semana 4 — Presença + Landing**
- Landing de conversão no ar.
- Instagram + Google Perfil da Empresa + WhatsApp Business ativos.
- Preparar (não escalar ainda) 1ª campanha de Google Search.

> Detalhe dia a dia dessas 4 semanas está no `notion-tarefas.csv` (importe no Notion).

---

## Divisão de tempo sugerida por fase

| Fase | Produto | Marketing/Vendas | Gestão |
|---|---|---|---|
| Fase 0–1 (consolidar) | 60% | 25% | 15% |
| Fase 2 (aquisição) | 30% | 55% | 15% |
| Fase 3 (escala) | 25% | 40% | 35% (time/processos) |

---

## Como usar o CSV no Notion
1. No Notion: crie uma página → `/` → **Import** → **CSV**, ou arraste o arquivo `notion-tarefas.csv`.
2. Ele vira uma **Database**. Mude a visualização para **Board** (agrupar por `Status`) ou **Calendar** (por `Data`).
3. Colunas: `Data`, `Bloco`, `Tarefa`, `Categoria`, `Prioridade`, `Status`, `Dia`.
4. Filtre por `Categoria` (Produto/Marketing/Vendas/Gestão/Jurídico) para focar por bloco do dia.
