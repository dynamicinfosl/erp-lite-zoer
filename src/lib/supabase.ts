import { createClient } from '@supabase/supabase-js'

// Lê as variáveis de ambiente SEM fallback para evitar conectar no projeto errado
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lança erro aqui para não quebrar build; o erro ficará claro nos logs
  // e nas chamadas de autenticação. Também ajuda durante setup local.
  // Dica: configure .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Exemplos de arquivos: env.example, env.supabase.config
  // eslint-disable-next-line no-console
  console.error('[Supabase] Variáveis de ambiente ausentes: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY')
}

// Loga a origem (mascara parte do domínio) para diagnóstico
try {
  const maskedUrl = supabaseUrl ? supabaseUrl.replace(/(https?:\/\/)([^.]+)/, '$1***') : 'undefined'
  // eslint-disable-next-line no-console
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
