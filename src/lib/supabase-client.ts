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
    console.error('Usando valores hardcoded como fallback')
    // Não lançar erro, usar valores hardcoded
  }

  console.log('✅ Supabase configurado com URL:', supabaseUrl?.substring(0, 30) + '...')
  return { supabaseUrl: supabaseUrl || SUPABASE_URL, supabaseAnonKey: supabaseAnonKey || SUPABASE_ANON_KEY }
}

// Criar cliente Supabase de forma segura
export function createSupabaseClient() {
  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Desabilitar detecção automática
        flowType: 'pkce',
        debug: false // Desabilitar debug para reduzir logs
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-web'
        },
        fetch: async (url, options = {}) => {
          try {
            const response = await fetch(url, {
              ...options,
              signal: AbortSignal.timeout(15000) // Aumentar para 15 segundos
            })
            return response
          } catch (error: any) {
            // Tratamento específico para erros de rede
            if (error.name === 'AbortError') {
              console.warn('⏱️ Timeout ao conectar com Supabase')
            } else if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
              console.warn('📡 Erro de conexão: Verifique sua conexão com a internet')
            } else {
              console.error('❌ Erro ao fazer requisição:', error.message)
            }
            throw error
          }
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 5 // Reduzir frequência
        }
      }
    })
  } catch (error) {
    console.error('❌ Erro ao criar cliente Supabase:', error)
    throw error
  }
}

// Singleton global para evitar múltiplas instâncias
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null
let isCreating = false

// Função para obter instância única
export function getSupabaseInstance() {
  if (!supabaseInstance && !isCreating) {
    isCreating = true
    try {
      supabaseInstance = createSupabaseClient()
      console.log('✅ Nova instância Supabase criada')
    } catch (error) {
      console.error('❌ Erro ao criar instância Supabase:', error)
      throw error
    } finally {
      isCreating = false
    }
  }
  return supabaseInstance!
}

// Cliente padrão exportado (sempre usa a mesma instância)
export const supabase = getSupabaseInstance()
