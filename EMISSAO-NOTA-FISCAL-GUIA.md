# Guia de Emissão de Nota Fiscal - Troubleshooting

## 📋 Pré-requisitos para Emitir Notas Fiscais

Antes de emitir notas fiscais, certifique-se de que:

### 1. Configuração da Integração FocusNFe
- [ ] Token da API FocusNFe configurado
- [ ] Certificado digital A1 (.pfx ou .p12) enviado
- [ ] Empresa provisionada na FocusNFe
- [ ] Integração habilitada

#### Como verificar:
1. Acesse `/configuracao-fiscal`
2. Vá para a aba "Status"
3. Verifique se todos os itens estão com status verde

### 2. Dados da Empresa Completos
- [ ] CNPJ cadastrado
- [ ] Endereço completo
- [ ] Inscrição Estadual (se aplicável)
- [ ] Inscrição Municipal (para NFS-e)

#### Como verificar:
1. Acesse `/perfil-empresa`
2. Preencha todos os campos obrigatórios
3. Salve as alterações

## 🔍 Erros Comuns e Soluções

### Erro 400 - Bad Request

Este erro indica que o FocusNFe rejeitou o documento. As causas mais comuns são:

#### 1. **"Empresa não provisionada"**
**Solução:**
- Acesse `/configuracao-fiscal`
- Vá para aba "Certificado"
- Clique em "Provisionar Empresa"
- Aguarde a confirmação

#### 2. **"CPF/CNPJ inválido"**
**Solução:**
- Verifique se o CPF/CNPJ está no formato correto
- Remova pontos, traços e barras (apenas números)
- Para CPF: 11 dígitos
- Para CNPJ: 14 dígitos

#### 3. **"NCM inválido"**
**Solução:**
- O NCM deve ter 8 dígitos
- Use "00000000" se não souber o NCM correto (apenas para testes)
- Consulte a tabela NCM oficial para produtos específicos

#### 4. **"CFOP inválido ou incompatível"**
**Solução:**
- Para vendas dentro do estado: use 5102
- Para vendas fora do estado: use 6102
- Para serviços: use 5405 (dentro do estado) ou 6405 (fora)

#### 5. **"Dados do endereço incompletos"**
**Solução para NF-e:**
- Logradouro é obrigatório
- Número é obrigatório (use "S/N" se não tiver)
- Bairro é obrigatório
- Município e UF são obrigatórios
- CEP é recomendado

#### 6. **"Certificado expirado ou inválido"**
**Solução:**
- Acesse `/configuracao-fiscal`
- Aba "Status" - verifique a validade do certificado
- Se expirado, envie um novo certificado na aba "Certificado"

### Erro 401 - Unauthorized

**Causa:** Token da API FocusNFe inválido ou expirado

**Solução:**
1. Acesse o painel da FocusNFe: https://app-v2.focusnfe.com.br/
2. Gere um novo token
3. Acesse `/configuracao-fiscal`
4. Aba "Integração"
5. Cole o novo token
6. Salve

### Erro 500 - Internal Server Error

**Causa:** Erro no servidor ou problema de comunicação

**Soluções:**
1. Verifique sua conexão com a internet
2. Tente novamente em alguns minutos
3. Verifique se o FocusNFe está online: https://status.focusnfe.com.br/
4. Se persistir, entre em contato com o suporte

## 📝 Checklist para Emissão

### Para NFC-e (Consumidor)
- [ ] Nome do cliente preenchido
- [ ] Pelo menos 1 item com descrição
- [ ] Quantidade e valor unitário preenchidos
- [ ] Forma de pagamento selecionada

### Para NF-e (Completa)
- [ ] Nome/Razão Social preenchido
- [ ] CPF/CNPJ válido
- [ ] Endereço completo
  - [ ] Logradouro
  - [ ] Número
  - [ ] Bairro
  - [ ] Município
  - [ ] UF
  - [ ] CEP (recomendado)
- [ ] Pelo menos 1 item com:
  - [ ] Descrição
  - [ ] NCM válido
  - [ ] CFOP correto
  - [ ] Quantidade e valores
- [ ] Configurações fiscais (ICMS, PIS, COFINS)

### Para NFS-e (Serviço)
- [ ] Nome do tomador do serviço
- [ ] CPF/CNPJ válido
- [ ] Descrição do serviço
- [ ] Valor do serviço
- [ ] Código de serviço (se aplicável)
- [ ] Alíquota de ISS configurada

## 🔧 Debug Avançado

### Ver Logs no Console do Navegador

1. Pressione `F12` para abrir o DevTools
2. Vá para a aba "Console"
3. Clique em "Emitir Nota"
4. Procure por:
   - "📤 Enviando para API:" - mostra o que está sendo enviado
   - "📄 Payload completo:" - mostra o payload JSON
   - "Resposta da API:" - mostra a resposta do servidor
   - "❌ Erro ao emitir nota:" - mostra detalhes do erro

### Testar no Ambiente de Homologação

1. Acesse `/configuracao-fiscal`
2. Aba "Integração"
3. Selecione "Homologação (Testes)"
4. Salve
5. Tente emitir uma nota de teste

**Importante:** Notas emitidas em homologação **não têm valor fiscal**.

### Validar Payload Manualmente

Se você é desenvolvedor, pode validar o payload antes de enviar:

```javascript
// Exemplo de payload válido para NFC-e
{
  "natureza_operacao": "Venda de mercadorias",
  "data_emissao": "2024-01-15T10:00:00-03:00",
  "tipo_documento": "1",
  "finalidade_emissao": "1",
  "consumidor_final": "1",
  "presenca_comprador": "1",
  "nome": "João da Silva",
  "cpf_cnpj": "12345678900",
  "items": [
    {
      "numero_item": "1",
      "descricao": "Produto Teste",
      "ncm": "12345678",
      "cfop": "5102",
      "unidade_comercial": "UN",
      "quantidade_comercial": "1.00",
      "valor_unitario_comercial": "10.00",
      "valor_bruto": "10.00",
      "icms_situacao_tributaria": "102",
      "icms_origem": "0",
      "pis_situacao_tributaria": "07",
      "cofins_situacao_tributaria": "07"
    }
  ],
  "valor_produtos": "10.00",
  "valor_total": "10.00",
  "formas_pagamento": [
    {
      "forma_pagamento": "01",
      "valor_pagamento": "10.00"
    }
  ]
}
```

## 📞 Suporte

### FocusNFe
- Site: https://focusnfe.com.br
- Suporte: suporte@acras.com.br
- Documentação: https://doc.focusnfe.com.br/

### Status do Serviço
- https://status.focusnfe.com.br/

## 📚 Referências

- [Documentação FocusNFe - NF-e](https://doc.focusnfe.com.br/docs/nfe)
- [Documentação FocusNFe - NFC-e](https://doc.focusnfe.com.br/docs/nfce)
- [Documentação FocusNFe - NFS-e](https://doc.focusnfe.com.br/docs/nfse)
- [Tabela de CFOP](http://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=Iy/5Qol1YbE=)
- [Consulta NCM](https://portalunico.siscomex.gov.br/classif/#/sumario)

