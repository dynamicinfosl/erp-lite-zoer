import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Buscar tenant de um usuário
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ [API] Cliente Supabase não configurado');
      return NextResponse.json(
        { 
          success: false, 
          data: null,
          error: 'Cliente Supabase não configurado' 
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID é obrigatório' 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [API] Buscando tenant para usuário: ${user_id}`);
    
    // Buscar membership ativo
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error('❌ [API] Erro ao buscar membership:', membershipError);
      return NextResponse.json(
        { 
          success: false, 
          data: null,
          error: 'Erro ao buscar membership: ' + membershipError.message 
        },
        { status: 200 }
      );
    }

    // ✅ Se não tem membership, criar tenant e membership automaticamente
    if (!membership?.tenant_id) {
      console.log('⚠️ [API] Nenhum membership encontrado, criando tenant automaticamente...');
      
      // Buscar email do usuário
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      
      if (authError || !authUser?.user?.email) {
        console.error('❌ [API] Erro ao buscar dados do usuário:', authError);
        return NextResponse.json(
          { 
            success: false, 
            data: null,
            error: 'Erro ao buscar dados do usuário' 
          },
          { status: 200 }
        );
      }

      const userEmail = authUser.user.email;
      const tenantName = userEmail.split('@')[0] || 'Minha Empresa';

      // Criar tenant
      const { data: newTenant, error: tenantCreateError } = await supabaseAdmin
        .from('tenants')
        .insert({
          id: user_id, // Usar user_id como tenant_id
          name: tenantName,
          status: 'trial',
          email: userEmail,
        })
        .select('id, name, status, email, phone, document, address, city, state, zip_code')
        .single();

      if (tenantCreateError) {
        // Se já existe, buscar o existente
        const { data: existingTenant } = await supabaseAdmin
          .from('tenants')
          .select('id, name, status, email, phone, document, address, city, state, zip_code')
          .eq('id', user_id)
          .maybeSingle();

        if (existingTenant) {
          // Criar membership se não existir
          await supabaseAdmin
            .from('user_memberships')
            .insert({
              user_id: user_id,
              tenant_id: user_id,
              role: 'owner',
              is_active: true,
            })
            .select()
            .maybeSingle();

          console.log('✅ [API] Tenant existente encontrado e membership criado:', existingTenant.name);
          return NextResponse.json({ 
            success: true, 
            data: existingTenant 
          });
        }

        console.error('❌ [API] Erro ao criar tenant:', tenantCreateError);
        return NextResponse.json(
          { 
            success: false, 
            data: null,
            error: 'Erro ao criar tenant: ' + tenantCreateError.message 
          },
          { status: 200 }
        );
      }

      // Criar membership
      await supabaseAdmin
        .from('user_memberships')
        .insert({
          user_id: user_id,
          tenant_id: newTenant.id,
          role: 'owner',
          is_active: true,
        });

      console.log('✅ [API] Tenant e membership criados automaticamente:', newTenant.name);
      return NextResponse.json({ 
        success: true, 
        data: newTenant 
      });
    }

    const tenantId = membership.tenant_id;
    console.log('✅ [API] Membership encontrado, tenant_id:', tenantId);

    // Buscar dados do tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status, email, phone, document, address, city, state, zip_code')
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantError) {
      console.error('❌ [API] Erro ao buscar tenant:', tenantError);
      return NextResponse.json(
        { 
          success: false, 
          data: null,
          error: 'Erro ao buscar tenant: ' + tenantError.message 
        },
        { status: 200 }
      );
    }

    if (!tenant) {
      console.log('⚠️ [API] Tenant não encontrado:', tenantId);
      return NextResponse.json(
        { 
          success: false, 
          data: null,
          error: 'Tenant não encontrado' 
        },
        { status: 200 }
      );
    }

    console.log('✅ [API] Tenant encontrado:', tenant.name, 'ID:', tenant.id);

    return NextResponse.json({ 
      success: true, 
      data: tenant 
    });

  } catch (error: any) {
    console.error('❌ [API] Erro no handler:', error);
    // Sempre retornar sucesso com data null, nunca erro 500
    return NextResponse.json(
      { 
        success: false, 
        data: null,
        error: 'Erro interno: ' + (error?.message || 'Erro desconhecido') 
      },
      { status: 200 }
    );
  }
}

