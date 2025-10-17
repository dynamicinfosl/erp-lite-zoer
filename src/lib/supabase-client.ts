'use client'

import { createClient } from '@supabase/supabase-js'

// Valores hardcoded das variáveis de ambiente (temporário para debugging)
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ'

// Função para obter as variáveis de ambiente de forma segura
function getSupabaseConfig() {
  // Tenta pegar do process.env primeiro (build time)
  let supabaseUrl = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback para valores hardcoded se não encontrar
  if (!supabaseUrl) supabaseUrl = SUPABASE_URL
  if (!supabaseAnonKey) supabaseAnonKey = SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis do Supabase não encontradas!')
    throw new Error('Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias!')
  }

  console.log('✅ Supabase configurado com URL:', supabaseUrl.substring(0, 30) + '...')
  return { supabaseUrl, supabaseAnonKey }
}

// Criar cliente Supabase de forma segura
export function createSupabaseClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: true
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web'
        },
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(15000)
          })
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error)
    throw error
  }
}

// Cliente padrão exportado (lazy initialization)
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient()
  }
  return supabaseInstance
})()
