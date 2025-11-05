
import { createClient } from '@supabase/supabase-js';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";
import { NextRequest } from 'next/server';

// Usar valores hardcoded como fallback (igual aos outros endpoints)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - buscar categorias
export const GET = requestMiddleware(async (request: NextRequest, context) => {
  try {
    console.log('🔍 GET /categories - Iniciando busca...');
    const { limit, offset } = parseQueryParams(request);
    console.log('🔍 Parâmetros:', { limit, offset });
    
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset || 0, (offset || 0) + (limit || 50) - 1);

    if (error) {
      console.error('❌ Erro ao buscar categorias do Supabase:', error);
      throw error;
    }

    console.log('✅ Categorias encontradas:', categories?.length || 0);
    return createSuccessResponse(categories || []);
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return createErrorResponse({
      errorMessage: `Erro ao buscar categorias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);

// POST - criar categoria
export const POST = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name) {
      return createErrorResponse({
        errorMessage: "Nome da categoria é obrigatório",
        status: 400,
      });
    }

    const categoryData = {
      name: body.name,
      description: body.description || null,
      color: body.color || '#2c3e50',
      is_active: body.is_active !== false,
    };

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert(categoryData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar categoria no Supabase:', error);
      throw error;
    }

    return createSuccessResponse(category, 201);
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    return createErrorResponse({
      errorMessage: `Erro ao criar categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);

// PUT - atualizar categoria
export const PUT = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da categoria é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);

    // Verificar se a categoria existe
    const { data: existing, error: findError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return createErrorResponse({
        errorMessage: "Categoria não encontrada",
        status: 404,
      });
    }

    const updateData = {
      name: body.name,
      description: body.description || null,
      color: body.color || '#2c3e50',
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar categoria no Supabase:', error);
      throw error;
    }

    return createSuccessResponse(category);
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error);
    return createErrorResponse({
      errorMessage: `Erro ao atualizar categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);

// DELETE - excluir categoria
export const DELETE = requestMiddleware(async (request: NextRequest, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID da categoria é obrigatório",
        status: 400,
      });
    }

    // Verificar se a categoria existe
    const { data: existing, error: findError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return createErrorResponse({
        errorMessage: "Categoria não encontrada",
        status: 404,
      });
    }

    // Soft delete - marcar como inativa
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao excluir categoria no Supabase:', error);
      throw error;
    }
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('❌ Erro ao excluir categoria:', error);
    return createErrorResponse({
      errorMessage: `Erro ao excluir categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      status: 500,
    });
  }
}, true);
