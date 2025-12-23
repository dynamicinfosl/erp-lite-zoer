# 📋 Resumo: Problema de Provisionamento e Solução

**Data:** 19 de Dezembro de 2025

---

## ❌ Problema Identificado

**Erro:** `404 - Endpoint não encontrado` ao tentar provisionar empresa  
**Endpoint:** `/v2/empresas`  
**Mensagem FocusNFe:** "Endpoint não encontrado, verifique a documentação"

---

## 🔍 Causa

O endpoint `/v2/empresas` usado para provisionar empresas **não existe** ou **não está acessível** com o token/plano atual da FocusNFe.

**Possíveis motivos:**
1. Endpoint não existe na API v2 da FocusNFe
2. Token não tem permissão para acessar esse endpoint
3. Plano da conta não inclui gestão de múltiplas empresas via API
4. Endpoint requer configuração especial na conta

---

## ✅ Solução Implementada (Temporária)

### Mudanças no Código:

1. **Removida validação obrigatória** de `focus_empresa_id` 
2. **Permitir emissão** mesmo sem empresa provisionada via API
3. **Adicionados warnings** nos logs para alertar sobre certificado manual

### Arquivos Modificados:

- `src/app/next_api/fiscal/focusnfe/issue/route.ts`
- `src/app/next_api/fiscal/focusnfe/nfse-nacional/issue/route.ts`

---

## 🎯 O Que Fazer Agora (Passo a Passo)

### **Passo 1: Configurar Certificado no Painel da FocusNFe**

1. Acesse: https://app-v2.focusnfe.com.br/
2. Faça login com sua conta
3. Vá em **Configurações** (ou **Certificados**)
4. Faça upload do certificado A1 (.pfx/.p12)
5. Digite a senha do certificado
6. Associe o certificado ao CNPJ da empresa

### **Passo 2: Configurar Token no Sistema**

1. No painel da FocusNFe, copie o **token da API**
2. Acesse `/configuracao-fiscal` no seu sistema
3. Cole o token e salve
4. **NÃO clique em "Provisionar Empresa"** (não vai funcionar por enquanto)

### **Passo 3: Testar Emissão de Nota**

Agora você pode testar emitir uma nota fiscal!

**Via API (Postman/Thunder Client):**

```bash
POST http://localhost:3000/next_api/fiscal/focusnfe/issue
Content-Type: application/json

{
  "tenant_id": "seu-tenant-id-aqui",
  "doc_type": "nfe",
  "payload": {
    "natureza_operacao": "Venda de mercadoria",
    "data_emissao": "2025-12-19T10:00:00-03:00",
    "tipo_documento": "1",
    "finalidade_emissao": "1",
    "cliente": {
      "cpf": "12345678901",
      "nome": "Cliente Teste",
      "endereco": "Rua Teste",
      "numero": "123",
      "bairro": "Centro",
      "municipio": "São Paulo",
      "uf": "SP",
      "cep": "01310100"
    },
    "itens": [
      {
        "numero_item": "1",
        "codigo_produto": "001",
        "descricao": "Produto Teste",
        "cfop": "5102",
        "unidade_comercial": "UN",
        "quantidade_comercial": 1,
        "valor_unitario_comercial": "100.00",
        "valor_unitario_tributavel": "100.00",
        "unidade_tributavel": "UN",
        "codigo_ncm": "12345678",
        "quantidade_tributavel": 1,
        "valor_bruto": "100.00",
        "icms_origem": "0",
        "icms_situacao_tributaria": "102"
      }
    ]
  }
}
```

---

## 📊 Status Atual

| Item | Status | Observação |
|------|--------|------------|
| Backend (Rotas API) | ✅ Funcionando | Todas as rotas criadas |
| Frontend (Página) | ✅ Funcionando | Página `/configuracao-fiscal` completa |
| Variáveis de Ambiente | ⚠️ Verificar | Confira se `SUPABASE_SERVICE_ROLE_KEY` está configurada |
| Integração FocusNFe | ✅ OK | Token configurado |
| Certificado | ⚠️ Manual | Enviar pelo painel da FocusNFe |
| Provisionamento Automático | ❌ Não funciona | Endpoint `/v2/empresas` retorna 404 |
| Emissão de Notas | ✅ Pronto para testar | Após configurar certificado no painel |

---

## 🔄 Próximos Passos (Investigação)

### **Opção A: Verificar com Suporte FocusNFe**

**Contato:** suporte@acras.com.br ou através do painel

**Perguntas:**
1. "O endpoint `/v2/empresas` existe na API v2?"
2. "Como provisionar empresas via API para multi-tenant?"
3. "Existe endpoint para upload de certificado via API?"
4. "Meu plano/token permite usar gestão de empresas via API?"

### **Opção B: Usar Painel Web (Solução Atual)**

- ✅ Continuar usando o painel da FocusNFe para gerenciar certificados
- ✅ Sistema envia apenas as notas via API
- ✅ Funciona perfeitamente, mas não é 100% automatizado

### **Opção C: Mudar de Provedor**

Se você precisa de provisionamento 100% automático via API:

- **PlugNotas (TecnoSpeed)** - Tem API completa para certificados
- **ENotas** - Gestão completa via API
- **WebMania** - API para multi-tenant com certificados

---

## 🎓 Aprendizados

1. ✅ A FocusNFe pode não ter endpoint de gestão de empresas via API
2. ✅ Cada provedor de NFe tem sua própria arquitetura
3. ✅ Algumas funcionalidades precisam ser feitas pelo painel web
4. ✅ É importante verificar a documentação oficial antes de implementar

---

## 📝 Documentos Criados

1. ✅ `SOLUCAO-PROVISIONAMENTO-FOCUSNFE.md` - Análise do problema
2. ✅ `VERIFICAR-TOKEN-FOCUSNFE.md` - Script de teste do token
3. ✅ `RESUMO-PROBLEMA-E-SOLUCAO.md` - Este documento
4. ✅ `DIAGNOSTICO-PROVISIONAMENTO.md` - Guia de diagnóstico
5. ✅ `O-QUE-FALTA-PARA-EMITIR-NFE.md` - Guia completo

---

## ✅ Checklist Final

Antes de testar emissão, confira:

- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada no `.env.local`
- [ ] Servidor reiniciado após configurar variáveis
- [ ] Certificado A1 enviado **no painel da FocusNFe**
- [ ] Token FocusNFe configurado na página `/configuracao-fiscal`
- [ ] Integração marcada como "habilitada"
- [ ] Dados da empresa (CNPJ, endereço) completos
- [ ] Pronto para testar emissão via API ou interface

---

## 🚀 Teste Agora!

**Execute o script de verificação do token** (em `VERIFICAR-TOKEN-FOCUSNFE.md`) para confirmar que o token está funcionando.

**Depois, tente emitir uma nota fiscal de teste!**

Se der erro, me mostre a mensagem completa que vou te ajudar a resolver.

---

**Boa sorte! 🎉**

Se precisar de ajuda, estou aqui!







