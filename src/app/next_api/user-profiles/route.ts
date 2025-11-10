
import { createClient } from '@supabase/supabase-js';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// Usar valores hardcoded como fallback (igual aos outros endpoints)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

let cachedProfileColumns: Set<string> | null = null;

async function getProfileColumns(): Promise<Set<string>> {
  if (cachedProfileColumns) {
    return cachedProfileColumns;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'user_profiles')
      .eq('table_schema', 'public');

    if (error) {
      console.warn('⚠️ Não foi possível obter colunas de user_profiles:', error);
      cachedProfileColumns = new Set(['name', 'phone', 'cpf', 'rg', 'birth_date', 'gender', 'role_type', 'is_active']);
    } else {
      cachedProfileColumns = new Set((data || []).map((col: any) => col.column_name as string));
    }
  } catch (err) {
    console.warn('⚠️ Erro inesperado ao carregar colunas de user_profiles:', err);
    cachedProfileColumns = new Set(['name', 'phone', 'cpf', 'rg', 'birth_date', 'gender', 'role_type', 'is_active']);
  }

  return cachedProfileColumns;
}

function handleSchemaCacheError(
  error: any,
  profileUpdate: Record<string, any>,
  columns: Set<string>
): { handled: boolean; missingColumn?: string } {
  const message: string | undefined = error?.message || error?.details;
  if (!message) {
    return { handled: false };
  }

  const match = message.match(/the '([^']+)' column of 'user_profiles'/i);
  if (!match) {
    return { handled: false };
  }

  const missingColumn = match[1];
  console.warn(`⚠️ Coluna '${missingColumn}' não está disponível em user_profiles. Removendo do update.`);
  delete profileUpdate[missingColumn];
  columns.delete(missingColumn);
  if (cachedProfileColumns) {
    cachedProfileColumns.delete(missingColumn);
  }
  return { handled: true, missingColumn };
}

