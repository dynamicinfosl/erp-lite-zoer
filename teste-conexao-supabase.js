const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testarConexao() {
    console.log('🔍 Testando conexão direta com Supabase...\n');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.POSTGREST_SERVICE_ROLE;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('📋 Verificando configurações:');
    console.log('URL:', supabaseUrl ? '✅ Configurado' : '❌ Não encontrado');
    console.log('Service Key:', supabaseServiceKey ? '✅ Configurado' : '❌ Não encontrado');
    console.log('Anon Key:', supabaseAnonKey ? '✅ Configurado' : '❌ Não encontrado');
    
    if (!supabaseUrl || !supabaseServiceKey) {
        console.log('❌ Configurações incompletas');
        return;
    }
    
    // Teste com Service Role Key
    console.log('\n🔑 Testando com Service Role Key...');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
        const { data, error } = await supabaseService
            .from('users')
            .select('count(*)')
            .single();
            
        if (error) {
            console.log('❌ Erro Service Key:', error.message);
            console.log('Código:', error.code);
        } else {
            console.log('✅ Service Key funcionando!');
            console.log('Dados:', data);
        }
    } catch (err) {
        console.log('❌ Erro na conexão Service:', err.message);
    }
    
    // Teste com Anon Key
    console.log('\n🔓 Testando com Anon Key...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
        const { data, error } = await supabaseAnon
            .from('users')
            .select('count(*)')
            .single();
            
        if (error) {
            console.log('❌ Erro Anon Key:', error.message);
            console.log('Código:', error.code);
        } else {
            console.log('✅ Anon Key funcionando!');
            console.log('Dados:', data);
        }
    } catch (err) {
        console.log('❌ Erro na conexão Anon:', err.message);
    }
    
    // Verificar se tabelas existem
    console.log('\n📋 Verificando se tabelas existem...');
    try {
        const { data, error } = await supabaseService
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['users', 'sessions', 'refresh_tokens', 'user_passcode']);
            
        if (error) {
            console.log('❌ Erro ao verificar tabelas:', error.message);
        } else {
            console.log('📊 Tabelas encontradas:', data.map(t => t.table_name));
        }
    } catch (err) {
        console.log('❌ Erro na verificação:', err.message);
    }
}

testarConexao();

