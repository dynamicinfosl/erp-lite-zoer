const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenfffodr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function autoFixMembership() {
  console.log('🚀 Iniciando correção automática do membership...');
  
  const userId = '5f34ff91-dc0f-4fe2-a5c7-6e8f9a6fdc01';
  
  try {
    // 1. Verificar se o membership existe
    console.log('📋 1. Verificando membership existente...');
    const { data: existingMembership, error: checkError } = await supabase
      .from('user_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
      
    if (checkError) {
      console.error('❌ Erro ao verificar membership:', checkError.message);
      return false;
    }
    
    console.log('✅ Memberships encontrados:', existingMembership?.length || 0);
    
    if (existingMembership && existingMembership.length > 0) {
      console.log('📊 Membership existente:', existingMembership[0]);
      
      // 2. Testar a query com diferentes métodos
      console.log('🔍 2. Testando query com JOIN...');
      
      const { data: withJoin, error: joinError } = await supabase
        .from('user_memberships')
        .select(`
          *,
          tenants(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);
        
      if (joinError) {
        console.error('❌ Erro na query com JOIN:', joinError.message);
        
        // 3. Tentar query simples separada
        console.log('🔄 3. Tentando query separada...');
        
        const { data: membershipOnly, error: membershipError } = await supabase
          .from('user_memberships')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);
          
        if (!membershipError && membershipOnly && membershipOnly.length > 0) {
          // Buscar tenant separadamente
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', membershipOnly[0].tenant_id)
            .single();
            
          if (!tenantError) {
            console.log('✅ Query separada funcionou!');
            console.log('👤 User:', userId);
            console.log('🏢 Tenant:', tenantData.name);
            return {
              success: true,
              method: 'separate_queries',
              membership: membershipOnly[0],
              tenant: tenantData
            };
          } else {
            console.error('❌ Erro ao buscar tenant:', tenantError.message);
          }
        }
      } else {
        console.log('✅ Query com JOIN funcionou!');
        console.log('📊 Dados:', withJoin);
        return {
          success: true,
          method: 'join_query',
          data: withJoin
        };
      }
    } else {
      console.log('❌ Nenhum membership encontrado!');
      console.log('🔧 Criando membership...');
      
      // Criar membership se não existir
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (tenantsError || !tenants || tenants.length === 0) {
        console.log('🏢 Criando tenant também...');
        
        const { data: newTenant, error: createTenantError } = await supabase
          .from('tenants')
          .insert({
            name: 'Teste Gabriel Auto',
            slug: 'teste-gabriel-auto',
            status: 'trial',
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();
          
        if (createTenantError) {
          console.error('❌ Erro ao criar tenant:', createTenantError.message);
          return false;
        }
        
        console.log('✅ Tenant criado:', newTenant.name);
        
        // Criar membership
        const { data: newMembership, error: createMembershipError } = await supabase
          .from('user_memberships')
          .insert({
            user_id: userId,
            tenant_id: newTenant.id,
            role: 'owner',
            is_active: true
          })
          .select()
          .single();
          
        if (createMembershipError) {
          console.error('❌ Erro ao criar membership:', createMembershipError.message);
          return false;
        }
        
        console.log('✅ Membership criado:', newMembership.id);
        
        return {
          success: true,
          method: 'created_new',
          membership: newMembership,
          tenant: newTenant
        };
        
      } else {
        // Usar tenant existente
        const tenant = tenants[0];
        console.log('🏢 Usando tenant existente:', tenant.name);
        
        const { data: newMembership, error: createMembershipError } = await supabase
          .from('user_memberships')
          .insert({
            user_id: userId,
            tenant_id: tenant.id,
            role: 'owner',
            is_active: true
          })
          .select()
          .single();
          
        if (createMembershipError) {
          console.error('❌ Erro ao criar membership:', createMembershipError.message);
          return false;
        }
        
        console.log('✅ Membership criado com tenant existente');
        
        return {
          success: true,
          method: 'created_with_existing_tenant',
          membership: newMembership,
          tenant: tenant
        };
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
    return false;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  autoFixMembership().then(result => {
    if (result && result.success) {
      console.log('\n🎉 SUCESSO! Correção automática concluída!');
      console.log('🔧 Método usado:', result.method);
      console.log('\n🚀 AGORA TESTE O LOGIN NO NAVEGADOR!');
      console.log('📧 Email: gabrieldesouza100@gmail.com');
      console.log('🔑 Senha: (a mesma que você usou)');
    } else {
      console.log('\n❌ Falha na correção automática.');
      console.log('📞 Preciso de ajuda manual.');
    }
  }).catch(console.error);
}

module.exports = { autoFixMembership };


