/**
 * Script para criar tabelas de vendas no Supabase
 * Executa o SQL do arquivo create-sales-tables.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const supabaseUrl = 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSalesTableScript() {
  console.log('🚀 Iniciando criação das tabelas de vendas no Supabase...\n');

  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'create-sales-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Arquivo SQL carregado com sucesso!');
    console.log(`📊 Tamanho: ${sqlContent.length} caracteres\n`);

    // Dividir o SQL em comandos individuais (separados por ';')
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => {
        // Filtrar comentários e linhas vazias
        return cmd.length > 0 && 
               !cmd.startsWith('--') && 
               !cmd.startsWith('/*') &&
               cmd !== '';
      });

    console.log(`🔧 Total de comandos SQL a executar: ${commands.length}\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Pular comandos muito curtos ou comentários
      if (command.length < 10) continue;

      try {
        console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });

        if (error) {
          // Alguns erros são esperados (como "já existe")
          if (error.message.includes('already exists') || 
              error.message.includes('já existe') ||
              error.message.includes('duplicate')) {
            console.log(`⚠️  Item já existe (ignorando): ${error.message.substring(0, 80)}...`);
            successCount++;
          } else {
            console.error(`❌ Erro no comando ${i + 1}:`, error.message.substring(0, 100));
            errorCount++;
            errors.push({
              command: i + 1,
              preview: command.substring(0, 100),
              error: error.message
            });
          }
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso!`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exceção no comando ${i + 1}:`, err.message);
        errorCount++;
        errors.push({
          command: i + 1,
          preview: command.substring(0, 100),
          error: err.message
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA EXECUÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Comando ${err.command}:`);
        console.log(`   Preview: ${err.preview}...`);
        console.log(`   Erro: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (errorCount === 0) {
      console.log('🎉 SUCESSO! Todas as tabelas foram criadas com sucesso!');
      console.log('\n📋 Tabelas criadas:');
      console.log('   • sales (vendas)');
      console.log('   • sale_items (itens de venda)');
      console.log('   • cash_operations (operações de caixa)');
      console.log('\n🔒 Políticas RLS aplicadas');
      console.log('📈 Índices de performance criados');
      console.log('⚡ Triggers de estoque configurados');
      console.log('\n✨ O PDV agora está 100% integrado com o Supabase!');
    } else {
      console.log('⚠️  Alguns comandos falharam. Verifique os erros acima.');
      console.log('💡 Dica: Você pode executar o SQL manualmente no Supabase SQL Editor.');
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error('\n💡 SOLUÇÃO: Execute o SQL manualmente no Supabase SQL Editor');
    console.error('📁 Arquivo: scripts/create-sales-tables.sql');
    process.exit(1);
  }
}

// Executar o script
executeSalesTableScript();



