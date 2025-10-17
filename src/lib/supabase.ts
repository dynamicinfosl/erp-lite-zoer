import { createClient } from '@supabase/supabase-js'

// Credenciais hardcoded (fallback se as variáveis de ambiente não funcionarem)
const HARDCODED_URL = 'https://lfxietcasaooenffdodr.supabase.co'
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTc3NDMsImV4cCI6MjA3MjU5Mzc0M30.NBHrAlv8RPxu1QhLta76Uoh6Bc_OnqhfVydy8_TX6GQ'

// Tenta ler das variáveis de ambiente primeiro, senão usa hardcoded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_KEY

console.log('[Supabase] Usando credenciais:', supabaseUrl.includes('lfxietcasaooenffdodr') ? 'HARDCODED ✅' : 'ENV VARS ✅')

// Loga a origem (mascara parte do domínio) para diagnóstico
try {
  const maskedUrl = supabaseUrl ? supabaseUrl.replace(/(https?:\/\/)([^.]+)/, '$1***') : 'undefined'
  console.log(`[Supabase] URL em uso: ${maskedUrl}`)
} catch {}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Timeout de 15 segundos para requests
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

// Função para obter o usuário atual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Função para fazer login
export const signIn = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPassword = password.trim()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: normalizedPassword,
  })
  if (error) throw error
  return data
}

// Função para fazer logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Função para registrar usuário
export const signUp = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  if (error) throw error
  return data
}

// Função para limpar dados de autenticação
export const clearAuthData = async () => {
  try {
    // Fazer sign out para limpar dados do Supabase
    await supabase.auth.signOut()
    
    // Limpar dados do localStorage
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    
    // Limpar dados do sessionStorage
    const sessionKeys = Object.keys(sessionStorage)
    sessionKeys.forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        sessionStorage.removeItem(key)
      }
    })
    
    console.log('Dados de autenticação limpos com sucesso')
  } catch (error) {
    console.error('Erro ao limpar dados de autenticação:', error)
  }
}
