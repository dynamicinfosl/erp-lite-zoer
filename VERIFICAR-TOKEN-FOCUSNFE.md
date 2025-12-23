# 🔍 Verificar Token e Conta FocusNFe

## ❓ Pergunta Importante

O erro **404 - Endpoint não encontrado** pode significar que:

1. **Token não tem permissão** para acessar o endpoint `/v2/empresas`
2. **Conta FocusNFe** não tem o recurso de multi-empresa habilitado
3. **Endpoint requer configuração especial** na conta

---

## 📋 Verificações Necessárias

### 1. Tipo de Conta FocusNFe

Acesse: https://app-v2.focusnfe.com.br/

**Perguntas:**
- ✅ Que tipo de plano você tem? (Free, Básico, Pro, Enterprise?)
- ✅ A conta permite gerenciar múltiplas empresas?
- ✅ Existe alguma opção "API Empresas" ou "Multi-tenant" na conta?

### 2. Token da API

No painel da FocusNFe:

**Verificar:**
- ✅ O token é "Master" ou "Por Empresa"?
- ✅ Quais permissões o token tem?
- ✅ Existe alguma configuração especial para o token?

### 3. Documentação Específica

**Ações:**
1. No painel FocusNFe, procure por "Documentação da API"
2. Veja se existe seção sobre "Empresas" ou "Certificados"
3. Verifique exemplos de código

---

## 🧪 Teste do Token

Execute este comando para testar o token:

### PowerShell (Windows):

```powershell
# Substitua SEU_TOKEN_AQUI pelo token real
$token = "SEU_TOKEN_AQUI"
$base64Token = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))

# Testar endpoint de empresas
Write-Host "Testando endpoint /v2/empresas..."
try {
    $response = Invoke-RestMethod -Uri "https://homologacao.focusnfe.com.br/v2/empresas" `
      -Method GET `
      -Headers @{ "Authorization" = "Basic $base64Token" } `
      -ErrorAction Stop
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    $response | ConvertTo-Json
} catch {
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
}

# Testar endpoint de NFe (para verificar se token funciona)
Write-Host "`nTestando endpoint /v2/nfe..."
try {
    $response = Invoke-RestMethod -Uri "https://homologacao.focusnfe.com.br/v2/nfe" `
      -Method GET `
      -Headers @{ "Authorization" = "Basic $base64Token" } `
      -ErrorAction Stop
    Write-Host "✅ Token funciona para NFe!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao testar NFe:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
}
```

---

## 📞 Contatar Suporte FocusNFe

Se o endpoint realmente não existe ou não está acessível:

**Email:** suporte@acras.com.br  
**Telefone:** Verificar no painel

**Perguntas para o suporte:**

1. "O endpoint `/v2/empresas` existe na API v2?"
2. "Como faço para cadastrar/provisionar empresas via API?"
3. "Como faço upload de certificado A1 via API para multi-tenant?"
4. "Meu plano permite usar o endpoint de empresas?"
5. "Existe documentação específica para integração multi-tenant?"

---

## 🎯 Enquanto Isso...

**Solução temporária para testar emissão:**

1. Acesse https://app-v2.focusnfe.com.br/
2. Faça upload manual do certificado pelo painel
3. Teste emitir uma nota usando apenas o token
4. Depois voltamos para resolver o provisionamento automático

---

**Por favor, execute o teste do PowerShell e me informe o resultado!**

Isso vai nos dizer se:
- ✅ O token está funcionando
- ✅ O endpoint `/v2/empresas` realmente não existe
- ✅ Ou se é questão de permissão/configuração







