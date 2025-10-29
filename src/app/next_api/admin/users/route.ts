import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar valores hardcoded como fallback (igual aos outros endpoints)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(_request: NextRequest) {
  try {

    const [profilesResult, tenantsResult, membershipsResult] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*'),
      supabaseAdmin.from('tenants').select('*'),
      supabaseAdmin.from('user_memberships').select('*').then(result => {
        if (result.error) {
          console.warn('⚠️ Tabela user_memberships não existe ou sem permissão:', result.error.message)
          return { data: [], error: null }
        }
        return result
      })
    ])

    if (profilesResult.error) {
      console.error('❌ Erro ao buscar profiles:', profilesResult.error)
      throw profilesResult.error
    }
    if (tenantsResult.error) {
      console.error('❌ Erro ao buscar tenants:', tenantsResult.error)
      throw tenantsResult.error
    }

    const profiles = profilesResult.data || []
    const tenants = tenantsResult.data || []
    const memberships = membershipsResult.data || []

    let mappedUsers: any[] = []

    if (memberships.length > 0) {
      mappedUsers = memberships.map((membership: any, index: number) => {
        const profile = profiles.find((p: any) => p.id === membership.user_id)
        const tenant = tenants.find((t: any) => t.id === membership.tenant_id)
        return {
          user_id: membership.user_id || `membership-${index}`,
          user_email: profile?.email || 'Desconhecido',
          user_created_at: profile?.created_at || membership.created_at,
          user_last_login: '-',
          tenant_id: membership.tenant_id || '',
          tenant_name: tenant?.name || 'Sem empresa',
          tenant_status: tenant?.status || 'trial',
          role: membership.role || 'admin',
          is_active: membership.is_active !== false,
          tenant_email: tenant?.email,
          tenant_phone: tenant?.phone,
          tenant_document: tenant?.document,
          approval_status: profile?.status || 'pending',
        }
      })
    } else {
      mappedUsers = tenants.map((tenant: any, index: number) => ({
        user_id: `tenant-${tenant.id}-${index}`,
        user_email: tenant.email || 'Desconhecido',
        user_created_at: tenant.created_at,
        user_last_login: '-',
        tenant_id: tenant.id,
        tenant_name: tenant.name || 'Sem empresa',
        tenant_status: tenant.status || 'trial',
        role: 'admin',
        is_active: true,
        tenant_email: tenant.email,
        tenant_phone: tenant.phone,
        tenant_document: tenant.document,
        approval_status: 'pending',
      }))
    }

    // dedup por user_id
    const unique = mappedUsers.reduce((acc: any[], cur: any) => {
      if (!acc.find(u => u.user_id === cur.user_id)) acc.push(cur)
      return acc
    }, [])

    return NextResponse.json({ data: unique })
  } catch (error: any) {
    console.error('Erro ao listar usuários admin:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}