// GET - buscar perfis de usuário
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    console.log('🔍 GET /user-profiles - Iniciando busca...');
    const { limit, offset, user_id } = parseQueryParams(request);
    console.log('🔍 Parâmetros:', { limit, offset, user_id });

    let query = supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('is_active', true);

    if (user_id) {
      query = query.eq('user_id', user_id).limit(1);
    } else {
      query = query.order('name', { ascending: true })
        .range(offset || 0, (offset || 0) + (limit || 50) - 1);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar perfis do Supabase:', error);
      throw error;
    }

    console.log('✅ Perfis encontrados:', profiles?.length || 0);
    if (user_id) {
      let userMetadata: Record<string, any> | null = null;
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (authError) {
          console.warn('⚠️ Não foi possível buscar metadata do usuário:', authError);
        } else {
          userMetadata = authData?.user?.user_metadata ?? null;
        }
      } catch (authErr) {
        console.warn('⚠️ Erro inesperado ao buscar metadata:', authErr);
      }

      return createSuccessResponse({
        profile: profiles && profiles.length > 0 ? profiles[0] : null,
        user_metadata: userMetadata,
      });
    }

    return createSuccessResponse(profiles || []);
  } catch (error) {
    console.error('❌ Erro ao buscar perfis:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return createErrorResponse({
      errorMessage: `Erro ao buscar perfis de usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);

// POST - criar perfil de usuário
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.email || !body.role_type) {
      return createErrorResponse({
        errorMessage: "Nome, e-mail e tipo de perfil são obrigatórios",
        status: 400,
      });
    }

    // Verificar se o e-mail já existe
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', body.email);

    if (existingUsers && existingUsers.length > 0) {
      return createErrorResponse({
        errorMessage: "E-mail já está em uso",
        status: 409,
      });
    }

    // Criar usuário
    const userData = {
      email: body.email,
      password: body.password, // Deveria ser hasheada
      role: body.role_type === 'admin' ? 'app20250905011157fofcdvmgil_v1_admin_user' : 'app20250905011157fofcdvmgil_v1_user',
    };

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (userError) {
      console.error('❌ Erro ao criar usuário no Supabase:', userError);
      throw userError;
    }

    // Criar perfil
    const profileData = {
      user_id: user.id,
      name: body.name,
      phone: body.phone || null,
      role_type: body.role_type,
      is_active: body.is_active !== false,
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar perfil no Supabase:', profileError);
      throw profileError;
    }

    return createSuccessResponse(profile, 201);
  } catch (error) {
    console.error('❌ Erro ao criar perfil:', error);
    return createErrorResponse({
      errorMessage: `Erro ao criar perfil de usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);

// PUT - atualizar perfil de usuário
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    const queryParams = parseQueryParams(request);
    
    // Aceita ID tanto do body quanto dos query params
    const userId = body.id || queryParams.id;
    
    if (!userId) {
      return createErrorResponse({
        errorMessage: "ID do usuário é obrigatório",
        status: 400,
      });
    }

    const sanitize = (value: any) => {
      if (value === undefined) return undefined;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
      }
      return value;
    };

    const columns = await getProfileColumns();
    const desiredFields = ['name', 'phone', 'cpf', 'rg', 'birth_date', 'gender', 'role_type'] as const;
    const profileFields = desiredFields.filter((field) => columns.has(field));

    const profileUpdate: Record<string, any> = {};

    for (const field of profileFields) {
      const sanitized = sanitize(body[field]);
      if (sanitized !== undefined) {
        profileUpdate[field] = sanitized;
      }
    }

    profileUpdate.updated_at = new Date().toISOString();

    console.log('📝 Atualizando perfil do usuário:', userId, profileUpdate);

    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Erro ao buscar perfil existente:', fetchError);
      return createErrorResponse({
        errorMessage: `Erro ao buscar perfil: ${fetchError.message}`,
        status: 500,
      });
    }

    let savedProfile;

    const resolvedRoleType =
      profileUpdate.role_type ??
      sanitize(body.role_type) ??
      existingProfile?.role_type ??
      (columns.has('role_type') ? 'vendedor' : null);

    if (columns.has('role_type')) {
      if (profileUpdate.role_type === undefined) {
        profileUpdate.role_type = resolvedRoleType;
      } else if (profileUpdate.role_type === null) {
        profileUpdate.role_type = resolvedRoleType;
      }
    }

    if (existingProfile) {
      if (Object.keys(profileUpdate).length > 0) {
        while (true) {
          const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update(profileUpdate)
            .eq('user_id', userId)
            .select()
            .single();

          if (error) {
            const { handled } = handleSchemaCacheError(error, profileUpdate, columns);
            if (handled) {
              if (Object.keys(profileUpdate).length === 0) {
                savedProfile = existingProfile;
                break;
              }
              continue;
            }

            console.error('❌ Erro ao atualizar perfil:', error);
            return createErrorResponse({
              errorMessage: `Erro ao atualizar perfil: ${error.message}`,
              status: 500,
            });
          }

          savedProfile = data;
          break;
        }
      } else {
        savedProfile = existingProfile;
      }
    } else {
      const nameForInsert =
        profileUpdate.name ??
        sanitize(body.name) ??
        (typeof body.email === 'string'
          ? body.email.split('@')[0]
          : 'Usuário');

      if (!nameForInsert) {
        return createErrorResponse({
          errorMessage: 'Nome é obrigatório para criar o perfil',
          status: 400,
        });
      }

      const newProfile: Record<string, any> = {
        user_id: userId,
        is_active: body.is_active !== false,
        ...profileUpdate,
        name: nameForInsert,
        created_at: new Date().toISOString(),
      };

      if (columns.has('role_type')) {
        newProfile.role_type = resolvedRoleType ?? 'vendedor';
      }

      while (true) {
        const { data, error } = await supabaseAdmin
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (error) {
          const { handled } = handleSchemaCacheError(error, newProfile, columns);
          if (handled) {
            if (Object.keys(newProfile).length === 0) {
              return createErrorResponse({
                errorMessage: 'Não foi possível criar perfil: nenhum campo válido após sincronização do schema',
                status: 500,
              });
            }
            continue;
          }

          console.error('❌ Erro ao criar perfil:', error);
          return createErrorResponse({
            errorMessage: `Erro ao criar perfil: ${error.message}`,
            status: 500,
          });
        }

        savedProfile = data;
        break;
      }
    }

    // Atualizar metadata do usuário no Supabase Auth
    const metadataUpdate: Record<string, any> = {};
    const metadataFields = ['cpf', 'rg', 'birth_date', 'gender', 'phone', 'role_type'] as const;

    for (const field of metadataFields) {
      const sanitized = sanitize(body[field]);
      if (sanitized !== undefined) {
        metadataUpdate[field] = sanitized;
      }
    }
    if (body.email) {
      metadataUpdate.email = sanitize(body.email);
    }

    let latestMetadata: Record<string, any> | null = null;

    try {
      if (Object.keys(metadataUpdate).length > 0) {
        const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              ...metadataUpdate,
            },
          }
        );

        if (authError) {
          console.error('⚠️ Não foi possível atualizar metadata do usuário:', authError);
        } else {
          console.log('✅ Metadata do usuário atualizada:', authResult?.user?.user_metadata);
          latestMetadata = authResult?.user?.user_metadata || null;
        }
      }
    } catch (authUpdateError) {
      console.error('⚠️ Erro inesperado ao atualizar metadata do usuário:', authUpdateError);
    }

    if (!latestMetadata) {
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
        latestMetadata = authData?.user?.user_metadata || null;
      } catch (fallbackErr) {
        console.warn('⚠️ Falha ao refazer fetch do metadata:', fallbackErr);
      }
    }

    return createSuccessResponse({
      profile: savedProfile,
      user_metadata: latestMetadata,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return createErrorResponse({
      errorMessage: `Erro ao atualizar perfil: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      status: 500,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}, true);

// DELETE - excluir perfil de usuário
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do perfil é obrigatório",
        status: 400,
      });
    }

    // Verificar se o perfil existe
    const { data: existing, error: findError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return createErrorResponse({
        errorMessage: "Perfil não encontrado",
        status: 404,
      });
    }

    // Soft delete - marcar como inativo
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao excluir perfil no Supabase:', error);
      throw error;
    }
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('❌ Erro ao excluir perfil:', error);
    return createErrorResponse({
      errorMessage: `Erro ao excluir perfil: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);
