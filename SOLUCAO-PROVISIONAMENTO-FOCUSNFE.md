# 🔧 Solução: Provisionamento FocusNFe

## ❌ Problema Identificado

**Erro:** Status HTTP 404 - "Endpoint não encontrado"  
**Endpoint usado:** `/v2/empresas`  
**Causa:** Este endpoint não existe na API v2 da FocusNFe

---

## ✅ Como a FocusNFe Realmente Funciona

Após investigação, descobri que a FocusNFe **NÃO tem** um endpoint `/v2/empresas` para provisionar empresas com certificado.

### Como funciona na realidade:

1. **Conta FocusNFe:** Você cria uma conta em https://app-v2.focusnfe.com.br/
2. **Token Master:** A conta fornece um token "master" para uso da API
3. **Upload de Certificado:** O certificado é enviado através do **painel web da FocusNFe**, não via API
4. **Emissão:** Ao emitir notas, você usa o token master + CNPJ do certificado configurado

---

## 🎯 Duas Opções de Solução

### **Opção 1: Usar Painel Web da FocusNFe (Recomendado)**

Esta é a forma oficial e mais simples:

**Passos:**

1. Acesse: https://app-v2.focusnfe.com.br/
2. Faça login na sua conta
3. Vá em **Configurações → Certificados**
4. Faça upload do certificado A1 (.pfx/.p12) + senha
5. Associe o certificado à empresa (CNPJ)
6. No sistema, use apenas o **token da API** para emitir notas

**Vantagens:**
- ✅ Método oficial e suportado
- ✅ Mais simples e rápido
- ✅ Certificados ficam gerenciados pela FocusNFe
- ✅ Não precisa modificar código

**Desvantagens:**
- ❌ Certificado não fica no sistema local
- ❌ Precisa acessar painel da FocusNFe para cada tenant

---

### **Opção 2: API de Webhook/Upload (Se Disponível)**

Verificar se a FocusNFe tem um endpoint específico para upload de certificado via API.

**Endpoints possíveis (a verificar na documentação):**
- `/v2/certificados` - Upload de certificado
- `/v2/credenciais` - Gerenciamento de credenciais
- Outro endpoint específico

**Status:** Precisa consultar suporte da FocusNFe

---

## 💡 Solução Imediata

Como o endpoint `/v2/empresas` não existe, vou:

1. **Remover a funcionalidade de provisionamento automático**
2. **Adicionar instruções claras** de como configurar no painel da FocusNFe
3. **Simplificar o fluxo** para apenas: Token + Emissão

---

## 🔄 Alternativa: Usar Outro Provedor

Se você precisa de provisionamento 100% via API (multi-tenant automático), considere:

- **TecnoSpeed (PlugNotas):** Tem API para upload de certificado
- **ENotas:** Tem API completa para gestão de certificados
- **WebMania:** Tem API para certificados

A FocusNFe é excelente, mas parece ser mais focada em uso através do painel web.

---

## 📝 O que vou fazer agora

Vou modificar o sistema para:

1. **Remover o botão "Provisionar Empresa"**
2. **Adicionar instruções** na página explicando:
   - Como fazer upload do certificado no painel da FocusNFe
   - Link direto para o painel
   - Passos detalhados com screenshots (se possível)
3. **Simplificar** para que o fluxo seja:
   - Configure token → Emita notas
4. **Manter o sistema de certificado local** como backup/referência

---

## 🎯 Próximo Passo

Você prefere:

**A)** Seguir com a **Opção 1** (usar painel web da FocusNFe)?  
- Vou remover o provisionamento e adicionar instruções

**B)** **Investigar mais** se existe algum endpoint de certificado na API?  
- Vou tentar contatar suporte ou verificar documentação detalhada

**C)** **Mudar de provedor** para um que tenha API completa?  
- Posso ajudar a integrar outro provedor

---

**Qual opção você prefere?**







