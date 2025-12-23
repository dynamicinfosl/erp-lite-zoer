# Solução: CNPJ do Emitente Não Autorizado

## 🔴 Erro
```
CNPJ do emitente não autorizado
```

## 📋 Causas Possíveis

1. **Empresa não provisionada no FocusNFe**
2. **CNPJ do certificado diferente do CNPJ cadastrado**
3. **Certificado não vinculado corretamente**
4. **Token de API incorreto**

## ✅ Solução Passo a Passo

### Passo 1: Verificar CNPJ da Empresa
1. Acesse `/perfil-empresa`
2. Verifique se o **CNPJ** está preenchido corretamente
3. O CNPJ deve estar **sem pontos, traços ou barras** (apenas números)
4. Exemplo correto: `12345678000190`
5. **Salve** se fizer alterações

### Passo 2: Verificar Certificado Digital
1. Acesse `/configuracao-fiscal`
2. Vá para aba **"Status"**
3. Procure por **"CNPJ do Certificado"**
4. **Importante:** O CNPJ do certificado DEVE ser o mesmo do cadastro da empresa

#### Se os CNPJs forem diferentes:
- Você precisa usar um certificado digital do **mesmo CNPJ** cadastrado na empresa
- OU atualizar o CNPJ da empresa para corresponder ao certificado

### Passo 3: Provisionar a Empresa
1. Acesse `/configuracao-fiscal`
2. Vá para aba **"Certificado"**
3. Role até **"Provisionar Empresa"**
4. Clique no botão **"Provisionar Empresa"**
5. Aguarde a confirmação (pode levar alguns segundos)

**⚠️ A empresa DEVE ser provisionada após:**
- Configurar o token
- Enviar o certificado
- Qualquer alteração nos dados da empresa

### Passo 4: Verificar o Provisionamento
1. Ainda em `/configuracao-fiscal`
2. Vá para aba **"Status"**
3. Verifique se:
   - ✅ **ID da Empresa** está preenchido
   - ✅ **Token Homologação** ou **Token Produção** está configurado
   - ✅ **CNPJ do Certificado** corresponde ao CNPJ da empresa

### Passo 5: Testar Novamente
1. Volte para `/emitir-nota`
2. Verifique o **Card de Status** no topo da página
3. Todos os itens devem estar com ✅ verde
4. Tente emitir a nota novamente

## 🔍 Verificação Manual

### Verificar CNPJ da Empresa
```
1. Perfil da Empresa → Campo CNPJ
   Deve ter 14 dígitos (sem formatação)
   Exemplo: 12345678000190
```

### Verificar CNPJ do Certificado
```
1. Configuração Fiscal → Aba Status → CNPJ do Certificado
   Deve ser IGUAL ao CNPJ da empresa
```

### Verificar Provisionamento
```
1. Configuração Fiscal → Aba Status → ID da Empresa
   Se estiver vazio = empresa NÃO provisionada
   Se tiver um ID = empresa provisionada ✅
```

## 🚨 Casos Especiais

### Caso 1: Certificado de Outra Empresa
Se o certificado digital é de um CNPJ diferente:
- **Opção A:** Obter certificado do CNPJ correto
- **Opção B:** Cadastrar nova empresa no sistema com o CNPJ do certificado

### Caso 2: Ambiente Homologação vs Produção
- **Homologação:** Use qualquer CNPJ válido para testes
- **Produção:** DEVE usar o CNPJ real da empresa

Para trocar:
1. `/configuracao-fiscal` → Aba "Integração"
2. Selecione "Homologação (Testes)" ou "Produção"
3. Salve e provisione novamente

### Caso 3: Erro Persiste Após Provisionar
1. Verifique se o provisionamento foi bem-sucedido
2. Aguarde 2-3 minutos após provisionar
3. Tente novamente
4. Se continuar, re-provisione a empresa

## 📞 Precisa de Ajuda?

Se após seguir todos os passos o erro persistir:

1. **Verifique novamente:**
   - CNPJ da empresa (14 dígitos)
   - CNPJ do certificado (aba Status)
   - ID da empresa preenchido (aba Status)

2. **Logs do Console:**
   - Pressione F12
   - Vá para Console
   - Procure por erros adicionais

3. **Contato FocusNFe:**
   - Se o problema for no provisionamento
   - suporte@acras.com.br

